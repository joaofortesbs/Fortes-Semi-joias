import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  Eye,
  Plus,
  ShoppingBag,
  UsersRound,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import EmptyState from "@/components/EmptyState";
import ResellersSection from "@/features/resellers/ResellersSection";
import CatalogSection from "@/features/catalog/CatalogSection";
import type { Section } from "@/components/AppShell";
import {
  createCustomer,
  createOrder,
  formatCurrency,
  getStore,
  statusLabel,
  subscribeStore,
  updateOrderDetails,
  updateOrderStatus,
  type Customer,
  type LocalUser,
  type Order,
  type OrderOrigin,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/localStore";
import {
  buildOrderInput,
  buildSalesHistory,
  canTransitionOrder,
  filterOrders,
  formatBRLInput,
  getOrderOriginLabel,
  getOrderReseller,
  getSelectableProducts,
  getPaymentMethodLabel,
  type SalesHistoryRange,
  type SalesHistoryWindow,
  filterOrdersBySalesWindow,
  parseBRLInput,
} from "@/features/orders/orderDomain";

type Props = { user: LocalUser; section: Section };
type StoreSnapshot = ReturnType<typeof getStore>;
type EntryType = "detailed" | "general";

export default function ManagerDashboard({ section }: Props) {
  const [refresh, setRefresh] = useState(0);
  const [quickResellerId, setQuickResellerId] = useState<string | undefined>();
  const [openQuickOrder, setOpenQuickOrder] = useState(false);
  const store = useMemo(() => getStore(), [refresh]);
  useEffect(() => subscribeStore(() => setRefresh(value => value + 1)), []);
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ resellerId?: string }>).detail;
      setQuickResellerId(detail?.resellerId);
      setOpenQuickOrder(true);
    };
    window.addEventListener("manager-open-order-for-reseller", handler);
    return () =>
      window.removeEventListener("manager-open-order-for-reseller", handler);
  }, []);
  const refreshStore = () => setRefresh(value => value + 1);
  if (section === "catalogo")
    return (
      <CatalogSection products={store.products} collections={store.collections} onRefresh={refreshStore} />
    );
  if (section === "pedidos")
    return (
      <Orders
        store={store}
        initialResellerId={quickResellerId}
        openFromShortcut={openQuickOrder}
        onShortcutOpened={() => setOpenQuickOrder(false)}
        onRefresh={refreshStore}
      />
    );
  if (section === "revendedoras")
    return (
      <ResellersSection
        users={store.users.filter(item => item.role === "revendedora")}
        onRefresh={refreshStore}
        onStartOrder={resellerId =>
          window.dispatchEvent(
            new CustomEvent("manager-open-order-for-reseller", {
              detail: { resellerId },
            })
          )
        }
      />
    );
  return <ManagerOverview store={store} />;
}

