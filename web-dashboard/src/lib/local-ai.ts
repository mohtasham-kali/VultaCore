import { CreateMLCEngine, MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

let engine: MLCEngine | null = null;
let isInitializing = false;

// We use Phi-3 as it's very small and efficient for mobile/desktop local inference
const MODEL_ID = 'Phi-3-mini-4k-instruct-q4f16_1-MLC';

export interface LocalAIProgress {
  progress: number;
  timeElapsed: number;
  text: string;
}

export async function initLocalEngine(
  onProgress?: (report: LocalAIProgress) => void
): Promise<MLCEngine> {
  if (typeof navigator === 'undefined' || !(navigator as { gpu?: unknown }).gpu) {

    throw new Error("WebGPU is not supported on this device/browser. Offline Local AI requires WebGPU. If you are using the Desktop app on Linux or macOS, the native webview may not support it yet. Please use Online Mode.");
  }

  if (engine) return engine;
  
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return engine!;
  }

  isInitializing = true;
  try {
    engine = await CreateMLCEngine(
      MODEL_ID,
      {
        initProgressCallback: (progress: InitProgressReport) => {
          if (onProgress) {
            onProgress({
              progress: progress.progress,
              timeElapsed: progress.timeElapsed,
              text: progress.text
            });
          }
        }
      }
    );
    return engine;
  } finally {
    isInitializing = false;
  }
}

export async function generateLocalResponse(
  prompt: string, 
  context?: string,
  onProgress?: (progress: LocalAIProgress) => void
): Promise<string> {
  const engine = await initLocalEngine(onProgress);
  
  const messages: Array<{ role: string; content: string }> = [];

  if (context) {
    messages.push({ role: 'system', content: `Context:\n${context}` });
  }
  messages.push({ role: 'user', content: prompt });

  const reply = await engine.chat.completions.create({
    // Engine SDK expects a loose message shape; keep typing permissive.
    messages: messages as unknown as Parameters<MLCEngine['chat']['completions']['create']>[0]['messages'],

  });


  return reply.choices[0].message.content as string;
}

export function isLocalEngineReady(): boolean {
  return engine !== null;
}
