namespace ReactApp.Server.DTOs.InfantRecords;

/// <summary>
/// 体温更新リクエストDTO
/// </summary>
public class UpdateTemperatureDto
{
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public string MeasurementType { get; set; } = string.Empty; // 'Home', 'Morning', 'Afternoon'
    public decimal Temperature { get; set; }
    public string MeasurementTime { get; set; } = string.Empty; // "HH:mm" format
    public int UpdatedBy { get; set; }
}

/// <summary>
/// 食事更新リクエストDTO
/// </summary>
public class UpdateMealDto
{
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public string MealType { get; set; } = string.Empty; // 'Breakfast', 'Lunch', 'Snack'
    public string Amount { get; set; } = string.Empty; // 'All', 'Most', 'Half', 'Little', 'None'
    public int UpdatedBy { get; set; }
}

/// <summary>
/// 機嫌更新リクエストDTO
/// </summary>
public class UpdateMoodDto
{
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public string MoodTime { get; set; } = string.Empty; // 'Morning', 'Afternoon'
    public string State { get; set; } = string.Empty; // 'Good', 'Normal', 'Bad', 'Crying'
    public int UpdatedBy { get; set; }
}

/// <summary>
/// 睡眠更新リクエストDTO
/// </summary>
public class UpdateSleepDto
{
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public int SleepSequence { get; set; } = 1;
    public string StartTime { get; set; } = string.Empty; // "HH:mm" format
    public string EndTime { get; set; } = string.Empty; // "HH:mm" format
    public int UpdatedBy { get; set; }
}

/// <summary>
/// 排泄更新リクエストDTO (旧バージョン - InfantToiletingDto.csを使用)
/// </summary>
[Obsolete("Use UpdateInfantToiletingDto from InfantToiletingDto.cs instead")]
public class UpdateToiletingDto
{
    public bool HasUrine { get; set; }
    public string? UrineAmount { get; set; } // 'Little', 'Normal', 'Lot'
    public bool HasStool { get; set; }
    public string? BowelAmount { get; set; } // 'Little', 'Normal', 'Lot'
    public string? BowelCondition { get; set; } // 'Normal', 'Hard', 'Soft', 'Diarrhea'
    public int UpdatedBy { get; set; }
}
