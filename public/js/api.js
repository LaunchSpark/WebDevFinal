// AI-generated: fetch wrappers for all Express REST routes
const BASE = 'http://localhost:3001/api';

async function request(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json();
}

export const getResume         = ()            => request('GET',    '/resume');
export const createSection     = (data)        => request('POST',   '/sections', data);
export const updateSection     = (id, patch)   => request('PATCH',  `/sections/${id}`, patch);
export const deleteSection     = (id)          => request('DELETE', `/sections/${id}`);
export const createEntry       = (data)        => request('POST',   '/entries', data);
export const updateEntry       = (id, patch)   => request('PATCH',  `/entries/${id}`, patch);
export const deleteEntry       = (id)          => request('DELETE', `/entries/${id}`);
export const createBullet      = (data)        => request('POST',   '/bullets', data);
export const updateBullet      = (id, patch)   => request('PATCH',  `/bullets/${id}`, patch);
export const deleteBullet      = (id)          => request('DELETE', `/bullets/${id}`);
export const getConfig         = (key)         => request('GET',    `/config/${key}`);
export const setConfig         = (key, value)  => request('PUT',    `/config/${key}`, { value });
export const refineText        = (type, input) => request('POST',   '/ai/refine', { type, input });
