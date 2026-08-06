import type { Category, HomeContent, Project, SiteContent } from '../types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore parse errors, use default message
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getContent: () => request<SiteContent>('/api/content'),

  login: (username: string, password: string) =>
    request<{ ok: true }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<{ ok: true }>('/api/logout', { method: 'POST' }),

  checkSession: () => request<{ authenticated: boolean }>('/api/me'),

  updateHome: (home: HomeContent) =>
    request<{ ok: true }>('/api/admin/home', {
      method: 'PUT',
      body: JSON.stringify(home),
    }),

  updateCategories: (categories: Category[]) =>
    request<{ ok: true }>('/api/admin/categories', {
      method: 'PUT',
      body: JSON.stringify(categories),
    }),

  updateProjects: (projects: Project[]) =>
    request<{ ok: true }>('/api/admin/projects', {
      method: 'PUT',
      body: JSON.stringify(projects),
    }),

  updateCustomCss: (css: string) =>
    request<{ ok: true }>('/api/admin/custom-css', {
      method: 'PUT',
      body: JSON.stringify({ css }),
    }),

  sendContact: (data: { name: string; email: string; message: string; company?: string }) =>
    request<{ ok: true }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      let message = `Upload failed (${res.status})`;
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch {
        // ignore
      }
      throw new Error(message);
    }
    return res.json();
  },
};
