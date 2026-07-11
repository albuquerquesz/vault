"use client";

import { cn } from "@vault/ui/lib/utils";
import { getCategoryDotColor } from "./utils";

export function CategoryMarker({ category }: { category: string }) {
  return (
    <div
      className={cn(
        "size-2 shrink-0 rounded-full",
        getCategoryDotColor(category),
      )}
    />
  );
}
