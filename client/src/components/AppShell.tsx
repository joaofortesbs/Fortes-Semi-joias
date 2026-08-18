import { Bell, ChevronDown, Gem, LayoutDashboard, LogOut, Menu, Package, ShoppingBag, UsersRound, WalletCards } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getStore, updateStore, type LocalUser } from "@/lib/localStore";

export type Section = "painel" | "catalogo" | "pedidos" | "revendedoras" | "comissoes";
type Props = { user: LocalUser; section: Section; setSection: (section: Section) => void; onLogout: () => void; children: React.ReactNode };

export default function AppShell({ user, section, setSection, onLogout, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifications = getStore().notifications.slice(0, 5);
  const unread = notifications.filter(item => !item.read).length;
  const managerItems = [
    { id: "painel" as Section, label: "Painel", icon: LayoutDashboard },
    { id: "catalogo" as Section, label: "Catálogo", icon: Package },
    { id: "pedidos" as Section, label: "Pedidos", icon: ShoppingBag },
    { id: "revendedoras" as Section, label: "Revendedoras", icon: UsersRound },
    { id: "comissoes" as Section, label: "Comissões", icon: WalletCards },
  ];
  const resellerItems = [
    { id: "painel" as Section, label: "Meu painel", icon: LayoutDashboard },
    { id: "catalogo" as Section, label: "Catálogo", icon: Package },
    { id: "pedidos" as Section, label: "Meus pedidos", icon: ShoppingBag },
    { id: "comissoes" as Section, label: "Minhas comissões", icon: WalletCards },
  ];
  const items = user.role === "gestora" ? managerItems : resellerItems;
  const currentLabel = items.find(item => item.id === section)?.label ?? "Painel";

  return <div className="min-h-screen bg-[#f8f4ed] text-[#263b32]">
    {mobileOpen && <button className="fixed inset-0 z-40 bg-[#263b32]/30 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#dfd4c3] bg-[#fbf8f3] transition-all duration-200 ${collapsed ? "w-[76px]" : "w-[268px]"} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="flex h-20 items-center gap-3 border-b border-[#e5dbcc] px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#263b32] text-[#e4c98f]"><Gem className="h-5 w-5" /></div>
        {!collapsed && <div><p className="serif text-lg leading-none">Fernanda Fortes</p><p className="mt-1 text-[10px] uppercase tracking-[.17em] text-[#9d7d48]">Semijoias</p></div>}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto hidden text-[#8f8b80] lg:block" aria-label="Alternar menu"><Menu className="h-5 w-5" /></button>
      </div>
      <div className="border-b border-[#e5dbcc] p-4">
        <Popover>
          <PopoverTrigger asChild><button aria-label="Selecionar perfil" className={`flex w-full items-center gap-3 rounded-2xl border border-[#d9cbb6] bg-[#f8f4ed] p-3 text-left ${collapsed ? "justify-center" : ""}`}>
            <Avatar className="h-9 w-9 border border-[#d7bd8c]"><AvatarFallback className="bg-[#e4d6be] text-xs text-[#6f5935]">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
            {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-medium">{user.name}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-[#9d7d48]">{user.role === "gestora" ? "Gestora" : "Revendedora"}<ChevronDown className="h-3 w-3" /></p></div>}
          </button></PopoverTrigger>
          <PopoverContent side="right" align="start" className="w-56 border-[#dfd4c3] bg-[#fbf8f3]"><p className="eyebrow text-[#9d7d48]">Perfil de acesso</p><div className="mt-3 space-y-1">
            {(["Gestora", "Revendedora", "Loja"] as const).map(profile => { const active = (profile === "Gestora" && user.role === "gestora") || (profile === "Revendedora" && user.role === "revendedora"); return <button key={profile} disabled={profile === "Loja" || !active} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-[#69756b] hover:bg-[#f1eadf] disabled:cursor-not-allowed disabled:opacity-40">{profile}{active && <span className="h-2 w-2 rounded-full bg-[#b8955b]" />}</button>; })}
          </div></PopoverContent>
        </Popover>
      </div>
      <nav className="flex-1 space-y-1 p-4">{items.map(item => <button key={item.id} onClick={() => { setSection(item.id); setMobileOpen(false); }} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${section === item.id ? "bg-[#263b32] text-[#f8f4ed]" : "text-[#69756b] hover:bg-[#f0e8dc] hover:text-[#263b32]"} ${collapsed ? "justify-center" : ""}`} title={collapsed ? item.label : undefined}><item.icon className="h-[18px] w-[18px] shrink-0" />{!collapsed && <span>{item.label}</span>}</button>)}</nav>
      <div className="border-t border-[#e5dbcc] p-4"><button onClick={onLogout} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#8b625f] hover:bg-[#f5e9e3] ${collapsed ? "justify-center" : ""}`}><LogOut className="h-[18px] w-[18px]" />{!collapsed && <span>Sair da conta</span>}</button></div>
    </aside>
    <div className={`transition-[margin] duration-200 ${collapsed ? "lg:ml-[76px]" : "lg:ml-[268px]"}`}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#e5dbcc] bg-[#f8f4ed]/90 px-5 backdrop-blur-md lg:px-10"><div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-[#eee5d8] lg:hidden" aria-label="Abrir menu"><Menu className="h-5 w-5" /></button><div><p className="eyebrow text-[#9d7d48]">Área {user.role === "gestora" ? "da gestora" : "da revendedora"}</p><h1 className="serif mt-1 text-2xl">{currentLabel}</h1></div></div>
        <div className="flex items-center gap-3"><Popover><PopoverTrigger asChild><button className="relative rounded-full border border-[#d9cbb6] bg-[#fbf8f3] p-2.5 text-[#69756b] hover:text-[#263b32]" aria-label="Notificações"><Bell className="h-[18px] w-[18px]" />{unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ad785f]" />}</button></PopoverTrigger><PopoverContent align="end" className="w-80 border-[#dfd4c3] bg-[#fbf8f3]"><div className="flex items-center justify-between"><p className="font-medium">Notificações</p>{unread > 0 && <button onClick={() => updateStore(store => store.notifications.forEach(item => { item.read = true; }))} className="text-xs text-[#846737]">Marcar como lidas</button>}</div><div className="mt-4 space-y-3">{notifications.length === 0 ? <p className="text-sm text-[#69756b]">Tudo tranquilo por aqui.</p> : notifications.map(item => <div key={item.id} className={`rounded-xl border p-3 ${item.read ? "border-[#eee7dd]" : "border-[#d7bd8c] bg-[#f6efe3]"}`}><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs leading-5 text-[#69756b]">{item.message}</p></div>)}</div></PopoverContent></Popover><div className="hidden h-8 w-px bg-[#dfd4c3] sm:block" /><div className="hidden items-center gap-2 sm:flex"><Avatar className="h-8 w-8 border border-[#d7bd8c]"><AvatarFallback className="bg-[#e4d6be] text-xs text-[#6f5935]">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="max-w-[150px] truncate text-sm">{user.name}</span></div></div>
      </header><main className="mx-auto max-w-[1500px] p-5 lg:p-10">{children}</main>
    </div>
  </div>;
}
