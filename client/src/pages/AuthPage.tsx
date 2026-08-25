import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, Gem, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { replaceStore, type Role } from "@/lib/localStore";
import {
  loginRemoteAccount,
  registerRemoteAccount,
} from "@/lib/remotePersistence";

type Props = { mode: "login" | "register"; onModeChange: (mode: "login" | "register") => void; onSuccess: () => void };

export default function AuthPage({ mode, onModeChange, onSuccess }: Props) {
  const [role, setRole] = useState<Role>("revendedora");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const result = mode === "register"
        ? await registerRemoteAccount({ name, email, phone, password, role, inviteToken: window.location.pathname.startsWith("/convite/") ? window.location.pathname.split("/").pop() : undefined })
        : await loginRemoteAccount({ email, password, role });
      replaceStore({
        users: [result.user],
        customers: [],
        products: [],
        orders: [],
        notifications: [],
        collections: [],
        sessionUserId: result.user.id,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir agora.");
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-5 py-8 text-[#25362f] lg:grid lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:px-12">
      <section className="relative hidden overflow-hidden rounded-[2rem] bg-[#263b32] p-12 text-[#f7f1e8] lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-[#d5b679]/30" /><div className="absolute bottom-16 right-12 h-36 w-36 rounded-full border border-[#d5b679]/20" />
        <div><div className="mb-12 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d5b679]/60"><Gem className="h-5 w-5 text-[#e3c78f]" /></div><span className="serif text-xl tracking-wide">Fernanda Fortes</span></div><p className="eyebrow text-[#d5b679]">Uma rede para florescer</p><h1 className="serif mt-5 max-w-xl text-5xl leading-[1.03]">Seu negócio de semijoias, com mais presença.</h1><p className="mt-6 max-w-md text-sm leading-7 text-[#d8ddd5]">Gestão, relacionamento e crescimento em um só lugar — com a delicadeza que o seu trabalho merece.</p></div>
        <div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-2xl text-[#e3c78f]">01</p><p className="mt-2 text-[#d8ddd5]">Gestão mais leve</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-2xl text-[#e3c78f]">02</p><p className="mt-2 text-[#d8ddd5]">Vendas com propósito</p></div></div>
      </section>
      <section className="flex items-center justify-center py-6 lg:py-12"><div className="w-full max-w-md"><div className="mb-8 flex items-center gap-3 lg:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#263b32] text-[#e3c78f]"><Gem className="h-5 w-5" /></div><span className="serif text-xl">Fernanda Fortes</span></div><div className="mb-8"><p className="eyebrow">Área exclusiva</p><h2 className="serif mt-3 text-4xl text-[#263b32]">{mode === "login" ? "Bem-vinda de volta" : "Comece sua jornada"}</h2><p className="mt-3 text-sm leading-6 text-[#69756b]">{mode === "login" ? "Entre para acompanhar sua operação e seus resultados." : "Crie seu acesso para fazer parte da nossa rede."}</p></div>
        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-[#d9cbb6] bg-[#fbf8f3] p-6 shadow-[0_20px_60px_rgba(74,58,39,.08)]">
          <div><Label className="text-xs uppercase tracking-[.14em] text-[#69756b]">Perfil de acesso</Label><Select value={role} onValueChange={(value) => setRole(value as Role)}><SelectTrigger className="mt-2 h-12 border-[#d9cbb6] bg-transparent"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gestora">Gestora</SelectItem><SelectItem value="revendedora">Revendedora</SelectItem></SelectContent></Select></div>
          {mode === "register" && <><div><Label className="text-xs uppercase tracking-[.14em] text-[#69756b]">Nome completo</Label><div className="relative mt-2"><UserRound className="absolute left-3 top-3.5 h-4 w-4 text-[#a6947a]" /><Input required value={name} onChange={e => setName(e.target.value)} className="h-12 border-[#d9cbb6] bg-transparent pl-10" placeholder="Como podemos chamar você?" /></div></div><div><Label className="text-xs uppercase tracking-[.14em] text-[#69756b]">Telefone</Label><div className="relative mt-2"><Phone className="absolute left-3 top-3.5 h-4 w-4 text-[#a6947a]" /><Input required value={phone} onChange={e => setPhone(e.target.value)} className="h-12 border-[#d9cbb6] bg-transparent pl-10" placeholder="(00) 00000-0000" /></div></div></>}
          <div><Label className="text-xs uppercase tracking-[.14em] text-[#69756b]">E-mail</Label><div className="relative mt-2"><Mail className="absolute left-3 top-3.5 h-4 w-4 text-[#a6947a]" /><Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 border-[#d9cbb6] bg-transparent pl-10" placeholder="voce@email.com" /></div></div>
          <div><Label className="text-xs uppercase tracking-[.14em] text-[#69756b]">Senha</Label><div className="relative mt-2"><LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-[#a6947a]" /><Input required minLength={6} type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="h-12 border-[#d9cbb6] bg-transparent pl-10 pr-10" placeholder="Mínimo de 6 caracteres" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-[#a6947a]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button disabled={loading} className="h-12 w-full rounded-xl bg-[#263b32] text-[#f7f1e8] hover:bg-[#344e42]">{loading ? "Aguarde..." : mode === "login" ? "Entrar na plataforma" : "Criar minha conta"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          {mode === "register" && <div className="flex gap-2 rounded-xl bg-[#f1eadf] p-3 text-xs leading-5 text-[#69756b]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#9d7d48]" />Revendedoras passam por uma aprovação antes do primeiro acesso.</div>}
        </form>
        <p className="mt-6 text-center text-sm text-[#69756b]">{mode === "login" ? "Ainda não possui acesso?" : "Já possui uma conta?"} <button onClick={() => onModeChange(mode === "login" ? "register" : "login")} className="font-medium text-[#846737] underline underline-offset-4">{mode === "login" ? "Criar cadastro" : "Entrar"}</button></p>
        {mode === "login" && <p className="mt-3 text-center text-xs text-[#9a958b]">Demo: gestora@fernandafortes.com / 123456</p>}
      </div></section>
    </main>
  );
}
