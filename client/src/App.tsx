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
import { getSessionUser, logout, subscribeStore, type LocalUser } from "./lib/localStore";

function App() {
  const [user, setUser] = useState<LocalUser | null>(() => getSessionUser());
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [section, setSection] = useState<Section>("painel");
  const [showAuth, setShowAuth] = useState(false);
  useEffect(() => subscribeStore(() => setUser(getSessionUser())), []);
  useEffect(() => { const catalog = () => setSection("catalogo"); const orders = () => setSection("pedidos"); const managerOrder = () => setSection("pedidos"); window.addEventListener("reseller-go-catalog", catalog); window.addEventListener("reseller-go-orders", orders); window.addEventListener("manager-open-order-for-reseller", managerOrder); return () => { window.removeEventListener("reseller-go-catalog", catalog); window.removeEventListener("reseller-go-orders", orders); window.removeEventListener("manager-open-order-for-reseller", managerOrder); }; }, []);
  const openAuth = (mode: "login" | "register") => { setAuthMode(mode); setShowAuth(true); };
  if (!user && !showAuth) return <LandingPage onStart={openAuth} />;
  if (!user) return <AuthPage mode={authMode} onModeChange={setAuthMode} onSuccess={() => { setUser(getSessionUser()); setShowAuth(false); setSection("painel"); }} />;
  return <ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><AppShell user={user} section={section} setSection={setSection} onLogout={() => { logout(); setUser(null); setShowAuth(false); }}><>{user.role === "gestora" ? <ManagerDashboard user={user} section={section} /> : <ResellerDashboard user={user} section={section} />}</></AppShell></TooltipProvider></ThemeProvider>;
}

export default function RootApp() { return <ErrorBoundary><App /></ErrorBoundary>; }
