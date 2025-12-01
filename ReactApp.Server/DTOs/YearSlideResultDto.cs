namespace ReactApp.Server.DTOs;

/// <summary>
/// 年度スライド実行結果DTO
/// </summary>
public class YearSlideResultDto
{
    /// <summary>
    /// 成功フラグ
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// スライド前年度
    /// </summary>
    public int PreviousYear { get; set; }

    /// <summary>
    /// スライド後年度（新年度）
    /// </summary>
    public int NewYear { get; set; }

    /// <summary>
    /// スライドされた園児数
    /// </summary>
    public int SlidedChildrenCount { get; set; }

    /// <summary>
    /// スライドされた職員数
    /// </summary>
    public int SlidedStaffCount { get; set; }

    /// <summary>
    /// 実行日時
    /// </summary>
    public DateTime ExecutedAt { get; set; }

    /// <summary>
    /// 実行者ユーザーID
    /// </summary>
    public int ExecutedByUserId { get; set; }

    /// <summary>
    /// エラーメッセージ（失敗時）
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// 詳細メッセージ
    /// </summary>
    public List<string> Messages { get; set; } = new();
}
