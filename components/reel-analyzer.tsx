"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import type { VideoAnalysis } from "@/lib/ai/video-analysis-types";
import { UpgradeCard, UsageIndicator, useUsageDemo } from "@/components/usage-demo";
import type { AnalysisRecord } from "@/components/usage-demo";

const acceptedTypes = ["video/mp4", "video/quicktime", "video/webm"];
const acceptedExtensions = ["mp4", "mov", "webm"];
const maxFileSize = 100 * 1024 * 1024;
const analysisStages = ["Uploading video...", "Understanding your content...", "Finding the best hook...", "Generating captions...", "Creating hashtags..."];

type AnalysisData = VideoAnalysis & { score: VideoAnalysis["score"] & { total: number } };

function withTotalScore(analysis: VideoAnalysis): AnalysisData {
  return { ...analysis, score: { ...analysis.score, total: analysis.score.overall } };
}

function isVideoAnalysis(value: unknown): value is VideoAnalysis {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<VideoAnalysis>;
  return typeof candidate.summary === "string" && typeof candidate.tone === "string" && Array.isArray(candidate.captions) && Array.isArray(candidate.hooks) && Array.isArray(candidate.titles) && Array.isArray(candidate.hashtags) && typeof candidate.description === "string" && Array.isArray(candidate.suggestions) && Boolean(candidate.score) && typeof candidate.score?.overall === "number";
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ResultAction({ label = "Copy", onClick }: { label?: string; onClick: () => void }) {
  return <button type="button" className="analyzer-copy" onClick={onClick}>{label} <span>⧉</span></button>;
}

function ResultCard({ index, children, onCopy, onRegenerate }: { index: number; children: string; onCopy: () => void; onRegenerate?: () => void }) {
  return <div className="analyzer-result-row"><span className="result-number">{String(index + 1).padStart(2, "0")}</span><p>{children}</p><div className="result-actions"><ResultAction onClick={onCopy} />{onRegenerate && <button type="button" className="analyzer-copy" onClick={onRegenerate}>Regenerate <span>↻</span></button>}</div></div>;
}

function ContentScore({ score, suggestions }: { score: AnalysisData["score"]; suggestions: string[] }) {
  return <section className="content-score analyzer-panel"><div className="score-header"><div><span className="section-kicker">CONTENT SCORE</span><h3>Strong foundation.</h3></div><div className="score-ring" style={{ "--score": `${score.total * 3.6}deg` } as React.CSSProperties}><strong>{score.total}</strong><small>/100</small></div></div><div className="score-metrics">{[["Hook", score.hook], ["Engagement", score.engagement], ["Clarity", score.clarity], ["Shareability", score.shareability]].map(([label, value]) => <div className="score-metric" key={label as string}><div><span>{label}</span><strong>{value}</strong></div><div className="score-bar"><i style={{ width: `${value}%` }} /></div></div>)}</div><div className="suggestions"><span className="suggestion-label">NEXT BEST MOVES</span>{suggestions.map((suggestion) => <p key={suggestion}><span>↗</span>{suggestion}</p>)}</div><small className="score-note">AI estimate based on this video&apos;s content. It does not guarantee virality.</small></section>;
}

function AnalysisResults({ analysis, onCopy, onRegenerateCaptions, onSave, isSaved }: { analysis: AnalysisData; onCopy: (text: string) => void; onRegenerateCaptions: () => void; onSave: () => void; isSaved: boolean }) {
  return <div className="analysis-results"><div className="analysis-results-heading"><div><span className="section-kicker">GEMINI ANALYSIS</span><h2>Ready to publish.</h2></div><button type="button" className="save-analysis-button" onClick={onSave}>{isSaved ? "Saved ✓" : "Save analysis"} <span>⌑</span></button></div><div className="analysis-layout"><div className="analysis-main"><section className="analyzer-panel summary-panel"><span className="panel-label">CONTENT SUMMARY</span><p>{analysis.summary}</p><p className="analysis-tone"><strong>Detected tone:</strong> {analysis.tone}</p></section><section className="analyzer-panel result-panel"><div className="panel-title"><div><span className="panel-label">VIRAL CAPTIONS</span><p>Five ways to frame the moment.</p></div></div>{analysis.captions.map((caption, index) => <ResultCard key={`${caption}-${index}`} index={index} onCopy={() => onCopy(caption)} onRegenerate={onRegenerateCaptions}>{caption}</ResultCard>)}</section><section className="analyzer-panel result-panel"><div className="panel-title"><div><span className="panel-label">VIRAL HOOKS</span><p>Open with a reason to keep watching.</p></div></div>{analysis.hooks.map((hook, index) => <ResultCard key={`${hook}-${index}`} index={index} onCopy={() => onCopy(hook)}>{hook}</ResultCard>)}</section><section className="analyzer-panel result-panel"><div className="panel-title"><div><span className="panel-label">SHORTS TITLES</span><p>Clear, curious, and made to earn the click.</p></div></div>{analysis.titles.map((title, index) => <ResultCard key={`${title}-${index}`} index={index} onCopy={() => onCopy(title)}>{title}</ResultCard>)}</section><section className="analyzer-panel result-panel"><div className="panel-title"><div><span className="panel-label">HASHTAGS</span><p>Relevant starting points for distribution.</p></div><ResultAction label="Copy All" onClick={() => onCopy(analysis.hashtags.join(" "))} /></div><div className="hashtag-list">{analysis.hashtags.map((hashtag) => <span key={hashtag}>{hashtag}</span>)}</div></section><section className="analyzer-panel description-panel"><div className="panel-title"><span className="panel-label">DESCRIPTION</span><ResultAction onClick={() => onCopy(analysis.description)} /></div><p>{analysis.description}</p></section></div><ContentScore score={analysis.score} suggestions={analysis.suggestions} /></div></div>;
}

function AnalysisLoader({ stage }: { stage: number }) {
  return <div className="analysis-loader"><div className="loader-orbit"><span>✦</span></div><span className="section-kicker">ANALYZING YOUR VIDEO</span><h2>Finding the story<br /><em>inside your short.</em></h2><div className="stage-list">{analysisStages.map((label, index) => <div className={index < stage ? "stage complete" : index === stage ? "stage active" : "stage"} key={label}><span>{index < stage ? "✓" : index === stage ? "" : ""}</span>{label}</div>)}</div><p className="loader-note">This usually takes a few seconds.</p></div>;
}

function ReelUploader({ file, previewUrl, error, onFile, onError, onRemove, onAnalyze }: { file: File | null; previewUrl: string; error: string; onFile: (file: File) => void; onError: (message: string) => void; onRemove: () => void; onAnalyze: () => void }) {
  const [dragging, setDragging] = useState(false);
  const inputId = "reel-upload";
  const validateFile = (candidate: File) => {
    const extension = candidate.name.split(".").pop()?.toLowerCase() ?? "";
    const hasAcceptedType = acceptedTypes.includes(candidate.type) || (!candidate.type && acceptedExtensions.includes(extension));
    if (!hasAcceptedType || !acceptedExtensions.includes(extension)) { onError("Please choose an MP4, MOV, or WEBM video file."); return; }
    if (candidate.size > maxFileSize) { onError("That video is too large. Please choose a file under 100 MB."); return; }
    onError("");
    onFile(candidate);
  };
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => { const candidate = event.target.files?.[0]; if (candidate) validateFile(candidate); event.target.value = ""; };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); const candidate = event.dataTransfer.files[0]; if (candidate) validateFile(candidate); };
  return <div className="reel-uploader"><input id={inputId} className="sr-only" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" onChange={handleInput} />{!file ? <div className={`dropzone ${dragging ? "dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={handleDrop}><div className="upload-icon">↑</div><strong>Drop your video here</strong><label className="choose-video-button" htmlFor={inputId}>Choose Video</label><span>MP4, MOV, or WEBM · up to 100 MB</span></div> : <div className="selected-video"><video src={previewUrl} controls preload="metadata" /><div className="file-details"><div className="file-type">VIDEO READY</div><strong>{file.name}</strong><span>{formatFileSize(file.size)}</span><div className="file-actions"><button type="button" className="remove-button" onClick={onRemove}>Remove</button><button type="button" className="primary-button analyze-button" onClick={onAnalyze}>Analyze video <span>↗</span></button></div></div></div>}{error && <p className="upload-error" role="alert">{error}</p>}</div>;
}

