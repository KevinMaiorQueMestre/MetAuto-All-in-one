"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Lock, Mail, ArrowRight, Stethoscope } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Erro no login", { description: error.message });
        setIsLoading(false);
        return;
      }

      // Segurança: Previne que administradores entrem pela interface comum de alunos
      if (data?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        if (profile?.role === 'admin') {
          await supabase.auth.signOut();
          toast.error("Acesso Inválido", { description: "Temos um painel próprio para você! Acesse /admin-login", duration: 5000 });
          setIsLoading(false);
          return;
        }
      }

      toast.success("Login realizado com sucesso!");
      window.location.href = "/hub"; 

    } catch (err: any) {
      toast.error("Erro inesperado", { description: err.message });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex transition-colors duration-300">
      
      {/* ---- LADO ESQUERDO — Hero com fundo hexagonal ---- */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] relative overflow-hidden">
        {/* Fundo hexagonal */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/design/fundo-hexagonal-tecnológico.jpeg')" }}
        />
        {/* Overlay marinho para harmonizar */}
        <div className="absolute inset-0 bg-[#1E2B45]/80" />

        {/* Conteúdo hero */}
        <div className="relative z-10 flex flex-col justify-between h-full p-14">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Image
              src="/design/logo-sem-fundo.png"
              alt="Método Autônomo"
              width={60}
              height={60}
              className="drop-shadow-2xl"
            />
            <div>
              <p className="text-white font-black text-xl tracking-wide leading-none">Método</p>
              <p className="text-[#E07A3A] font-black text-xl tracking-wide leading-none">Autônomo</p>
            </div>
          </div>

          {/* Headline central */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#E07A3A]/20 border border-[#E07A3A]/30 rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-[#E07A3A] animate-pulse" />
              <span className="text-[#E07A3A] text-xs font-black uppercase tracking-widest">Plataforma de Estudos</span>
            </div>
            <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
              Sua jornada<br />
              <span className="text-[#E07A3A]">para a aprovação</span><br />
              começa aqui.
            </h2>
            <p className="text-white/60 text-lg font-medium max-w-sm leading-relaxed">
              Método estruturado, métricas precisas e evolução consistente — tudo em um só lugar.
            </p>
          </div>

          {/* Rodapé hero */}
          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
              {["#E07A3A", "#1E2B45", "#60A5FA"].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20" style={{ backgroundColor: c }} />
              ))}
            </div>
            <p className="text-white/50 text-sm font-medium">Junte-se a alunos que já estão decolando 🚀</p>
          </div>
        </div>
      </div>

      {/* ---- LADO DIREITO — Formulário ---- */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0D1117] relative">

        {/* Top bar */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <ThemeSwitcher />
        </div>

        {/* Botão discreto de acesso admin */}
        <Link
          href="/admin-login"
          title="Acesso Administrativo"
          className="absolute bottom-6 left-6 group w-9 h-9 bg-slate-50 dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-xl flex items-center justify-center shadow-sm hover:border-[#E07A3A]/50 dark:hover:border-[#E07A3A]/40 transition-all active:scale-95"
        >
          <Stethoscope className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#E07A3A] transition-colors" />
        </Link>

        {/* Formulário centralizado */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-sm">

            {/* Logo (mobile only) + Saudação */}
            <div className="flex flex-col items-center mb-10">
              <div className="lg:hidden mb-6">
                <Image
                  src="/design/logo-sem-fundo.png"
                  alt="Método Autônomo"
                  width={72}
                  height={72}
                />
              </div>
              <h1 className="text-3xl font-black text-[#1E2B45] dark:text-white tracking-tight text-center">
                Bem-vindo de volta 👋
              </h1>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 text-center">
                Portal do Aluno · Método Autônomo
              </p>
            </div>

            {/* Card do formulário */}
            <form onSubmit={handleLogin} className="space-y-5">
              
              {/* E-mail */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#161B22] border-2 border-slate-100 dark:border-[#21262D] rounded-2xl text-sm font-medium focus:ring-0 focus:border-[#E07A3A] dark:focus:border-[#E07A3A] transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Senha
                  </label>
                  <a href="#" className="text-xs font-bold text-[#E07A3A] hover:text-[#c96a2a] transition-colors">
                    Esqueci a senha
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#161B22] border-2 border-slate-100 dark:border-[#21262D] rounded-2xl text-sm font-medium focus:ring-0 focus:border-[#E07A3A] dark:focus:border-[#E07A3A] transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Botão de entrar */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-[#1E2B45] hover:bg-[#162035] disabled:opacity-60 text-white font-black py-4 px-4 rounded-2xl shadow-xl shadow-[#1E2B45]/20 transition-all active:scale-[0.98] mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    Entrar na Plataforma
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 dark:text-slate-600 pt-1">
                Problemas com acesso?{" "}
                <a href="#" className="font-bold text-[#E07A3A] hover:underline">
                  Fale com o suporte
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
