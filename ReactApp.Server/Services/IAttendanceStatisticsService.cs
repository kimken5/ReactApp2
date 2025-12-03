using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 出席統計サービスのインターフェース
    /// </summary>
    public interface IAttendanceStatisticsService
    {
        /// <summary>
        /// 出席統計レポートを取得
        /// </summary>
        /// <param name="request">統計リクエスト</param>
        /// <returns>統計レポート</returns>
        Task<AttendanceStatisticsResponseDto> GetAttendanceStatisticsAsync(AttendanceStatisticsRequestDto request);

        /// <summary>
        /// 月別出席統計を取得（グラフ表示用）
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="dateFrom">開始日</param>
        /// <param name="dateTo">終了日</param>
        /// <param name="classIds">クラスIDリスト（省略時は全クラス）</param>
        /// <returns>月別統計リスト</returns>
        Task<List<MonthlyAttendanceStatsDto>> GetMonthlyStatisticsAsync(
            int nurseryId,
            DateTime dateFrom,
            DateTime dateTo,
            List<string>? classIds = null);
    }
}
