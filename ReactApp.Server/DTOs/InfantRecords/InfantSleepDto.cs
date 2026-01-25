using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.InfantRecords;

/// <summary>
/// 乳児睡眠記録DTO
/// </summary>
public class InfantSleepDto
{
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; }
    public int SleepSequence { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? DurationMinutes { get; set; }
    public string? SleepQuality { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public int CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UpdatedBy { get; set; }
}

/// <summary>
/// 乳児睡眠記録作成DTO
/// </summary>
public class CreateInfantSleepDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    public int SleepSequence { get; set; } = 1;

    [Required]
    public DateTime StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    [StringLength(20)]
    public string? SleepQuality { get; set; } // 'Deep', 'Normal', 'Light', 'Restless'

    [StringLength(500)]
    public string? Notes { get; set; }
}

/// <summary>
/// 乳児睡眠記録更新DTO
/// </summary>
public class UpdateInfantSleepDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    public int SleepSequence { get; set; }

    [Required]
    public DateTime StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    [StringLength(20)]
    public string? SleepQuality { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
