import { Link, useRouterState } from "@tanstack/react-router";
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
import type { SidebarNavGroup, SidebarNavItem } from "@/components/app-shared";

function triggerIconHover(
	event: React.MouseEvent<HTMLElement>,
	type: "mouseover" | "mouseout",
) {
	const icon = event.currentTarget.querySelector('[role="img"]');
	if (!icon) return;
	icon.dispatchEvent(new MouseEvent(type, { bubbles: true }));
}

function isItemActive(pathname: string, item: SidebarNavItem) {
	if (item.path) {
		return (
			pathname === item.path ||
			(item.path !== "/" && pathname.startsWith(`${item.path}/`))
		);
	}

	return item.subItems?.some((subItem) => isItemActive(pathname, subItem)) ?? false;
}

export function NavGroup({ label, items }: SidebarNavGroup) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	return (
		<SidebarGroup className="py-0">
			{label ? <SidebarGroupLabel className="sr-only">{label}</SidebarGroupLabel> : null}
			<SidebarMenu className="space-y-2">
				{items.map((item) => {
					const itemIsActive = isItemActive(pathname, item);

					return (
						<Collapsible
							className="group/collapsible py-0"
							defaultOpen={itemIsActive}
							key={item.title}
							render={<SidebarMenuItem />}
						>
							{item.subItems?.length ? (
								<>
									<CollapsibleTrigger
									render={
										<SidebarMenuButton
											className="font-['Space_Grotesk'] text-[1.12rem] font-medium tracking-tight"
											isActive={itemIsActive}
											size="lg"
												tooltip={item.title}
												onMouseEnter={(e) => triggerIconHover(e, "mouseover")}
												onMouseLeave={(e) => triggerIconHover(e, "mouseout")}
											/>
										}
									>
										{item.icon}
										<span className="font-['Space_Grotesk'] text-[1.12rem] font-medium tracking-tight">
											{item.title}
										</span>
										<ChevronRightIcon className="ml-auto size-5.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											{item.subItems?.map((subItem) => {
												const subItemIsActive = isItemActive(
													pathname,
													subItem,
												);

												return (
													<SidebarMenuSubItem key={subItem.title}>
														<SidebarMenuSubButton
															className="font-['Space_Grotesk'] text-[1rem] font-medium tracking-tight"
															isActive={subItemIsActive}
															render={
																subItem.path ? (
																	<Link to={subItem.path} />
																) : undefined
															}
														>
															{subItem.icon}
															<span className="font-['Space_Grotesk'] text-[1rem] font-medium tracking-tight">
																{subItem.title}
															</span>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												);
											})}
										</SidebarMenuSub>
									</CollapsibleContent>
								</>
							) : (
								<SidebarMenuButton
									className="font-['Space_Grotesk'] text-[1.12rem] font-medium tracking-tight"
									isActive={itemIsActive}
									size="lg"
									tooltip={item.title}
									onMouseEnter={(e) => triggerIconHover(e, "mouseover")}
									onMouseLeave={(e) => triggerIconHover(e, "mouseout")}
									render={item.path ? <Link to={item.path} /> : undefined}
								>
									{item.icon}
									<span className="font-['Space_Grotesk'] text-[1.12rem] font-medium tracking-tight">
										{item.title}
									</span>
								</SidebarMenuButton>
							)}
						</Collapsible>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
