export interface Anomaly {
  id: number;
  title: string;
  severity: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
  description: string;
  employee: string;
  time: string;
  resolved: boolean;
  image?: string;  // ← base64 image
}

export interface ResolveAnomalyPayload {
  resolved: boolean;
}