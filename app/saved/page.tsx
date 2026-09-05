import { LibraryView, UsageProvider } from "@/components/usage-demo";
import { SiteNavbar } from "@/components/creator-kit";

export default function SavedPage() {
  return <UsageProvider><div className="site-shell"><SiteNavbar /><LibraryView mode="saved" /></div></UsageProvider>;
}
