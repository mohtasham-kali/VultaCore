import { API_BASE_URL } from './constants';

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

export async function likeComment(commentId: string) {
  const res = await fetch(`${API_BASE_URL}/forum/comments/${commentId}/like`, {
    method: 'POST',
  });
  return res.json();
}

export async function executeBot(id: string, prompt: string, userId: string, context?: string) {
  const res = await fetch(`${API_BASE_URL}/bots/${id}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, userId, context }),
  });
  return res.json();
}


export async function fetchAnalytics(userId: string) {
  const res = await fetch(`${API_BASE_URL}/analytics/${userId}`, { cache: 'no-store' });
  return res.json();
}

export async function fetchBots() {
  const res = await fetch(`${API_BASE_URL}/bots`, { cache: 'no-store' });
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
  const res = await fetch(`${API_BASE_URL}/forum`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  });
  return res.json();
}
