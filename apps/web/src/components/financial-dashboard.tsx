import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";

export function FinancialDashboard() {
  return (
    <main
      className="financial-dashboard h-full w-full bg-[#0000] text-zinc-100"
      style={{ fontFamily: '"Space Grotesk", sans-serif' }}
    >
      <style>{`
        .financial-dashboard, .financial-dashboard * { background-color: #0000 !important; }
        .financial-panel-border {
          position: relative !important;
          border: 1px solid #2f2f33 !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          --panel-separator: #2f2f33;
          --panel-corner: #77777f;
        }
        .financial-panel-border[data-slot="card"] {
          box-shadow: none !important;
          outline: none !important;
          --tw-ring-shadow: 0 0 #0000 !important;
          --tw-ring-offset-shadow: 0 0 #0000 !important;
          --tw-shadow: 0 0 #0000 !important;
        }
        .financial-panel-border::after {
          content: "" !important;
          position: absolute !important;
          inset: -1px !important;
          pointer-events: none !important;
          background:
            linear-gradient(var(--panel-corner), var(--panel-corner)) top left / 14px 1px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) top left / 1px 14px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) top right / 14px 1px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) top right / 1px 14px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) bottom left / 14px 1px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) bottom left / 1px 14px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) bottom right / 14px 1px no-repeat,
            linear-gradient(var(--panel-corner), var(--panel-corner)) bottom right / 1px 14px no-repeat !important;
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
      `}</style>
      <AppShell>
        <Dashboard />
      </AppShell>
    </main>
  );
}

export default FinancialDashboard;
