using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

[Table("InfantMeals")]
public class InfantMeal
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
    public string MealType { get; set; } = null!; // 'Breakfast', 'Lunch', 'Snack'

    [StringLength(20)]
    public string? OverallAmount { get; set; } // 'All', 'Most', 'Half', 'Little', 'None'

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public int CreatedBy { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    [Required]
    public int UpdatedBy { get; set; }
}
