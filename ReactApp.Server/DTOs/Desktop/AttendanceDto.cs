namespace ReactApp.Server.DTOs.Desktop;

public class AttendanceDto
{
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public string? ChildName { get; set; }
    public DateTime AttendanceDate { get; set; }
    public string Status { get; set; } = "blank"; // blank, present, absent, late
    public TimeSpan? ArrivalTime { get; set; }
    public string? Notes { get; set; }
    public int? AbsenceNotificationId { get; set; }
    public int? RecordedByStaffId { get; set; }
    public string? RecordedByStaffName { get; set; }
    public DateTime? RecordedAt { get; set; }
    public int? UpdatedByStaffId { get; set; }
    public string? UpdatedByStaffName { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; }
}

public class AttendanceHistorySummaryDto
{
    public int TotalDays { get; set; }
    public int PresentDays { get; set; }
    public int AbsentDays { get; set; }
    public int LateDays { get; set; }
    public decimal AttendanceRate { get; set; }
}

public class UpdateAttendanceRequest
{
    public string Status { get; set; } = null!; // present, absent, late
    public TimeSpan? ArrivalTime { get; set; }
    public string? Notes { get; set; }
    public int RecordedByStaffId { get; set; }
    public int RecordedByStaffNurseryId { get; set; }
}

public class UpdateAttendanceNotesRequest
{
    public string? Notes { get; set; }
    public int UpdatedByStaffId { get; set; }
    public int UpdatedByStaffNurseryId { get; set; }
}

public class BulkPresentRequest
{
    public int NurseryId { get; set; }
    public string ClassId { get; set; } = null!;
    public DateTime Date { get; set; }
    public int RecordedByStaffId { get; set; }
    public int RecordedByStaffNurseryId { get; set; }
}

public class BulkPresentResponse
{
    public int TotalChildren { get; set; }
    public int RegisteredCount { get; set; }
    public int SkippedCount { get; set; }
    public List<SkippedChildInfo> SkippedChildren { get; set; } = new();
}

public class SkippedChildInfo
{
    public int ChildId { get; set; }
    public string ChildName { get; set; } = null!;
    public string Reason { get; set; } = null!;
}
