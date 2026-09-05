"use client";

import Link from "next/link";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { VideoAnalysis } from "@/lib/ai/video-analysis-types";

const usageKey = "creatorkit-demo-usage";
const historyKey = "creatorkit-demo-history";
const savedKey = "creatorkit-demo-saved";
const planKey = "creatorkit-demo-plan";
const dailyLimit = 3;

type StoredUsage = { date: string; count: number };
export type AnalysisRecord = { id: string; filename: string; date: string; analysis: VideoAnalysis };
type UsageContextValue = {
  isPro: boolean;
  analysesUsed: number;
  canAnalyze: boolean;
  history: AnalysisRecord[];
  saved: AnalysisRecord[];
  setPlan: (pro: boolean) => void;
  recordAnalysis: (filename: string, analysis: VideoAnalysis) => AnalysisRecord;
  saveAnalysis: (record: AnalysisRecord) => void;
  removeSaved: (id: string) => void;
  deleteHistory: (id: string) => void;
  isSaved: (id: string) => boolean;
};

const UsageContext = createContext<UsageContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}

export function UsageProvider({ children }: { children: ReactNode }) {
  const today = new Date().toISOString().slice(0, 10);
  const [isPro, setIsPro] = useState(false);
  const [analysesUsed, setAnalysesUsed] = useState(0);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [saved, setSaved] = useState<AnalysisRecord[]>([]);

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      const usage = readStorage<StoredUsage>(usageKey, { date: today, count: 0 });
      const currentUsage = usage.date === today ? usage : { date: today, count: 0 };
      setAnalysesUsed(currentUsage.count);
      window.localStorage.setItem(usageKey, JSON.stringify(currentUsage));
      setHistory(readStorage<AnalysisRecord[]>(historyKey, []));
      setSaved(readStorage<AnalysisRecord[]>(savedKey, []));
      setIsPro(readStorage<boolean>(planKey, false));
    }, 0);
    return () => window.clearTimeout(hydrate);
  }, [today]);

  const value = useMemo<UsageContextValue>(() => ({
    isPro,
    analysesUsed,
    canAnalyze: isPro || analysesUsed < dailyLimit,
    history,
    saved,
    // Demo-only switch. Production access must be verified server-side from authenticated subscription data.
    setPlan: (pro) => { setIsPro(pro); window.localStorage.setItem(planKey, JSON.stringify(pro)); },
    recordAnalysis: (filename, analysis) => {
      const record = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, filename, date: new Date().toISOString(), analysis };
      setHistory((current) => { const next = [record, ...current]; window.localStorage.setItem(historyKey, JSON.stringify(next)); return next; });
      if (!isPro) setAnalysesUsed((current) => { const nextCount = current + 1; window.localStorage.setItem(usageKey, JSON.stringify({ date: today, count: nextCount })); return nextCount; });
      return record;
    },
    saveAnalysis: (record) => setSaved((current) => { if (current.some((item) => item.id === record.id)) return current; const next = [record, ...current]; window.localStorage.setItem(savedKey, JSON.stringify(next)); return next; }),
    removeSaved: (id) => setSaved((current) => { const next = current.filter((item) => item.id !== id); window.localStorage.setItem(savedKey, JSON.stringify(next)); return next; }),
    deleteHistory: (id) => setHistory((current) => { const next = current.filter((item) => item.id !== id); window.localStorage.setItem(historyKey, JSON.stringify(next)); return next; }),
    isSaved: (id) => saved.some((item) => item.id === id),
  }), [analysesUsed, history, saved, isPro, today]);

  return <UsageContext.Provider value={value}>{children}</UsageContext.Provider>;
}

export function useUsageDemo() {
  const context = useContext(UsageContext);
  if (!context) throw new Error("useUsageDemo must be used inside UsageProvider");
  return context;
}

export function PlanSwitcher() {
  const { isPro, setPlan } = useUsageDemo();
  return <div className="plan-switcher" aria-label="Demo subscription switcher"><span>Demo plan</span><button type="button" className={!isPro ? "active" : ""} onClick={() => setPlan(false)}>FREE</button><button type="button" className={isPro ? "active pro" : ""} onClick={() => setPlan(true)}>PRO</button></div>;
}

export function UsageIndicator() {
  const { isPro, analysesUsed } = useUsageDemo();
  return <div className="usage-indicator"><span className={isPro ? "pro-badge" : "usage-dot"}>{isPro ? "PRO" : "✦"}</span><span>{isPro ? "Unlimited analyses" : `${analysesUsed} of ${dailyLimit} analyses used today`}</span></div>;
}

export function UpgradeCard() {
  const { isPro, setPlan } = useUsageDemo();
  if (isPro) return null;
  return <div className="upgrade-card"><div><span className="section-kicker">CREATOR PRO</span><h3>Unlock Creator Pro</h3><p>Unlimited AI video analysis and advanced creator insights.</p></div><button type="button" onClick={() => setPlan(true)}>Upgrade to Pro — ₹99/month <span>↗</span></button></div>;
}

export function LibraryView({ mode }: { mode: "history" | "saved" }) {
  const { history, saved, deleteHistory, removeSaved } = useUsageDemo();
  const records = mode === "history" ? history : saved;
  return <main className="library-page section-shell"><div className="library-heading"><span className="eyebrow"><span>✦</span> Creator workspace</span><h1>{mode === "history" ? "Analysis history." : "Saved results."}</h1><p>{mode === "history" ? "Every video you have analyzed, kept in one place." : "Your best AI-generated content kits, ready when you are."}</p></div>{records.length === 0 ? <div className="library-empty analyzer-panel"><span>✧</span><h2>No {mode === "history" ? "analyses" : "saved results"} yet.</h2><p>Analyze a Reel to start building your creator library.</p><Link href="/tools/reel-analyzer" className="primary-button">Open analyzer <span>↗</span></Link></div> : <div className="library-list">{records.map((record) => <article className="library-item analyzer-panel" key={record.id}><div className="library-item-copy"><span className="file-type">{mode === "saved" ? "SAVED RESULT" : "ANALYSIS"}</span><h2>{record.filename}</h2><time dateTime={record.date}>{new Date(record.date).toLocaleDateString()}</time><p>{record.analysis.summary}</p></div><div className="library-item-actions"><Link href="/tools/reel-analyzer" className="analyzer-copy">Open <span>↗</span></Link><button type="button" className="analyzer-copy" onClick={() => mode === "history" ? deleteHistory(record.id) : removeSaved(record.id)}>Delete <span>×</span></button></div></article>)}</div>}</main>;
}
