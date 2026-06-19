"use client";
import { Button } from "@vault/ui/components/button";
import { cn } from "@vault/ui/lib/utils";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { useScroll } from "@/hooks/use-scroll";

export const navLinks = [
	{
		label: "Recursos",
		href: "#",
	},
	{
		label: "Preços",
		href: "#",
	},
	{
		label: "Sobre",
		href: "#",
	},
];

export function Header() {
	const scrolled = useScroll(10);

	return (
		<header
			className={cn("sticky top-0 z-50 w-full border-b border-border", {
				"border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50":
					scrolled,
			})}
		>
			<nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
				<a
					className="rounded-md p-2 hover:bg-muted dark:hover:bg-muted/50"
					href="#"
				>
					<Logo className="h-4" />
				</a>
				<div className="hidden items-center gap-2 md:flex">
					<ModeToggle />
					{navLinks.map((link) => (
						<Button
							key={link.label}
							size="sm"
							variant="ghost"
							render={<a href={link.href} />}
							nativeButton={false}
						>
							{link.label}
						</Button>
					))}
					<Button size="sm" variant="outline">
						Entrar
					</Button>
					<Button size="sm">Começar</Button>
				</div>
				<MobileNav />
			</nav>
		</header>
	);
}
