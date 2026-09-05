import { analyzeVideoWithProvider } from "@/lib/ai/video-analysis";

const acceptedTypes = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const acceptedExtensions = new Set(["mp4", "mov", "webm"]);
const maxFileSize = 100 * 1024 * 1024;

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isAcceptedVideo(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const hasAcceptedType = acceptedTypes.has(file.type) || (!file.type && acceptedExtensions.has(extension));
  return hasAcceptedType && acceptedExtensions.has(extension);
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
    return errorResponse("Please upload an MP4, MOV, or WEBM video.", 415);
  }

  if (video.size > maxFileSize) {
    return errorResponse("That video is too large. Please upload a file under 100 MB.", 413);
  }

  console.info("[analyze-video] video received", { type: video.type, size: video.size });

  try {
    console.info("[analyze-video] Gemini processing started");
    const analysis = await analyzeVideoWithProvider(video, video.name);
    console.info("[analyze-video] Gemini returned a response");
    return Response.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Gemini error.";
    console.error("[analyze-video] Gemini analysis failed", { message });
    return errorResponse(`Gemini could not analyze this video: ${message}`, 502);
  }
}
