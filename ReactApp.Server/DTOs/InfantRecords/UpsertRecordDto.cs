namespace ReactApp.Server.DTOs.InfantRecords;

/// <summary>
/// 体温記録の作成または更新リクエストDTO
/// </summary>
public class UpsertTemperatureDto
{
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public string MeasurementType { get; set; } = string.Empty; // 'Home', 'Morning', 'Afternoon'
    public decimal Temperature { get; set; }
    public string MeasurementTime { get; set; } = string.Empty; // "HH:mm" format
}

/// <summary>
/// 食事記録の作成または更新リクエストDTO
/// </summary>
public class UpsertMealDto
{
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public string MealType { get; set; } = string.Empty; // 'MorningSnack', 'Lunch', 'AfternoonSnack'
    public string Amount { get; set; } = string.Empty; // 'All', 'Most', 'Half', 'Little', 'None'
}

/// <summary>
/// 機嫌記録の作成または更新リクエストDTO
/// </summary>
public class UpsertMoodDto
{
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public string MoodTime { get; set; } = string.Empty; // 'Morning', 'Afternoon'
    public string State { get; set; } = string.Empty; // 'Good', 'Normal', 'Bad', 'Crying'
}

/// <summary>
/// 排泄記録の作成または更新リクエストDTO
/// </summary>
public class UpsertToiletingDto
{
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public string? UrineAmount { get; set; } // 'Little', 'Normal', 'Lot'
    public string? BowelCondition { get; set; } // 'Normal', 'Hard', 'Soft', 'Diarrhea'
    public string? BowelColor { get; set; } // 'Normal', 'Green', 'White', 'Black', 'Bloody'
    public int? DiaperChangeCount { get; set; }
}

/// <summary>
/// 睡眠記録の作成または更新リクエストDTO
/// </summary>
public class UpsertSleepDto
{
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public string? StartTime { get; set; } // "HH:mm" format
    public string? EndTime { get; set; } // "HH:mm" format
    public string? SleepQuality { get; set; } // 'Deep', 'Normal', 'Light', 'Restless'
}
