import { createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import { Input } from "@vault/ui/components/input";
import { GitHubIcon } from "@/components/github-icon";
import { GoogleIcon } from "@/components/google-icon";
import { LogoIcon } from "@/components/logo";
import { VercelIcon } from "@/components/vercel-icon";
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
	async function handleGoogleSignIn() {
		await authClient.signIn.social({
			provider: "google",
			callbackURL: `${window.location.origin}/`,
		});
	}

	return (
		<main className="flex min-h-screen bg-[#0c0a09] text-white">
			{/* Left panel - Form */}
			<section className="flex flex-1 flex-col items-center justify-center px-6 py-12">
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
							className="h-9 w-full gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 text-sm text-white/80 hover:bg-zinc-800/50 hover:text-white"
							onClick={handleGoogleSignIn}
						>
							<GoogleIcon className="size-4" />
							Continue with Google
						</Button>
						<Button
							variant="outline"
							className="h-9 w-full gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 text-sm text-white/80 hover:bg-zinc-800/50 hover:text-white"
						>
							<VercelIcon className="size-4" />
							Continue with Vercel
						</Button>
						<Button
							variant="outline"
							className="h-9 w-full gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 text-sm text-white/80 hover:bg-zinc-800/50 hover:text-white"
						>
							<GitHubIcon className="size-4" />
							Continue with GitHub
						</Button>
					</div>

					{/* OR divider */}
					<div className="flex items-center gap-3">
						<div className="h-px flex-1 bg-zinc-800" />
						<span className="text-xs text-zinc-500">OR</span>
						<div className="h-px flex-1 bg-zinc-800" />
					</div>

					{/* Email input */}
					<div className="space-y-2">
						<div className="relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									role="img"
									aria-hidden="true"
								>
									<rect width="20" height="16" x="2" y="4" rx="2" />
									<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
								</svg>
							</span>
							<Input
								type="email"
								placeholder="Enter your email address"
								className="h-10 rounded-md border border-zinc-800 bg-transparent pl-10 text-sm text-white placeholder:text-zinc-500 focus-visible:border-zinc-600 focus-visible:ring-0"
							/>
						</div>
						<Button
							variant="outline"
							className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900/50 text-sm text-white/80 hover:bg-zinc-800/50 hover:text-white"
						>
							Continue With Email
						</Button>
					</div>

					{/* Privacy policy */}
					<p className="text-center text-xs text-zinc-500">
						By continuing, you agree to Vault's{" "}
						<a
							href="/privacy"
							className="underline underline-offset-4 hover:text-zinc-300"
						>
							privacy policy
						</a>
						.
					</p>
				</div>
			</section>

			{/* Right panel - Testimonial */}
			<section className="relative hidden flex-col overflow-hidden border-l border-zinc-800/50 lg:flex lg:flex-1">
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
								className="text-2xl font-medium tracking-tight text-white"
								style={{ fontFamily: '"Space Grotesk", sans-serif' }}
							>
								Ready to join Vault?
							</h2>
							<p className="text-sm text-zinc-400">
								Join thousands of teams shipping beautiful, production-ready
								interfaces in record time.
							</p>
						</div>

						{/* Testimonial card */}
						<div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-left backdrop-blur">
							<div className="mb-4 flex items-center gap-2">
								<VercelIcon className="size-5 text-white" />
								<span className="text-sm font-medium text-white">Vercel</span>
							</div>
							<blockquote className="mb-4 text-sm leading-relaxed text-white/90">
								&quot;Vault is why I still have hair. No more worrying about UI
								blocks.&quot;
							</blockquote>
							<div className="flex items-center gap-3">
								<div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-zinc-700">
									<span className="text-xs text-zinc-300">GR</span>
								</div>
								<div>
									<p className="text-sm font-medium text-white">
										Guillermo Rauch
									</p>
									<p className="text-xs text-zinc-500">CEO, Vercel</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
