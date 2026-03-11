import { InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function CheckboxInput(props: Props) {
  return (
    <input
      {...props}
      type="checkbox"
      className={`h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 ${props.className ?? ""}`}
    />
  );
}
