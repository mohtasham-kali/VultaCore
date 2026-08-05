import { API_BASE_URL } from './constants';

// Helper to read CSRF token from cookie (set by backend)
function getCsrfToken(): string | undefined {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

// Wrapper around fetch that automatically adds CSRF token for state‑changing requests
async function secureFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  // For unsafe methods, attach the CSRF token header
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    const token = getCsrfToken();
    init.headers = {
      ...(init.headers || {}),
      'x-csrf-token': token || '',
    };
  }
  return fetch(input, init);
}

export async function fetchPosts(type?: 'dev' | 'cyber') {
  const url = type ? `${API_BASE_URL}/forum?type=${type}` : `${API_BASE_URL}/forum`;
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}

export async function fetchPostDetail(id: string) {
  const res = await fetch(`${API_BASE_URL}/forum/${id}`, { cache: 'no-store' });
  return res.json();
}

export async function createComment(postId: string, content: string) {
  const res = await secureFetch(`${API_BASE_URL}/forum/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function likePost(postId: string) {
  const res = await secureFetch(`${API_BASE_URL}/forum/${postId}/like`, {
    method: 'POST',
  });
  return res.json();
}

export async function likeComment(commentId: string) {
  const res = await secureFetch(`${API_BASE_URL}/forum/comments/${commentId}/like`, {
    method: 'POST',
  });
  return res.json();
}

let webLlmEngine: any = null;

export async function syncOfflineChats() {
  if (typeof window === 'undefined') return;
  const pending = JSON.parse(localStorage.getItem('pending_chats') || '[]');
  if (pending.length === 0) return;

  console.log(`Syncing ${pending.length} offline chats to server...`);
  // Try to sync to backend
  const remaining = [];
  for (const chat of pending) {
    try {
      await secureFetch(`${API_BASE_URL}/bots/${chat.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chat.prompt, userId: chat.userId, context: chat.context }),
      });
    } catch (e) {
      remaining.push(chat);
    }
  }
  localStorage.setItem('pending_chats', JSON.stringify(remaining));
}

// Automatically try to sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', syncOfflineChats);
}

export async function executeBot(id: string, prompt: string, userId: string, context?: string) {
  try {
    // Try the network first
    const res = await secureFetch(`${API_BASE_URL}/bots/${id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, userId, context }),
    });
    
    if (!res.ok) throw new Error("Backend failed or offline");
    return res.json();
  } catch (err) {
    console.warn("Network offline. Switching to True Mobile Offline mode via WebLLM...");
    
    // Save to sync queue
    if (typeof window !== 'undefined') {
      const pending = JSON.parse(localStorage.getItem('pending_chats') || '[]');
      pending.push({ id, prompt, userId, context, timestamp: Date.now() });
      localStorage.setItem('pending_chats', JSON.stringify(pending));
    }

    // Dynamic import to avoid SSR crashes
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
    
    if (!webLlmEngine) {
      console.log("Initializing Mobile WebLLM Engine (Llama 3.2 1B). First run will download to phone storage...");
      webLlmEngine = await CreateMLCEngine(
        "Llama-3.2-1B-Instruct-q4f16_1-MLC", 
        { initProgressCallback: (progress) => console.log("WebLLM Loading:", progress.text) }
      );
    }
    
    const messages = [
      { role: "system", content: "You are an AI assistant running entirely offline inside the user's device memory via WebGPU. " + (context || "") },
      { role: "user", content: prompt }
    ];
    
    // Generate locally on the phone's GPU
    const reply = await webLlmEngine.chat.completions.create({ messages });
    
    return {
      bot_name: "Mobile On-Device AI (Llama 3.2 1B)",
      response: reply.choices[0].message.content,
      confidence: 1.0,
      processing_time: 0,
      metadata: { source: "true-mobile-offline-webgpu" }
    };
  }
}


export async function fetchBotHistory(botId: string, userId: string) {
  const res = await secureFetch(`${API_BASE_URL}/bots/${botId}/history?userId=${userId}`, { cache: 'no-store' });
  return res.json();
}

export async function fetchAnalytics(userId: string) {
  const res = await secureFetch(`${API_BASE_URL}/analytics/${userId}`, { cache: 'no-store' });
  return res.json();
}

export async function fetchBots() {
  const res = await secureFetch(`${API_BASE_URL}/bots`, { cache: 'no-store' });
  return res.json();
}

export async function createPost(postData: { 
  title: string, 
  content: string, 
  type: 'dev' | 'cyber', 
  tags: string[],
  userId: string,
  severity?: 'low' | 'medium' | 'high' | 'critical'
}) {
  const res = await secureFetch(`${API_BASE_URL}/forum`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  });
  return res.json();
}
