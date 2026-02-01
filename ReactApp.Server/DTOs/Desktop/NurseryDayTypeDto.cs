namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// 休園日・休日保育DTO
/// </summary>
public class NurseryDayTypeDto
{
    public int Id { get; set; }
    public string NurseryId { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty; // ISO date string (YYYY-MM-DD)
    public string DayType { get; set; } = string.Empty; // ClosedDay / HolidayCare
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// 休園日・休日保育作成リクエストDTO
/// </summary>
public class CreateNurseryDayTypeRequestDto
{
    public string Date { get; set; } = string.Empty; // ISO date string (YYYY-MM-DD)
    public string DayType { get; set; } = string.Empty; // ClosedDay / HolidayCare
}

/// <summary>
/// 休園日・休日保育更新リクエストDTO
/// </summary>
public class UpdateNurseryDayTypeRequestDto
{
    public string DayType { get; set; } = string.Empty; // ClosedDay / HolidayCare
}
