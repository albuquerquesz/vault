import { cn } from "@vault/ui/lib/utils";

const sizeClasses = {
	sm: {
		mark: "h-7 w-7 rounded-lg",
		wordmark: "text-base",
		gap: "gap-2",
	},
	md: {
		mark: "h-10 w-10 rounded-xl",
		wordmark: "text-xl",
		gap: "gap-2.5",
	},
} as const;

type VaultLogoProps = {
	className?: string;
	/** Whether the "Vault" wordmark is shown next to the mark. */
	showName?: boolean;
	size?: keyof typeof sizeClasses;
};

export function VaultLogo({
	className,
	showName = true,
	size = "md",
}: VaultLogoProps) {
	const classes = sizeClasses[size];

	return (
		<div
			className={cn(
				"inline-flex items-center",
				classes.gap,
				className,
			)}
		>
			<img
				src="/images/logo.png"
				alt={showName ? "" : "Vault"}
				aria-hidden={showName ? true : undefined}
				className={cn(classes.mark, "object-contain")}
			/>
			{showName ? (
				<span
					className={cn(
						"font-semibold tracking-tight text-zinc-900 dark:text-zinc-50",
						classes.wordmark,
					)}
					style={{ fontFamily: '"Space Grotesk", sans-serif' }}
				>
					Vault
				</span>
			) : null}
		</div>
	);
}
