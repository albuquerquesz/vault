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
			<section
				data-testid="login-auth-column"
				className="flex min-h-0 w-full flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12 lg:w-1/2"
			>
				<div className="mx-auto w-full max-w-sm space-y-6">
					<div className="flex flex-col items-center gap-8 text-center">
						<VaultLogo showName={false} size="lg" />
						<div className="space-y-4 sm:space-y-7">
							<h1
								className="text-3xl leading-tight font-semibold tracking-tight text-zinc-900 sm:text-5xl"
								style={{ fontFamily: '"Space Grotesk", sans-serif' }}
							>
								Bem-vindo de volta!
							</h1>
							<p className="text-base leading-6 text-zinc-600 sm:text-xl sm:leading-7">
								Entre para continuar de onde parou, ou comece agora
								criando sua conta.
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<MovingBorderButton
							borderRadius="0.75rem"
							containerClassName="h-12 w-full p-[3px]"
							borderClassName="bg-[radial-gradient(#18181b_40%,transparent_60%)]"
							className="gap-2 border-zinc-200 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-50"
							type="button"
							onClick={handleGoogleSignIn}
						>
							<GoogleIcon className="size-5 self-center" />
							Continue with Google
						</MovingBorderButton>
					</div>
				</div>
			</section>

			<section
				data-testid="login-promo-column"
				className="relative hidden min-h-0 w-1/2 flex-col p-4 lg:flex"
			>
				<div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl">
					<Waves
						data-testid="login-waves"
						className="absolute inset-0"
						backgroundColor="#000000"
						strokeColor="#ffffff"
					/>
				</div>
			</section>
		</main>
	);
}
