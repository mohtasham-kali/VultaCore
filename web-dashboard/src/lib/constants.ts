// Central API configuration — change NEXT_PUBLIC_API_URL in .env.local for production
export const API_BASE_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    const trimmed = envUrl.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://localhost:3001/api';
})();

export const SOCKET_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3001';
})();
