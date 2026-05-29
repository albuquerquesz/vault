import { SidebarInset, SidebarProvider } from "@vault/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useTheme } from "@/components/theme-provider";
import { useKeybind } from "@/hooks/use-keybind";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme();

  useKeybind({
    key: "m",
    onTrigger: () => {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    },
  });

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <div className="p-4 md:p-6">
          <div className="flex flex-1 flex-col gap-4">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
