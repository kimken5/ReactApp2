using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

/// <summary>
/// 室温・湿度記録（午睡チェックと連動）
/// </summary>
[Table("RoomEnvironmentRecords")]
public class RoomEnvironmentRecord
{
    [Required]
    public int NurseryId { get; set; }

    [Required]
    public int ClassId { get; set; }

    [Required]
    [Column(TypeName = "date")]
    public DateTime RecordDate { get; set; }

    [Required]
    [Column(TypeName = "decimal(3,1)")]
    [Range(10.0, 35.0, ErrorMessage = "室温は10.0～35.0℃の範囲で入力してください")]
    public decimal Temperature { get; set; }

    [Required]
    [Column(TypeName = "decimal(4,1)")]
    [Range(0.0, 100.0, ErrorMessage = "湿度は0.0～100.0%の範囲で入力してください")]
    public decimal Humidity { get; set; }

    [Required]
    public DateTime RecordedAt { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public int CreatedBy { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    [Required]
    public int UpdatedBy { get; set; }
}
