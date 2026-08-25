import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import AppShell, { type Section } from "./components/AppShell";
import ManagerDashboard from "./pages/ManagerDashboard";
import ResellerDashboard from "./pages/ResellerDashboard";
import {
  configureRemotePersistence,
  getSessionUser,
  logout,
  replaceStore,
  subscribeStore,
  type LocalUser,
} from "./lib/localStore";
import {
  fetchRemoteSession,
  fetchRemoteStore,
  logoutRemoteAccount,
  persistRemoteStore,
} from "./lib/remotePersistence";

function App() {
  const [user, setUser] = useState<LocalUser | null>(() => getSessionUser());
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [section, setSection] = useState<Section>("painel");
  const [showAuth, setShowAuth] = useState(() => typeof window !== "undefined" && window.location.pathname.startsWith("/convite/"));
  useEffect(() => subscribeStore(() => setUser(getSessionUser())), []);
  useEffect(() => {
    const notify = () => setSyncError("Não foi possível salvar no Supabase. Seus dados não foram confirmados; verifique a conexão e tente novamente.");
    window.addEventListener("fernanda-remote-persistence-error", notify);
    return () => window.removeEventListener("fernanda-remote-persistence-error", notify);
  }, []);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const session = await fetchRemoteSession();
        if (!session.user) {
          configureRemotePersistence(null);
          if (active) setUser(null);
          return;
        }
        const store = await fetchRemoteStore();
        configureRemotePersistence(persistRemoteStore);
        replaceStore(store);
        if (active) setUser(getSessionUser());
      } catch {
        configureRemotePersistence(null);
        if (active) setUser(null);
      } finally {
        if (active) setReady(true);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => { const catalog = () => setSection("catalogo"); const orders = () => setSection("pedidos"); const managerOrder = () => setSection("pedidos"); window.addEventListener("reseller-go-catalog", catalog); window.addEventListener("reseller-go-orders", orders); window.addEventListener("manager-open-order-for-reseller", managerOrder); return () => { window.removeEventListener("reseller-go-catalog", catalog); window.removeEventListener("reseller-go-orders", orders); window.removeEventListener("manager-open-order-for-reseller", managerOrder); }; }, []);
  const openAuth = (mode: "login" | "register") => { setAuthMode(mode); setShowAuth(true); };
  const finishAuthentication = async () => {
    const store = await fetchRemoteStore();
    configureRemotePersistence(persistRemoteStore);
    replaceStore(store);
    setUser(getSessionUser());
    setShowAuth(false);
    setSection("painel");
  };
  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-[#f8f4ed] text-sm text-[#69756b]">Carregando dados seguros…</div>;
  if (!user && !showAuth) return <LandingPage onStart={openAuth} />;
  if (!user) return <AuthPage mode={authMode} onModeChange={setAuthMode} onSuccess={finishAuthentication} />;
  return <ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><AppShell user={user} section={section} setSection={setSection} onLogout={() => { void logoutRemoteAccount().finally(() => { configureRemotePersistence(null); logout(); setUser(null); setShowAuth(false); }); }}><>{syncError && <div className="mx-auto mb-4 max-w-6xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{syncError}<button className="ml-3 font-semibold underline" onClick={() => setSyncError(null)}>Fechar</button></div>}{user.role === "gestora" ? <ManagerDashboard user={user} section={section} /> : <ResellerDashboard user={user} section={section} />}</></AppShell></TooltipProvider></ThemeProvider>;
}

export default function RootApp() { return <ErrorBoundary><App /></ErrorBoundary>; }
