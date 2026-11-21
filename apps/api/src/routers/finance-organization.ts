import { and, asc, count, desc, eq, inArray, max, not } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import {
	category,
	categoryRule,
	expense,
	pluggyItems,
	pluggyTransactions,
	tag,
	transactionTag,
} from "../db/schema/index.js";
import { AppError, errorBody, sendKnownError } from "../lib/http-errors.js";
import type { RouteRegistrar } from "../hono/registrar.js";
import {
	archiveCategory,
	cleanCategoryName,
	createCategory,
	deleteCategory,
	mergeCategories,
	rebuildBankExpenses,
	renameCategory,
} from "../services/category-catalog.js";
import {
	firstMatchingRule,
	normalizeLabel,
	ruleMatches,
} from "../services/category-rules.js";
import {
	loadCategoryRules,
	loadClassifiedPluggyTransactions,
} from "../services/pluggy-ledger.js";
import { signedAmount } from "../services/pluggy-classification.js";
import { sql } from "drizzle-orm";
import { requireSession } from "../session.js";
import { listFinanceTransactionsBetween } from "./finance.js";

const categoryName = z.string().trim().min(1).max(64);
const tagName = z.string().trim().min(1).max(48);
const ids = z.array(z.uuid()).min(1).max(100);
const matchType = z.enum(["contains", "starts_with", "equals"]);
const pattern = z.string().trim().min(1).max(100);

const ruleInput = z.object({
	matchType,
	pattern,
	category: categoryName,
	priority: z.number().int().min(0).max(100000).optional(),
	enabled: z.boolean().optional(),
});

const rulePatch = z
	.object({
		matchType: matchType.optional(),
		pattern: pattern.optional(),
		category: categoryName.optional(),
		priority: z.number().int().min(0).max(100000).optional(),
		enabled: z.boolean().optional(),
	})
	.refine((value) => Object.values(value).some((v) => v !== undefined), {
		message: "Informe ao menos um campo para editar.",
	});

const rulePreviewInput = z.object({
	matchType,
	pattern,
	category: categoryName.optional(),
});

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function serializeRule(row: typeof categoryRule.$inferSelect) {
	return {
		id: row.id,
		matchType: row.matchType,
		pattern: row.pattern,
		category: row.category,
		priority: row.priority,
		enabled: row.enabled,
	};
}

function onError(reply: Parameters<typeof sendKnownError>[0], error: unknown) {
	if ((error as { statusCode?: number }).statusCode === 401)
		return reply.status(401).send(errorBody("UNAUTHORIZED"));
	return sendKnownError(reply, error);
}

