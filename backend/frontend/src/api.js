export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
async function handleResponse(res) {
    if (!res.ok) {
        const message = await res.text();
        throw new Error(message || `Request failed with status ${res.status}`);
    }
    return res.json();
}
export async function fetchMetrics() {
    const res = await fetch(`${API_BASE}/v1/metrics`);
    return handleResponse(res);
}
export async function fetchRolloutDetail(rolloutId) {
    const res = await fetch(`${API_BASE}/v1/rollouts/${rolloutId}`);
    return handleResponse(res);
}
export async function postPromote(rolloutId) {
    const res = await fetch(`${API_BASE}/v1/rollouts/${rolloutId}/promote`, {
        method: "POST",
    });
    return handleResponse(res);
}
export async function postPause(rolloutId, reason = null) {
    const res = await fetch(`${API_BASE}/v1/rollouts/${rolloutId}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
}
export async function postRollback(rolloutId, reason = null) {
    const res = await fetch(`${API_BASE}/v1/rollouts/${rolloutId}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
}
