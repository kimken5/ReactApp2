namespace ReactApp.Server.DTOs
{
    public class DailyReportFilterDto
    {
        public int? ChildId { get; set; }
        public string? ClassId { get; set; }
        public int? StaffId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Category { get; set; }
        public string? ReportKind { get; set; }
        public string? Status { get; set; }
        public bool? ParentAcknowledged { get; set; }
        public bool? HasPhoto { get; set; }
        public string? Keyword { get; set; }
        public string? SearchKeyword { get; set; }
    }
}
