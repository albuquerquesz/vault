import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@vault/ui/components/button";
import { Card, CardContent, CardHeader } from "@vault/ui/components/card";
import { Input } from "@vault/ui/components/input";
import { Plus, Target, XIcon } from "lucide-react";
import { useState } from "react";
import { type Goal, useCreateGoal, useGoals } from "@/features/finance/sdk";

const currencyFmt = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

function GoalsCard() {
	const { data: goals, isLoading } = useGoals();
	const createGoal = useCreateGoal();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [targetAmount, setTargetAmount] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const amount = parseFloat(targetAmount);
		if (!name.trim() || Number.isNaN(amount) || amount <= 0) return;

		createGoal.mutate(
			{ name: name.trim(), targetAmount: amount },
			{
				onSuccess: () => {
					setName("");
					setTargetAmount("");
					setOpen(false);
				},
			},
		);
	};

	return (
		<Card className="financial-panel-border w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Target className="size-4 text-muted-foreground" />
						<span className="text-sm font-medium">Metas</span>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="gap-1 text-muted-foreground"
						onClick={() => setOpen(true)}
					>
						<Plus className="size-3.5" />
						Adicionar
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="text-sm text-muted-foreground">Carregando...</div>
				) : goals?.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						Nenhuma meta definida
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{goals?.map((goal: Goal) => {
							const pct =
								goal.targetAmount > 0
									? Math.min(
											100,
											(goal.currentAmount / goal.targetAmount) * 100,
										)
									: 0;

							return (
								<div key={goal.id} className="flex flex-col gap-1.5">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">{goal.name}</span>
										<span className="text-xs text-muted-foreground">
											{currencyFmt.format(goal.currentAmount)} /{" "}
											{currencyFmt.format(goal.targetAmount)}
										</span>
									</div>
									<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-primary transition-all"
											style={{ width: `${pct}%` }}
										/>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>

			<Dialog.Root open={open} onOpenChange={setOpen}>
				<Dialog.Portal>
					<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
					<Dialog.Popup
						className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-card text-card-foreground shadow-2xl transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 sm:rounded-xl"
					>
						<form onSubmit={handleSubmit}>
							<div className="flex flex-col gap-4 p-6">
								{/* Title + Close */}
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-semibold tracking-tight">
										Nova meta
									</h2>
									<Dialog.Close
										render={
											<Button
												variant="ghost"
												size="icon-sm"
												className="h-8 w-8"
											/>
										}
									>
										<XIcon className="size-4" />
									</Dialog.Close>
								</div>

								<div className="flex flex-col gap-4">
									<div className="flex flex-col gap-1.5">
										<label
											htmlFor="goal-name"
											className="text-sm font-medium"
										>
											Nome
										</label>
										<Input
											id="goal-name"
											placeholder="Ex: Viagem, Carro novo..."
											value={name}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												setName(e.target.value)
											}
											required
										/>
									</div>
									<div className="flex flex-col gap-1.5">
										<label
											htmlFor="goal-target"
											className="text-sm font-medium"
										>
											Valor meta
										</label>
										<Input
											id="goal-target"
											type="number"
											min="0.01"
											step="0.01"
											placeholder="0,00"
											value={targetAmount}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												setTargetAmount(e.target.value)
											}
											required
										/>
									</div>
								</div>

								<div className="flex justify-end gap-2">
									<Button
										variant="ghost"
										type="button"
										onClick={() => setOpen(false)}
									>
										Cancelar
									</Button>
									<Button type="submit">Criar meta</Button>
								</div>
							</div>
						</form>
					</Dialog.Popup>
				</Dialog.Portal>
			</Dialog.Root>
		</Card>
	);
}

export { GoalsCard };
