import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@vault/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@vault/ui/components/card";
import { Input } from "@vault/ui/components/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@vault/ui/components/tooltip";
import { Info, Wallet, XIcon } from "lucide-react";
import { useState } from "react";
import {
	getMonthValue,
	useFinanceMonthlyOverview,
	useSavingsTarget,
	useUpsertSavingsTarget,
} from "@/features/finance/sdk";

function formatCurrency(value: number) {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
}

function getDaysInMonth(yearMonth: string) {
	const [year, month] = yearMonth.split("-").map(Number);
	return new Date(year, month, 0).getDate();
}

function DailySpendingLimitCard() {
	const month = getMonthValue();
	const { data: overview } = useFinanceMonthlyOverview(month);
	const { data: target } = useSavingsTarget(month);
	const upsertMutation = useUpsertSavingsTarget();
	const [open, setOpen] = useState(false);
	const [percentage, setPercentage] = useState(
		() => target?.savingsPercentage ?? 0,
	);

	const income = overview?.income ?? 0;
	const savingsPercentage = target?.savingsPercentage ?? 0;
	const daysInMonth = getDaysInMonth(month);
	const spendable = income * (1 - savingsPercentage / 100);
	const dailyLimit = savingsPercentage > 0 ? spendable / daysInMonth : 0;

	const previewSpendable =
		income > 0 && percentage > 0 ? income * (1 - percentage / 100) : 0;
	const previewDailyLimit =
		income > 0 && percentage > 0 ? previewSpendable / daysInMonth : 0;

	const handleSave = () => {
		upsertMutation.mutate(
			{ month, savingsPercentage: percentage },
			{
				onSuccess: () => {
					setOpen(false);
				},
			},
		);
	};

	return (
		<Card className="financial-panel-border h-full min-h-[24rem] w-full">
			<CardHeader className="border-b">
				<div className="flex items-center justify-between gap-2">
					<CardDescription className="flex items-center gap-2 text-base">
						<Wallet className="size-4 text-muted-foreground" />
						<span>Limite Diário</span>
					</CardDescription>
					<Tooltip>
						<TooltipTrigger
							render={<Info className="mt-0.5 size-4 text-muted-foreground" />}
						/>
						<TooltipContent>
							Defina uma meta de economia e veja quanto pode gastar por dia.
						</TooltipContent>
					</Tooltip>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-baseline gap-2">
					<span className="text-3xl font-semibold tabular-nums tracking-tight">
						{formatCurrency(dailyLimit)}
					</span>
				</div>

				{dailyLimit > 0 && (
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>Meta: {savingsPercentage}% economia</span>
							<span>{formatCurrency(spendable)} disponível</span>
						</div>
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-primary transition-all"
								style={{ width: `${savingsPercentage}%` }}
							/>
						</div>
					</div>
				)}

				{dailyLimit === 0 && income > 0 && (
					<p className="text-xs text-muted-foreground">
						Nenhuma meta definida. Configure sua meta de economia.
					</p>
				)}

				<Button
					variant="outline"
					size="sm"
					className="self-end"
					onClick={() => {
						setPercentage(savingsPercentage);
						setOpen(true);
					}}
				>
					Configurar Meta
				</Button>

				<Dialog.Root open={open} onOpenChange={setOpen}>
					<Dialog.Portal>
						<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
						<Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-card text-card-foreground shadow-2xl transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 sm:rounded-xl">
							<div className="flex flex-col gap-4 p-6">
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-semibold tracking-tight">
										Meta de Economia
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
										<label htmlFor="savings-pct" className="text-sm font-medium">
											Porcentagem de economia
										</label>
										<div className="flex items-center gap-2">
											<Input
												id="savings-pct"
												type="number"
												min={1}
												max={99}
												value={percentage}
												onChange={e => setPercentage(Number(e.target.value))}
												className="flex-1"
											/>
											<span className="text-sm text-muted-foreground">%</span>
										</div>
									</div>

									{income > 0 && percentage > 0 && (
										<div className="space-y-2 rounded-lg border bg-muted/50 p-3">
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">Renda mensal</span>
												<span className="font-medium">
													{formatCurrency(income)}
												</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">
													Economia prevista
												</span>
												<span className="font-medium text-green-500">
													{formatCurrency(income * (percentage / 100))}
												</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">
													Disponível para gastos
												</span>
												<span className="font-medium">
													{formatCurrency(previewSpendable)}
												</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">
													Limite diário
												</span>
												<span className="font-medium">
													{formatCurrency(previewDailyLimit)}
												</span>
											</div>
										</div>
									)}

									<div className="flex justify-end gap-2">
										<Button
											variant="ghost"
											onClick={() => setOpen(false)}
										>
											Cancelar
										</Button>
										<Button onClick={handleSave} disabled={upsertMutation.isPending}>
											{upsertMutation.isPending ? "Salvando..." : "Salvar"}
										</Button>
									</div>
								</div>
							</div>
						</Dialog.Popup>
					</Dialog.Portal>
				</Dialog.Root>
			</CardContent>
		</Card>
	);
}

export { DailySpendingLimitCard };
