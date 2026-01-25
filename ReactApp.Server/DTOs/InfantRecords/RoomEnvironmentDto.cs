using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.InfantRecords;

/// <summary>
/// 室温・湿度記録DTO
/// </summary>
public class RoomEnvironmentDto
{
    public int NurseryId { get; set; }
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; }
    public decimal Temperature { get; set; }
    public decimal Humidity { get; set; }
    public DateTime RecordedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public int CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UpdatedBy { get; set; }
}

/// <summary>
/// 室温・湿度記録作成DTO
/// </summary>
public class CreateRoomEnvironmentDto
{
    [Required]
    public string ClassId { get; set; } = null!;

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    [Range(10.0, 35.0, ErrorMessage = "室温は10.0～35.0℃の範囲で入力してください")]
    public decimal Temperature { get; set; }

    [Required]
    [Range(0.0, 100.0, ErrorMessage = "湿度は0.0～100.0%の範囲で入力してください")]
    public decimal Humidity { get; set; }

    [Required]
    public DateTime RecordedAt { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}

/// <summary>
/// 室温・湿度記録更新DTO (Upsert対応)
/// </summary>
public class UpdateRoomEnvironmentDto
{
    [Required]
    public string ClassId { get; set; } = null!;

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    [Range(10.0, 35.0, ErrorMessage = "室温は10.0～35.0℃の範囲で入力してください")]
    public decimal Temperature { get; set; }

    [Required]
    [Range(0.0, 100.0, ErrorMessage = "湿度は0.0～100.0%の範囲で入力してください")]
    public decimal Humidity { get; set; }

    [Required]
    public DateTime RecordedAt { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}
