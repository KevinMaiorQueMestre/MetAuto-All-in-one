"use client";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-[#FFFFFF] dark:text-[#FFFFFF] tracking-tight transition-colors">Configurações</h1>
        <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 transition-colors">Personalize a experiência do seu dashboard e do seu ambiente de estudo.</p>
      </header>

      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] transition-colors duration-300">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#2C2C2E] pb-6 transition-colors">
            <div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-[#FFFFFF] dark:text-[#FFFFFF] transition-colors">Aparência do Sistema</h3>
              <p className="text-slate-500 dark:text-[#A1A1AA] text-sm mt-1 transition-colors">Escolha entre os modos claro, escuro ou siga as configurações do sistema.</p>
            </div>
            <div className="flex items-center shrink-0">
              <ThemeSwitcher />
            </div>
          </div>
          
          <div className="pt-2">
            <p className="text-slate-500 dark:text-[#A1A1AA] italic text-sm transition-colors">
              Novas opções de configuração de conta, notificações e segurança estarão disponíveis em atualizações futuras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
