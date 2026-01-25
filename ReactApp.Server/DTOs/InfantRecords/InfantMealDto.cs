using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.InfantRecords;

/// <summary>
/// 乳児食事記録DTO
/// </summary>
public class InfantMealDto
{
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; }
    public string MealType { get; set; } = string.Empty;
    public string? OverallAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public int CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UpdatedBy { get; set; }
}

/// <summary>
/// 乳児食事記録作成DTO
/// </summary>
public class CreateInfantMealDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    [StringLength(20)]
    public string MealType { get; set; } = string.Empty; // 'Breakfast', 'Lunch', 'Snack'

    [StringLength(20)]
    public string? OverallAmount { get; set; } // 'All', 'Most', 'Half', 'Little', 'None'
}

/// <summary>
/// 乳児食事記録更新DTO
/// </summary>
public class UpdateInfantMealDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    [StringLength(20)]
    public string MealType { get; set; } = string.Empty;

    [StringLength(20)]
    public string? OverallAmount { get; set; }
}
