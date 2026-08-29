import { useMemo } from "react";
import AppShell from "@/components/AppShell";
import FinanceSection from "@/features/finance/FinanceSection";
import { seedFinancePreview } from "@/lib/localStore";
import type { LocalUser } from "@/lib/localStore";

const previewUser: LocalUser = {
  id: "preview-manager",
  name: "Marina Fortes",
  email: "preview@fernandafortes.com",
  phone: "",
  role: "gestora",
  password: "",
  active: true,
  commissionRate: 0,
  createdAt: "2026-08-01T12:00:00.000Z",
};

export default function FinancePreviewPage() {
  useMemo(() => seedFinancePreview(), []);
  return (
    <div className="min-h-screen bg-[#f8f4ed]">
      <div className="sticky top-0 z-50 border-b border-[#d9cbb6] bg-[#fffaf2] px-4 py-2 text-center text-xs font-medium tracking-wide text-[#896b3b]">
        Preview privada · dados de demonstração · nenhuma alteração é enviada ao Supabase
      </div>
      <AppShell user={previewUser} section="financeiro" setSection={() => undefined} onLogout={() => undefined}>
        <FinanceSection />
      </AppShell>
    </div>
  );
}
