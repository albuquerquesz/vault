"use client";

import { Button } from "@vault/ui/components/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
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
) {
	return isVisible ? value : mask;
}

export function MaskedMonetaryText({
	children,
	className,
	mask = MASKED_VALUE,
}: {
	children: React.ReactNode;
	className?: string;
	mask?: string;
}) {
	const { isVisible } = useMonetaryVisibility();

	return (
		<span className={className}>{isVisible ? children : mask}</span>
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
}: {
	value: number;
	format: (value: number) => string;
	animated?: boolean;
	start?: number;
	duration?: number;
	className?: string;
	mask?: string;
}) {
	const { isVisible } = useMonetaryVisibility();

	if (!isVisible) {
		return <span className={className}>{mask}</span>;
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
			{isVisible ? <EyeIcon className="size-5.5" /> : <EyeOffIcon className="size-5.5" />}
		</Button>
	);
}
