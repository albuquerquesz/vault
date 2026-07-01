import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@vault/ui/components/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@vault/ui/components/sidebar";
import { ChevronRightIcon } from "lucide-react";
import type { SidebarNavGroup } from "@/components/app-shared";

function triggerIconHover(
	event: React.MouseEvent<HTMLElement>,
	type: "mouseover" | "mouseout",
) {
	const icon = event.currentTarget.querySelector('[role="img"]');
	if (!icon) return;
	icon.dispatchEvent(new MouseEvent(type, { bubbles: true }));
}

export function NavGroup({ label, items }: SidebarNavGroup) {
	return (
		<SidebarGroup className="py-0">
			{label ? (
				<SidebarGroupLabel className="sr-only">{label}</SidebarGroupLabel>
			) : null}
			<SidebarMenu className="space-y-1">
				{items.map((item) => (
					<Collapsible
						className="group/collapsible py-0"
						defaultOpen={
							!!item.isActive || item.subItems?.some((i) => !!i.isActive)
						}
						key={item.title}
						render={<SidebarMenuItem />}
					>
						{item.subItems?.length ? (
							<>
								<CollapsibleTrigger
									render={
										<SidebarMenuButton
											className="font-['Space_Grotesk'] text-xl font-semibold tracking-tight"
											isActive={item.isActive}
											tooltip={item.title}
											onMouseEnter={(e) => triggerIconHover(e, "mouseover")}
											onMouseLeave={(e) => triggerIconHover(e, "mouseout")}
										/>
									}
								>
									{item.icon}
									<span className="text-[21px] font-semibold">{item.title}</span>
									<ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
								</CollapsibleTrigger>
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.subItems?.map((subItem) => (
											<SidebarMenuSubItem key={subItem.title}>
												<SidebarMenuSubButton
													className="font-['Space_Grotesk'] text-xl font-semibold tracking-tight"
													isActive={subItem.isActive}
													render={<a href={subItem.path} />}
												>
													{subItem.icon}
													<span className="text-[21px] font-semibold">
														{subItem.title}
													</span>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								</CollapsibleContent>
							</>
						) : (
							<SidebarMenuButton
								className="font-['Space_Grotesk'] text-xl font-semibold tracking-tight"
								isActive={item.isActive}
								tooltip={item.title}
								onMouseEnter={(e) => triggerIconHover(e, "mouseover")}
								onMouseLeave={(e) => triggerIconHover(e, "mouseout")}
								render={<a href={item.path} />}
							>
								{item.icon}
								<span className="text-[21px] font-semibold">{item.title}</span>
							</SidebarMenuButton>
						)}
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
