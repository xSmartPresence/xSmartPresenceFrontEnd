export interface Summary {
  total: number;
  present: number;
  absent: number;
  late: number;
  earlyExit: number;
  overtime: number;
  occupancy: number;
}

export interface AttendanceItem {
  day: string;
  present: number;
  absent: number;
}

export interface PieItem {
  name: string;
  value: number;
}

export interface DeptItem {
  name: string;
  present: number;
  absent: number;
}
 
export interface SystemHealth {
  entryCamera: string;
  exitCamera: string;
  aiRecognition: string;
  lastSync: string;
}

export interface DashboardData {
  summary: Summary;
  attendanceData: AttendanceItem[];
  pieData: PieItem[];
  deptData: DeptItem[];
  systemHealth: SystemHealth; 
}



