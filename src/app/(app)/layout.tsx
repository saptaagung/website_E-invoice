"use client";

import { SettingsProvider } from "@/context/SettingsContext";
import Layout from "@/components/Layout";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <Layout>{children}</Layout>
    </SettingsProvider>
  );
}
