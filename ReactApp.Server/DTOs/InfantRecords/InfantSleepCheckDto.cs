using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.InfantRecords;

/// <summary>
/// 乳児午睡チェック記録DTO
/// </summary>
public class InfantSleepCheckDto
{
    public int Id { get; set; }
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; }
    public int SleepSequence { get; set; }
    public string CheckTime { get; set; } = string.Empty; // HH:mm format
    public string BreathingStatus { get; set; } = string.Empty; // Normal, Abnormal
    public string HeadDirection { get; set; } = string.Empty; // Left, Right, FaceUp
    public string BodyTemperature { get; set; } = string.Empty; // Normal, SlightlyWarm, Cold
    public string FaceColor { get; set; } = string.Empty; // Normal, Pale, Purple
    public string BodyPosition { get; set; } = string.Empty; // OnBack, OnSide, FaceDown
    public string? CreatedByName { get; set; } // 記録者名
    public DateTime CreatedAt { get; set; }
    public int CreatedBy { get; set; }
}

/// <summary>
/// 乳児午睡チェック記録作成DTO
/// </summary>
public class CreateInfantSleepCheckDto
{
    [Required]
    public int ChildId { get; set; }

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    public int SleepSequence { get; set; }

    [Required]
    [StringLength(5)] // HH:mm format
    public string CheckTime { get; set; } = string.Empty;

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
}

/// <summary>
/// 乳児午睡チェック記録更新DTO
/// </summary>
public class UpdateInfantSleepCheckDto
{
    [Required]
    [StringLength(20)]
    public string BreathingStatus { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string HeadDirection { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string BodyTemperature { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string FaceColor { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string BodyPosition { get; set; } = string.Empty;
}

/// <summary>
/// クラス別午睡チェック表用DTO
/// </summary>
public class SleepCheckGridDto
{
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; }
    public decimal? RoomTemperature { get; set; }
    public decimal? Humidity { get; set; }
    public List<ChildSleepCheckDto> Children { get; set; } = new();
}

/// <summary>
/// 園児別午睡チェック情報
/// </summary>
public class ChildSleepCheckDto
{
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public int AgeInMonths { get; set; }
    public string? SleepStartTime { get; set; } // HH:mm format
    public string? SleepEndTime { get; set; } // HH:mm format
    public List<InfantSleepCheckDto> Checks { get; set; } = new();
}
