"use client";

import { useState } from "react";
import Link from "next/link";
import ReelAnalyzer from "@/components/reel-analyzer";
import { PlanSwitcher, UsageProvider, useUsageDemo } from "@/components/usage-demo";

export function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);
  return <header className="navbar"><Link href="/" className="logo" aria-label="CreatorKit AI home"><span className="logo-mark">✦</span> CreatorKit <em>AI</em></Link><button className="menu-button" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle navigation">{open ? "×" : "☰"}</button><nav className={open ? "nav-links open" : "nav-links"}><a href="#home" onClick={closeMenu}>Home</a><Link href="/tools/reel-analyzer" onClick={closeMenu}>Analyzer</Link><Link href="/history" onClick={closeMenu}>History</Link><Link href="/saved" onClick={closeMenu}>Saved</Link><a href="#pricing" onClick={closeMenu}>Pricing</a></nav><div className="nav-actions"><PlanSwitcher /><a href="#reel-analyzer" className="nav-cta">Analyze a video <span>↗</span></a></div></header>;
}

function Hero() {
  return <section className="focused-hero section-shell" id="home"><div className="focused-hero-copy"><span className="eyebrow"><span>✦</span> AI-powered short-form studio</span><h1>Turn your Reels into<br /><span>better content.</span></h1><p>Upload a Reel or Short and let AI analyze it to create captions, hooks, titles, hashtags and descriptions.</p><div className="hero-actions"><a href="#reel-analyzer" className="primary-button">Analyze my video <span>↗</span></a><a href="#reel-analyzer" className="secondary-button">Try demo <span>↓</span></a></div><div className="hero-proof"><span className="proof-dot" /> Built for creators who want to publish with purpose</div></div><div className="hero-signal" aria-hidden="true"><div className="signal-glow" /><div className="signal-card"><div className="signal-top"><span>AI CONTENT SIGNAL</span><span>LIVE</span></div><div className="signal-wave"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="signal-bottom"><strong>One video</strong><span>→</span><strong>Eight assets</strong></div></div><div className="signal-tag tag-top">✦ Hook potential <strong>90</strong></div><div className="signal-tag tag-bottom">↗ Ready to publish</div></div></section>;
}

function Pricing() {
  const { setPlan } = useUsageDemo();
  return <section className="focused-pricing section-shell" id="pricing"><div className="focused-section-heading"><span className="section-kicker">SIMPLE, FAIR PRICING</span><h2>Choose your creative pace.</h2><p>Start with the essentials, then unlock more room to create when you are ready.</p></div><div className="focused-pricing-grid"><article className="focused-price-card"><span className="plan-label">FREE</span><h3>For getting started</h3><div className="focused-price">₹0 <small>/ month</small></div><a href="#reel-analyzer" className="focused-price-button muted">Start Free <span>↗</span></a><ul><li>3 AI video analyses per day</li><li>AI captions</li><li>AI hooks</li><li>Shorts titles</li><li>Hashtags</li><li>Description</li><li>Content score</li></ul></article><article className="focused-price-card pro"><span className="popular-badge">MOST POPULAR</span><span className="plan-label">CREATOR PRO</span><h3>For your next level</h3><div className="focused-price">₹99 <small>/ month</small></div><button type="button" className="focused-price-button" onClick={() => setPlan(true)}>Upgrade to Pro <span>↗</span></button><ul><li><span className="feature-pro-badge">PRO</span>Unlimited AI video analyses</li><li><span className="feature-pro-badge">PRO</span>Advanced caption suggestions</li><li><span className="feature-pro-badge">PRO</span>Advanced hooks</li><li><span className="feature-pro-badge">PRO</span>More title variations</li><li><span className="feature-pro-badge">PRO</span>Hashtag suggestions</li><li><span className="feature-pro-badge">PRO</span>Content improvement insights</li><li><span className="feature-pro-badge">PRO</span>Analysis history</li><li><span className="feature-pro-badge">PRO</span>Saved results</li><li><span className="feature-pro-badge">PRO</span>No ads</li></ul></article></div><p className="pricing-note">Pro features and pricing may change before launch.</p></section>;
}

function Footer() {
  return <footer className="footer section-shell"><div><Link href="/" className="logo"><span className="logo-mark">✦</span> CreatorKit <em>AI</em></Link><p>Turn your Reels into better content.</p></div><div className="footer-links"><a href="#home">Home</a><Link href="/tools/reel-analyzer">Analyzer</Link><Link href="/history">History</Link><Link href="/saved">Saved</Link><a href="#pricing">Pricing</a><a href="#">Privacy policy</a><a href="#">Terms</a></div><span className="copyright">© 2025 CreatorKit AI</span></footer>;
}

export default function CreatorKit({ toolsOnly = false }: { toolsOnly?: boolean }) {
  return <UsageProvider><div className="site-shell"><SiteNavbar />{toolsOnly ? <main><div className="tools-page-hero focused-tools-hero section-shell"><span className="eyebrow"><span>✦</span> CREATOR CONTENT STUDIO</span><h1>One video.<br /><span>More to publish.</span></h1><p>Analyze your Reel or Short and turn the real moments inside it into a complete content kit.</p></div><ReelAnalyzer /></main> : <main><Hero /><ReelAnalyzer /><Pricing /></main>}<Footer /></div></UsageProvider>;
}
