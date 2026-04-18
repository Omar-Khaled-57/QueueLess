const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type FetchOptions = RequestInit & { token?: string };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data as T;
}

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  register: (body: { name: string; email: string; password: string; role?: string; phone?: string; city?: string; address?: string; gender?: string }) =>
    apiFetch<{ user: User; token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    apiFetch<{ user: User; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: (token: string) =>
    apiFetch<{ user: User }>('/api/auth/me', { token }),

  updateMe: (body: Partial<User>, token: string) =>
    apiFetch<{ user: User }>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(body), token }),
};

// ── Businesses ────────────────────────────────────────────
export const businessAPI = {
  list: () => apiFetch<{ businesses: Business[] }>('/api/businesses'),
  get: (id: number) => apiFetch<{ business: Business; queues: Queue[] }>(`/api/businesses/${id}`),
};

// ── Queues ────────────────────────────────────────────────
export const queueAPI = {
  tickets: (queueId: number, date?: string) => 
    apiFetch<{ tickets: Ticket[] }>(`/api/queues/${queueId}/tickets${date ? `?date=${date}` : ''}`),
  join: (queueId: number, targetDate: string, notifySettings: number[], token: string) =>
    apiFetch<{ ticket: Ticket }>(`/api/queues/${queueId}/join`, { 
      method: 'POST', 
      token,
      body: JSON.stringify({ targetDate, notifySettings })
    }),
  cancel: (queueId: number, ticketId: number, token: string) =>
    apiFetch<{ ticket: Ticket }>(`/api/queues/${queueId}/tickets/${ticketId}/cancel`, { method: 'PATCH', token }),
  next: (queueId: number, token: string) =>
    apiFetch<{ serving: Ticket }>(`/api/queues/${queueId}/next`, { method: 'POST', token }),
  skip: (queueId: number, token: string) =>
    apiFetch<{ skipped: Ticket }>(`/api/queues/${queueId}/skip`, { method: 'POST', token }),
  open: (queueId: number, is_open: boolean, token: string) =>
    apiFetch<{ queue: Queue }>(`/api/queues/${queueId}/open`, { method: 'PATCH', token, body: JSON.stringify({ is_open }) }),
  analytics: (queueId: number, token: string) =>
    apiFetch<QueueAnalytics>(`/api/queues/${queueId}/analytics`, { token }),
  weeklyAnalytics: (queueId: number, token: string) =>
    apiFetch<{ weekly: { day: string; served: number; noshow: number }[] }>(`/api/queues/${queueId}/analytics/weekly`, { token }),
  create: (body: { business_id: number; name: string; avg_service_time_min?: number }, token: string) =>
    apiFetch<{ queue: Queue }>('/api/queues', { method: 'POST', token, body: JSON.stringify(body) }),
};

// ── Tickets ───────────────────────────────────────────────
export const ticketAPI = {
  myHistory: (token: string) => apiFetch<{ tickets: Ticket[] }>('/api/tickets/my', { token }),
  myActive: (token: string) => apiFetch<{ ticket: Ticket | null }>('/api/tickets/my/active', { token }),
};

// ── Notifications ─────────────────────────────────────────
export const notificationsAPI = {
  getAll: (token: string) => 
    apiFetch<{ notifications: Notification[] }>('/api/notifications', { token }),
    
  getUnreadCount: (token: string) =>
    apiFetch<{ unread_count: number }>('/api/notifications/unread-count', { token }),

  markRead: (id: number, token: string) =>
    apiFetch<{ notification: Notification }>(`/api/notifications/${id}/read`, { method: 'PATCH', token }),
};

// ── Types ─────────────────────────────────────────────────
export type User = {
  id: number; name: string; email: string;
  role: 'user' | 'admin'; avatar_url?: string; 
  phone?: string; city?: string; address?: string; gender?: string;
  created_at: string;
};

export type Notification = {
  id: number; user_id: number; title: string; message: string;
  is_read: boolean; created_at: string;
};

export type Business = {
  id: number; owner_id: number; name: string;
  description: string; category: string;
  address: string; is_active: boolean; created_at: string;
  image_url?: string;
  operating_days: number[];
  owner_name?: string;
};

export type Queue = {
  id: number; business_id: number; name: string;
  is_open: boolean; avg_service_time_min: number; created_at: string;
};

export type Ticket = {
  id: number; queue_id: number; user_id: number;
  ticket_number: number; status: 'waiting' | 'serving' | 'done' | 'cancelled' | 'skipped';
  joined_at: string; called_at: string | null; completed_at: string | null;
  target_date: string;
  notify_settings: number[];
  notified_events: (number | string)[];
  user_name?: string; queue_name?: string; business_name?: string;
  category?: string; position_ahead?: number;
};

export type QueueAnalytics = {
  served_today: number; no_shows_today: number;
  avg_wait_min: number; hourly_distribution: { hour: number; count: number }[];
};
