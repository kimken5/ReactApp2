namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 出席統計レポートのリクエストDTO
    /// </summary>
    public class AttendanceStatisticsRequestDto
    {
        /// <summary>
        /// 保育園ID
        /// </summary>
        public int NurseryId { get; set; }

        /// <summary>
        /// 集計開始日
        /// </summary>
        public DateTime DateFrom { get; set; }

        /// <summary>
        /// 集計終了日
        /// </summary>
        public DateTime DateTo { get; set; }

        /// <summary>
        /// 対象クラスIDリスト（省略時は全クラス）
        /// </summary>
        public List<string>? ClassIds { get; set; }
    }

    /// <summary>
    /// 出席統計レポートのレスポンスDTO
    /// </summary>
    public class AttendanceStatisticsResponseDto
    {
        /// <summary>
        /// 集計期間
        /// </summary>
        public PeriodDto Period { get; set; } = new();

        /// <summary>
        /// クラス別統計リスト
        /// </summary>
        public List<ClassStatisticsDto> ClassStatistics { get; set; } = new();

        /// <summary>
        /// 全体サマリー
        /// </summary>
        public OverallSummaryDto OverallSummary { get; set; } = new();
    }

    /// <summary>
    /// 集計期間DTO
    /// </summary>
    public class PeriodDto
    {
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public int TotalDays { get; set; }
    }

    /// <summary>
    /// クラス別統計DTO
    /// </summary>
    public class ClassStatisticsDto
    {
        /// <summary>
        /// クラスID
        /// </summary>
        public string ClassId { get; set; } = string.Empty;

        /// <summary>
        /// クラス名
        /// </summary>
        public string ClassName { get; set; } = string.Empty;

        /// <summary>
        /// 総園児数
        /// </summary>
        public int TotalChildren { get; set; }

        /// <summary>
        /// 平均出席率（%）
        /// </summary>
        public decimal AverageAttendanceRate { get; set; }

        /// <summary>
        /// 園児別統計リスト
        /// </summary>
        public List<ChildStatisticsDto> ChildrenStatistics { get; set; } = new();
    }

    /// <summary>
    /// 園児別統計DTO
    /// </summary>
    public class ChildStatisticsDto
    {
        /// <summary>
        /// 園児ID
        /// </summary>
        public int ChildId { get; set; }

        /// <summary>
        /// 園児名
        /// </summary>
        public string ChildName { get; set; } = string.Empty;

        /// <summary>
        /// 出席日数
        /// </summary>
        public int PresentDays { get; set; }

        /// <summary>
        /// 欠席日数
        /// </summary>
        public int AbsentDays { get; set; }

        /// <summary>
        /// 遅刻日数
        /// </summary>
        public int LateDays { get; set; }

        /// <summary>
        /// 記録日数（出席+欠席+遅刻）
        /// </summary>
        public int TotalRecordedDays { get; set; }

        /// <summary>
        /// 出席率（%）
        /// </summary>
        public decimal AttendanceRate { get; set; }
    }

    /// <summary>
    /// 全体サマリーDTO
    /// </summary>
    public class OverallSummaryDto
    {
        /// <summary>
        /// 総園児数
        /// </summary>
        public int TotalChildren { get; set; }

        /// <summary>
        /// 平均出席率（%）
        /// </summary>
        public decimal AverageAttendanceRate { get; set; }

        /// <summary>
        /// 総出席日数
        /// </summary>
        public int TotalPresentDays { get; set; }

        /// <summary>
        /// 総欠席日数
        /// </summary>
        public int TotalAbsentDays { get; set; }

        /// <summary>
        /// 総遅刻日数
        /// </summary>
        public int TotalLateDays { get; set; }
    }

    /// <summary>
    /// 月別出席統計DTO（グラフ表示用）
    /// </summary>
    public class MonthlyAttendanceStatsDto
    {
        /// <summary>
        /// 年月（YYYY-MM形式）
        /// </summary>
        public string Month { get; set; } = string.Empty;

        /// <summary>
        /// クラスID
        /// </summary>
        public string ClassId { get; set; } = string.Empty;

        /// <summary>
        /// クラス名
        /// </summary>
        public string ClassName { get; set; } = string.Empty;

        /// <summary>
        /// 出席率（%）
        /// </summary>
        public decimal AttendanceRate { get; set; }

        /// <summary>
        /// 出席日数
        /// </summary>
        public int PresentDays { get; set; }

        /// <summary>
        /// 欠席日数
        /// </summary>
        public int AbsentDays { get; set; }

        /// <summary>
        /// 遅刻日数
        /// </summary>
        public int LateDays { get; set; }
    }
}
