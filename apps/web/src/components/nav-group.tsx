import { Link } from "@tanstack/react-router";
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

export function NavGroup({ label, items }: SidebarNavGroup) {
	return (
		<SidebarGroup>
			{label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						className="group/collapsible"
						defaultOpen={
							!!item.isActive || item.subItems?.some((i) => !!i.isActive)
						}
						key={item.title}
						render={<SidebarMenuItem />}
					>
						{item.subItems?.length ? (
							<>
								<CollapsibleTrigger
									render={<SidebarMenuButton isActive={item.isActive} />}
								>
									{item.icon}
									<span>{item.title}</span>
									<ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
								</CollapsibleTrigger>
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.subItems?.map((subItem) => (
											<SidebarMenuSubItem key={subItem.title}>
												<SidebarMenuSubButton
													isActive={subItem.isActive}
													render={<Link to={subItem.path ?? "#"} />}
												>
													{subItem.icon}
													<span>{subItem.title}</span>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								</CollapsibleContent>
							</>
						) : (
							<SidebarMenuButton
								isActive={item.isActive}
								render={<Link to={item.path ?? "#"} />}
							>
								{item.icon}
								<span>{item.title}</span>
							</SidebarMenuButton>
						)}
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
