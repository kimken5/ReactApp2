using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 出席統計サービスの実装
    /// </summary>
    public class AttendanceStatisticsService : IAttendanceStatisticsService
    {
        private readonly KindergartenDbContext _context;
        private readonly ILogger<AttendanceStatisticsService> _logger;

        public AttendanceStatisticsService(
            KindergartenDbContext context,
            ILogger<AttendanceStatisticsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// 出席統計レポートを取得
        /// </summary>
        public async Task<AttendanceStatisticsResponseDto> GetAttendanceStatisticsAsync(
            AttendanceStatisticsRequestDto request)
        {
            _logger.LogInformation(
                "出席統計レポート取得開始: NurseryId={NurseryId}, DateFrom={DateFrom}, DateTo={DateTo}, ClassIds={ClassIds}",
                request.NurseryId, request.DateFrom, request.DateTo,
                request.ClassIds != null ? string.Join(",", request.ClassIds) : "全クラス");

            // 対象クラスの取得
            var classesQuery = _context.Classes
                .Where(c => c.NurseryId == request.NurseryId && c.IsActive);

            if (request.ClassIds != null && request.ClassIds.Any())
            {
                classesQuery = classesQuery.Where(c => request.ClassIds.Contains(c.ClassId));
            }

            var classes = await classesQuery
                .OrderBy(c => c.ClassId)
                .ToListAsync();

            var classStatisticsList = new List<ClassStatisticsDto>();

            // クラスごとに統計を計算
            foreach (var classItem in classes)
            {
                var classStats = await CalculateClassStatisticsAsync(
                    request.NurseryId,
                    classItem.ClassId,
                    request.DateFrom,
                    request.DateTo);

                classStats.ClassName = classItem.Name;
                classStatisticsList.Add(classStats);
            }

            // 全体サマリーの計算
            var overallSummary = new OverallSummaryDto
            {
                TotalChildren = classStatisticsList.Sum(c => c.TotalChildren),
                TotalPresentDays = classStatisticsList.SelectMany(c => c.ChildrenStatistics).Sum(s => s.PresentDays),
                TotalAbsentDays = classStatisticsList.SelectMany(c => c.ChildrenStatistics).Sum(s => s.AbsentDays),
                TotalLateDays = classStatisticsList.SelectMany(c => c.ChildrenStatistics).Sum(s => s.LateDays)
            };

            var totalRecordedDays = overallSummary.TotalPresentDays + overallSummary.TotalAbsentDays + overallSummary.TotalLateDays;
            overallSummary.AverageAttendanceRate = totalRecordedDays > 0
                ? Math.Round((decimal)overallSummary.TotalPresentDays / totalRecordedDays * 100, 1)
                : 0;

            var response = new AttendanceStatisticsResponseDto
            {
                Period = new PeriodDto
                {
                    From = request.DateFrom,
                    To = request.DateTo,
                    TotalDays = (request.DateTo - request.DateFrom).Days + 1
                },
                ClassStatistics = classStatisticsList,
                OverallSummary = overallSummary
            };

            _logger.LogInformation(
                "出席統計レポート取得完了: クラス数={ClassCount}, 総園児数={TotalChildren}, 平均出席率={AttendanceRate}%",
                classStatisticsList.Count, overallSummary.TotalChildren, overallSummary.AverageAttendanceRate);

            return response;
        }

        /// <summary>
        /// クラス別統計を計算
        /// </summary>
        private async Task<ClassStatisticsDto> CalculateClassStatisticsAsync(
            int nurseryId,
            string classId,
            DateTime dateFrom,
            DateTime dateTo)
        {
            // クラスに所属する園児を取得
            var children = await _context.Children
                .Where(c => c.NurseryId == nurseryId && c.ClassId == classId && c.IsActive)
                .OrderBy(c => c.Name)
                .ToListAsync();

            var childrenStatistics = new List<ChildStatisticsDto>();

            // 園児ごとに統計を計算
            foreach (var child in children)
            {
                var attendanceRecords = await _context.DailyAttendances
                    .Where(a => a.NurseryId == nurseryId
                        && a.ChildId == child.ChildId
                        && a.AttendanceDate >= dateFrom
                        && a.AttendanceDate <= dateTo
                        && a.IsActive)
                    .ToListAsync();

                var presentDays = attendanceRecords.Count(a => a.Status == "present");
                var absentDays = attendanceRecords.Count(a => a.Status == "absent");
                var lateDays = attendanceRecords.Count(a => a.Status == "late");
                var totalRecorded = presentDays + absentDays + lateDays;

                var childStats = new ChildStatisticsDto
                {
                    ChildId = child.ChildId,
                    ChildName = child.Name,
                    PresentDays = presentDays,
                    AbsentDays = absentDays,
                    LateDays = lateDays,
                    TotalRecordedDays = totalRecorded,
                    AttendanceRate = totalRecorded > 0
                        ? Math.Round((decimal)presentDays / totalRecorded * 100, 1)
                        : 0
                };

                childrenStatistics.Add(childStats);
            }

            // クラス全体の平均出席率を計算
            var averageRate = childrenStatistics.Any()
                ? Math.Round(childrenStatistics.Average(s => s.AttendanceRate), 1)
                : 0;

            return new ClassStatisticsDto
            {
                ClassId = classId,
                TotalChildren = children.Count,
                AverageAttendanceRate = averageRate,
                ChildrenStatistics = childrenStatistics
            };
        }

        /// <summary>
        /// 月別出席統計を取得（グラフ表示用）
        /// </summary>
        public async Task<List<MonthlyAttendanceStatsDto>> GetMonthlyStatisticsAsync(
            int nurseryId,
            DateTime dateFrom,
            DateTime dateTo,
            List<string>? classIds = null)
        {
            _logger.LogInformation(
                "月別統計取得開始: NurseryId={NurseryId}, DateFrom={DateFrom}, DateTo={DateTo}",
                nurseryId, dateFrom, dateTo);

            // 対象クラスの取得
            var classesQuery = _context.Classes
                .Where(c => c.NurseryId == nurseryId && c.IsActive);

            if (classIds != null && classIds.Any())
            {
                classesQuery = classesQuery.Where(c => classIds.Contains(c.ClassId));
            }

            var classes = await classesQuery.ToListAsync();
            var monthlyStats = new List<MonthlyAttendanceStatsDto>();

            // 月のリストを生成
            var months = new List<(int Year, int Month)>();
            var current = new DateTime(dateFrom.Year, dateFrom.Month, 1);
            var end = new DateTime(dateTo.Year, dateTo.Month, 1);

            while (current <= end)
            {
                months.Add((current.Year, current.Month));
                current = current.AddMonths(1);
            }

            // クラスごと、月ごとに統計を計算
            foreach (var classItem in classes)
            {
                foreach (var (year, month) in months)
                {
                    var monthStart = new DateTime(year, month, 1);
                    var monthEnd = monthStart.AddMonths(1).AddDays(-1);

                    // 期間を調整
                    var actualStart = monthStart < dateFrom ? dateFrom : monthStart;
                    var actualEnd = monthEnd > dateTo ? dateTo : monthEnd;

                    // 該当月の出欠データを取得
                    var attendanceData = await _context.DailyAttendances
                        .Where(a => a.NurseryId == nurseryId
                            && a.AttendanceDate >= actualStart
                            && a.AttendanceDate <= actualEnd
                            && a.IsActive)
                        .Join(_context.Children,
                            a => new { a.NurseryId, a.ChildId },
                            c => new { c.NurseryId, c.ChildId },
                            (a, c) => new { Attendance = a, Child = c })
                        .Where(x => x.Child.ClassId == classItem.ClassId && x.Child.IsActive)
                        .Select(x => x.Attendance)
                        .ToListAsync();

                    var presentDays = attendanceData.Count(a => a.Status == "present");
                    var absentDays = attendanceData.Count(a => a.Status == "absent");
                    var lateDays = attendanceData.Count(a => a.Status == "late");
                    var totalRecorded = presentDays + absentDays + lateDays;

                    var attendanceRate = totalRecorded > 0
                        ? Math.Round((decimal)presentDays / totalRecorded * 100, 1)
                        : 0;

                    monthlyStats.Add(new MonthlyAttendanceStatsDto
                    {
                        Month = $"{year:0000}-{month:00}",
                        ClassId = classItem.ClassId,
                        ClassName = classItem.Name,
                        AttendanceRate = attendanceRate,
                        PresentDays = presentDays,
                        AbsentDays = absentDays,
                        LateDays = lateDays
                    });
                }
            }

            _logger.LogInformation(
                "月別統計取得完了: データ件数={Count}",
                monthlyStats.Count);

            return monthlyStats.OrderBy(s => s.Month).ThenBy(s => s.ClassId).ToList();
        }
    }
}
