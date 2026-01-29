using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

[Table("InfantSleeps")]
public class InfantSleep
{
    [Required]
    public int NurseryId { get; set; }

    [Required]
    public int ChildId { get; set; }

    [Required]
    [Column(TypeName = "date")]
    public DateTime RecordDate { get; set; }

    [Required]
    public int SleepSequence { get; set; } = 1;

    [Required]
    [Column(TypeName = "time")]
    public TimeSpan StartTime { get; set; }

    [Column(TypeName = "time")]
    public TimeSpan? EndTime { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    public int? DurationMinutes { get; set; }

    [StringLength(20)]
    public string? SleepQuality { get; set; }

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
