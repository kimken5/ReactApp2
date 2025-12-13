using ReactApp.Server.Helpers;

namespace ReactApp.Server.Models;

public class DailyAttendance
{
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public DateTime AttendanceDate { get; set; }
    public string Status { get; set; } = "blank"; // blank, present, absent, late
    public TimeSpan? ArrivalTime { get; set; }
    public string? Notes { get; set; }
    public int? AbsenceNotificationId { get; set; }
    public int? RecordedByStaffId { get; set; }
    public int? RecordedByStaffNurseryId { get; set; }
    public DateTime RecordedAt { get; set; } = DateTimeHelper.GetJstNow();
    public int? UpdatedByStaffId { get; set; }
    public int? UpdatedByStaffNurseryId { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTimeHelper.GetJstNow();
    public bool IsActive { get; set; } = true;
}
