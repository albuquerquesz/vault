"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@vault/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { Button } from "@vault/ui/components/button";
import { Separator } from "@vault/ui/components/separator";
import { Skeleton } from "@vault/ui/components/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@vault/ui/components/tooltip";
import {
	ArrowDownLeft,
	ArrowLeft,
	ArrowUpRight,
	CalendarDays,
	Check,
	Copy,
	CreditCard,
	Database,
	Info,
	Landmark,
	RefreshCw,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { InstitutionMark } from "@/components/institution-mark";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import { usePluggyTransaction } from "@/features/pluggy/sdk";

function formatCurrency(value: number, currency = "BRL") {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

function formatDate(value: string) {
	return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

function formatLabel(value?: string | null) {
	if (!value) return null;
	return value
		.toLowerCase()
		.split(/[_-]+/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function DetailField({
	label,
	value,
	mono = false,
}: {
	label: string;
	value?: ReactNode;
	mono?: boolean;
}) {
	return (
		<div className="grid gap-1.5">
			<dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
				{label}
			</dt>
			<dd className={mono ? "break-all font-mono text-xs" : "text-sm"}>
				{value ?? <span className="text-muted-foreground">Não informado</span>}
			</dd>
		</div>
	);
}

function CopyValue({ value, label }: { value: string; label: string }) {
	const [copied, setCopied] = useState(false);

	async function copyValue() {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			toast.success(`${label} copiado`);
			window.setTimeout(() => setCopied(false), 1600);
		} catch {
			toast.error(`Não foi possível copiar ${label.toLowerCase()}`);
		}
	}

	return (
		<Tooltip>
			<TooltipTrigger
				render={() => (
					<Button
						aria-label={`Copiar ${label}`}
						className="text-muted-foreground"
						onClick={() => void copyValue()}
						size="icon-xs"
						variant="ghost"
					>
						{copied ? <Check /> : <Copy />}
					</Button>
				)}
			/>
			<TooltipContent>{copied ? "Copiado" : `Copiar ${label}`}</TooltipContent>
		</Tooltip>
	);
}

function DetailSkeleton() {
	return (
		<div className="grid w-full min-w-0 gap-4 pt-6 pb-8">
			<Skeleton className="h-8 w-28" />
			<Card className="financial-panel-border gap-0 ring-0">
				<CardContent className="grid gap-6 p-5 sm:p-8">
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-center gap-3">
							<Skeleton className="size-10" />
							<div className="grid gap-2">
								<Skeleton className="h-5 w-48" />
								<Skeleton className="h-4 w-32" />
							</div>
						</div>
						<Skeleton className="h-10 w-36" />
					</div>
					<Separator />
					<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
						{Array.from({ length: 8 }, (_, index) => (
							<div className="grid gap-2" key={index}>
								<Skeleton className="h-3 w-20" />
								<Skeleton className="h-4 w-32" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function TransactionDetailPage({ transactionId }: { transactionId: string }) {
	const navigate = useNavigate();
	const detail = usePluggyTransaction(transactionId);

	if (detail.isPending) {
		return <DetailSkeleton />;
	}

	if (detail.isError) {
		return (
			<div className="grid w-full min-w-0 gap-4 pt-4 sm:pt-6">
				<Button
					className="w-fit text-muted-foreground"
					onClick={() => void navigate({ to: "/transactions" })}
					size="sm"
					variant="ghost"
				>
					<ArrowLeft /> Voltar para transações
				</Button>
				<Card className="financial-panel-border ring-0">
					<CardHeader className="border-b">
						<CardDescription>Detalhe da transação</CardDescription>
						<CardTitle>Não foi possível carregar este registro</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-stretch gap-3 pt-5 sm:flex-row sm:items-center">
						<p className="max-w-xl text-sm text-muted-foreground">
							Confira sua conexão e tente novamente para consultar os dados
							sincronizados da Pluggy.
						</p>
						<Button className="min-h-11 w-full sm:w-auto" onClick={() => void detail.refetch()} variant="outline">
							<RefreshCw /> Tentar novamente
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!detail.transaction) {
		return (
			<div className="grid w-full min-w-0 gap-4 pt-4 sm:pt-6">
				<Button
					className="w-fit text-muted-foreground"
					onClick={() => void navigate({ to: "/transactions" })}
					size="sm"
					variant="ghost"
				>
					<ArrowLeft /> Voltar para transações
				</Button>
				<Card className="financial-panel-border ring-0">
					<CardHeader>
						<CardDescription>Registro indisponível</CardDescription>
						<CardTitle>Esta transação não está mais disponível</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="max-w-xl text-sm text-muted-foreground">
							Ela pode ter sido ocultada, removida ou ainda não ter sido sincronizada
							pela Pluggy.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const { transaction, account } = detail;
	const amount = Number(transaction.amount);
	const isOutgoing = amount < 0;
	const currency = account?.currency ?? "BRL";
	const DirectionIcon = isOutgoing ? ArrowDownLeft : ArrowUpRight;
	const description = transaction.description?.trim() || "Transação sem descrição";
	const accountLabel = account?.name ?? transaction.accountName ?? "Conta não identificada";

	return (
		<main className="grid w-full min-w-0 gap-4 pt-4 pb-8 sm:pt-6">
			<Link
				className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
				to="/transactions"
			>
				<ArrowLeft className="size-4" /> Voltar para transações
			</Link>

			<Card className="financial-panel-border gap-0 ring-0">
				<CardContent className="grid gap-5 p-4 sm:gap-6 sm:p-8">
					<div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
						<div className="flex min-w-0 items-start gap-3">
							<InstitutionMark
								name={accountLabel}
								provider={transaction.provider}
								size="lg"
							/>
							<div className="min-w-0 space-y-1">
								<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									{transaction.provider}
								</p>
								<h1 className="max-w-2xl break-words font-[Space_Grotesk] text-2xl font-semibold tracking-tight sm:text-3xl">
									{description}
								</h1>
								<p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
									<span>{accountLabel}</span>
									<span aria-hidden>·</span>
									<span>Sincronizada pela Pluggy</span>
								</p>
							</div>
						</div>

						<div className="shrink-0 border-t border-border/60 pt-4 sm:border-0 sm:pt-0 sm:text-right">
							<div className="flex items-center gap-2 sm:justify-end">
								<DirectionIcon
									aria-label={isOutgoing ? "Saída" : "Entrada"}
									className={isOutgoing ? "text-red-500" : "text-emerald-500"}
								/>
								<MaskedMonetaryValue
									className="font-[Space_Grotesk] text-xl font-semibold tracking-tight sm:text-3xl"
									format={(value) => formatCurrency(value, currency)}
									value={Math.abs(amount)}
								/>
							</div>
							<p className="mt-1 text-xs text-muted-foreground">
								{isOutgoing ? "Saída" : "Entrada"} · {currency}
							</p>
						</div>
					</div>

					<Separator />

					<dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
						<DetailField
							label="Data da transação"
							value={
								<span className="inline-flex items-center gap-2">
									<CalendarDays className="size-4 text-muted-foreground" />
									{formatDate(transaction.date)}
								</span>
							}
						/>
						<DetailField
							label="Horário"
							value="Não informado pela instituição"
						/>
						<DetailField label="Categoria" value={
							<Badge variant="outline">{transaction.category || "Outros"}</Badge>
						} />
						<DetailField label="Descrição" value={description} />
					</dl>
				</CardContent>
			</Card>

			<div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
				<Card className="financial-panel-border ring-0">
					<CardHeader className="border-b p-4 sm:p-6">
						<div className="flex items-center gap-2">
							<Landmark className="size-4 text-muted-foreground" />
							<CardTitle>Conta de origem</CardTitle>
						</div>
						<CardDescription>Contexto da conta no momento da sincronização.</CardDescription>
					</CardHeader>
					<CardContent className="p-4 pt-5 sm:p-6 sm:pt-5">
						<dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
							<DetailField label="Nome" value={accountLabel} />
							<DetailField
								label="Tipo"
								value={formatLabel(account?.type ?? transaction.accountType)}
							/>
							<DetailField
								label="Subtipo"
								value={formatLabel(account?.subtype ?? transaction.accountSubtype)}
							/>
							<DetailField
								label="Bandeira"
								value={account?.brand ?? transaction.accountBrand}
							/>
							<DetailField
								label="Saldo"
								value={
									account?.balance
										? <MaskedMonetaryValue
											format={(value) => formatCurrency(value, currency)}
											value={Number(account.balance)}
										/>
										: undefined
								}
							/>
							<DetailField
								label="Saldo disponível"
								value={
									account?.availableBalance
										? <MaskedMonetaryValue
											format={(value) => formatCurrency(value, currency)}
											value={Number(account.availableBalance)}
										/>
										: undefined
								}
							/>
							<DetailField label="Moeda" value={currency} />
							<DetailField label="Status" value={formatLabel(account?.status)} />
						</dl>
					</CardContent>
				</Card>

				<Card className="financial-panel-border ring-0">
					<CardHeader className="border-b p-4 sm:p-6">
						<div className="flex items-center gap-2">
							<Database className="size-4 text-muted-foreground" />
							<CardTitle>Identificação</CardTitle>
						</div>
						<CardDescription>Referências preservadas da origem Pluggy.</CardDescription>
					</CardHeader>
					<CardContent className="p-4 pt-5 sm:p-6 sm:pt-5">
						<dl className="grid gap-x-6 gap-y-5">
							<DetailField
								label="ID da transação no Vault"
								value={
									<span className="flex items-center gap-1">
										<span className="min-w-0 break-all font-mono text-xs">{transaction.id}</span>
										<CopyValue label="ID da transação" value={transaction.id} />
									</span>
								}
								mono
							/>
							<DetailField
								label="ID da transação na Pluggy"
								value={
									<span className="flex items-center gap-1">
										<span className="min-w-0 break-all font-mono text-xs">{transaction.pluggyTransactionId}</span>
										<CopyValue label="ID da Pluggy" value={transaction.pluggyTransactionId} />
									</span>
								}
								mono
							/>
							<DetailField label="ID da conta na Pluggy" value={transaction.remoteAccountId} mono />
							<DetailField label="Número de transferência" value={account?.transferNumber} mono />
						</dl>
						<div className="mt-6 flex items-start gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
							<Info className="mt-0.5 size-3.5 shrink-0" />
							<span>O horário real não foi disponibilizado pela instituição conectada.</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				<CreditCard className="size-3.5" />
				<span>Dados sincronizados da conexão {transaction.provider}.</span>
			</div>
		</main>
	);
}
