import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { GoogleIcon } from "@/components/google-icon";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import { VaultLogo } from "@/components/vault-logo";
import { Waves } from "@/components/waves";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (session?.data) {
			throw redirect({ to: "/", replace: true });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	async function handleGoogleSignIn() {
		try {
			const result = await authClient.signIn.social({
				provider: "google",
				callbackURL: `${window.location.origin}/`,
				errorCallbackURL: `${window.location.origin}/auth/error`,
			});

			if (result.error) {
				throw new Error(result.error.message);
			}
		} catch (error) {
			navigate({
				to: "/auth/error",
				search: {
					error: "please_restart_the_process",
					error_description:
						error instanceof Error ? error.message : undefined,
					state: undefined,
				},
			});
		}
	}

	return (
		<main
			data-testid="login-page"
			className="flex min-h-0 w-full flex-1 bg-white px-0 pb-[env(safe-area-inset-bottom,0px)] text-zinc-900"
		>
			{/* Left panel - Form */}
			<section
				data-testid="login-auth-column"
				className="flex min-h-0 w-full flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12 lg:w-1/2"
			>
				<div className="mx-auto w-full max-w-sm space-y-6">
					{/* Logo + welcome copy */}
					<div className="flex flex-col items-center gap-3 text-center">
						<VaultLogo showName={false} />
						<div className="space-y-7">
							<h1
								className="text-4xl font-semibold tracking-tight text-zinc-900"
								style={{ fontFamily: '"Space Grotesk", sans-serif' }}
							>
								Bem-vindo de volta!
							</h1>
							<p className="text-base text-zinc-600">
								Entre para continuar de onde parou, ou comece agora
								criando sua conta.
							</p>
						</div>
					</div>

					{/* Social login buttons */}
					<div className="space-y-2">
						<MovingBorderButton
							borderRadius="0.75rem"
							duration={2500}
							containerClassName="h-12 w-full"
							borderClassName="h-12 w-12 bg-[radial-gradient(#09090b_25%,transparent_65%)] opacity-100"
							className="gap-2 border-zinc-200 bg-white text-sm font-medium text-zinc-800 backdrop-blur-none hover:bg-zinc-50"
							type="button"
							onClick={handleGoogleSignIn}
						>
							<GoogleIcon className="size-5 self-center" />
							Continue with Google
						</MovingBorderButton>
					</div>
				</div>
			</section>

			{/* Right panel - Waves (black + white strokes) */}
			<section
				data-testid="login-promo-column"
				className="relative hidden min-h-0 w-1/2 flex-col border-l border-zinc-200 lg:flex"
			>
				<Waves
					data-testid="login-waves"
					className="absolute inset-0"
					backgroundColor="#000000"
					strokeColor="#ffffff"
				/>
			</section>
		</main>
	);
}
