import { Button } from "@vault/ui/components/button";
import { cn } from "@vault/ui/lib/utils";
import { MenuIcon, XIcon } from "lucide-react";
import React from "react";
import { navLinks } from "@/components/header";
import { Portal, PortalBackdrop } from "@/components/portal";

export function MobileNav() {
	const [open, setOpen] = React.useState(false);

	return (
		<div className="md:hidden">
			<Button
				aria-controls="mobile-menu"
				aria-expanded={open}
				aria-label="Alternar menu"
				className="md:hidden"
				onClick={() => setOpen(!open)}
				size="icon"
				variant="outline"
			>
				{open ? (
					<XIcon className="size-4.5" />
				) : (
					<MenuIcon className="size-4.5" />
				)}
			</Button>
			{open && (
				<Portal className="top-14" id="mobile-menu">
					<PortalBackdrop />
					<div
						className={cn(
							"data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
							"size-full p-4",
						)}
						data-slot={open ? "open" : "closed"}
					>
						<div className="grid gap-y-2">
							{navLinks.map((link) => (
								<Button
									className="justify-start"
									key={link.label}
									variant="ghost"
									render={<a href={link.href} />}
									nativeButton={false}
								>
									{link.label}
								</Button>
							))}
						</div>
						<div className="mt-12 flex flex-col gap-2">
							<Button className="w-full" variant="outline">
								Entrar
							</Button>
							<Button className="w-full">Começar</Button>
						</div>
					</div>
				</Portal>
			)}
		</div>
	);
}
