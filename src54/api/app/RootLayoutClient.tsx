"use client";

import { BalanceProvider } from "./components/BalanceProvider";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BalanceProvider>
      {children}
    </BalanceProvider>
  );
} 