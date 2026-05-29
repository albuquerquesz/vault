import type { ReactNode } from "react";

type TabPageHeaderProps = {
  title: string;
  icon: ReactNode;
};

export function TabPageHeader({ title, icon }: TabPageHeaderProps) {
  return (
    <header className="mb-4 flex items-center gap-3 px-1 pb-3">
      <span className="border-r border-border/40 pr-3 text-muted-foreground">
        {icon}
      </span>
      <h1
        className="text-2xl font-semibold tracking-tight text-foreground"
        style={{ fontFamily: '"Space Grotesk", sans-serif' }}
      >
        {title}
      </h1>
    </header>
  );
}
