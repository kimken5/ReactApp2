using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs;

/// <summary>
/// クラス一括体温入力リクエスト
/// </summary>
public class ClassTemperatureBulkRequest
{
    [Required]
    public int NurseryId { get; set; }

    [Required]
    [StringLength(50)]
    public string ClassId { get; set; } = string.Empty;

    [Required]
    public DateTime RecordDate { get; set; }

    [Required]
    public List<ChildTemperatureData> Temperatures { get; set; } = new();
}

/// <summary>
/// 園児別体温データ
/// </summary>
public class ChildTemperatureData
{
    [Required]
    public int ChildId { get; set; }

    public TemperatureMeasurement? Morning { get; set; }

    public TemperatureMeasurement? Afternoon { get; set; }
}

/// <summary>
/// 体温測定データ
/// </summary>
public class TemperatureMeasurement
{
    [Required]
    [Range(35.0, 42.0, ErrorMessage = "体温は35.0～42.0℃の範囲で入力してください")]
    public decimal Temperature { get; set; }

    [Required]
    [StringLength(20)]
    public string MeasurementLocation { get; set; } = "Armpit"; // Armpit, Ear, Forehead

    [Required]
    public DateTime MeasuredAt { get; set; }

    public string? Notes { get; set; }
}

/// <summary>
/// クラス一括体温入力レスポンス
/// </summary>
public class ClassTemperatureBulkResponse
{
    public bool Success { get; set; }
    public int SavedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<TemperatureWarning> Warnings { get; set; } = new();
}

/// <summary>
/// 体温警告情報
/// </summary>
public class TemperatureWarning
{
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public string MeasurementType { get; set; } = string.Empty; // Morning, Afternoon
    public decimal Temperature { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// クラス体温一覧取得レスポンス
/// </summary>
public class ClassTemperatureListResponse
{
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; }
    public List<ChildTemperatureInfo> Children { get; set; } = new();
}

/// <summary>
/// 園児体温情報
/// </summary>
public class ChildTemperatureInfo
{
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public int AgeMonths { get; set; }
    public HomeTemperatureInfo? Home { get; set; }
    public MorningTemperatureInfo? Morning { get; set; }
    public AfternoonTemperatureInfo? Afternoon { get; set; }
}

/// <summary>
/// 朝の体温情報
/// </summary>
public class MorningTemperatureInfo
{
    public decimal? Temperature { get; set; }
    public string? MeasurementLocation { get; set; }
    public DateTime? MeasuredAt { get; set; }
    public bool IsParentInput { get; set; }
    public bool IsAbnormal { get; set; }
}

/// <summary>
/// 家庭での体温情報(保護者入力)
/// </summary>
public class HomeTemperatureInfo
{
    public decimal? Temperature { get; set; }
    public string? MeasurementLocation { get; set; }
    public DateTime? MeasuredAt { get; set; }
    public bool IsAbnormal { get; set; }
}

/// <summary>
/// 午後の体温情報
/// </summary>
public class AfternoonTemperatureInfo
{
    public decimal? Temperature { get; set; }
    public string? MeasurementLocation { get; set; }
    public DateTime? MeasuredAt { get; set; }
    public bool IsAbnormal { get; set; }
}
