"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  FileCheck2,
  CalendarDays,
  CheckSquare,
  Settings,
  Menu,
  X,
  ArrowLeft,
  Trophy,
  Home,
  PenTool,
  Users,
  LogOut
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Home",              href: "/home",      icon: Home         },
  { label: "Diário de Estudos", href: "/diario",    icon: BookOpen      },
  { label: "Simulados",         href: "/simulados", icon: FileCheck2  },
  { label: "Redação",           href: "/redacao",   icon: PenTool     },
  { label: "KevQuest",          href: "/kevquest",  icon: Target      },
  { label: "Calendário",        href: "/calendario",icon: CalendarDays },
  { label: "Tarefas",           href: "/tarefas",   icon: CheckSquare },
  { label: "Liga",              href: "/liga",      icon: Trophy      },
];

const ADMIN_NAV_ITEMS = [
  { label: "Home",              href: "/admin",            icon: LayoutDashboard },
  { label: "Gestão",            href: "/admin/alunos",     icon: Users },
  { label: "Calendário Global", href: "/admin/calendario", icon: CalendarDays },
  { label: "Redação",           href: "/admin/redacao",    icon: PenTool },
];

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role === 'admin') setIsAdmin(true);
    };
    fetchRole();
  }, []);

  const displayedItems = isAdmin ? ADMIN_NAV_ITEMS : NAV_ITEMS;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Logo e Toggle */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-8`}>
        {!isCollapsed && (
          <Link href={isAdmin ? "/admin" : "/home"} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/design/logo-sem-fundo.png"
                alt="Método Autônomo"
                fill
                className="object-contain drop-shadow-md"
              />
            </div>
            <div className="leading-none">
              <p className="text-[#1E2B45] dark:text-white font-black text-base tracking-wide leading-tight">
                {isAdmin ? "Painel" : "Método"}
              </p>
              <p className="text-[#E07A3A] font-black text-base tracking-wide leading-tight">
                {isAdmin ? "Admin" : "Autônomo"}
              </p>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <Link href={isAdmin ? "/admin" : "/home"} className="relative w-9 h-9 flex-shrink-0">
            <Image
              src="/design/logo-sem-fundo.png"
              alt="Método Autônomo"
              fill
              className="object-contain"
            />
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-[#2C2C2E] rounded-xl transition-colors cursor-pointer hidden md:block"
        >
          <Menu className="w-5 h-5 text-slate-400 dark:text-[#A1A1AA]" />
        </button>
      </div>

      {/* Divisor com label de seção */}
      {!isCollapsed && (
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-300 dark:text-[#3A3A3C] px-3 mb-3">
          Navegação
        </p>
      )}

      {/* Nav Links */}
      <nav className="flex-1 space-y-1">
        {displayedItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-3 rounded-2xl transition-all duration-200 group ${
                isActive
                  ? "bg-[#1E2B45] text-white shadow-lg shadow-[#1E2B45]/20"
                  : "text-slate-500 dark:text-[#A1A1AA] hover:bg-[#E07A3A]/8 dark:hover:bg-[#2C2C2E] hover:text-[#1E2B45] dark:hover:text-white"
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? "text-[#E07A3A]" : "text-slate-400 dark:text-[#71717A]"
                }`}
              />
              {!isCollapsed && (
                <span className="text-sm font-bold">{item.label}</span>
              )}
              {/* Pílula ativa */}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E07A3A]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Area */}
      <div className="mt-auto pt-5 border-t border-slate-100 dark:border-[#2C2C2E] space-y-1">
        {!isCollapsed && (
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-300 dark:text-[#3A3A3C] px-3 mb-2">
            Conta
          </p>
        )}
        {!isAdmin && (
          <Link
            href="/hub"
            title={isCollapsed ? "Voltar ao Hub" : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-3 rounded-2xl transition-all duration-200 group text-slate-400 dark:text-[#A1A1AA] hover:bg-slate-50 dark:hover:bg-[#2C2C2E] hover:text-[#1E2B45] dark:hover:text-white`}
          >
            <ArrowLeft className="w-5 h-5 flex-shrink-0 transition-transform group-hover:-translate-x-1" />
            {!isCollapsed && <span className="text-sm font-bold">Voltar ao Hub</span>}
          </Link>
        )}
        <Link
          href={isAdmin ? "/admin/configuracoes" : "/configuracoes"}
          title={isCollapsed ? "Configurações" : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-3 rounded-2xl transition-all duration-200 group ${
            (pathname === "/configuracoes" || pathname === "/admin/configuracoes")
              ? "bg-[#1E2B45] text-white shadow-lg shadow-[#1E2B45]/20"
              : "text-slate-400 dark:text-[#A1A1AA] hover:bg-slate-50 dark:hover:bg-[#2C2C2E] hover:text-[#1E2B45] dark:hover:text-white"
          }`}
        >
          <Settings
            className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
              (pathname === "/configuracoes" || pathname === "/admin/configuracoes")
                ? "text-[#E07A3A]"
                : "text-slate-400 dark:text-[#71717A]"
            }`}
          />
          {!isCollapsed && <span className="text-sm font-bold">Configurações</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Sair da Conta" : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-3 rounded-2xl transition-all duration-200 group text-slate-400 dark:text-[#A1A1AA] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
          {!isCollapsed && <span className="text-sm font-bold">Sair da Conta</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#121212] transition-colors duration-300 font-sans">
      
      {/* Top Bar Fixa (Somente Mobile) */}
      <div className="md:hidden fixed top-0 w-full h-16 bg-white dark:bg-[#1C1C1E] border-b border-slate-100 dark:border-[#2C2C2E] flex items-center px-4 z-40 shadow-sm gap-3 transition-colors duration-300">
        <button 
          onClick={() => setIsMobileOpen(true)} 
          className="p-2 -ml-2 text-slate-500 dark:text-[#A1A1AA] hover:bg-slate-100 dark:hover:bg-[#2C2C2E] rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link href={isAdmin ? "/admin" : "/home"} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image src="/design/logo-sem-fundo.png" alt="Método Autônomo" fill className="object-contain" />
          </div>
          <div className="leading-none">
            <p className="text-[#1E2B45] dark:text-white font-black text-sm tracking-wide leading-tight">Método</p>
            <p className="text-[#E07A3A] font-black text-sm tracking-wide leading-tight">Autônomo</p>
          </div>
        </Link>
      </div>

      {/* Fundo escuro do mobile drawer */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 dark:bg-black/60 z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Mobile */}
      <aside 
        className={`md:hidden fixed top-0 bottom-0 left-0 w-72 bg-white dark:bg-[#1C1C1E] border-r border-slate-100 dark:border-[#2C2C2E] z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } p-6 flex flex-col shadow-2xl`}
      >
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-6 right-6 p-2 text-slate-400 dark:text-[#71717A] hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-[#2C2C2E] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex flex-col ${isCollapsed ? 'w-20 p-4' : 'w-64 p-6'} bg-white dark:bg-[#1C1C1E] border-r border-slate-100 dark:border-[#2C2C2E] fixed h-full z-10 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
        <SidebarContent />
      </aside>

      {/* Área Principal */}
      <main className={`flex-1 w-full pt-20 md:pt-6 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} px-4 pb-4 md:px-10 md:pb-10 transition-all duration-300 min-h-screen relative overflow-x-hidden text-slate-800 dark:text-[#F4F4F5]`}>
        {children}
      </main>
    </div>
  );
}
