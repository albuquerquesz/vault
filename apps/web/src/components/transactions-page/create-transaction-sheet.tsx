"use client";

import { Button } from "@vault/ui/components/button";
import { Input } from "@vault/ui/components/input";
import { Label } from "@vault/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@vault/ui/components/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@vault/ui/components/sheet";
import { Textarea } from "@vault/ui/components/textarea";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@vault/ui/components/toggle-group";
import { ArrowDownIcon, ArrowUpIcon, BanknoteIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	type CreateManualTransactionInput,
	useCreateManualTransaction,
} from "@/features/finance/sdk";

const expenseCategories = [
	"Moradia",
	"Alimentação",
	"Transporte",
	"Saúde",
	"Lazer",
	"Outros",
];

const incomeCategories = [
	"Salário",
	"Freelance",
	"Investimentos",
	"Reembolso",
	"Outros",
];

type TransactionKind = CreateManualTransactionInput["kind"];

function getDefaultDateForMonth(month: string) {
	const now = new Date();
	const [year, monthIndex] = month.split("-").map(Number);
	const lastDay = new Date(year, monthIndex, 0).getDate();
	const day = Math.min(now.getDate(), lastDay);
	return `${month}-${String(day).padStart(2, "0")}`;
}

export function CreateTransactionSheet({ month }: { month: string }) {
	const [open, setOpen] = useState(false);
	const [kind, setKind] = useState<TransactionKind>("expense");
	const [date, setDate] = useState(() => getDefaultDateForMonth(month));
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState(expenseCategories[0]);
	const [note, setNote] = useState("");
	const createTransaction = useCreateManualTransaction(month);
	const categories = kind === "expense" ? expenseCategories : incomeCategories;

	useEffect(() => {
		setCategory(categories[0] ?? "Outros");
	}, [kind]);

	useEffect(() => {
		if (open) setDate(getDefaultDateForMonth(month));
	}, [month, open]);

	function resetForm() {
		setKind("expense");
		setDate(getDefaultDateForMonth(month));
		setAmount("");
		setCategory(expenseCategories[0]);
		setNote("");
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const parsedAmount = Number(amount.replace(",", "."));
		if (!date || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
			toast.error("Informe um valor válido e uma data.");
			return;
		}

		try {
			await createTransaction.mutateAsync({
				kind,
				date,
				amount: parsedAmount,
				category,
				note: note.trim() || undefined,
			});
			toast.success(kind === "expense" ? "Despesa adicionada" : "Receita adicionada");
			resetForm();
			setOpen(false);
		} catch {
			toast.error("Não foi possível salvar o lançamento.");
		}
	}

	return (
		<>
			<Button aria-label="Adicionar lançamento" onClick={() => setOpen(true)}>
				<PlusIcon data-icon="inline-start" />
				Adicionar
			</Button>

			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent
					className="data-[side=right]:w-full sm:data-[side=right]:w-3/4 sm:max-w-md"
					side="right"
				>
					<SheetHeader className="border-b px-5 py-5 sm:px-6">
						<SheetTitle className="text-lg">Novo lançamento</SheetTitle>
						<SheetDescription>
							Registre uma entrada ou saída que não veio do Pluggy.
						</SheetDescription>
					</SheetHeader>

					<form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
						<div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
							<div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-foreground">
									<BanknoteIcon aria-hidden className="size-4" />
								</div>
								<div className="min-w-0">
									<p className="text-sm font-medium">Dinheiro físico</p>
									<p className="text-xs text-muted-foreground">Origem deste lançamento</p>
								</div>
							</div>
							<div className="grid gap-2">
								<Label>Tipo</Label>
								<ToggleGroup
									aria-label="Tipo de lançamento"
									className="grid w-full grid-cols-2 gap-2"
									onValueChange={(values) => {
										const next = values[0];
										if (next === "expense" || next === "income") setKind(next);
									}}
									value={[kind]}
								>
									<ToggleGroupItem className="h-11 rounded-md border" value="expense">
										<ArrowDownIcon data-icon="inline-start" />
										Despesa
									</ToggleGroupItem>
									<ToggleGroupItem className="h-11 rounded-md border" value="income">
										<ArrowUpIcon data-icon="inline-start" />
										Receita
									</ToggleGroupItem>
								</ToggleGroup>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="manual-transaction-amount">Valor</Label>
								<Input
									aria-describedby="manual-transaction-amount-help"
									autoFocus
									className="h-12 rounded-md text-lg tabular-nums"
									id="manual-transaction-amount"
									inputMode="decimal"
									min="0.01"
									onChange={(event) => setAmount(event.target.value)}
									placeholder="0,00"
									step="0.01"
									type="number"
									value={amount}
								/>
								<p className="text-xs text-muted-foreground" id="manual-transaction-amount-help">
									Digite sempre um valor positivo. O tipo define o sentido do lançamento.
								</p>
							</div>

							<div className="grid gap-2 sm:grid-cols-2">
								<div className="grid gap-2">
									<Label htmlFor="manual-transaction-date">Data</Label>
									<Input className="h-11 rounded-md" id="manual-transaction-date" onChange={(event) => setDate(event.target.value)} type="date" value={date} />
								</div>
								<div className="grid gap-2">
									<Label htmlFor="manual-transaction-category">Categoria</Label>
									<Select onValueChange={(value) => value && setCategory(value)} value={category}>
										<SelectTrigger className="h-11 w-full rounded-md" id="manual-transaction-category">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="manual-transaction-note">Observação</Label>
								<Textarea
									className="min-h-24 rounded-md text-sm"
									id="manual-transaction-note"
									maxLength={280}
									onChange={(event) => setNote(event.target.value)}
									placeholder="Ex.: pagamento de freelance"
									value={note}
								/>
							</div>
						</div>

						<SheetFooter className="border-t px-5 py-4 sm:px-6">
							<Button className="h-11 w-full" disabled={createTransaction.isPending} type="submit">
								{createTransaction.isPending ? "Salvando..." : kind === "expense" ? "Salvar despesa" : "Salvar receita"}
							</Button>
						</SheetFooter>
					</form>
				</SheetContent>
			</Sheet>
		</>
	);
}