export default function ReelAnalyzer() {
  const { canAnalyze, isPro, recordAnalysis, saveAnalysis, isSaved } = useUsageDemo();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [toast, setToast] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [currentRecord, setCurrentRecord] = useState<AnalysisRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const previewUrlRef = useRef("");
  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(false), 2200); return () => window.clearTimeout(timer); }, [toast]);
  const selectFile = (candidate: File) => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); const nextPreviewUrl = URL.createObjectURL(candidate); previewUrlRef.current = nextPreviewUrl; setPreviewUrl(nextPreviewUrl); setError(""); setAnalysisError(""); setAnalysis(null); setCurrentRecord(null); setFile(candidate); };
  const removeFile = () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = ""; setPreviewUrl(""); setFile(null); setAnalysis(null); setCurrentRecord(null); setAnalysisError(""); setError(""); };
  const analyze = async () => {
    if (!file) { setError("Choose a video before analyzing."); return; }
    if (!canAnalyze) { setAnalysisError("Daily free limit reached. Upgrade to Creator Pro for unlimited analyses."); return; }
    setError("");
    setAnalysisError("");
    setIsAnalyzing(true);
    setAnalysis(null);
    setStage(0);
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, analysisStages.length - 1)), 620);
    try {
      const formData = new FormData();
      formData.append("video", file);
      const response = await fetch("/api/analyze-video", { method: "POST", body: formData });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : "The video could not be analyzed.";
        throw new Error(message);
      }
      if (!isVideoAnalysis(payload)) throw new Error("The analysis response was incomplete.");
      const nextAnalysis = withTotalScore(payload);
      setAnalysis(nextAnalysis);
      setCurrentRecord(recordAnalysis(file.name, payload));
    } catch (requestError) {
      setAnalysisError(requestError instanceof TypeError ? "The analysis service is unavailable. Check your connection and try again." : requestError instanceof Error ? requestError.message : "We could not analyze the video. Please try again.");
    } finally {
      window.clearInterval(timer);
      setStage(analysisStages.length);
      setIsAnalyzing(false);
    }
  };
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); } catch { /* Clipboard can be unavailable in local previews. */ } setToast(true); };
  const regenerateCaptions = () => { if (!analysis) return; setAnalysisError("Caption regeneration requires a new Gemini request. Analyze the video again to refresh captions."); };
  const saveCurrentAnalysis = () => { if (currentRecord) saveAnalysis(currentRecord); };
  return <section className="reel-analyzer-section section-shell" id="reel-analyzer"><div className="analyzer-intro"><div><span className="eyebrow"><span>✦</span> AI reel & shorts analyzer</span><h1>AI Reel & Shorts<br /><em>Analyzer.</em></h1><p>Upload your video and let AI analyze the real moments inside it to create a complete content kit.</p></div><div className="analyzer-stats"><span><strong>5×</strong> content angles</span><span><strong>1</strong> upload to publish</span></div></div><div className="analyzer-plan-row"><UsageIndicator />{!isPro && <span className="basic-plan-note">Basic creator insights</span>}</div>{isAnalyzing ? <AnalysisLoader stage={stage} /> : analysis ? <>{analysisError && <p className="upload-error" role="status">{analysisError}</p>}<AnalysisResults analysis={analysis} onCopy={copy} onRegenerateCaptions={regenerateCaptions} onSave={saveCurrentAnalysis} isSaved={currentRecord ? isSaved(currentRecord.id) : false} /></> : analysisError ? <><div className="analysis-error analyzer-panel" role="alert"><span className="section-kicker">ANALYSIS UNAVAILABLE</span><h2>{analysisError.includes("Daily free") ? "Daily free limit reached." : "Gemini could not analyze this video."}</h2><p>{analysisError}</p><button type="button" className="primary-button" onClick={analyze} disabled={!canAnalyze && !isPro}>{analysisError.includes("Daily free") ? "Upgrade to Pro" : "Try again"} <span>↗</span></button></div>{analysisError.includes("Daily free") && <UpgradeCard />}</> : <><div className="upload-panel analyzer-panel"><div className="upload-heading"><div><span className="section-kicker">START WITH A VIDEO</span><h2>Upload Your Reel or Short</h2><p>Turn one video into a complete content kit.</p></div><span className="upload-step">01 / 01</span></div><ReelUploader file={file} previewUrl={previewUrl} error={error} onFile={selectFile} onError={setError} onRemove={removeFile} onAnalyze={analyze} /></div><UpgradeCard /></>}{toast && <div className="toast" role="status">Copied to clipboard <span>✓</span></div>}</section>;
}
