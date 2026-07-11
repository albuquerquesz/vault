import { Button } from "@vault/ui/components/button";
import { Input } from "@vault/ui/components/input";
import { KeyRound, Loader2, Search, X } from "lucide-react";
import { useState } from "react";
import {
	usePluggyConnectors,
	usePluggyConnectToken,
	usePluggyCredentialsStatus,
	usePluggyDeleteItem,
	usePluggyItems,
} from "@/features/pluggy/sdk";

const POPULAR_CONNECTOR_IDS = [
	"nubank",
	"inter",
	"itau",
	"bradesco",
	"bb",
	"santander",
	"caixa",
	"bf",
	"citibank",
	"hsbc",
	"daycoval",
	"picpay",
];

function BankCard({
	name,
	imageUrl,
	onConnect,
	isConnecting,
}: {
	name: string;
	imageUrl: string;
	onConnect: () => void;
	isConnecting: boolean;
}) {
	return (
		<div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
			<img
				src={imageUrl}
				alt={name}
				className="size-10 shrink-0 rounded-md object-contain bg-white p-1"
			/>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium truncate">{name}</p>
			</div>
			<Button
				size="sm"
				onClick={onConnect}
				disabled={isConnecting}
				className="shrink-0"
			>
				{isConnecting ? (
					<Loader2 className="size-3.5 animate-spin" />
				) : (
					"Conectar"
				)}
			</Button>
		</div>
	);
}

function BankGrid({
	connectors,
	onConnect,
	connectingId,
}: {
	connectors: Array<{ id: string; name: string; imageUrl: string }>;
	onConnect: (connectorId: string) => void;
	connectingId: string | null;
}) {
	return (
		<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
			{connectors.map((c) => (
				<BankCard
					key={c.id}
					name={c.name}
					imageUrl={c.imageUrl}
					onConnect={() => onConnect(c.id)}
					isConnecting={connectingId === c.id}
				/>
			))}
		</div>
	);
}

export function PluggyPage() {
	const { data: items, isLoading: isLoadingItems } = usePluggyItems();
	const { data: credentialsStatus, isLoading: isLoadingCredentials } =
		usePluggyCredentialsStatus();
	const credentialsReady = credentialsStatus?.configured === true;
	const { data: connectors, isLoading: isLoadingConnectors } =
		usePluggyConnectors(credentialsReady);
	const connectTokenMutation = usePluggyConnectToken();
	const deleteItemMutation = usePluggyDeleteItem();
	const [connectingId, setConnectingId] = useState<string | null>(null);
	const [showAll, setShowAll] = useState(false);
	const [search, setSearch] = useState("");

	const handleConnect = async (connectorId: string) => {
		if (!credentialsReady) return;
		setConnectingId(connectorId);
		try {
			const token = await connectTokenMutation.mutateAsync(connectorId);
			window.open(
				`https://connect.pluggy.ai/connect?token=${token.accessToken}&connectorId=${connectorId}`,
				"_blank",
			);
		} finally {
			setConnectingId(null);
		}
	};

	const handleDelete = async (pluggyItemId: string) => {
		await deleteItemMutation({ pluggyItemId });
	};

	const filteredConnectors =
		connectors?.filter((c) =>
			c.name.toLowerCase().includes(search.toLowerCase()),
		) ?? [];

	const popularConnectors = filteredConnectors.filter((c) =>
		POPULAR_CONNECTOR_IDS.includes(c.id),
	);
	const otherConnectors = filteredConnectors.filter(
		(c) => !POPULAR_CONNECTOR_IDS.includes(c.id),
	);

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Conectar conta bancária
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Conecte sua conta para importar transações automaticamente via Open
					Finance.
				</p>
			</div>

			{/* Bank Connection Section */}
			<section>
				<div className="mb-4 flex items-center gap-3">
					<h2 className="text-lg font-semibold">Bancos disponíveis</h2>
					<span className="text-xs text-muted-foreground">
						{filteredConnectors.length} bancos
					</span>
				</div>

				{isLoadingCredentials ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="size-5 animate-spin text-muted-foreground" />
					</div>
				) : !credentialsReady ? (
					<div className="rounded-xl border border-border bg-muted/30 p-6">
						<div className="flex items-start gap-3">
							<KeyRound className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
							<div className="space-y-1">
								<p className="text-sm font-medium">
									Configure suas chaves Pluggy
								</p>
								<p className="text-sm text-muted-foreground">
									Abra Configurações e informe o Client ID e Client Secret do
									seu app no dashboard Pluggy (BYOK) para listar bancos e
									conectar contas.
								</p>
							</div>
						</div>
					</div>
				) : (
					<>
						<div className="mb-3">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
								<Input
									placeholder="Buscar banco..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-9 rounded-md"
								/>
							</div>
						</div>

						{isLoadingConnectors ? (
							<div className="flex items-center justify-center py-12">
								<Loader2 className="size-5 animate-spin text-muted-foreground" />
							</div>
						) : filteredConnectors.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Nenhum banco encontrado.
							</p>
						) : (
							<>
								{popularConnectors.length > 0 && (
									<BankGrid
										connectors={popularConnectors}
										onConnect={handleConnect}
										connectingId={connectingId}
									/>
								)}
								{otherConnectors.length > 0 && (
									<>
										{!showAll && (
											<Button
												variant="ghost"
												size="sm"
												className="mt-3"
												onClick={() => setShowAll(true)}
											>
												Ver mais {otherConnectors.length} bancos
											</Button>
										)}
										{showAll && (
											<>
												<div className="my-4 h-px bg-border" />
												<BankGrid
													connectors={otherConnectors}
													onConnect={handleConnect}
													connectingId={connectingId}
												/>
											</>
										)}
									</>
								)}
							</>
						)}
					</>
				)}
			</section>

			{/* Connected Accounts Section */}
			<section>
				<h2 className="mb-4 text-lg font-semibold">Contas conectadas</h2>
				{isLoadingItems ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="size-5 animate-spin text-muted-foreground" />
					</div>
				) : !items || items.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Nenhuma conta conectada.
					</p>
				) : (
					<div className="space-y-2">
						{items.map((item) => (
							<div
								key={item.id}
								className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
							>
								<div>
									<p className="text-sm font-medium capitalize">
										{item.provider}
									</p>
									<p className="text-xs text-muted-foreground">
										Status: {item.status}
									</p>
								</div>
								<Button
									variant="destructive"
									size="icon-xs"
									onClick={() => handleDelete(item.id)}
								>
									<X className="size-3" />
								</Button>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
