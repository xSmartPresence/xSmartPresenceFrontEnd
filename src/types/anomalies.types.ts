export interface Anomaly {
  id: number;
  title: string;
  severity: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
  description: string;
  employee: string;
  time: string;
  resolved: boolean;
  image?: string;  // ← base64 image
  anomaly_type?: string;
  camera?: string;
  confidence?: number | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  resolution_note?: string | null;
}

export interface ResolveAnomalyPayload {
  resolved: boolean;
}