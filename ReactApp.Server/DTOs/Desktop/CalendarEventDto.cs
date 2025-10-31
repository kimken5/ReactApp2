namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// カレンダーイベント情報DTO
/// </summary>
public class CalendarEventDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public bool IsAllDay { get; set; }
    public string? TargetClassId { get; set; }
    public int? TargetGrade { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// カレンダーイベント作成リクエストDTO
/// </summary>
public class CreateCalendarEventRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public bool IsAllDay { get; set; }
    public string? TargetClassId { get; set; }
    public int? TargetGrade { get; set; }
}

/// <summary>
/// カレンダーイベント更新リクエストDTO
/// </summary>
public class UpdateCalendarEventRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public bool IsAllDay { get; set; }
    public string? TargetClassId { get; set; }
    public int? TargetGrade { get; set; }
}

/// <summary>
/// API共通レスポンス
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public ApiError? Error { get; set; }
}

/// <summary>
/// APIエラー情報
/// </summary>
public class ApiError
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
