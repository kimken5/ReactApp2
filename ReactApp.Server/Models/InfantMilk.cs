using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

/// <summary>
/// 乳児ミルク記録（0歳児向け）
/// </summary>
[Table("InfantMilks")]
public class InfantMilk
{
    [Key]
    [Column(Order = 0)]
    [Required]
    public int NurseryId { get; set; }

    [Key]
    [Column(Order = 1)]
    [Required]
    public int ChildId { get; set; }

    [Key]
    [Required]
    [Column(TypeName = "date", Order = 2)]
    public DateTime RecordDate { get; set; }

    [Key]
    [Required]
    [Column(TypeName = "time", Order = 3)]
    public TimeSpan MilkTime { get; set; }

    [Required]
    [Range(10, 300, ErrorMessage = "ミルク量は10～300mLの範囲で入力してください")]
    public int AmountMl { get; set; }

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
