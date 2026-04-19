export interface RecognitionLog {
  id: string;
  timestamp: string;
  employeeId: string;
  name: string;
  camera: string;
  confidence: number;
  status: "Accepted" | "Rejected" | "Duplicate";
}