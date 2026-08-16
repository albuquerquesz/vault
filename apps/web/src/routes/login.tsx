import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import { GoogleIcon } from "@/components/google-icon";
import { LogoIcon } from "@/components/logo";
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
		<main className="flex min-h-[100svh] bg-[#0c0a09] px-0 pb-[env(safe-area-inset-bottom,0px)] text-white">
			{/* Left panel - Form */}
			<section className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
				<div className="mx-auto w-full max-w-sm space-y-6">
					{/* Logo */}
					<div className="flex flex-col items-center gap-3">
						<LogoIcon className="h-6 w-auto text-white" />
						<p className="text-sm text-white/80">
							login or create your account.
						</p>
					</div>

					{/* Social login buttons */}
					<div className="space-y-2">
						<Button
							variant="outline"
							size="lg"
							className="h-12 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 text-sm text-white/80 hover:bg-zinc-800/50 hover:text-white"
							onClick={handleGoogleSignIn}
						>
							<GoogleIcon className="size-5 self-center" />
							Continue with Google
						</Button>
					</div>
				</div>
			</section>

			{/* Right panel - Testimonial */}
			<section className="relative hidden flex-col border-l border-zinc-800/50 lg:flex lg:flex-1">
				{/* Grid background pattern */}
				<div className="absolute inset-0 grid grid-cols-3 grid-rows-5 gap-2 p-4">
					{Array.from({ length: 15 }).map((_, i) => (
						<div key={i} className="rounded-2xl bg-zinc-900/20" />
					))}
				</div>

				{/* Content */}
				<div className="relative z-10 mx-auto flex flex-1 flex-col items-center justify-center px-12">
					<div className="space-y-8 text-center">
						<div className="space-y-3">
							<h2
								className="text-3xl font-medium tracking-tight text-white"
								style={{ fontFamily: '"Space Grotesk", sans-serif' }}
							>
								Ready to join Vault?
							</h2>
							<p className="text-sm text-zinc-400">
								Join thousands of teams shipping beautiful, production-ready
								interfaces in record time.
							</p>
						</div>

						<div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-left">
							<blockquote className="mb-4 text-sm leading-relaxed text-white/90">
								&quot;Vault is why I still have hair. No more worrying about UI
								blocks.&quot;
							</blockquote>
							<div className="flex items-center gap-3">
								<div>
									<p className="text-sm font-medium text-zinc-100">
										Victor Albuquerque
									</p>
									<p className="text-sm text-zinc-300">Software Engineer</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
