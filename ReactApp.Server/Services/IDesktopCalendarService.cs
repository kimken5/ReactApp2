using ReactApp.Server.DTOs.Desktop;

namespace ReactApp.Server.Services;

/// <summary>
/// デスクトップアプリ用カレンダーサービスインターフェース
/// </summary>
public interface IDesktopCalendarService
{
    /// <summary>
    /// 期間内のイベント一覧を取得
    /// </summary>
    Task<List<CalendarEventDto>> GetEventsAsync(int nurseryId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// イベント詳細を取得
    /// </summary>
    Task<CalendarEventDto?> GetEventByIdAsync(int nurseryId, int eventId);

    /// <summary>
    /// イベントを作成
    /// </summary>
    Task<CalendarEventDto> CreateEventAsync(int nurseryId, CreateCalendarEventRequestDto request, string createdBy);

    /// <summary>
    /// イベントを更新
    /// </summary>
    Task<CalendarEventDto> UpdateEventAsync(int nurseryId, int eventId, UpdateCalendarEventRequestDto request);

    /// <summary>
    /// イベントを削除
    /// </summary>
    Task<bool> DeleteEventAsync(int nurseryId, int eventId);
}
