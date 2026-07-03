import type { SVGProps } from "react";

interface VercelIconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
	size?: number;
}

export function VercelIcon({ size = 20, ...props }: VercelIconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			aria-hidden="true"
			focusable="false"
			{...props}
		>
			<path fill="currentColor" d="M12 2L2 22h20L12 2z" />
		</svg>
	);
}
