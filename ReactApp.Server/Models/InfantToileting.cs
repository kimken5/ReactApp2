using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

[Table("InfantToileting")]
public class InfantToileting
{
    [Required]
    public int NurseryId { get; set; }

    [Required]
    public int ChildId { get; set; }

    [Required]
    [Column(TypeName = "date")]
    public DateTime RecordDate { get; set; }

    [Required]
    public DateTime ToiletingTime { get; set; }

    [Required]
    [StringLength(20)]
    public string ToiletingType { get; set; } = null!; // 'Urine', 'Bowel'

    [StringLength(20)]
    public string? BowelCondition { get; set; } // 'Normal', 'Soft', 'Diarrhea', 'Hard'

    [StringLength(20)]
    public string? BowelColor { get; set; } // 'Normal', 'Green', 'White', 'Black', 'Bloody'

    [StringLength(20)]
    public string? UrineAmount { get; set; } // 'Little', 'Normal', 'Lot'

    public int? DiaperChangeCount { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public int CreatedBy { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    [Required]
    public int UpdatedBy { get; set; }
}
