// Vendored from shadcn/ui (MIT, https://github.com/shadcn-ui/ui) for the
// site's own preview rendering. Installing projects use their own `cn`.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
