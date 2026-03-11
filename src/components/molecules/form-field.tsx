import { ReactNode } from "react";

type Props = {
  label: string;
  required?: boolean;
  children: ReactNode;
};

export function FormField({ label, required, children }: Props) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      {children}
    </label>
  );
}
