"use client";

import { cn } from "@vault/ui/lib/utils";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
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

	try {
		const storedValue = window.localStorage.getItem(STORAGE_KEY);
		if (storedValue === null) {
			return true;
		}

		return storedValue === "true";
	} catch {
		// Storage can be unavailable in privacy-restricted browser contexts.
		return true;
	}
}

export function MonetaryVisibilityProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isVisible, setVisible] = useState(readStoredVisibility);
	const toggle = useCallback(() => {
		setVisible((currentValue) => !currentValue);
	}, []);
	const contextValue = useMemo(
		() => ({ isVisible, setVisible, toggle }),
		[isVisible, toggle],
	);

	useEffect(() => {
		try {
			window.localStorage.setItem(STORAGE_KEY, String(isVisible));
		} catch {
			// The in-memory preference still works when persistence is unavailable.
		}
	}, [isVisible]);

	return (
		<MonetaryVisibilityContext.Provider
			value={contextValue}
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
	prefix = "R$",
}: {
	children: React.ReactNode;
	className?: string;
	prefix?: React.ReactNode;
}) {
	const { isVisible } = useMonetaryVisibility();

	return (
		<span className={className}>
			{isVisible ? children : <MonetaryMask prefix={prefix} />}
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
	prefix = "R$",
}: {
	value: number;
	format: (value: number) => string;
	animated?: boolean;
	start?: number;
	duration?: number;
	className?: string;
	prefix?: React.ReactNode;
}) {
	const { isVisible } = useMonetaryVisibility();

	if (!isVisible) {
		return (
			<span className={className}>
				<MonetaryMask prefix={prefix} />
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
