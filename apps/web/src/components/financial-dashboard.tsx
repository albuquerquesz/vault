import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";

export function FinancialDashboard() {
  return (
    <main
      className="financial-dashboard h-full w-full bg-[#0000] text-zinc-100"
      style={{ fontFamily: '"Space Grotesk", sans-serif' }}
    >
      <style>{`.financial-dashboard, .financial-dashboard * { background-color: #0000 !important; }`}</style>
      <AppShell>
        <Dashboard />
      </AppShell>
    </main>
  );
}

export default FinancialDashboard;
