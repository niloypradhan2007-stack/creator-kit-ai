import { analyzeVideoWithProvider } from "@/lib/ai/video-analysis";
import { checkAnalyzeRateLimit } from "@/lib/security/rate-limit";

const acceptedTypes = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const acceptedExtensions = new Set(["mp4", "mov", "webm"]);
const maxFileSize = 100 * 1024 * 1024;

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown-client";
  return request.headers.get("x-real-ip")?.trim() || "unknown-client";
}

function getSafeUploadName(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return `video.${extension}`;
}

function isAcceptedVideo(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return acceptedTypes.has(file.type) && acceptedExtensions.has(extension);
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Please send the video as multipart form data.", 400);
  }

  const video = formData.get("video");
  if (!(video instanceof File)) {
    return errorResponse("A video file is required.", 400);
  }

  if (!isAcceptedVideo(video)) {
    return errorResponse("Please upload a valid MP4, MOV, or WEBM video.", 400);
  }

  if (video.size > maxFileSize) {
    return errorResponse("That video is too large. Please upload a file under 100 MB.", 400);
  }

  if (video.size === 0) {
    return errorResponse("The uploaded video is empty. Please choose a valid video file.", 400);
  }

  const limit = checkAnalyzeRateLimit(getClientKey(request));
  if (!limit.allowed) {
    return Response.json({ error: "Too many analysis requests. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }

  console.info("[analyze-video] video received", { type: video.type, size: video.size });

  try {
    console.info("[analyze-video] Gemini processing started");
    const analysis = await analyzeVideoWithProvider(video, getSafeUploadName(video));
    console.info("[analyze-video] Gemini returned a response");
    return Response.json(analysis);
  } catch (error) {
    console.error("[analyze-video] Gemini analysis failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    return errorResponse("We could not analyze this video right now. Please try again later.", 500);
  }
}
