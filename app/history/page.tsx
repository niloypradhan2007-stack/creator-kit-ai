import { LibraryView, UsageProvider } from "@/components/usage-demo";
import { SiteNavbar } from "@/components/creator-kit";

export default function HistoryPage() {
  return <UsageProvider><div className="site-shell"><SiteNavbar /><LibraryView mode="history" /></div></UsageProvider>;
}
