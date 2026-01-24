using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

/// <summary>
/// 乳児午睡チェック記録（SIDS予防）
/// </summary>
[Table("InfantSleepChecks")]
public class InfantSleepCheck
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int NurseryId { get; set; }

    [Required]
    public int ChildId { get; set; }

    [Required]
    [Column(TypeName = "date")]
    public DateTime RecordDate { get; set; }

    [Required]
    public int SleepSequence { get; set; }

    [Required]
    [Column(TypeName = "time")]
    public TimeSpan CheckTime { get; set; }

    [Required]
    [StringLength(20)]
    public string BreathingStatus { get; set; } = string.Empty; // Normal, Abnormal

    [Required]
    [StringLength(20)]
    public string HeadDirection { get; set; } = string.Empty; // Left, Right, FaceUp

    [Required]
    [StringLength(20)]
    public string BodyTemperature { get; set; } = string.Empty; // Normal, SlightlyWarm, Cold

    [Required]
    [StringLength(20)]
    public string FaceColor { get; set; } = string.Empty; // Normal, Pale, Purple

    [Required]
    [StringLength(20)]
    public string BodyPosition { get; set; } = string.Empty; // OnBack, OnSide, FaceDown

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
