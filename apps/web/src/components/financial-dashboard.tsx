import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";

export function FinancialDashboard() {
	return (
		<main
			className="financial-dashboard h-full w-full bg-transparent text-foreground"
			style={{ fontFamily: '"Space Grotesk", sans-serif' }}
		>
			<style>{`
        .financial-dashboard, .financial-dashboard * { background-color: #0000 !important; }
        .financial-panel-border {
          position: relative !important;
          border: 1px solid var(--border) !important;
          outline: 1px solid var(--border) !important;
          outline-offset: -1px !important;
          box-shadow:
            inset 0 1px 0 color-mix(in oklab, var(--foreground) 6%, transparent),
            inset 1px 0 0 color-mix(in oklab, var(--foreground) 6%, transparent),
            inset 0 -1px 0 color-mix(in oklab, var(--foreground) 2%, transparent),
            inset -1px 0 0 color-mix(in oklab, var(--foreground) 2%, transparent) !important;
          border-radius: 0 !important;
          --panel-separator: var(--border);
          --panel-corner: color-mix(in oklab, var(--foreground) 55%, transparent);
        }
        .financial-panel-border[data-slot="card"] {
          --tw-ring-shadow: 0 0 #0000 !important;
          --tw-ring-offset-shadow: 0 0 #0000 !important;
          --tw-shadow: 0 0 #0000 !important;
        }
        .financial-panel-border::after {
          content: "" !important;
          position: absolute !important;
          inset: 0 !important;
          pointer-events: none !important;
          background:
            linear-gradient(var(--panel-corner), var(--panel-corner)) top left / 16px 1px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) top left / 1px 16px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) top right / 16px 1px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) top right / 1px 16px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) bottom left / 16px 1px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) bottom left / 1px 16px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) bottom right / 16px 1px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) bottom right / 1px 16px no-repeat !important;
        }
        .financial-panel-border [data-slot="card-header"] {
          border-bottom: 1px solid var(--panel-separator) !important;
          padding-bottom: 1rem !important;
        }
        .financial-panel-border [data-slot="card-footer"] {
          border-top: 1px solid var(--panel-separator) !important;
        }
        .financial-dashboard [data-slot="card-title"] { font-size: 1.5rem !important; line-height: 1.2 !important; }
        .financial-dashboard [data-slot="card-description"] { font-size: 1rem !important; line-height: 1.45 !important; }
        .financial-dashboard [data-slot="card-content"] { font-size: 1rem !important; }
        .financial-dashboard [data-slot="card-footer"] { font-size: 0.95rem !important; }
        .financial-dashboard > div > header {
          padding-top: 0.75rem !important;
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }
      `}</style>
			<AppShell>
				<Dashboard />
			</AppShell>
		</main>
	);
}

export default FinancialDashboard;
