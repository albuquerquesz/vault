import type { SVGProps } from "react";

interface GoogleIconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
	size?: number;
}

export function GoogleIcon({ size = 20, ...props }: GoogleIconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			aria-hidden="true"
			focusable="false"
			{...props}
		>
			<path
				fill="currentColor"
				d="M21.35 11.1h-9.18v2.98h5.27c-.23 1.52-1.83 4.47-5.27 4.47-3.17 0-5.76-2.62-5.76-5.85s2.58-5.85 5.76-5.85c1.8 0 3 .77 3.69 1.44l2.52-2.45C16.77 4.34 14.67 3.5 12.17 3.5c-5.09 0-9.22 4.18-9.22 9.35s4.13 9.35 9.22 9.35c5.32 0 8.84-3.78 8.84-9.1 0-.61-.06-1.08-.16-1.5Z"
			/>
		</svg>
	);
}
