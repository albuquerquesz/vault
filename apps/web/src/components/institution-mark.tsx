"use client";

import { cn } from "@vault/ui/lib/utils";
import { BanknoteIcon, Building2 } from "lucide-react";
import { useState } from "react";

type InstitutionStyle = {
	/** Tailwind classes for avatar background + text (used without logo). */
	className: string;
	/** Optional short label (1–2 chars) when no logo asset. */
	label?: string;
	/** Optional public path to institution logo under `/images/institutions/`. */
	logoSrc?: string;
};

/**
 * Brand accents for known Brazilian / Open Finance institutions.
 * Matched case-insensitively against Pluggy `provider` (or account name).
 * Logo assets live in `apps/web/public/images/institutions/`.
 */
/** Pluggy sandbox / multipurpose connector names that are not a real bank. */
const GENERIC_PROVIDERS = /^(meu\s*pluggy|unknown institution|pluggy)$/i;

const INSTITUTION_STYLES: Array<{ match: RegExp; style: InstitutionStyle }> = [
	{
		// "Nu Pagamentos S.A.", "Nubank", standalone "Nu"
		match: /nubank|nu\s*pagamentos|\bnu\b/i,
		style: {
			className: "bg-[#820AD1] text-white",
			label: "Nu",
			logoSrc: "/images/institutions/nubank.png",
		},
	},
	{
		match: /inter/i,
		style: { className: "bg-[#FF7A00] text-white", label: "In" },
	},
	{
		match: /ita[uú]/i,
		style: { className: "bg-[#EC7000] text-white", label: "It" },
	},
	{
		match: /bradesco/i,
		style: { className: "bg-[#CC092F] text-white", label: "Br" },
	},
	{
		match: /santander/i,
		style: { className: "bg-[#EC0000] text-white", label: "Sa" },
	},
	{
		match: /bb|banco do brasil/i,
		style: { className: "bg-[#FCFC30] text-[#003399]", label: "BB" },
	},
	{
		match: /caixa/i,
		style: { className: "bg-[#005CA9] text-white", label: "Cx" },
	},
	{
		match: /c6/i,
		style: {
			className: "bg-[#242424] text-white ring-1 ring-white/20",
			label: "C6",
		},
	},
	{
		match: /mercado\s*pago|mercadopago/i,
		style: {
			className: "bg-[#00B1EA] text-white",
			label: "MP",
			logoSrc: "/images/institutions/mercado-pago.png",
		},
	},
	{
		match: /picpay/i,
		style: { className: "bg-[#21C25E] text-white", label: "Pp" },
	},
	{
		match: /xp/i,
		style: {
			className: "bg-black text-[#F5C518] ring-1 ring-white/15",
			label: "XP",
		},
	},
	{
		match: /btg/i,
		style: { className: "bg-[#001E62] text-white", label: "BT" },
	},
	{
		match: /will/i,
		style: { className: "bg-[#FFDD00] text-black", label: "Wi" },
	},
	{
		match: /neon/i,
		style: { className: "bg-[#00E3C2] text-black", label: "Ne" },
	},
	{
		match: /original/i,
		style: { className: "bg-[#00A650] text-white", label: "Or" },
	},
	{
		match: /safra/i,
		style: { className: "bg-[#003DA5] text-white", label: "Sf" },
	},
	{
		match: /sicoob/i,
		style: { className: "bg-[#003641] text-white", label: "Sc" },
	},
	{
		match: /sicredi/i,
		style: { className: "bg-[#3FA110] text-white", label: "Si" },
	},
];

function isGenericProvider(value?: string | null): boolean {
	return Boolean(value?.trim() && GENERIC_PROVIDERS.test(value.trim()));
}

function resolveInstitutionStyle(
	provider?: string | null,
	fallbackName?: string | null,
): InstitutionStyle {
	// Ignore sandbox multipurpose connectors (e.g. MeuPluggy) — they are not brands.
	const usefulProvider = isGenericProvider(provider) ? null : provider;
	const haystack = [usefulProvider, fallbackName].filter(Boolean).join(" ");
	if (haystack) {
		for (const entry of INSTITUTION_STYLES) {
			if (entry.match.test(haystack)) {
				return entry.style;
			}
		}
	}

	const seed = (usefulProvider || fallbackName || "?").trim();
	const initial = seed.charAt(0).toUpperCase() || "?";
	return {
		className: "bg-foreground/10 text-foreground",
		label: initial,
	};
}

export function InstitutionMark({
	provider,
	name,
	source,
	className,
	size = "md",
}: {
	/** Institution name from Pluggy item (`provider`). */
	provider?: string | null;
	/** Optional account/card label used when provider is missing. */
	name?: string | null;
	/** Manual transaction source, rendered with a source-specific mark. */
	source?: "cash" | "pluggy";
	className?: string;
	size?: "sm" | "md" | "lg";
}) {
	const style = resolveInstitutionStyle(provider, name);
	const sizeClass =
		size === "sm"
			? "size-7 text-[10px]"
			: size === "lg"
				? "size-9 text-xs"
				: "size-8 text-xs";
	const [logoFailed, setLogoFailed] = useState(false);
	const showLogo = Boolean(style.logoSrc) && !logoFailed;
	const isCash = source === "cash";
	const title = isCash
		? "Dinheiro físico"
		: provider?.trim() || name?.trim() || "Instituição";

	return (
		<div
			aria-hidden={isCash ? undefined : true}
			className={cn(
				"flex shrink-0 items-center justify-center overflow-hidden rounded-md font-semibold uppercase tracking-tight",
				sizeClass,
				// Solid brand fill only as fallback when there is no logo.
				!showLogo && style.className,
				showLogo && "bg-transparent",
				className,
			)}
			aria-label={isCash ? title : undefined}
			title={title}
			role={isCash ? "img" : undefined}
		>
			{isCash ? (
				<BanknoteIcon aria-hidden className="size-1/2" />
			) : showLogo && style.logoSrc ? (
				<img
					src={style.logoSrc}
					alt=""
					className="size-full object-cover"
					draggable={false}
					onError={() => setLogoFailed(true)}
				/>
			) : style.label ? (
				<span className="leading-none">{style.label}</span>
			) : (
				<Building2 className="size-3.5" />
			)}
		</div>
	);
}
