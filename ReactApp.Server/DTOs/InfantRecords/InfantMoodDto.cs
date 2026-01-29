using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.InfantRecords;

/// <summary>
/// 乳児機嫌記録DTO
/// </summary>
public class InfantMoodDto
{
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; }
    public string MoodTime { get; set; } = string.Empty; // HH:mm format
    public string MoodState { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? CreatedByName { get; set; } // 入力者名
    public DateTime CreatedAt { get; set; }
    public int CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UpdatedBy { get; set; }
}

/// <summary>
/// 乳児機嫌記録作成DTO
/// </summary>
public class CreateInfantMoodDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    [StringLength(5)] // HH:mm format
    public string MoodTime { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string MoodState { get; set; } = string.Empty; // 'Good', 'Normal', 'Bad', 'Crying'

    [StringLength(500)]
    public string? Notes { get; set; }
}

/// <summary>
/// 乳児機嫌記録更新DTO
/// </summary>
public class UpdateInfantMoodDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    [StringLength(5)] // HH:mm format
    public string MoodTime { get; set; } = string.Empty; // 識別用の時刻（複合キーのため変更不可）

    [Required]
    [StringLength(20)]
    public string MoodState { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Notes { get; set; }
}
