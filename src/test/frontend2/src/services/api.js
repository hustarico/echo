async function authFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!res.ok) {
    const text = await res.text();
    let msg;
    try { msg = JSON.parse(text); } catch { msg = text; }
    if (typeof msg === 'object' && msg !== null) {
      throw new Error(Object.values(msg).join(', ') || 'Request failed');
    }
    throw new Error(msg || 'Request failed');
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export async function register(username, password) {
  return authFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function login(username, password) {
  return authFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function searchUsers(token, query) {
  return authFetch(`/users/${encodeURIComponent(query)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

export async function fetchMessageHistory(token, otherUsername) {
  return authFetch(`/messages/history/${encodeURIComponent(otherUsername)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

export async function fetchRecentContacts(token) {
  return authFetch('/messages/recent', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

export async function uploadImage(token, file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch('/messages/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Upload failed');
  }
  return res.text();
}

export async function sendMessageRest(token, text, sentTo, imageUrl) {
  return authFetch('/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text, sentTo, ...(imageUrl ? { imageUrl } : {}) })
  });
}
