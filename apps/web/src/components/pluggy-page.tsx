"use client";

import { Loader2, Trash2 } from "lucide-react";
import { PluggyConnectWidget } from "@/components/pluggy-connect-widget";
import { usePluggyDeleteItem, usePluggyItems } from "@/features/pluggy/sdk";

export function PluggyPage() {
	const { data: items, isLoading } = usePluggyItems();
	const deleteItem = usePluggyDeleteItem();

	const handleDelete = async (pluggyItemId: string) => {
		await deleteItem({ pluggyItemId });
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-semibold tracking-tight">
					Conectar conta bancária
				</h2>
				<p className="text-muted-foreground mt-1">
					Conecte sua conta para importar transações automaticamente via Open
					Finance.
				</p>
			</div>

			<PluggyConnectWidget />

			<div>
				<h3 className="text-lg font-semibold tracking-tight mb-3">
					Contas conectadas
				</h3>
				{isLoading ? (
					<div className="flex items-center justify-center p-8">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : items?.length === 0 ? (
					<p className="text-muted-foreground">Nenhuma conta conectada.</p>
				) : (
					<div className="space-y-2">
						{items?.map((item) => (
							<div
								key={item.id}
								className="flex items-center justify-between rounded-lg border p-4"
							>
								<div>
									<p className="font-medium">{item.provider}</p>
									<p className="text-sm text-muted-foreground">{item.status}</p>
								</div>
								<button
									onClick={() => handleDelete(item.id)}
									className="p-2 rounded-md hover:bg-accent"
									title="Remover"
								>
									<Trash2 className="h-4 w-4 text-muted-foreground" />
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
