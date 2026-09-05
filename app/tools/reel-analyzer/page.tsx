import ReelAnalyzer from "@/components/reel-analyzer";
import Link from "next/link";
import { UsageProvider } from "@/components/usage-demo";

export default function ReelAnalyzerPage() {
  return <UsageProvider><div className="site-shell"><header className="analyzer-route-header section-shell"><Link href="/" className="logo" aria-label="CreatorKit AI home"><span className="logo-mark">✦</span> CreatorKit <em>AI</em></Link><div className="analyzer-route-links"><Link href="/history" className="back-link">History</Link><Link href="/saved" className="back-link">Saved</Link><Link href="/tools" className="back-link">← All tools</Link></div></header><main><ReelAnalyzer /></main></div></UsageProvider>;
}