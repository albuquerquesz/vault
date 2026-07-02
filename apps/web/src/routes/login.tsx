import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<div className="relative min-h-screen overflow-hidden">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.08),transparent_45%),linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_25%)]" />
				<div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:72px_72px]" />

				<div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-3">
					<section className="hidden flex-col border-b border-border/60 px-8 py-8 lg:col-span-1 lg:flex lg:border-r lg:border-b-0 lg:px-10 lg:py-10">
						<div className="mt-20 max-w-md space-y-6 text-left lg:mt-0 lg:flex lg:flex-1 lg:flex-col lg:justify-center">
							<h1
								className="text-4xl leading-tight font-medium tracking-tight lg:text-5xl"
								style={{ fontFamily: '"Space Grotesk", sans-serif' }}
							>
								Assuma o controle do seu dinheiro, um dia de cada vez.
							</h1>
							<p className="text-xl text-muted-foreground">
								Acompanhe cada despesa, veja quanto da sua renda mensal já está
								comprometida e siga uma meta inteligente de gasto diário para
								manter sua estabilidade financeira.
							</p>
						</div>

						<figure className="mt-20 max-w-md space-y-4 lg:mt-auto">
							<blockquote className="text-xl leading-snug text-foreground">
								&quot;Antes, eu não tinha um limite claro e sempre chutava meus
								gastos. Agora eu sei exatamente quanto posso gastar por dia sem
								passar aperto no fim do mês.&quot;
							</blockquote>
							<figcaption className="flex items-center gap-3">
								<img
									src="/images/testimonial-user.jpeg"
									alt="Depoimento de usuário"
									className="size-10 rounded-full object-cover"
								/>
								<div>
									<p className="text-sm font-medium text-foreground">
										Victor Albuquerque
									</p>
									<p className="text-xs text-muted-foreground">
										- Engenheiro de Software
									</p>
								</div>
							</figcaption>
						</figure>
					</section>

					<section className="flex items-center justify-center px-6 py-12 lg:col-span-2 lg:px-8">
						<div className="w-full max-w-sm space-y-6">
							<div className="space-y-3 text-center">
								<h2
									className="text-4xl font-medium tracking-tight"
									style={{ fontFamily: '"Space Grotesk", sans-serif' }}
								>
									Entrar ou Criar Conta
								</h2>
								<p className="text-xs font-normal text-muted-foreground">
									Entre ou crie sua conta Vault para começar.
								</p>
							</div>

							<form className="space-y-3" aria-label="Formulário de login">
								<Button
									type="button"
									variant="outline"
									className="h-12 w-full justify-center gap-3 !rounded-lg text-base"
								>
									<svg
										viewBox="0 0 24 24"
										className="size-5"
										aria-hidden="true"
										focusable="false"
									>
										<path
											fill="currentColor"
											d="M21.35 11.1h-9.18v2.98h5.27c-.23 1.52-1.83 4.47-5.27 4.47-3.17 0-5.76-2.62-5.76-5.85s2.58-5.85 5.76-5.85c1.8 0 3 .77 3.69 1.44l2.52-2.45C16.77 4.34 14.67 3.5 12.17 3.5c-5.09 0-9.22 4.18-9.22 9.35s4.13 9.35 9.22 9.35c5.32 0 8.84-3.78 8.84-9.1 0-.61-.06-1.08-.16-1.5Z"
										/>
									</svg>
									Continuar com Google
								</Button>
							</form>
						</div>
					</section>
				</div>
			</div>
		</main>
	);
}
