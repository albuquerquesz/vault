"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@vault/ui/components/button";
import { Input } from "@vault/ui/components/input";
import { XIcon } from "lucide-react";
import type { FormEvent } from "react";
import { maskBrlInput } from "@/components/overview/goals/hooks/use-goals-card";

type CreateGoalDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	name: string;
	targetAmount: string;
	url: string;
	onNameChange: (value: string) => void;
	onTargetAmountChange: (value: string) => void;
	onUrlChange: (value: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	isSubmitting: boolean;
	isEditing?: boolean;
};

export function CreateGoalDialog({
	open,
	onOpenChange,
	name,
	targetAmount,
	url,
	onNameChange,
	onTargetAmountChange,
	onUrlChange,
	onSubmit,
	isSubmitting,
	isEditing = false,
}: CreateGoalDialogProps) {
	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
				<Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-card text-card-foreground shadow-2xl transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 sm:rounded-xl">
					<form onSubmit={onSubmit}>
						<div className="flex flex-col gap-4 p-6">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold tracking-tight">
									{isEditing ? "Editar meta" : "Nova meta"}
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
									<label htmlFor="goal-name" className="text-sm font-medium">
										Nome
									</label>
									<Input
										id="goal-name"
										placeholder="Ex: Viagem, Carro novo..."
										value={name}
										onChange={(event) => onNameChange(event.target.value)}
										required
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<label htmlFor="goal-target" className="text-sm font-medium">
										Valor
									</label>
									<Input
										id="goal-target"
										type="text"
										inputMode="numeric"
										autoComplete="off"
										placeholder="R$ 0,00"
										value={targetAmount}
										onKeyDown={(event) => {
											// Allow control/navigation keys; block non-digit character input.
											if (event.ctrlKey || event.metaKey || event.altKey) {
												return;
											}
											if (event.key.length === 1 && !/^\d$/.test(event.key)) {
												event.preventDefault();
											}
										}}
										onChange={(event) => {
											// Digits-only BRL mask. Always write the masked value back onto
											// the DOM: when the result equals previous React state (e.g.
											// paste with letters), React skips re-render and junk would stick.
											const masked = maskBrlInput(event.currentTarget.value);
											event.currentTarget.value = masked;
											onTargetAmountChange(masked);
										}}
										onPaste={(event) => {
											event.preventDefault();
											const text = event.clipboardData.getData("text") ?? "";
											const digits =
												targetAmount.replace(/\D/g, "") +
												text.replace(/\D/g, "");
											onTargetAmountChange(maskBrlInput(digits));
										}}
										required
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<label htmlFor="goal-url" className="text-sm font-medium">
										URL
										<span className="ml-1 font-normal text-muted-foreground">
											(opcional)
										</span>
									</label>
									<Input
										id="goal-url"
										type="url"
										placeholder="https://..."
										value={url}
										onChange={(event) => onUrlChange(event.target.value)}
									/>
								</div>
							</div>

							<div className="flex justify-end gap-2">
								<Button
									variant="ghost"
									type="button"
									onClick={() => onOpenChange(false)}
								>
									Cancelar
								</Button>
								<Button disabled={isSubmitting} type="submit">
									{isEditing ? "Salvar" : "Criar meta"}
								</Button>
							</div>
						</div>
					</form>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
