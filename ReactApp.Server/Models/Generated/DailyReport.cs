using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 連絡帳テーブル
/// </summary>
public partial class DailyReport
{
    /// <summary>
    /// 連絡帳ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 園児ID
    /// </summary>
    public int ChildId { get; set; }

    /// <summary>
    /// 職員保育園ID
    /// </summary>
    public int StaffNurseryId { get; set; }

    /// <summary>
    /// 職員ID
    /// </summary>
    public int StaffId { get; set; }

    /// <summary>
    /// 対象日
    /// </summary>
    public DateOnly ReportDate { get; set; }

    /// <summary>
    /// カテゴリー
    /// </summary>
    public string Category { get; set; } = null!;

    /// <summary>
    /// タイトル
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// 内容
    /// </summary>
    public string Content { get; set; } = null!;

    /// <summary>
    /// タグ
    /// </summary>
    public string? Tags { get; set; }

    /// <summary>
    /// 写真
    /// </summary>
    public string? Photos { get; set; }

    /// <summary>
    /// ステータス
    /// </summary>
    public string Status { get; set; } = null!;

    /// <summary>
    /// 公開日時
    /// </summary>
    public DateTime? PublishedAt { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
