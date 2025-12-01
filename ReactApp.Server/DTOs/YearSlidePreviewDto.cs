namespace ReactApp.Server.DTOs;

/// <summary>
/// 年度スライドプレビューDTO
/// </summary>
public class YearSlidePreviewDto
{
    /// <summary>
    /// 現在年度
    /// </summary>
    public int CurrentYear { get; set; }

    /// <summary>
    /// スライド先年度
    /// </summary>
    public int TargetYear { get; set; }

    /// <summary>
    /// 影響を受ける園児数
    /// </summary>
    public int AffectedChildrenCount { get; set; }

    /// <summary>
    /// 影響を受ける職員数
    /// </summary>
    public int AffectedStaffCount { get; set; }

    /// <summary>
    /// クラス別園児数サマリー
    /// </summary>
    public List<ClassChildrenSummary> ClassSummaries { get; set; } = new();

    /// <summary>
    /// クラス別職員数サマリー
    /// </summary>
    public List<ClassStaffSummary> StaffSummaries { get; set; } = new();

    /// <summary>
    /// 警告メッセージ
    /// </summary>
    public List<string> Warnings { get; set; } = new();
}

/// <summary>
/// クラス別園児数サマリー
/// </summary>
public class ClassChildrenSummary
{
    /// <summary>
    /// クラスID
    /// </summary>
    public string ClassId { get; set; } = string.Empty;

    /// <summary>
    /// クラス名
    /// </summary>
    public string ClassName { get; set; } = string.Empty;

    /// <summary>
    /// 園児数
    /// </summary>
    public int ChildrenCount { get; set; }
}

/// <summary>
/// クラス別職員数サマリー
/// </summary>
public class ClassStaffSummary
{
    /// <summary>
    /// クラスID
    /// </summary>
    public string ClassId { get; set; } = string.Empty;

    /// <summary>
    /// クラス名
    /// </summary>
    public string ClassName { get; set; } = string.Empty;

    /// <summary>
    /// 職員数
    /// </summary>
    public int StaffCount { get; set; }
}
