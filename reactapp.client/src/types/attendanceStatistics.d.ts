// 出席統計関連の型定義

export interface AttendanceStatisticsRequest {
  nurseryId: number;
  dateFrom: string; // ISO date string (YYYY-MM-DD)
  dateTo: string;   // ISO date string (YYYY-MM-DD)
  classIds?: string[]; // Optional: filter by specific classes
}

export interface PeriodDto {
  from: string;
  to: string;
  totalDays: number;
}

export interface ChildStatistics {
  childId: number;
  childName: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalRecordedDays: number;
  attendanceRate: number; // Percentage (0-100)
}

export interface ClassStatistics {
  classId: string;
  className: string;
  totalChildren: number;
  averageAttendanceRate: number; // Percentage (0-100)
  childrenStatistics: ChildStatistics[];
}

export interface OverallSummary {
  totalChildren: number;
  averageAttendanceRate: number; // Percentage (0-100)
  totalPresentDays: number;
  totalAbsentDays: number;
  totalLateDays: number;
}

export interface AttendanceStatisticsResponse {
  period: PeriodDto;
  classStatistics: ClassStatistics[];
  overallSummary: OverallSummary;
}

export interface MonthlyAttendanceStats {
  month: string; // YYYY-MM format
  classId: string;
  className: string;
  attendanceRate: number; // Percentage (0-100)
  presentDays: number;
  absentDays: number;
  lateDays: number;
}
