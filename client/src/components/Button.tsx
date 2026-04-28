import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "border-teal-600 bg-teal-600 text-white shadow-[0_10px_24px_rgba(20,116,111,0.22)] hover:bg-teal-700",
  secondary: "border-line bg-white text-ink hover:border-slate-300 hover:bg-moss",
  ghost: "border-transparent bg-transparent text-ink hover:bg-moss"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "default" | "large" | "compact";
};

export function Button({ className = "", variant = "primary", size = "default", ...props }: ButtonProps) {
  const sizeClass =
    size === "large" ? "min-h-12 px-5" : size === "compact" ? "min-h-9 px-3 text-[13px]" : "min-h-10 px-4";

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-bold transition ${sizeClass} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: "default" | "large" | "compact";
};

export function LinkButton({ className = "", variant = "secondary", size = "default", ...props }: LinkButtonProps) {
  const sizeClass =
    size === "large" ? "min-h-12 px-5" : size === "compact" ? "min-h-9 px-3 text-[13px]" : "min-h-10 px-4";

  return (
    <a
      className={`inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-bold transition ${sizeClass} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
