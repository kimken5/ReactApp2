using ReactApp.Server.DTOs.Desktop;

namespace ReactApp.Server.Services;

/// <summary>
/// デスクトップアプリ用出欠表管理サービスインターフェース
/// </summary>
public interface IDesktopAttendanceService
{
    /// <summary>
    /// 指定日・クラスの出欠状況を取得
    /// </summary>
    Task<List<AttendanceDto>> GetAttendanceByClassAndDateAsync(int nurseryId, string classId, DateTime date);

    /// <summary>
    /// 出欠履歴を取得
    /// </summary>
    Task<(List<AttendanceDto> Attendances, AttendanceHistorySummaryDto Summary)> GetAttendanceHistoryAsync(
        int nurseryId, string classId, DateTime startDate, DateTime endDate, int? childId = null);

    /// <summary>
    /// 出欠ステータスを更新
    /// </summary>
    Task<AttendanceDto> UpdateAttendanceAsync(int nurseryId, int childId, DateTime date, UpdateAttendanceRequest request);

    /// <summary>
    /// 備考のみを更新
    /// </summary>
    Task<AttendanceDto> UpdateAttendanceNotesAsync(int nurseryId, int childId, DateTime date, UpdateAttendanceNotesRequest request);

    /// <summary>
    /// クラス全員を一括で出席に登録（未記録の園児のみ）
    /// </summary>
    Task<BulkPresentResponse> BulkPresentAsync(BulkPresentRequest request);
}
