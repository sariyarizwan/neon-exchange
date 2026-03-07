import * as React from "react";
import { cn } from "@/lib/cn";

type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(({ className, ...props }, ref) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">⌕</span>
    <input
      ref={ref}
      className={cn(
        "w-full rounded-2xl border border-slate-800 bg-slate-950/70 py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-neon-cyan/40 focus:bg-slate-900/90 focus:shadow-neon-cyan",
        className
      )}
      {...props}
    />
  </div>
));

SearchInput.displayName = "SearchInput";
