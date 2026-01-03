using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

[Table("InfantTemperatures")]
public class InfantTemperature
{
    [Required]
    public int NurseryId { get; set; }

    [Required]
    public int ChildId { get; set; }

    [Required]
    [Column(TypeName = "date")]
    public DateTime RecordDate { get; set; }

    [Required]
    [StringLength(20)]
    public string MeasurementType { get; set; } = null!; // 'Home', 'Morning', 'Afternoon'

    [Required]
    public DateTime MeasuredAt { get; set; }

    [Required]
    [Column(TypeName = "decimal(3,1)")]
    public decimal Temperature { get; set; }

    public bool IsAbnormal { get; set; } = false;

    [Required]
    [StringLength(20)]
    public string CreatedByType { get; set; } = "Staff"; // 'Parent', 'Staff'

    public bool IsDraft { get; set; } = false;

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public int CreatedBy { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    [Required]
    public int UpdatedBy { get; set; }
}
