"use client";

import { Button } from "@vault/ui/components/button";
import { cn } from "@vault/ui/lib/utils";
import { createContext, useContext, useEffect, useState } from "react";
import {
	AnimatedSidebarEyeIcon,
	AnimatedSidebarEyeOffIcon,
} from "@/components/animated-sidebar-icons";
import { AnimatedNumber } from "@/components/animated-number";

const STORAGE_KEY = "vault-monetary-visibility";
const MASKED_VALUE = "...";

type MonetaryVisibilityContextValue = {
	isVisible: boolean;
	setVisible: (visible: boolean) => void;
	toggle: () => void;
};

const MonetaryVisibilityContext =
	createContext<MonetaryVisibilityContextValue | null>(null);

function readStoredVisibility() {
	if (typeof window === "undefined") {
		return true;
	}

	const storedValue = window.localStorage.getItem(STORAGE_KEY);
	if (storedValue === null) {
		return true;
	}

	return storedValue === "true";
}

export function MonetaryVisibilityProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isVisible, setVisible] = useState(readStoredVisibility);

	useEffect(() => {
		window.localStorage.setItem(STORAGE_KEY, String(isVisible));
	}, [isVisible]);

	return (
		<MonetaryVisibilityContext.Provider
			value={{
				isVisible,
				setVisible,
				toggle: () => setVisible((currentValue) => !currentValue),
			}}
		>
			{children}
		</MonetaryVisibilityContext.Provider>
	);
}

export function useMonetaryVisibility() {
	const context = useContext(MonetaryVisibilityContext);

	if (!context) {
		throw new Error(
			"useMonetaryVisibility must be used within MonetaryVisibilityProvider.",
		);
	}

	return context;
}

export function maskMonetaryText(
	value: string,
	isVisible: boolean,
	mask = MASKED_VALUE,
	prefix = "R$",
) {
	return isVisible ? value : `${prefix} ${mask}`;
}

export function MonetaryMask({
	className,
	prefix = "R$",
}: {
	className?: string;
	prefix?: React.ReactNode;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 align-middle leading-none",
				className,
			)}
		>
			{prefix ? (
				<span className="shrink-0 font-inherit leading-none text-current">
					{prefix}
				</span>
			) : null}
			<span className="inline-flex translate-y-px items-center gap-1">
				<span className="size-[0.34em] rounded-full bg-current" />
				<span className="size-[0.34em] rounded-full bg-current" />
				<span className="size-[0.34em] rounded-full bg-current" />
			</span>
		</span>
	);
}

export function MaskedMonetaryText({
	children,
	className,
	mask = MASKED_VALUE,
	prefix = "R$",
}: {
	children: React.ReactNode;
	className?: string;
	mask?: string;
	prefix?: React.ReactNode;
}) {
	const { isVisible } = useMonetaryVisibility();

	return (
		<span className={className}>
			{isVisible ? children : <MonetaryMask prefix={prefix ?? mask} />}
		</span>
	);
}

export function MaskedMonetaryValue({
	value,
	format,
	animated = false,
	start = 0,
	duration = 0.9,
	className,
	mask = MASKED_VALUE,
	prefix = "R$",
}: {
	value: number;
	format: (value: number) => string;
	animated?: boolean;
	start?: number;
	duration?: number;
	className?: string;
	mask?: string;
	prefix?: React.ReactNode;
}) {
	const { isVisible } = useMonetaryVisibility();

	if (!isVisible) {
		return (
			<span className={className}>
				<MonetaryMask prefix={prefix ?? mask} />
			</span>
		);
	}

	if (animated) {
		return (
			<AnimatedNumber
				className={className}
				duration={duration}
				format={format}
				start={start}
				value={value}
			/>
		);
	}

	return <span className={className}>{format(value)}</span>;
}

export function MonetaryVisibilityToggle() {
	const { isVisible, toggle } = useMonetaryVisibility();

	return (
		<Button
			aria-label={isVisible ? "Ocultar valores monetários" : "Mostrar valores monetários"}
			aria-pressed={!isVisible}
			className="size-9 rounded-full text-muted-foreground"
			onClick={toggle}
			size="icon-sm"
			type="button"
			variant="ghost"
		>
			{isVisible ? (
				<AnimatedSidebarEyeIcon className="size-6" size={24} />
			) : (
				<AnimatedSidebarEyeOffIcon className="size-6" size={24} />
			)}
		</Button>
	);
}
