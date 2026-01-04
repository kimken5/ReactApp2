namespace ReactApp.Server.DTOs.InfantRecords;

/// <summary>
/// 週次生活記録レスポンスDTO
/// </summary>
public class WeeklyRecordResponseDto
{
    public List<ChildWeeklyRecordDto> Children { get; set; } = new();
}

/// <summary>
/// 園児ごとの週次記録DTO
/// </summary>
public class ChildWeeklyRecordDto
{
    public int ChildId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public Dictionary<string, DailyRecordDto> DailyRecords { get; set; } = new();
}

/// <summary>
/// 日ごとの記録DTO (日付: "2026-01-04" → データ)
/// </summary>
public class DailyRecordDto
{
    public HomeRecordDto? Home { get; set; }
    public MorningRecordDto? Morning { get; set; }
    public AfternoonRecordDto? Afternoon { get; set; }
    public ToiletingRecordDto? Toileting { get; set; }
}

/// <summary>
/// 家庭記録DTO (保護者入力 - 読取専用)
/// </summary>
public class HomeRecordDto
{
    public TemperatureRecordDto? Temperature { get; set; }
    public ParentNoteRecordDto? ParentNote { get; set; }
}

/// <summary>
/// 午前記録DTO (スタッフ入力 - 編集可)
/// </summary>
public class MorningRecordDto
{
    public TemperatureRecordDto? Temperature { get; set; }
    public MealRecordDto? Snack { get; set; }
    public MoodRecordDto? Mood { get; set; }
}

/// <summary>
/// 午後記録DTO (スタッフ入力 - 編集可)
/// </summary>
public class AfternoonRecordDto
{
    public MoodRecordDto? Mood { get; set; }
    public MealRecordDto? Lunch { get; set; }
    public SleepRecordDto? Nap { get; set; }
    public TemperatureRecordDto? Temperature { get; set; }
    public MealRecordDto? Snack { get; set; }
}

/// <summary>
/// 排泄記録DTO (スタッフ入力 - 編集可)
/// </summary>
public class ToiletingRecordDto
{
    public int? Id { get; set; }
    public string? UrineAmount { get; set; } // 'Little', 'Normal', 'Lot'
    public string? BowelCondition { get; set; } // 'Normal', 'Hard', 'Soft', 'Diarrhea'
    public string? BowelColor { get; set; } // 'Normal', 'Green', 'White', 'Black', 'Bloody'
    public int? DiaperChangeCount { get; set; }
    public bool Readonly { get; set; } // 常にfalse (スタッフ入力)
}

/// <summary>
/// 体温記録DTO
/// </summary>
public class TemperatureRecordDto
{
    public int? Id { get; set; }
    public string? Value { get; set; } // "36.0" (小数点1桁の文字列)
    public string? Time { get; set; } // "08:30"
    public bool Readonly { get; set; } // CreatedByType = 'Parent' の場合 true
}

/// <summary>
/// 保護者メモ記録DTO
/// </summary>
public class ParentNoteRecordDto
{
    public int? Id { get; set; }
    public string? Text { get; set; }
    public bool Readonly { get; set; } // 常にtrue (保護者入力)
}

/// <summary>
/// 食事記録DTO
/// </summary>
public class MealRecordDto
{
    public int? Id { get; set; }
    public string? Amount { get; set; } // 'All', 'Most', 'Half', 'Little', 'None'
    public bool Readonly { get; set; } // 常にfalse (スタッフ入力)
}

/// <summary>
/// 機嫌記録DTO
/// </summary>
public class MoodRecordDto
{
    public int? Id { get; set; }
    public string? State { get; set; } // 'VeryGood', 'Good', 'Normal', 'Bad', 'Crying'
    public bool Readonly { get; set; } // 常にfalse (スタッフ入力)
}

/// <summary>
/// 睡眠記録DTO
/// </summary>
public class SleepRecordDto
{
    public int? Id { get; set; }
    public string? Start { get; set; } // "12:30"
    public string? End { get; set; } // "14:00"
    public int? Duration { get; set; } // 90 (分)
    public string? SleepQuality { get; set; } // 'Deep', 'Normal', 'Light', 'Restless'
    public bool Readonly { get; set; } // 常にfalse (スタッフ入力)
}
