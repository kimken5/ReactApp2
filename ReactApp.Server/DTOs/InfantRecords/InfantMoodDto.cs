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
    public TimeOnly RecordTime { get; set; }
    public string MoodState { get; set; } = string.Empty;
    public string? Notes { get; set; }
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
    public TimeOnly RecordTime { get; set; }

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
    public TimeOnly RecordTime { get; set; }

    [Required]
    [StringLength(20)]
    public string MoodState { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Notes { get; set; }
}
