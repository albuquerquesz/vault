import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vault/ui/components/card";

export function FinancialDashboard() {
  return (
    <div className="min-h-full bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Financial Dashboard</CardTitle>
            <CardDescription>
              Dashboard scaffold is now exported correctly and ready for the full layout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Import error resolved.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FinancialDashboard;
