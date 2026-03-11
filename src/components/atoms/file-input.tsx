import { InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function FileInput(props: Props) {
  return (
    <input
      {...props}
      type="file"
      className={`block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700 ${props.className ?? ""}`}
    />
  );
}
