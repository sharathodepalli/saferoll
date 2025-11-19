import type { MetricsResponse, Rollout, RolloutDetail } from "./types";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchMetrics(): Promise<MetricsResponse> {
  const res = await fetch(`${API_BASE}/v1/metrics`);
  return handleResponse<MetricsResponse>(res);
}

export async function fetchRolloutDetail(rolloutId: string): Promise<RolloutDetail> {
  const res = await fetch(`${API_BASE}/v1/rollouts/${rolloutId}`);
  return handleResponse<RolloutDetail>(res);
}

export async function postPromote(rolloutId: string): Promise<Rollout> {
  const res = await fetch(`${API_BASE}/v1/rollouts/${rolloutId}/promote`, {
    method: "POST",
  });
  return handleResponse<Rollout>(res);
}

export async function postPause(
  rolloutId: string,
  reason: string | null = null
): Promise<Rollout> {
  const res = await fetch(`${API_BASE}/v1/rollouts/${rolloutId}/pause`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return handleResponse<Rollout>(res);
}

export async function postRollback(
  rolloutId: string,
  reason: string | null = null
): Promise<Rollout> {
  const res = await fetch(`${API_BASE}/v1/rollouts/${rolloutId}/rollback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return handleResponse<Rollout>(res);
}
