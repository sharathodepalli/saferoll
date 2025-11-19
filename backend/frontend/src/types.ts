export type Ring = "pilot" | "five" | "twentyfive" | "all";

export type DecisionKind = "PROMOTE" | "PAUSE" | "ROLLBACK" | "ADVISE_NO";

export type RolloutState = "active" | "paused" | "completed";

export interface MetricsResponse {
  active_rollout_id: string;
  active_ring: Ring;
  window_seconds: number;
  boot_success: number;
  crash_free_median: number;
  checkin_ms_median: number;
  breaches: string[];
}

export interface Rollout {
  rollout_id: string;
  target_version: string;
  last_known_good: string;
  state: RolloutState;
  ring_index: number;
  created_at: string;
}

export interface Decision {
  ts: string;
  kind: DecisionKind;
  reason: string;
  ring: Ring;
  snapshot: Record<string, number>;
}

export interface RolloutDetail {
  rollout: Rollout;
  decisions: Decision[];
}
