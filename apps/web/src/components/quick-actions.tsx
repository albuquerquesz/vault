import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import {
	ChevronRightIcon,
	DownloadIcon,
	MegaphoneIcon,
	SettingsIcon,
	TruckIcon,
} from "lucide-react";
import { cn } from "@vault/ui/lib/utils";

const actions = [
	{
		title: "Add Campaign",
		description: "Launch a new campaign and reach more customers.",
		href: "#",
		icon: MegaphoneIcon,
	},
	{
		title: "Review unfulfilled",
		description: "Check orders that still need to be packed and shipped.",
		href: "#",
		icon: TruckIcon,
	},
	{
		title: "Workspace settings",
		description: "Manage billing, permissions, and your workspace details.",
		href: "#",
		icon: SettingsIcon,
	},
	{
		title: "Export sales",
		description: "Download your latest sales data as a CSV file.",
		href: "#",
		icon: DownloadIcon,
	},
] as const;

export function QuickActions() {
	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="gap-0 pb-4">
				<CardTitle>Quick actions</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col">
					{actions.map((a) => (
						<a
							key={a.title}
							href={a.href}
							className={cn(
								"group flex items-start gap-4 rounded-[1.25rem] px-0 py-4 transition-colors",
								"hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
							)}
						>
							<div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-muted-foreground transition-colors group-hover:text-foreground">
								<a.icon aria-hidden="true" className="size-4" />
							</div>
							<div className="min-w-0 flex-1 space-y-1.5">
								<div className="text-[1.02rem] font-medium tracking-tight text-foreground">
									{a.title}
								</div>
								<p className="max-w-[28ch] text-sm leading-6 text-muted-foreground">
									{a.description}
								</p>
							</div>
							<div className="flex h-9 shrink-0 items-center">
								<ChevronRightIcon
									aria-hidden="true"
									className="size-4 shrink-0 text-muted-foreground transition-transform transition-colors group-hover:translate-x-0.5 group-hover:text-foreground"
								/>
							</div>
						</a>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
