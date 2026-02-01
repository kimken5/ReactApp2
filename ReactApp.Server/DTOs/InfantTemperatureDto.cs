using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.InfantRecords;

/// <summary>
/// 乳児体温記録DTO
/// </summary>
public class InfantTemperatureDto
{
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; }
    public string MeasurementType { get; set; } = string.Empty; // 'Morning', 'Afternoon'
    public DateTime MeasuredAt { get; set; }
    public string MeasuredTime { get; set; } = string.Empty; // HH:mm形式
    public decimal Temperature { get; set; }
    public string MeasurementLocation { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public bool IsAbnormal { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// 乳児体温記録作成DTO
/// </summary>
public class CreateInfantTemperatureDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    [StringLength(20)]
    public string MeasurementType { get; set; } = null!; // 'Morning', 'Afternoon'

    [Required]
    public DateTime MeasuredAt { get; set; }

    [Required]
    [Range(30.0, 45.0)]
    public decimal Temperature { get; set; }

    [Required]
    [StringLength(20)]
    public string MeasurementLocation { get; set; } = "Armpit"; // 'Armpit', 'Ear', 'Forehead'

    [StringLength(500)]
    public string? Notes { get; set; }

    public bool IsAbnormal { get; set; } = false;
}

/// <summary>
/// 乳児体温記録更新DTO
/// </summary>
public class UpdateInfantTemperatureDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    [StringLength(20)]
    public string MeasurementType { get; set; } = null!;

    [Required]
    public DateTime MeasuredAt { get; set; }

    [Required]
    [Range(30.0, 45.0)]
    public decimal Temperature { get; set; }

    [Required]
    [StringLength(20)]
    public string MeasurementLocation { get; set; } = "Armpit";

    [StringLength(500)]
    public string? Notes { get; set; }

    public bool IsAbnormal { get; set; } = false;
}
