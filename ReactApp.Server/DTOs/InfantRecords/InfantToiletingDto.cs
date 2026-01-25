using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.InfantRecords;

/// <summary>
/// 乳児排泄記録DTO
/// </summary>
public class InfantToiletingDto
{
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; }
    public DateTime ToiletingTime { get; set; }
    public bool HasUrine { get; set; }
    public string? UrineAmount { get; set; }
    public bool HasStool { get; set; }
    public string? BowelAmount { get; set; }
    public string? BowelCondition { get; set; }
    public DateTime CreatedAt { get; set; }
    public int CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UpdatedBy { get; set; }
}

/// <summary>
/// 乳児排泄記録作成DTO
/// </summary>
public class CreateInfantToiletingDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    public DateTime ToiletingTime { get; set; }

    [Required]
    public bool HasUrine { get; set; }

    [StringLength(20)]
    public string? UrineAmount { get; set; } // 'Little', 'Normal', 'Lot'

    [Required]
    public bool HasStool { get; set; }

    [StringLength(20)]
    public string? BowelAmount { get; set; } // 'Little', 'Normal', 'Lot'

    [StringLength(20)]
    public string? BowelCondition { get; set; } // 'Normal', 'Soft', 'Diarrhea', 'Hard', 'Bloody'
}

/// <summary>
/// 乳児排泄記録更新DTO
/// </summary>
public class UpdateInfantToiletingDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    public DateTime ToiletingTime { get; set; }

    [Required]
    public bool HasUrine { get; set; }

    [StringLength(20)]
    public string? UrineAmount { get; set; }

    [Required]
    public bool HasStool { get; set; }

    [StringLength(20)]
    public string? BowelAmount { get; set; }

    [StringLength(20)]
    public string? BowelCondition { get; set; }
}
