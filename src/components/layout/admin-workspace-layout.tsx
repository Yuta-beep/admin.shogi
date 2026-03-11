"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

const navItems: { href: string; label: string }[] = [
  { href: "/pieces", label: "駒管理" },
  { href: "/stages", label: "ステージ管理" },
];

export function AdminWorkspaceLayout({ children }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="w-64 border-r border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-6">
          <h1 className="text-lg font-bold">将棋管理画面</h1>
          <p className="mt-1 text-xs text-slate-500">管理メニュー</p>
        </div>

        <nav>
          <ul className="space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={{ pathname: item.href }}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
