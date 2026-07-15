const API_BASE = '/auth';

export async function register(username, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Registration failed');
  }
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Login failed');
  }
  return res.json();
}

export async function fetchMessageHistory(token, otherUsername) {
  const res = await fetch(`/messages/history/${otherUsername}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to fetch messages');
  }
  return res.json();
}

export async function sendMessageRest(token, text, sentTo) {
  const res = await fetch('/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text, sentTo })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to send message');
  }
  return res.text();
}
