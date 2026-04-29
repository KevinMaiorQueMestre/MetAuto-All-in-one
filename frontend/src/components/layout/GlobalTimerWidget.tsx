"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Play, Pause, X, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "metauto_timer_simulados";
const UI_KEY      = "metauto_timer_ui";

interface TimerStorage { endTimestamp: number; wasRunning: boolean }
interface UiStorage   { isFocusMode: boolean; isMinimized: boolean }

function readLS<T>(key: string): T | null {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

function fmt(s: number) {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

const MIN15 = 15 * 60;
const MIN5  =  5 * 60;

export default function GlobalTimerWidget() {
  const pathname = usePathname();
  const router   = useRouter();

  const [timeLeft,     setTimeLeft]     = useState(0);
  const [isRunning,    setIsRunning]    = useState(false);
  const [isMinimized,  setIsMinimized]  = useState(false);

  // Flags de alerta disparados uma única vez por sessão de countdown
  const alerted15Ref   = useRef(false);
  const alerted5Ref    = useRef(false);
  // Flag de "usuário fechou este alerta de urgência"
  const dismissed15Ref = useRef(false);
  const dismissed5Ref  = useRef(false);

  const endTimestampRef = useRef<number | null>(null);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Urgência ─────────────────────────────────────────────────────────────
  const isUrgent5  = isRunning && timeLeft > 0 && timeLeft <= MIN5;
  const isUrgent15 = isRunning && timeLeft > 0 && timeLeft <= MIN15;

  /**
   * Widget visível quando:
   *   1. Timer minimizado (usuário clicou em minimizar no overlay)
   *   2. ≤ 15 min restantes E alerta não foi dispensado pelo usuário
   *   3. ≤ 5 min restantes E alerta não foi dispensado pelo usuário
   *
   * Oculto na página /simulados (que já tem sua própria UI do timer).
   */
  const shouldShow =
    isRunning &&
    timeLeft > 0 &&
    (
      isMinimized ||
      (isUrgent15 && !dismissed15Ref.current) ||
      (isUrgent5  && !dismissed5Ref.current)
    );

  // ── Sync com localStorage ─────────────────────────────────────────────────
  const syncFromStorage = useCallback(() => {
    const timer = readLS<TimerStorage>(STORAGE_KEY);
    const ui    = readLS<UiStorage>(UI_KEY);

    if (!timer?.endTimestamp) {
      setTimeLeft(0);
      setIsRunning(false);
      return;
    }

    const remaining = Math.ceil((timer.endTimestamp - Date.now()) / 1000);
    if (remaining <= 0) { setTimeLeft(0); setIsRunning(false); return; }

    endTimestampRef.current = timer.endTimestamp;
    setTimeLeft(remaining);
    setIsRunning(timer.wasRunning ?? false);
    setIsMinimized(ui?.isFocusMode === true && ui?.isMinimized === true);
  }, []);

  // ── Tick ─────────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (!endTimestampRef.current) return;
    const remaining = Math.ceil((endTimestampRef.current - Date.now()) / 1000);

    if (remaining <= 0) {
      setTimeLeft(0);
      setIsRunning(false);
      return;
    }

    setTimeLeft(remaining);

    // Toast de aviso aos 15 min
    if (remaining <= MIN15 && !alerted15Ref.current) {
      alerted15Ref.current  = true;
      dismissed15Ref.current = false; // reabre o widget de urgência
      toast.warning("⏰ Últimos 15 minutos de simulado!", {
        duration: 7000,
        description: "Administre bem o tempo restante.",
      });
    }

    // Toast de urgência aos 5 min
    if (remaining <= MIN5 && !alerted5Ref.current) {
      alerted5Ref.current  = true;
      dismissed5Ref.current = false;
      toast.error("🚨 Apenas 5 minutos restantes!", {
        duration: 10000,
        description: "Finalize as questões pendentes!",
      });
    }
  }, []);

  // Reinicia flags quando timer recomeça do zero (timeLeft > 15min novamente)
  useEffect(() => {
    if (timeLeft > MIN15) {
      alerted15Ref.current   = false;
      alerted5Ref.current    = false;
      dismissed15Ref.current = false;
      dismissed5Ref.current  = false;
    } else if (timeLeft > MIN5) {
      alerted5Ref.current    = false;
      dismissed5Ref.current  = false;
    }
  }, [timeLeft]);

  // ── Interval — roda sempre que isRunning (para disparar toasts em qq página)
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, tick]);

  // Sync na montagem e ao trocar de rota
  useEffect(() => { syncFromStorage(); }, [pathname, syncFromStorage]);

  // Sync quando volta ao foco ou outra aba altera o storage
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") { syncFromStorage(); tick(); }
    };
    const onStorage = () => syncFromStorage();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, [syncFromStorage, tick]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePlayPause = () => {
    const newRunning = !isRunning;
    setIsRunning(newRunning);
    try {
      const end = newRunning
        ? (endTimestampRef.current ?? Date.now() + timeLeft * 1000)
        : Date.now() + timeLeft * 1000;
      endTimestampRef.current = end;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ endTimestamp: end, wasRunning: newRunning }));
    } catch { /* noop */ }
  };

  const handleClose = () => {
    // Dispensa o alerta de urgência correspondente
    if (isUrgent5)        { dismissed5Ref.current  = true; }
    else if (isUrgent15)  { dismissed15Ref.current = true; }

    // Se estava minimizado, desminimiza
    if (isMinimized) {
      setIsMinimized(false);
      try {
        const ui = readLS<UiStorage>(UI_KEY) ?? { isFocusMode: false, isMinimized: false };
        localStorage.setItem(UI_KEY, JSON.stringify({ ...ui, isFocusMode: false, isMinimized: false }));
      } catch { /* noop */ }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const isOnSimulados = pathname === "/simulados";
  if (!shouldShow || isOnSimulados) return null;

  const containerCls = isUrgent5
    ? "bg-rose-950/95 border-rose-500/50 shadow-rose-500/30 shadow-lg"
    : isUrgent15
    ? "bg-amber-950/95 border-amber-500/40 shadow-amber-500/20 shadow-lg"
    : "bg-slate-900/95 border-white/10";

  const timeCls = isUrgent5
    ? "text-rose-300 animate-pulse"
    : isUrgent15
    ? "text-amber-200"
    : "text-white";

  const iconCls = isUrgent5
    ? "text-rose-400"
    : isUrgent15
    ? "text-amber-400"
    : "text-indigo-400";

  const ppBtnCls = isUrgent5
    ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
    : isUrgent15
    ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
    : isRunning
    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
    : "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30";

  return (
    <div
      className={`fixed bottom-20 md:bottom-6 right-4 z-[999] flex items-center gap-2.5 border rounded-2xl px-4 py-3 cursor-default select-none transition-all duration-500 ${containerCls}`}
      style={{ backdropFilter: "blur(20px)" }}
    >
      {/* Ícone — alerta ou relógio */}
      <button
        onClick={() => router.push("/simulados")}
        className={`transition-colors hover:opacity-70 ${iconCls}`}
        title="Ir para Simulados"
      >
        {isUrgent5 || isUrgent15
          ? <AlertTriangle className={`w-4 h-4 ${isUrgent5 ? "animate-bounce" : ""}`} />
          : <Clock className="w-4 h-4" />
        }
      </button>

      {/* Tempo restante */}
      <span
        onClick={() => router.push("/simulados")}
        className={`font-mono font-black text-sm tabular-nums tracking-tighter cursor-pointer hover:opacity-80 transition-opacity ${timeCls}`}
      >
        {fmt(timeLeft)}
      </span>

      {/* Label de urgência */}
      {isUrgent5 && (
        <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 animate-pulse">
          URGENTE
        </span>
      )}
      {!isUrgent5 && isUrgent15 && (
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
          15 MIN
        </span>
      )}

      {/* Play / Pause */}
      <button
        onClick={handlePlayPause}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${ppBtnCls}`}
      >
        {isRunning
          ? <Pause className="w-3.5 h-3.5 fill-current" />
          : <Play  className="w-3.5 h-3.5 fill-current ml-px" />
        }
      </button>

      {/* Fechar / Dispensar */}
      <button
        onClick={handleClose}
        className="text-slate-500 hover:text-slate-300 transition-colors"
        title={isUrgent5 || isUrgent15 ? "Dispensar alerta" : "Fechar"}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