/** Category catalog, automatic category rules and tags (specs 05 and 06). */
export function registerOrganizationRoutes(server: RouteRegistrar) {
	// --- Category rules ---

	server.route({
		method: "GET",
		url: "/category-rules",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const rows = await db
					.select()
					.from(categoryRule)
					.where(eq(categoryRule.userId, session.user.id))
					.orderBy(asc(categoryRule.priority), asc(categoryRule.createdAt));
				return reply.send(rows.map(serializeRule));
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "POST",
		url: "/category-rules",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const input = ruleInput.parse(req.body);
				let priority = input.priority;
				if (priority === undefined) {
					const [row] = await db
						.select({ top: max(categoryRule.priority) })
						.from(categoryRule)
						.where(eq(categoryRule.userId, session.user.id));
					priority = (row?.top ?? 0) + 1;
				}
				const [created] = await db
					.insert(categoryRule)
					.values({
						userId: session.user.id,
						matchType: input.matchType,
						pattern: input.pattern,
						category: cleanCategoryName(input.category),
						priority,
						enabled: input.enabled ?? true,
					})
					.returning();
				// Rules show up in the ledger at once; the stored expense rows follow.
				await rebuildBankExpenses(session.user.id);
				return reply.code(201).send(serializeRule(created!));
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "PATCH",
		url: "/category-rules/:id",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const id = z.uuid().parse(req.params.id);
				const patch = rulePatch.parse(req.body);
				const [updated] = await db
					.update(categoryRule)
					.set({
						...patch,
						category: patch.category ? cleanCategoryName(patch.category) : undefined,
					})
					.where(
						and(
							eq(categoryRule.id, id),
							eq(categoryRule.userId, session.user.id),
						),
					)
					.returning();
				if (!updated)
					return reply.status(404).send(errorBody("NOT_FOUND", "Regra não encontrada."));
				await rebuildBankExpenses(session.user.id);
				return reply.send(serializeRule(updated));
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "DELETE",
		url: "/category-rules/:id",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const id = z.uuid().parse(req.params.id);
				const removed = await db
					.delete(categoryRule)
					.where(
						and(
							eq(categoryRule.id, id),
							eq(categoryRule.userId, session.user.id),
						),
					)
					.returning({ id: categoryRule.id });
				if (removed.length === 0)
					return reply.status(404).send(errorBody("NOT_FOUND", "Regra não encontrada."));
				await rebuildBankExpenses(session.user.id);
				return reply.send({ deleted: 1 });
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "POST",
		url: "/category-rules/preview",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const candidate = rulePreviewInput.parse(req.body);
				const rows = await loadClassifiedPluggyTransactions({
					userId: session.user.id,
				});
				// Only what shows up in the lists, and never what the user chose by hand.
				const matches = rows.filter(
					(row) =>
						row.classification.kind !== "ignored" &&
						!row.categoryOverride?.trim() &&
						ruleMatches(candidate, row.description),
				);
				const wouldChange = candidate.category
					? matches.filter(
							(row) =>
								normalizeLabel(row.displayCategory) !==
								normalizeLabel(candidate.category),
						)
					: matches;
				return reply.send({
					matched: matches.length,
					wouldChange: wouldChange.length,
					examples: wouldChange.slice(0, 20).map((row) => ({
						id: row.id,
						date: row.date,
						description: row.description,
						amount: signedAmount(row.classification),
						currentCategory: row.displayCategory,
					})),
				});
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "POST",
		url: "/category-rules/apply",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const userId = session.user.id;
				const rules = await loadCategoryRules(userId);
				const rows = await loadClassifiedPluggyTransactions({ userId });
				const ruled = rows.filter(
					(row) =>
						row.classification.kind !== "ignored" &&
						!row.categoryOverride?.trim() &&
						firstMatchingRule(rules, row.description),
				);
				await rebuildBankExpenses(userId);
				return reply.send({ categorizedByRules: ruled.length });
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	// --- Category catalog ---

	server.route({
		method: "GET",
		url: "/categories",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const userId = session.user.id;
				const includeArchived = (req.query as { archived?: string }).archived === "true";
				const used = await db
					.select({
						category: expense.category,
						kind: expense.kind,
						count: sql<number>`count(*)`.mapWith(Number),
					})
					.from(expense)
					.where(eq(expense.userId, userId))
					.groupBy(expense.category, expense.kind)
					.orderBy(desc(sql`count(*)`));
				const catalog = await db
					.select()
					.from(category)
					.where(eq(category.userId, userId))
					.orderBy(asc(category.name));
				const byKey = new Map(catalog.map((row) => [row.nameKey, row]));
				const seen = new Set<string>();

				const rows = used.map((row) => {
					const key = normalizeLabel(row.category);
					seen.add(key);
					const entry = byKey.get(key);
					return {
						...row,
						id: entry?.id ?? null,
						archived: entry?.archived ?? false,
					};
				});
				for (const entry of catalog) {
					if (seen.has(entry.nameKey)) continue;
					rows.push({
						category: entry.name,
						kind: "expense",
						count: 0,
						id: entry.id,
						archived: entry.archived,
					});
				}
				return reply.send(
					rows.filter((row) => includeArchived || !row.archived || row.count > 0),
				);
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "POST",
		url: "/categories",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { name } = z.object({ name: categoryName }).parse(req.body);
				const created = await createCategory(session.user.id, name);
				return reply
					.code(201)
					.send({ id: created.id, name: created.name, archived: created.archived });
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "POST",
		url: "/categories/rename",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const body = z
					.object({ name: categoryName, newName: categoryName })
					.parse(req.body);
				const moved = await renameCategory({ userId: session.user.id, ...body });
				return reply.send({ renamed: cleanCategoryName(body.newName), updated: moved });
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "POST",
		url: "/categories/merge",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const body = z.object({ from: categoryName, into: categoryName }).parse(req.body);
				const moved = await mergeCategories({ userId: session.user.id, ...body });
				return reply.send({ into: cleanCategoryName(body.into), updated: moved });
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "POST",
		url: "/categories/archive",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const body = z
					.object({ name: categoryName, archived: z.boolean() })
					.parse(req.body);
				const entry = await archiveCategory({ userId: session.user.id, ...body });
				return reply.send({ id: entry.id, name: entry.name, archived: entry.archived });
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "DELETE",
		url: "/categories",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const body = z
					.object({ name: categoryName, moveTo: categoryName.optional() })
					.parse(req.body);
				return reply.send(await deleteCategory({ userId: session.user.id, ...body }));
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	// --- Tags ---

	server.route({
		method: "GET",
		url: "/tags",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const rows = await db
					.select({
						id: tag.id,
						name: tag.name,
						transactions: count(transactionTag.id),
					})
					.from(tag)
					.leftJoin(transactionTag, eq(transactionTag.tagId, tag.id))
					.where(eq(tag.userId, session.user.id))
					.groupBy(tag.id, tag.name)
					.orderBy(asc(tag.name));
				return reply.send(rows);
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "POST",
		url: "/tags",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { name: raw } = z.object({ name: tagName }).parse(req.body);
				const name = cleanCategoryName(raw);
				const [created] = await db
					.insert(tag)
					.values({ userId: session.user.id, name, nameKey: normalizeLabel(name) })
					.onConflictDoNothing()
					.returning();
				if (!created)
					throw new AppError("CONFLICT", 409, `Já existe uma tag "${name}" (maiúsculas e acentos não contam).`);
				return reply.code(201).send({ id: created.id, name: created.name });
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "DELETE",
		url: "/tags/:id",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const id = z.uuid().parse(req.params.id);
				const removed = await db
					.delete(tag)
					.where(and(eq(tag.id, id), eq(tag.userId, session.user.id)))
					.returning({ id: tag.id });
				if (removed.length === 0)
					return reply.status(404).send(errorBody("NOT_FOUND", "Tag não encontrada."));
				return reply.send({ deleted: 1 });
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	/** Splits ids into the user's bank transactions and manual ones. */
	async function ownedTransactions(userId: string, wanted: string[]) {
		const [bank, manual] = await Promise.all([
			db
				.select({ id: pluggyTransactions.id })
				.from(pluggyTransactions)
				.innerJoin(pluggyItems, eq(pluggyTransactions.pluggyItemId, pluggyItems.id))
				.where(and(eq(pluggyItems.userId, userId), inArray(pluggyTransactions.id, wanted))),
			db
				.select({ id: expense.id })
				.from(expense)
				.where(
					and(
						eq(expense.userId, userId),
						not(eq(expense.source, "pluggy")),
						inArray(expense.id, wanted),
					),
				),
		]);
		return { bank: bank.map((row) => row.id), manual: manual.map((row) => row.id) };
	}

	const tagBody = z.object({ ids, tagId: z.uuid() });

	async function findOwnTag(userId: string, tagId: string) {
		const [row] = await db
			.select()
			.from(tag)
			.where(and(eq(tag.id, tagId), eq(tag.userId, userId)));
		if (!row) throw new AppError("NOT_FOUND", 404, "Tag não encontrada.");
		return row;
	}

	server.route({
		method: "POST",
		url: "/transactions/tag",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { ids: wanted, tagId } = tagBody.parse(req.body);
				await findOwnTag(session.user.id, tagId);
				const owned = await ownedTransactions(session.user.id, wanted);
				const values = [
					...owned.bank.map((id) => ({ tagId, pluggyTransactionId: id })),
					...owned.manual.map((id) => ({ tagId, expenseId: id })),
				];
				if (values.length > 0)
					await db.insert(transactionTag).values(values).onConflictDoNothing();
				return reply.send({ tagged: values.length, ignored: wanted.length - values.length });
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "POST",
		url: "/transactions/untag",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw);
				const { ids: wanted, tagId } = tagBody.parse(req.body);
				await findOwnTag(session.user.id, tagId);
				const owned = await ownedTransactions(session.user.id, wanted);
				let untagged = 0;
				if (owned.bank.length > 0)
					untagged += (
						await db
							.delete(transactionTag)
							.where(
								and(
									eq(transactionTag.tagId, tagId),
									inArray(transactionTag.pluggyTransactionId, owned.bank),
								),
							)
							.returning({ id: transactionTag.id })
					).length;
				if (owned.manual.length > 0)
					untagged += (
						await db
							.delete(transactionTag)
							.where(
								and(
									eq(transactionTag.tagId, tagId),
									inArray(transactionTag.expenseId, owned.manual),
								),
							)
							.returning({ id: transactionTag.id })
					).length;
				return reply.send({ untagged });
			} catch (error) {
				return onError(reply, error);
			}
		},
	});

	server.route({
		method: "GET",
		url: "/tags/:id/total",
		async handler(req, reply) {
			try {
				const session = await requireSession(req.raw, { allowMcpToken: true });
				const id = z.uuid().parse(req.params.id);
				const { from, to } = req.query as { from?: string; to?: string };
				if (!from || !to || !datePattern.test(from) || !datePattern.test(to))
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "Informe from e to no formato AAAA-MM-DD."));
				if (from > to)
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "A data inicial não pode ser depois da final."));
				const earliest = new Date(`${to}T00:00:00.000Z`);
				earliest.setUTCMonth(earliest.getUTCMonth() - 24);
				if (from < earliest.toISOString().slice(0, 10))
					return reply
						.status(400)
						.send(errorBody("VALIDATION_ERROR", "O período pode ter no máximo 24 meses."));

				const found = await findOwnTag(session.user.id, id);
				const records = await listFinanceTransactionsBetween({
					userId: session.user.id,
					start: from,
					end: to,
				});
				const tagged = records.filter((record) =>
					record.tags.some((t) => t.id === id),
				);
				// Same rule as the by-category chart: expenses only, refunds not netted.
				const spent = tagged
					.filter((record) => record.kind === "expense")
					.reduce((sum, record) => sum + Math.abs(record.amount), 0);
				return reply.send({
					tag: { id: found.id, name: found.name },
					from,
					to,
					spent: Math.round(spent * 100) / 100,
					transactions: tagged.length,
				});
			} catch (error) {
				return onError(reply, error);
			}
		},
	});
}
