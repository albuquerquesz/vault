import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@vault/ui/components/item";
import {
	ChevronRightIcon,
	DownloadIcon,
	PackagePlusIcon,
	SettingsIcon,
	TruckIcon,
} from "lucide-react";

const actions = [
	{
		title: "Adicionar produto",
		description: "Crie um novo SKU.",
		href: "#",
		icon: <PackagePlusIcon aria-hidden="true" />,
	},
	{
		title: "Revisar pendentes",
		description: "Pedidos aguardando envio.",
		href: "#",
		icon: <TruckIcon aria-hidden="true" />,
	},
	{
		title: "Configurações da loja",
		description: "Pagamentos, checkout etc.",
		href: "#",
		icon: <SettingsIcon aria-hidden="true" />,
	},
	{
		title: "Exportar vendas",
		description: "CSV para contabilidade.",
		href: "#",
		icon: <DownloadIcon aria-hidden="true" />,
	},
] as const;

export function QuickActions() {
	return (
		<Card className="financial-panel-border">
			<CardHeader>
				<CardTitle>Ações rápidas</CardTitle>
				<CardDescription>Atalhos para os principais destinos.</CardDescription>
			</CardHeader>
			<CardContent>
				<ItemGroup className="gap-0">
					{actions.map((a) => (
						<Item key={a.title} size="sm" render={<a href={a.href} />}>
							<ItemMedia variant="icon">{a.icon}</ItemMedia>
							<ItemContent>
								<ItemTitle>{a.title}</ItemTitle>
								<ItemDescription className="line-clamp-1">
									{a.description}
								</ItemDescription>
							</ItemContent>
							<ItemActions>
								<ChevronRightIcon
									aria-hidden="true"
									className="size-4 shrink-0 text-muted-foreground"
								/>
							</ItemActions>
						</Item>
					))}
				</ItemGroup>
			</CardContent>
		</Card>
	);
}
