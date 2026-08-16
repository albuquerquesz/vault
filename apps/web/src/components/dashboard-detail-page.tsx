import { Link } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import type { DashboardDetailDefinition } from "@/components/dashboard-detail-definitions";

export function DashboardDetailPage({
	detail,
}: {
	detail: DashboardDetailDefinition;
}) {
	return (
		<div className="grid gap-4 pt-4 sm:gap-6 sm:pt-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
						{detail.title}
					</h1>
					<p className="max-w-[65ch] text-sm leading-6 text-muted-foreground sm:text-base">
						{detail.description}
					</p>
				</div>
				<Button
					className="min-h-11 w-full md:w-auto"
					render={<Link to="/" />}
					variant="outline"
				>
					Voltar para a dashboard
				</Button>
			</div>

			<Card className="financial-panel-border min-h-0 ring-0 sm:min-h-[24rem]">
				<CardHeader className="gap-4">
					<CardTitle className="text-2xl sm:text-3xl">{detail.scaffoldTitle}</CardTitle>
					<CardDescription className="max-w-3xl text-base">
						{detail.scaffoldDescription}
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 text-base text-muted-foreground">
					<p>
						Esta página foi criada como base de navegação para o indicador{" "}
						<span className="font-medium text-foreground">{detail.title}</span>.
					</p>
					<p>
						O próximo passo aqui é substituir este scaffold por um painel
						detalhado específico para esse indicador.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
