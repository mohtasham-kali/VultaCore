const API_BASE_URL = 'http://localhost:4000';

export async function fetchPosts(type?: 'dev' | 'cyber') {
  const url = type ? `${API_BASE_URL}/forum?type=${type}` : `${API_BASE_URL}/forum`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchPostDetail(id: string) {
  const res = await fetch(`${API_BASE_URL}/forum/${id}`);
  return res.json();
}

export async function createComment(postId: string, content: string) {
  const res = await fetch(`${API_BASE_URL}/forum/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function likePost(postId: string) {
  const res = await fetch(`${API_BASE_URL}/forum/${postId}/like`, {
    method: 'POST',
  });
  return res.json();
}

export async function executeBot(id: string, prompt: string, context?: string) {
  const res = await fetch(`${API_BASE_URL}/bots/${id}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, context }),
  });
  return res.json();
}

export async function fetchAnalytics(userId: string) {
  const res = await fetch(`${API_BASE_URL}/analytics/${userId}`);
  return res.json();
}

export async function fetchBots() {
  const res = await fetch(`${API_BASE_URL}/bots`);
  return res.json();
}

export async function createPost(postData: { 
  title: string, 
  content: string, 
  type: 'dev' | 'cyber', 
  tags: string[],
  severity?: 'low' | 'medium' | 'high' | 'critical'
}) {
  const res = await fetch(`${API_BASE_URL}/forum`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  });
  return res.json();
}
