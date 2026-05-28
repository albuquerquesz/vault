import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";

export function FinancialDashboard() {
	return (
		<main className="financial-dashboard h-full w-full text-foreground" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
			<style>{`
        .financial-dashboard, .financial-dashboard * { background-color: #0000 !important; }
        .financial-panel-border {
          border: 1px solid var(--border) !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          --panel-separator: var(--border);
        }
        .financial-panel-border[data-slot="card"] {
          box-shadow: none !important;
          outline: none !important;
          --tw-ring-shadow: 0 0 #0000 !important;
          --tw-ring-offset-shadow: 0 0 #0000 !important;
          --tw-shadow: 0 0 #0000 !important;
        }
        .financial-panel-border [data-slot="card-header"] {
          border-bottom: 1px solid var(--border) !important;
          padding-bottom: 1rem !important;
        }
        .financial-panel-border [data-slot="card-footer"] {
          border-top: 1px solid var(--border) !important;
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