function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="eyebrow text-[#9d7d48]">{eyebrow}</p>
        <h2 className="serif mt-2 text-4xl tracking-[-.02em]">{title}</h2>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#69756b]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function ManagerOverview({ store }: { store: StoreSnapshot }) {
  const [historyWindow, setHistoryWindow] = useState<SalesHistoryWindow>({ range: "6m" });
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const activeResellers = store.users.filter(user => user.role === "revendedora" && (user.active || user.inviteStatus === "not_invited")).length;
  const filteredOrders = filterOrdersBySalesWindow(store.orders, historyWindow);
  const validOrders = filteredOrders;
  const totalSales = validOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = validOrders.length;
  const availableUnits = store.products.filter(product => product.status === "available").reduce((sum, product) => sum + Math.max(0, product.stock), 0);
  const availableModels = store.products.filter(product => product.status === "available" && product.stock > 0).length;
  const recentOrders = [...validOrders].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()).slice(0, 4);
  const chartPoints = buildSalesHistory(store.orders, historyWindow);
  return (
    <>
      <PageIntro eyebrow="Visão geral" title="Sua operação" description="Acompanhe os dados reais registrados no Catálogo, Pedidos e sua rede." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={ShoppingBag} label="Vendas registradas" value={formatCurrency(totalSales)} detail={`${validOrders.length} pedido(s) no período`} />
        <Metric icon={ShoppingBag} label="Total de pedidos" value={String(totalOrders)} detail="Pedidos válidos no período" />
        <Metric icon={UsersRound} label="Revendedoras ativas" value={String(activeResellers)} detail="Na rede atual" />
        <Metric icon={ShoppingBag} label="Unidades disponíveis" value={String(availableUnits)} detail={`${availableModels} modelo(s) ativo(s) no Catálogo`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl border border-[#dfd4c3] bg-[#fbf8f3] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow text-[#9d7d48]">Performance</p><h3 className="serif mt-2 text-2xl">Histórico de vendas</h3></div><div className="flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 text-xs text-[#69756b]"><span className="sr-only">Período do histórico</span><select value={historyWindow.range} onChange={event => { const range = event.target.value as SalesHistoryRange; setHistoryWindow(range === "custom" ? { range, from: customFrom, to: customTo } : { range }); }} className="h-8 rounded-lg border border-[#dfd4c3] bg-white px-2 text-xs text-[#263b32]" aria-label="Período do histórico de vendas"><option value="1m">Último mês</option><option value="6m">Últimos 6 meses</option><option value="12m">Último ano</option><option value="all">Todo o período</option><option value="custom">Período personalizado</option></select></label>{historyWindow.range === "custom" && <div className="flex items-center gap-1"><input type="date" value={customFrom} onChange={event => { setCustomFrom(event.target.value); setHistoryWindow({ range: "custom", from: event.target.value, to: customTo }); }} aria-label="Data inicial personalizada" className="h-8 rounded-lg border border-[#dfd4c3] bg-white px-2 text-xs" /><span className="text-xs text-[#9b9b91]">até</span><input type="date" value={customTo} onChange={event => { setCustomTo(event.target.value); setHistoryWindow({ range: "custom", from: customFrom, to: event.target.value }); }} aria-label="Data final personalizada" className="h-8 rounded-lg border border-[#dfd4c3] bg-white px-2 text-xs" /></div>}</div></div>
          {chartPoints.some(point => point.value > 0) ? <SalesChart points={chartPoints} /> : <div className="mt-8"><EmptyState title="Ainda não há histórico" description="Registre pedidos reais para acompanhar a evolução da operação." /></div>}
        </div>
        <div className="rounded-2xl border border-[#dfd4c3] bg-[#263b32] p-6 text-[#f8f4ed]"><p className="eyebrow text-[#dfc58f]">Atenção</p><h3 className="serif mt-2 text-2xl">Pedidos recentes</h3>{recentOrders.length === 0 ? <p className="mt-6 text-sm leading-6 text-[#c2cec3]">Nenhum pedido real foi cadastrado ainda.</p> : <div className="mt-6 space-y-4">{recentOrders.map(order => <div key={order.id} className="flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-sm">{order.customerName || (order.origin === "direct" ? "Venda direta" : "Pedido da rede")}</p><p className="mt-1 text-xs text-[#b9c4ba]">{new Date(order.saleDate).toLocaleDateString("pt-BR")} · {statusLabel[order.status]}</p></div><span className="text-sm text-[#dfc58f]">{formatCurrency(order.total)}</span></div>)}</div>}</div>
      </div>
    </>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof ShoppingBag; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-[#dfd4c3] bg-[#fbf8f3] p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eee4d3] text-[#896b3b]"><Icon className="h-5 w-5" /></div><p className="mt-7 text-xs uppercase tracking-[.12em] text-[#899086]">{label}</p><p className="serif mt-1 text-2xl text-[#263b32]">{value}</p><p className="mt-1 text-xs text-[#8b9187]">{detail}</p></div>;
}

function SalesChart({ points }: { points: Array<{ label: string; value: number; count: number; period: string }> }) {
  const max = Math.max(...points.map(point => point.value), 1);
  return <div className="mt-8 grid h-56 grid-cols-6 items-end gap-3 border-b border-[#e8dfd2] pb-5">{points.map(point => <div key={point.label} className="flex h-full flex-col items-center justify-end gap-2"><Tooltip><TooltipTrigger asChild><div className="w-full rounded-t-xl bg-[#c7a66b] transition-all hover:bg-[#b08d53]" style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }} title={`${point.period}: ${point.count} ${point.count === 1 ? "venda" : "vendas"} · ${formatCurrency(point.value)}`} aria-label={`${point.period}: ${point.count} ${point.count === 1 ? "venda" : "vendas"}, ${formatCurrency(point.value)} em vendas`} /></TooltipTrigger><TooltipContent className="border-[#cdbd9e] bg-[#263b32] text-[#f8f4ed]"><p className="font-medium">{point.period}</p><p>{point.count} {point.count === 1 ? "venda" : "vendas"} · {formatCurrency(point.value)}</p></TooltipContent></Tooltip><span className="text-[10px] text-[#9b9b91]">{point.label}</span></div>)}</div>;
}

function Orders({
  store,
  initialResellerId,
  openFromShortcut,
  onShortcutOpened,
  onRefresh,
}: {
  store: StoreSnapshot;
  initialResellerId?: string;
  openFromShortcut: boolean;
  onShortcutOpened: () => void;
  onRefresh: () => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [origin, setOrigin] = useState<OrderOrigin | "all">("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(openFromShortcut);
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);
  const [profileCustomerId, setProfileCustomerId] = useState<string | null>(null);
  const orders = filterOrders(store.orders, query, status, origin, customerFilter);
  useEffect(() => {
    if (openFromShortcut) {
      setShowCreate(true);
      onShortcutOpened();
    }
  }, [onShortcutOpened, openFromShortcut]);
  return (
    <>
      <PageIntro
        eyebrow="Operação"
        title="Pedidos"
        description="Registre e acompanhe vendas diretas e pedidos da sua rede em um só lugar."
        action={
          <Button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-[#263b32] text-[#f8f4ed] hover:bg-[#344e42]"
          >
            <Plus className="mr-2 h-4 w-4" /> Registrar venda
          </Button>
        }
      />
      <div className="mb-5 grid gap-3 rounded-2xl border border-[#dfd4c3] bg-[#fbf8f3] p-4 md:grid-cols-[1fr_180px_180px_220px]">
        <Input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Buscar pedido, cliente ou peça"
          aria-label="Buscar pedidos"
        />
        <select
          value={status}
          onChange={event =>
            setStatus(event.target.value as OrderStatus | "all")
          }
          className="h-10 rounded-md border border-[#dfd4c3] bg-white px-3 text-sm"
          aria-label="Filtrar por status"
        >
          <option value="all">Todos os status</option>
          {Object.entries(statusLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={origin}
          onChange={event =>
            setOrigin(event.target.value as OrderOrigin | "all")
          }
          className="h-10 rounded-md border border-[#dfd4c3] bg-white px-3 text-sm"
          aria-label="Filtrar por origem"
        >
          <option value="all">Todas as origens</option>
          <option value="direct">Venda direta</option>
          <option value="reseller">Por revendedora</option>
        </select>
        <div className="flex gap-2">
          <select value={customerFilter} onChange={event => setCustomerFilter(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border border-[#dfd4c3] bg-white px-3 text-sm" aria-label="Filtrar por cliente">
            <option value="all">Todos os clientes</option>
            {store.customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
          {customerFilter !== "all" && <Button type="button" variant="outline" className="h-10 shrink-0 bg-[#f8f4ed] px-3" onClick={() => setProfileCustomerId(customerFilter)} aria-label="Abrir histórico do cliente" title="Ver histórico do cliente"><Eye className="h-4 w-4" /></Button>}
        </div>
      </div>
      {orders.length === 0 ? (
        <EmptyState
          title="Nenhum pedido encontrado"
          description={
            store.orders.length
              ? "Ajuste os filtros para localizar um pedido real."
              : "Registre a primeira venda real para iniciar o histórico da operação."
          }
        />
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              products={store.products}
              users={store.users}
              onInspect={() => setInspectOrder(order)}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
      {showCreate && (
        <CreateOrderModal
          store={store}
          initialResellerId={initialResellerId}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            onRefresh();
          }}
        />
      )}
      {inspectOrder && (
        <OrderInspector
          order={
            store.orders.find(item => item.id === inspectOrder.id) ??
            inspectOrder
          }
          users={store.users}
          onClose={() => setInspectOrder(null)}
          onRefresh={onRefresh}
        />
      )}
      {profileCustomerId && <CustomerHistoryDialog customer={store.customers.find(customer => customer.id === profileCustomerId)} orders={store.orders.filter(order => order.customerId === profileCustomerId)} onClose={() => setProfileCustomerId(null)} />}
    </>
  );
}

function CustomerHistoryDialog({ customer, orders, onClose }: { customer?: Customer; orders: Order[]; onClose: () => void }) {
  if (!customer) return null;
  const total = orders.filter(order => order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0);
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="border-[#dfd4c3] bg-[#fbf8f3] sm:max-w-xl"><DialogHeader><p className="eyebrow text-[#9d7d48]">Perfil de cliente</p><DialogTitle className="serif text-3xl text-[#263b32]">{customer.name}</DialogTitle><DialogDescription className="text-[#69756b]">Histórico objetivo de pedidos registrados para este cliente.</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-2 gap-3 rounded-xl bg-[#eee4d3] p-4"><div><p className="text-xs text-[#69756b]">Contato</p><p className="mt-1 text-sm font-medium">{customer.phone || customer.email || "Não informado"}</p></div><div><p className="text-xs text-[#69756b]">Pedidos</p><p className="mt-1 text-sm font-medium">{orders.length}</p></div><div><p className="text-xs text-[#69756b]">Total registrado</p><p className="mt-1 text-sm font-medium">{formatCurrency(total)}</p></div><div><p className="text-xs text-[#69756b]">Última compra</p><p className="mt-1 text-sm font-medium">{orders[0] ? new Date(orders[0].saleDate).toLocaleDateString("pt-BR") : "—"}</p></div></div>{orders.length === 0 ? <EmptyState title="Nenhum pedido para este cliente" description="O histórico aparecerá quando uma venda for vinculada a ele." /> : <div className="max-h-64 space-y-2 overflow-y-auto">{orders.map(order => <div key={order.id} className="flex items-center justify-between rounded-xl border border-[#e5dbcc] bg-white p-3"><div><p className="text-sm font-medium">Pedido {order.id.slice(0, 8)}</p><p className="mt-1 text-xs text-[#69756b]">{new Date(order.saleDate).toLocaleDateString("pt-BR")} · {statusLabel[order.status]}</p></div><p className="text-sm font-medium">{formatCurrency(order.total)}</p></div>)}</div>}</div></DialogContent></Dialog>;
}

function OrderCard({
  order,
  products,
  users,
  onInspect,
  onRefresh,
  }: {
  order: Order;
  products: StoreSnapshot["products"];
  users: LocalUser[];
  onInspect: () => void;
  onRefresh: () => void;
}) {
  const reseller = getOrderReseller(order, users);
  const leadProduct = order.items.map(item => products.find(product => product.id === item.productId)).find(Boolean);
  const updateStatus = (next: OrderStatus) => {
    try {
      updateOrderStatus(order.id, next, "gestora");
      onRefresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o pedido."
      );
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onInspect}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onInspect();
        }
      }}
      className="group cursor-pointer rounded-xl border border-[#dfd4c3] bg-[#fbf8f3] px-4 py-3 shadow-[0_8px_24px_rgba(38,59,50,.04)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-[#cdbd9e] hover:shadow-[0_12px_30px_rgba(38,59,50,.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7a66b]"
      aria-label={`Abrir detalhes do pedido ${order.id}`}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#dfd4c3] bg-[#eee4d3] text-[#9d7d48]" aria-label={leadProduct ? `Imagem de ${leadProduct.name}` : "Pedido sem imagem de peça"}>
            {leadProduct?.imageUrl ? <img src={leadProduct.imageUrl} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="h-5 w-5" aria-hidden="true" />}
          </div>
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium">
              Pedido {order.id.slice(0, 8)}
            </span>
            <Badge className="bg-[#eee4d3] px-2 py-0.5 text-[10px] text-[#896b3b]">
              {getOrderOriginLabel(order.origin)}
            </Badge>
            <Badge
              className={
                order.status === "cancelled"
                  ? "bg-[#f5e3df] px-2 py-0.5 text-[10px] text-[#984f46]"
                  : "bg-[#e2eee4] px-2 py-0.5 text-[10px] text-[#58705d]"
              }
            >
              {statusLabel[order.status]}
            </Badge>
          </div>
          <p className="mt-1 truncate text-xs text-[#69756b]">
            {reseller?.name ?? "Venda direta"}
            {order.customerName ? ` · ${order.customerName}` : ""} ·{" "}
            {new Date(order.saleDate).toLocaleDateString("pt-BR")}
          </p>
        </div>
        </div>
        <div className="flex items-center justify-between gap-4 md:justify-end">
          <div className="text-right">
            <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
            <p className="text-[10px] text-[#69756b]">
              Comissão {formatCurrency(order.commission)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={event => {
              event.stopPropagation();
              onInspect();
            }}
            className="h-8 w-8 rounded-lg bg-[#f8f4ed] p-0 text-[#263b32]"
            aria-label={`Inspecionar pedido ${order.id}`}
            title="Inspecionar pedido"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[#eee7dd] pt-2">
        <span className="text-[11px] text-[#69756b]">
          {order.items
            .map(item => `${item.quantity} × ${item.productName}`)
            .join(" · ")}
        </span>
        <span className="ml-auto text-[11px] text-[#69756b]">
          {getPaymentMethodLabel(order.paymentMethod)} ·{" "}
          {order.paymentStatus === "paid" ? "Pago" : "Pendente"}
        </span>
        {order.status !== "cancelled" && order.status !== "delivered" && (
          <select
            value={order.status}
            onClick={event => event.stopPropagation()}
            onChange={event => updateStatus(event.target.value as OrderStatus)}
            className="h-7 rounded-md border border-[#dfd4c3] bg-white px-2 text-[11px]"
            aria-label={`Status do pedido ${order.id}`}
          >
            <option value={order.status}>{statusLabel[order.status]}</option>
            {[
              "approved",
              "paid",
              "separating",
              "shipped",
              "delivered",
              "cancelled",
            ]
              .filter(value =>
                canTransitionOrder(order.status, value as OrderStatus)
              )
              .map(value => (
                <option key={value} value={value}>
                  {value === "approved"
                    ? "Aprovar"
                    : value === "paid"
                      ? "Marcar como pago"
                      : value === "separating"
                        ? "Em separação"
                        : value === "shipped"
                          ? "Enviado"
                          : value === "delivered"
                            ? "Entregue"
                            : "Cancelar"}
                </option>
              ))}
          </select>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] text-[#69756b]">
          <Check className="h-3 w-3 text-[#58705d]" /> Histórico
        </span>
      </div>
    </div>
  );
}

function OrderInspector({
  order,
  users,
  onClose,
  onRefresh,
}: {
  order: Order;
  users: LocalUser[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [customerId, setCustomerId] = useState(order.customerId ?? "");
  const [paymentMethod, setPaymentMethod] = useState(order.paymentMethod);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [saleDate, setSaleDate] = useState(order.saleDate.slice(0, 10));
  const [status, setStatus] = useState(order.status);
  const store = getStore();
  const reseller = getOrderReseller(order, users);
  const save = () => {
    try {
      updateOrderDetails(
        order.id,
        {
          customerId: customerId || undefined,
          paymentMethod,
          paymentStatus,
          saleDate: new Date(`${saleDate}T12:00:00`).toISOString(),
          status,
        },
        "gestora"
      );
      setEditing(false);
      onRefresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Não foi possível editar o pedido."
      );
    }
  };
  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#dfd4c3] bg-[#fbf8f3] sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[#9d7d48]">Inspeção do pedido</p>
              <DialogTitle className="serif mt-2 text-3xl text-[#263b32]">
                Pedido {order.id.slice(0, 8)}
              </DialogTitle>
              <DialogDescription className="mt-2 text-[#69756b]">
                Consulte os detalhes registrados e edite os dados operacionais
                permitidos.
              </DialogDescription>
            </div>
            <Badge className="bg-[#e2eee4] text-[#58705d]">
              {statusLabel[order.status]}
            </Badge>
          </div>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-3 rounded-xl bg-[#eee4d3] p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[.1em] text-[#896b3b]">
                Origem
              </p>
              <p className="mt-1 text-sm font-medium">
                {getOrderOriginLabel(order.origin)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[.1em] text-[#896b3b]">
                Responsável
              </p>
              <p className="mt-1 text-sm font-medium">
                {reseller?.name ?? "Gestora / venda direta"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[.1em] text-[#896b3b]">
                Total
              </p>
              <p className="mt-1 text-lg font-medium">
                {formatCurrency(order.total)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[.1em] text-[#896b3b]">
                Comissão
              </p>
              <p className="mt-1 text-sm font-medium">
                {formatCurrency(order.commission)}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-[#e5dbcc] bg-white p-4">
            <p className="text-sm font-medium">Itens do pedido</p>
            <div className="mt-3 space-y-2">
              {order.items.map(item => (
                <div
                  key={item.productId}
                  className="flex justify-between text-sm text-[#69756b]"
                >
                  <span>
                    {item.quantity} × {item.productName}
                  </span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
          {editing ? (
            <div className="grid gap-3 rounded-xl border border-[#e5dbcc] bg-white p-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Cliente
                <select
                  value={customerId}
                  onChange={event => setCustomerId(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-[#dfd4c3] bg-white px-3 text-sm"
                >
                  <option value="">Sem cliente selecionado</option>
                  {store.customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} · {customer.phone}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Data da venda
                <Input
                  type="date"
                  value={saleDate}
                  onChange={event => setSaleDate(event.target.value)}
                  className="mt-2 bg-white"
                />
              </label>
              <label className="text-sm font-medium">
                Forma de pagamento
                <select
                  value={paymentMethod}
                  onChange={event =>
                    setPaymentMethod(event.target.value as PaymentMethod)
                  }
                  className="mt-2 h-10 w-full rounded-md border border-[#dfd4c3] bg-white px-3 text-sm"
                >
                  <option value="pending">A definir</option>
                  <option value="pix">Pix</option>
                  <option value="card">Cartão</option>
                  <option value="cash">Dinheiro</option>
                  <option value="transfer">Transferência</option>
                </select>
              </label>
              <label className="text-sm font-medium">
                Situação
                <select
                  value={paymentStatus}
                  onChange={event =>
                    setPaymentStatus(event.target.value as PaymentStatus)
                  }
                  className="mt-2 h-10 w-full rounded-md border border-[#dfd4c3] bg-white px-3 text-sm"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="partially_paid">Parcialmente pago</option>
                </select>
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Status do pedido
                <select
                  value={status}
                  onChange={event =>
                    setStatus(event.target.value as OrderStatus)
                  }
                  className="mt-2 h-10 w-full rounded-md border border-[#dfd4c3] bg-white px-3 text-sm"
                >
                  <option value={order.status}>
                    {statusLabel[order.status]}
                  </option>
                  {[
                    "approved",
                    "paid",
                    "separating",
                    "shipped",
                    "delivered",
                    "cancelled",
                  ]
                    .filter(value =>
                      canTransitionOrder(order.status, value as OrderStatus)
                    )
                    .map(value => (
                      <option key={value} value={value}>
                        {statusLabel[value as OrderStatus]}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          ) : (
            <div className="grid gap-2 text-sm text-[#69756b]">
              <p>
                <strong className="text-[#263b32]">Cliente:</strong>{" "}
                {order.customerName ?? "Não informado"}
              </p>
              <p>
                <strong className="text-[#263b32]">Pagamento:</strong>{" "}
                {getPaymentMethodLabel(order.paymentMethod)} ·{" "}
                {order.paymentStatus === "paid"
                  ? "Pago"
                  : order.paymentStatus === "partially_paid"
                    ? "Parcialmente pago"
                    : "Pendente"}
              </p>
              <p>
                <strong className="text-[#263b32]">Registrado em:</strong>{" "}
                {new Date(order.createdAt).toLocaleString("pt-BR")}
              </p>
              <p>
                <strong className="text-[#263b32]">Histórico:</strong>{" "}
                {order.history.length} evento(s) preservado(s)
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          {editing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
                className="bg-[#f8f4ed]"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={save}
                className="bg-[#263b32] text-[#f8f4ed]"
              >
                Salvar alterações
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-[#f8f4ed]"
              >
                Fechar
              </Button>
              <Button
                type="button"
                onClick={() => setEditing(true)}
                className="bg-[#263b32] text-[#f8f4ed]"
              >
                Editar pedido
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateOrderModal({
  store,
  initialResellerId,
  onClose,
  onCreated,
}: {
  store: StoreSnapshot;
  initialResellerId?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [origin, setOrigin] = useState<OrderOrigin>(
    initialResellerId ? "reseller" : "direct"
  );
  const [requestId] = useState(() => crypto.randomUUID());
  const [entryType, setEntryType] = useState<EntryType>("detailed");
  const [resellerId, setResellerId] = useState(initialResellerId ?? "");
  const [manualDescription, setManualDescription] = useState("");
  const [manualTotal, setManualTotal] = useState("");
  const [items, setItems] = useState<Record<string, number>>({});
  const [catalogQuery, setCatalogQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>(store.customers);
  const [customerId, setCustomerId] = useState("");
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pending");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [error, setError] = useState("");
  const [customerError, setCustomerError] = useState("");
  const availableProducts = getSelectableProducts(store.products);
  const filteredProducts = availableProducts.filter(product => `${product.name} ${product.category}`.toLocaleLowerCase("pt-BR").includes(catalogQuery.toLocaleLowerCase("pt-BR")));
  const selectedItems = Object.entries(items).filter(
    ([, quantity]) => quantity > 0
  );
  const total =
    entryType === "general"
      ? parseBRLInput(manualTotal)
      : selectedItems.reduce(
          (sum, [id, quantity]) =>
            sum +
            (store.products.find(product => product.id === id)?.price ?? 0) *
              quantity,
          0
        );
  const save = () => {
    try {
      createOrder(
        buildOrderInput({
          requestId,
          entryType,
          manualDescription:
            entryType === "general" ? manualDescription : undefined,
          manualTotal: entryType === "general" ? total : undefined,
          origin,
          resellerId: origin === "reseller" ? resellerId : undefined,
          customerId: customerId || undefined,
          items: selectedItems.map(([productId, quantity]) => ({
            productId,
            quantity,
          })),
          status: paymentStatus === "paid" ? "paid" : "pending",
          paymentMethod,
          paymentStatus,
          saleDate: new Date(`${saleDate}T12:00:00`).toISOString(),
        })
      );
      onCreated();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Revise os dados do pedido."
      );
    }
  };
  const registerCustomer = () => {
    try {
      const customer = createCustomer({
        name: newCustomerName,
        phone: newCustomerPhone,
        email: newCustomerEmail,
      });
      setCustomers(current => [
        customer,
        ...current.filter(item => item.id !== customer.id),
      ]);
      setCustomerId(customer.id);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerEmail("");
      setCustomerError("");
      setNewCustomerOpen(false);
    } catch (reason) {
      setCustomerError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível registrar o cliente."
      );
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#263b32]/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-order-title"
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#dfd4c3] bg-[#fbf8f3] p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow text-[#9d7d48]">Novo registro</p>
            <h3 id="new-order-title" className="serif mt-2 text-3xl">
              Registrar venda
            </h3>
            <p className="mt-2 text-sm text-[#69756b]">
              Preencha os dados, revise o resumo e confirme uma única vez.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full text-[#896b3b] transition-colors hover:bg-[#eee4d3]"
              onClick={() =>
                setEntryType(value =>
                  value === "detailed" ? "general" : "detailed"
                )
              }
              aria-label={
                entryType === "detailed"
                  ? "Trocar para venda geral"
                  : "Trocar para pedido detalhado"
              }
              title={
                entryType === "detailed" ? "Venda geral" : "Pedido detalhado"
              }
            >
              <ArrowLeftRight
                className="h-[18px] w-[18px]"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar registro"
              className="rounded-full p-2 text-[#69756b] hover:bg-[#eee4d3]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-5">
          <div className="flex items-center justify-between rounded-xl bg-[#eee4d3] px-4 py-3">
            <span className="text-xs uppercase tracking-[.12em] text-[#896b3b]">
              {entryType === "detailed" ? "Pedido detalhado" : "Venda geral"}
            </span>
            <span className="text-xs text-[#69756b]">
              Clique no ícone superior para alternar
            </span>
          </div>
          <div className="grid gap-3">
            <label className="text-sm font-medium">
              Origem
              <select
                value={origin}
                onChange={event => setOrigin(event.target.value as OrderOrigin)}
                className="mt-2 h-10 w-full rounded-md border border-[#dfd4c3] bg-white px-3 text-sm"
              >
                <option value="direct">Venda direta</option>
                <option value="reseller">Por revendedora</option>
              </select>
            </label>
          </div>
          {entryType === "general" ? (
            <div className="grid gap-3 rounded-xl border border-[#e5dbcc] bg-white p-4 md:grid-cols-2">
              <label className="text-sm font-medium">
                Descrição da venda
                <Input className="mt-2" value={manualDescription} onChange={event => setManualDescription(event.target.value)} placeholder="Ex.: venda de peças não discriminadas" />
              </label>
              <label className="text-sm font-medium">
                Valor total
                <Input className="mt-2" inputMode="numeric" value={manualTotal} onChange={event => setManualTotal(formatBRLInput(event.target.value))} placeholder="R$ 0,00" />
              </label>
              {origin === "reseller" && <label className="text-sm font-medium md:col-span-2">Revendedora<select value={resellerId} onChange={event => setResellerId(event.target.value)} aria-label="Selecionar revendedora na venda geral" className="mt-2 h-10 w-full rounded-md border border-[#dfd4c3] bg-white px-3 text-sm"><option value="">Selecione uma revendedora</option>{store.users.filter(user => user.role === "revendedora").map(user => <option key={user.id} value={user.id}>{user.name} · {user.city}</option>)}</select></label>}
              <p className="text-xs text-[#69756b] md:col-span-2">O registro geral não baixa estoque de peças individuais; use-o apenas para uma entrada agregada.</p>
            </div>
          ) : (
            <div
              className={
                origin === "reseller"
                  ? "grid gap-3 md:grid-cols-2"
                  : "grid gap-3"
              }
            >
              <div>
                <p className="text-sm font-medium">Peças do catálogo</p>
                <div className="mt-2 grid gap-2">
                  {availableProducts.length === 0 ? (
                    <p className="rounded-xl bg-[#eee4d3] p-4 text-sm text-[#69756b]">Cadastre peças no Catálogo antes de registrar uma venda.</p>
                  ) : (
                    <div className="rounded-xl border border-[#e5dbcc] bg-white p-3">
                      <Input value={catalogQuery} onChange={event => setCatalogQuery(event.target.value)} placeholder="Pesquisar peça por nome ou categoria" aria-label="Pesquisar peças do catálogo" className="mb-3" />
                      <select value={selectedItems[0]?.[0] ?? ""} onChange={event => setItems(event.target.value ? { [event.target.value]: Math.max(1, items[event.target.value] ?? 0) } : {})} aria-label="Selecionar peça do catálogo" className="h-10 w-full rounded-md border border-[#dfd4c3] bg-white px-3 text-sm">
                        <option value="">Selecione uma peça</option>
                        {filteredProducts.map(product => <option key={product.id} value={product.id} disabled={product.stock === 0}>{product.name} · {formatCurrency(product.price)} · {product.stock > 0 ? `${product.stock} em estoque` : "Sem estoque"}</option>)}
                      </select>
                      {selectedItems[0] && (() => { const [productId, quantity] = selectedItems[0]; const product = store.products.find(item => item.id === productId); if (!product) return null; return <div className="mt-3 flex items-center justify-between rounded-lg bg-[#f8f4ed] px-3 py-2"><div><p className="text-sm font-medium">{product.name}</p><p className="text-xs text-[#69756b]">{formatCurrency(product.price)} · {product.stock} em estoque</p></div><div className="flex items-center gap-2"><Button variant="outline" className="h-8 w-8 bg-white p-0" onClick={() => setItems(current => ({ ...current, [product.id]: Math.max(0, quantity - 1) }))}>−</Button><span className="w-5 text-center text-sm">{quantity}</span><Button variant="outline" className="h-8 w-8 bg-white p-0" onClick={() => setItems(current => ({ ...current, [product.id]: Math.min(product.stock, quantity + 1) }))} disabled={quantity >= product.stock}>+</Button></div></div>; })()}
                    </div>
                  )}
                </div>
              </div>
              {origin === "reseller" && (
                <div>
                  <label className="text-sm font-medium">
                    Revendedora
                    <select
                      value={resellerId}
                      onChange={event => setResellerId(event.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-[#dfd4c3] bg-white px-3 text-sm"
                    >
                      <option value="">Selecione uma revendedora</option>
                      {store.users
                        .filter(user => user.role === "revendedora")
                        .map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} · {user.city}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="flex items-end gap-2">
                <label className="min-w-0 flex-1 text-sm font-medium">
                  Cliente
                  <select
                    value={customerId}
                    onChange={event => setCustomerId(event.target.value)}
                    aria-label="Selecionar cliente"
                    className="mt-2 h-10 w-full rounded-md border border-[#dfd4c3] bg-white px-3 text-sm"
                  >
                    <option value="">Sem cliente selecionado</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} · {customer.phone}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCustomerError("");
                    setNewCustomerOpen(true);
                  }}
                  className="h-10 shrink-0 border-[#cdbd9e] text-[#263b32]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo cliente
                </Button>
              </div>
              <p className="mt-2 text-xs text-[#69756b]">
                Cadastre o cliente uma vez e selecione-o nos próximos pedidos.
              </p>
            </div>
            <label className="text-sm font-medium">
              Data da venda
              <Input
                className="mt-2 bg-white"
                type="date"
                value={saleDate}
                onChange={event => setSaleDate(event.target.value)}
              />
            </label>
            <label className="text-sm font-medium">
              Forma de pagamento
              <select
                value={paymentMethod}
                onChange={event =>
                  setPaymentMethod(event.target.value as PaymentMethod)
                }
                className="mt-2 h-10 w-full rounded-md border border-[#dfd4c3] bg-white px-3 text-sm"
              >
                <option value="pending">A definir</option>
                <option value="pix">Pix</option>
                <option value="card">Cartão</option>
                <option value="cash">Dinheiro</option>
                <option value="transfer">Transferência</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Situação do pagamento
              <select
                value={paymentStatus}
                onChange={event =>
                  setPaymentStatus(event.target.value as PaymentStatus)
                }
                className="mt-2 h-10 w-full rounded-md border border-[#dfd4c3] bg-white px-3 text-sm"
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="partially_paid">Parcialmente pago</option>
              </select>
            </label>
          </div>
          <div className="rounded-2xl bg-[#263b32] p-5 text-[#f8f4ed]">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow text-[#dfc58f]">
                  Resumo antes de confirmar
                </p>
                <p className="mt-2 text-sm text-[#c2cec3]">
                  {entryType === "general"
                    ? "Venda geral"
                    : `${selectedItems.reduce((sum, [, quantity]) => sum + quantity, 0)} item(ns) selecionado(s)`}
                </p>
              </div>
              <p className="serif text-3xl">{formatCurrency(total)}</p>
            </div>
          </div>
          {error && (
            <p
              className="rounded-xl bg-[#f5e3df] p-3 text-sm text-[#984f46]"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl bg-[#f8f4ed]"
            >
              Cancelar
            </Button>
            <Button
              onClick={save}
              className="rounded-xl bg-[#263b32] text-[#f8f4ed] hover:bg-[#344e42]"
            >
              Confirmar pedido
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent className="border-[#dfd4c3] bg-[#fbf8f3] sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="serif text-3xl text-[#263b32]">
              Registrar cliente
            </DialogTitle>
            <DialogDescription className="text-[#69756b]">
              Salve os dados básicos para selecionar este cliente em pedidos
              atuais e futuros.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <label className="text-sm font-medium">
              Nome do cliente
              <Input
                className="mt-2 bg-white"
                value={newCustomerName}
                onChange={event => setNewCustomerName(event.target.value)}
                placeholder="Nome completo"
              />
            </label>
            <label className="text-sm font-medium">
              Telefone ou WhatsApp
              <Input
                className="mt-2 bg-white"
                value={newCustomerPhone}
                onChange={event => setNewCustomerPhone(event.target.value)}
                placeholder="(00) 00000-0000"
              />
            </label>
            <label className="text-sm font-medium">
              E-mail (opcional)
              <Input
                className="mt-2 bg-white"
                type="email"
                value={newCustomerEmail}
                onChange={event => setNewCustomerEmail(event.target.value)}
                placeholder="cliente@email.com"
              />
            </label>
            {customerError && (
              <p
                className="rounded-xl bg-[#f5e3df] p-3 text-sm text-[#984f46]"
                role="alert"
              >
                {customerError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewCustomerOpen(false)}
              className="border-[#cdbd9e]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={registerCustomer}
              className="bg-[#263b32] text-[#f8f4ed] hover:bg-[#344e42]"
            >
              Registrar cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

