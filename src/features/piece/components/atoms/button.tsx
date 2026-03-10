import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "danger" | "neutral";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variantClass: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  neutral: "bg-slate-700 text-white hover:bg-slate-800 disabled:bg-slate-300",
};

export function Button({ variant = "primary", ...props }: Props) {
  return (
    <button
      {...props}
      className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition ${variantClass[variant]} ${props.className ?? ""}`}
    />
  );
}
