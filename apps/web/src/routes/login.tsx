import { createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import { GoogleIcon } from "@/components/google-icon";
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
                Controle suas despesas e siga uma meta diária de gasto para
                manter sua estabilidade financeira.
              </p>
            </div>

            <figure className="mt-20 max-w-lg space-y-4 lg:mt-auto">
              <blockquote
                className="text-lg leading-snug text-foreground"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                &quot;Antes, eu não tinha um limite claro e sempre chutava meus
                gastos. Agora eu sei exatamente quanto posso gastar por dia sem
                passar aperto no fim do mês.&quot;
              </blockquote>
              <figcaption>
                <div>
                  <p
                    className="text-sm font-medium text-foreground"
                    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                  >
                    Victor Albuquerque
                  </p>
                  <p
                    className="text-xs text-muted-foreground"
                    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                  >
                    Engenheiro de Software
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
                  Seja bem vindo!
                </h2>
                <p className="font-normal text-muted-foreground">
                  Entre ou crie sua conta Vault para começar.
                </p>
              </div>

              <form
                className="space-y-3"
                aria-label="Formulário de login"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleGoogleSignIn();
                }}
              >
                <Button
                  type="submit"
                  variant="outline"
                  className="h-12 w-full justify-center gap-3 rounded-lg text-base"
                >
                  <GoogleIcon className="size-5" />
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
