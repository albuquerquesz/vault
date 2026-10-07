import { Dashboard } from "@/components/dashboard";

export function FinancialDashboard() {
	return (
		<main className="financial-dashboard h-full w-full text-foreground">
			<style>{`
        .financial-dashboard { background-color: transparent; }
        .financial-dashboard [data-slot="card"]:not(.dashboard-metric) { background-color: #0000 !important; }
        .financial-dashboard .dashboard-analyses [data-slot="card"] {
          border: 0;
          background-color: color-mix(in oklab, var(--muted) 40%, transparent) !important;
        }
        .dark .financial-dashboard .dashboard-analyses [data-slot="card"] {
          background-color: oklch(0.205 0.005 285) !important;
        }
        .financial-dashboard {
          font-family: var(--font-sans);
        }
        .financial-dashboard [data-slot="card-title"] {
          font-family: var(--font-sans) !important;
          font-size: 1.25rem !important;
          line-height: 1.2 !important;
        }
        @media (min-width: 640px) {
          .financial-dashboard [data-slot="card-title"] {
            font-size: 1.5rem !important;
          }
        }
        .financial-dashboard h1 {
          font-family: var(--font-sans) !important;
        }
        .financial-dashboard [data-slot="card-description"] { font-size: 1rem !important; line-height: 1.45 !important; }
        .financial-dashboard [data-slot="card-footer"] { font-size: 0.95rem !important; }
        .financial-dashboard > div > header {
          padding-top: 0.75rem !important;
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }
      `}</style>
			<Dashboard />
		</main>
	);
}

export default FinancialDashboard;
