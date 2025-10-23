using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 連絡帳返信テーブル
/// </summary>
public partial class DailyReportResponse
{
    /// <summary>
    /// 返信ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 連絡帳ID
    /// </summary>
    public int DailyReportId { get; set; }

    /// <summary>
    /// 保護者ID
    /// </summary>
    public int ParentId { get; set; }

    /// <summary>
    /// 返信メッセージ
    /// </summary>
    public string? ResponseMessage { get; set; }

    /// <summary>
    /// 既読フラグ
    /// </summary>
    public bool IsRead { get; set; }

    /// <summary>
    /// 既読日時
    /// </summary>
    public DateTime? ReadAt { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
