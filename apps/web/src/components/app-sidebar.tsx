"use client";

import { cloneElement, isValidElement, useRef, useState, type ReactElement } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "@tanstack/react-router";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@vault/ui/components/sidebar";
import { cn } from "@vault/ui/lib/utils";
import { type SidebarNavItem, useNavLinks } from "@/components/app-shared";
import { NavUser } from "@/components/nav-user";
import { MonetaryVisibilityToggle } from "@/components/monetary-visibility-toggle";
import { VaultLogo } from "@/components/vault-logo";

export function AppSidebar() {
	const navLinks = useNavLinks();
	const { setOpenMobile, state } = useSidebar();

	return (
		<Sidebar
			className={cn(
				"border-0! md:p-4 md:group-data-[collapsible=icon]:p-2 *:data-[slot=sidebar-inner]:bg-sidebar",
				"**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75",
			)}
			collapsible="icon"
			style={{ fontFamily: '"Space Grotesk", sans-serif' }}
			variant="inset"
		>
			<div className="vault-sidebar-surface flex h-full min-h-0 flex-col">
			<SidebarHeader className="h-14 justify-center px-2 group-data-[collapsible=icon]:px-0">
				<div className="flex w-full min-w-0 items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
					<VaultLogo
						size="sm"
						className="min-w-0 group-data-[collapsible=icon]:hidden [&_span]:truncate [&_span]:text-xl [&_span]:font-medium [&_span]:text-foreground!"
					/>
					<VaultLogo
						size="sm"
						showName={false}
						className="hidden group-data-[collapsible=icon]:inline-flex"
					/>
					<div className="group-data-[collapsible=icon]:hidden">
						<MonetaryVisibilityToggle />
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent className="px-3 pt-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
				<SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
					{navLinks.map((item) => (
						<AnimatedNavItem key={item.title} item={item} onNavigate={() => setOpenMobile(false)} />
					))}
				</SidebarMenu>
				<div className="mt-auto mb-4 pt-2">
					<NavUser compact={state === "collapsed"} />
				</div>
			</SidebarContent>
			</div>
		</Sidebar>
	);
}

function AnimatedNavItem({ item, onNavigate }: { item: SidebarNavItem; onNavigate: () => void }) {
	const iconRef = useRef<{ startAnimation: () => void; stopAnimation: () => void }>(null);
	const [hovered, setHovered] = useState(false);
	const reducedMotion = useReducedMotion();
	const controlled = item.path === "/" || item.path === "/transactions";
	const icon = controlled && isValidElement(item.icon)
		? cloneElement(item.icon as ReactElement<{ ref: typeof iconRef }>, { ref: iconRef })
		: item.icon;
	const start = () => {
		if (reducedMotion) return;
		setHovered(true);
		iconRef.current?.startAnimation();
	};
	const stop = () => {
		setHovered(false);
		iconRef.current?.stopAnimation();
	};
	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				className="h-10 text-base [&_svg]:size-6"
				isActive={item.isActive}
				onClick={onNavigate}
				onMouseEnter={start}
				onMouseLeave={stop}
				onFocus={start}
				onBlur={stop}
				render={<Link to={item.path ?? "#"} />}
			>
				<motion.div
					className="flex shrink-0 items-center justify-center"
					animate={hovered && !controlled ? { rotate: [0, -12, 12, 0], scale: [1, 1.12, 1] } : { rotate: 0, scale: 1 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					{icon}
				</motion.div>
				<span>{item.title}</span>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}
