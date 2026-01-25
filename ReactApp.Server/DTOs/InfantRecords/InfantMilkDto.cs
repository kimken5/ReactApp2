using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.InfantRecords;

/// <summary>
/// 乳児ミルク記録DTO
/// </summary>
public class InfantMilkDto
{
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; }
    public string MilkTime { get; set; } = string.Empty; // HH:mm format
    public int AmountMl { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public int CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UpdatedBy { get; set; }
}

/// <summary>
/// 乳児ミルク記録作成DTO
/// </summary>
public class CreateInfantMilkDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    public string MilkTime { get; set; } = string.Empty; // HH:mm format

    [Required]
    [Range(10, 300, ErrorMessage = "ミルク量は10～300mLの範囲で入力してください")]
    public int AmountMl { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}

/// <summary>
/// 乳児ミルク記録更新DTO
/// </summary>
public class UpdateInfantMilkDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    public string MilkTime { get; set; } = string.Empty; // HH:mm format (変更前の時刻・識別用)

    [Required]
    [Range(10, 300, ErrorMessage = "ミルク量は10～300mLの範囲で入力してください")]
    public int AmountMl { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
