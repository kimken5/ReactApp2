using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.InfantRecords;

/// <summary>
/// 乳児食事記録DTO
/// </summary>
public class InfantMealDto
{
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; }
    public string MealType { get; set; } = string.Empty;
    public string MealTime { get; set; } = string.Empty; // HH:mm format
    public string? OverallAmount { get; set; }
    public string? Notes { get; set; } // メモ
    public DateTime CreatedAt { get; set; }
    public int CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UpdatedBy { get; set; }
}

/// <summary>
/// 乳児食事記録作成DTO
/// </summary>
public class CreateInfantMealDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    [StringLength(20)]
    public string MealType { get; set; } = string.Empty; // 'Breakfast', 'Lunch', 'MorningSnack', 'AfternoonSnack'

    [Required(ErrorMessage = "食事時刻は必須です")]
    // TODO: 正規表現バリデーション一時的に無効化してデバッグ
    // [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "時刻の形式が正しくありません (HH:mm)")]
    public string MealTime { get; set; } = string.Empty; // HH:mm format

    [StringLength(20)]
    public string? OverallAmount { get; set; } // 'All', 'Most', 'Half', 'Little', 'None'

    [StringLength(500)]
    public string? Notes { get; set; } // メモ
}

/// <summary>
/// 乳児食事記録更新DTO
/// </summary>
public class UpdateInfantMealDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    [StringLength(20)]
    public string MealType { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "時刻の形式が正しくありません (HH:mm)")]
    public string MealTime { get; set; } = string.Empty; // HH:mm format

    [StringLength(20)]
    public string? OverallAmount { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; } // メモ
}
