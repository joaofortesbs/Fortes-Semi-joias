import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Check, ShoppingBag, UsersRound, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";
import ResellersSection from "@/features/resellers/ResellersSection";
import CatalogSection from "@/features/catalog/CatalogSection";
import type { Section } from "@/components/AppShell";
import { getStore, statusLabel, updateStore, type LocalUser, type OrderStatus } from "@/lib/localStore";

type Props = { user: LocalUser; section: Section };

export default function ManagerDashboard({ section }: Props) {
  const [refresh, setRefresh] = useState(0);
  const store = useMemo(() => getStore(), [refresh]);
  const refreshStore = () => setRefresh(value => value + 1);
  if (section === "catalogo") return <CatalogSection products={store.products} onRefresh={refreshStore} />;
  if (section === "pedidos") return <Orders onRefresh={refreshStore} />;
  if (section === "revendedoras") return <ResellersSection users={store.users.filter(item => item.role === "revendedora")} onRefresh={refreshStore} />;
  if (section === "comissoes") return <Commissions orders={store.orders} />;
  return <ManagerOverview />;
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow text-[#9d7d48]">{eyebrow}</p><h2 className="serif mt-2 text-4xl tracking-[-.02em]">{title}</h2>{description && <p className="mt-3 max-w-2xl text-sm leading-6 text-[#69756b]">{description}</p>}</div>{action}</div>;
}

function ManagerOverview() {
  return <><PageIntro eyebrow="Visão geral" title="Sua operação" description="Os indicadores aparecerão aqui assim que dados reais forem cadastrados." action={<Select defaultValue="period"><SelectTrigger className="w-[180px]"><SelectValue placeholder="Período" /></SelectTrigger><SelectContent><SelectItem value="period">Selecionar período</SelectItem></SelectContent></Select>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={ShoppingBag} label="Vendas no período" /><Metric icon={ShoppingBag} label="Pedidos em aberto" /><Metric icon={UsersRound} label="Revendedoras ativas" /><Metric icon={WalletCards} label="Comissões geradas" /></div><div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]"><div className="rounded-2xl border border-[#dfd4c3] bg-[#fbf8f3] p-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eee4d3] text-[#896b3b]"><WalletCards className="h-5 w-5" /></div><div><p className="eyebrow text-[#9d7d48]">Performance</p><h3 className="serif mt-2 text-2xl">Histórico de vendas</h3></div></div><div className="mt-8"><EmptyState title="Ainda não há histórico" description="Cadastre produtos e registre pedidos para acompanhar a evolução real da operação." /></div></div><div className="rounded-2xl border border-[#dfd4c3] bg-[#263b32] p-6 text-[#f8f4ed]"><p className="eyebrow text-[#dfc58f]">Atenção</p><h3 className="serif mt-2 text-2xl">Pedidos recentes</h3><div className="mt-6"><p className="text-sm leading-6 text-[#c2cec3]">Nenhum pedido real foi cadastrado ainda. Quando a rede começar a vender, os pedidos aparecerão aqui.</p></div></div></div></>;
}

function Metric({ icon: Icon, label }: { icon: typeof ShoppingBag; label: string }) {
  return <div className="rounded-2xl border border-[#dfd4c3] bg-[#fbf8f3] p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eee4d3] text-[#896b3b]"><Icon className="h-5 w-5" /></div><p className="mt-7 text-xs uppercase tracking-[.12em] text-[#899086]">{label}</p><p className="serif mt-1 text-2xl text-[#899086]">Sem dados</p></div>;
}

function Orders({ onRefresh }: { onRefresh: () => void }) {
  const store = getStore();
  return <><PageIntro eyebrow="Operação" title="Pedidos" description="Acompanhe cada pedido real com clareza, do recebimento à entrega." />{store.orders.length === 0 ? <EmptyState title="Nenhum pedido cadastrado" description="Os pedidos aparecerão aqui quando uma revendedora registrar uma venda real." /> : <div className="overflow-hidden rounded-2xl border border-[#dfd4c3] bg-[#fbf8f3]"><div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-4 border-b border-[#e5dbcc] px-5 py-4 text-xs uppercase tracking-[.1em] text-[#92968d]"><span>Pedido</span><span>Revendedora</span><span>Data</span><span>Status</span><span /></div>{store.orders.map(order => <div key={order.id} className="grid grid-cols-[1.2fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-[#eee7dd] px-5 py-5 text-sm last:border-0"><span className="font-medium">Pedido</span><span>{store.users.find(user => user.id === order.resellerId)?.name ?? "Revendedora"}</span><span className="text-[#69756b]">Data cadastrada</span><Select defaultValue={order.status} onValueChange={status => { updateStore(next => { const target = next.orders.find(item => item.id === order.id); if (target) target.status = status as OrderStatus; }); onRefresh(); }}><SelectTrigger className="h-9 w-[145px]"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><span className="text-[#9d7d48]">Valor real</span></div>)}</div>}</>;
}

function Commissions({ orders }: { orders: ReturnType<typeof getStore>["orders"] }) {
  return <><PageIntro eyebrow="Financeiro" title="Comissões" description="O extrato será preenchido somente após pedidos e percentuais reais." />{orders.length === 0 ? <EmptyState title="Nenhuma comissão gerada" description="As comissões aparecerão aqui quando houver pedidos reais registrados." /> : <div className="rounded-2xl border border-[#dfd4c3] bg-[#fbf8f3] p-6"><p className="text-sm text-[#69756b]">Extrato de comissões reais disponível após o primeiro pedido.</p></div>}</>;
}
