import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold tracking-[1.6px] text-muted uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

// 16px text keeps iOS Safari from zooming in on focus.
export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-12 w-full min-w-0 appearance-none rounded-2xl border border-line bg-surface-2 px-4 text-base font-medium text-ink placeholder:text-muted/70 focus:border-gold focus:outline-none ${className}`}
      {...props}
    />
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

const VARIANTS = {
  primary: "bg-gold text-bg font-bold",
  secondary: "border border-line text-ink font-semibold",
  danger: "border border-warn/40 text-warn font-semibold",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`flex h-12 items-center justify-center rounded-full px-5 text-[15px] disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
