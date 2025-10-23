using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 欠席連絡返信テーブル
/// </summary>
public partial class AbsenceNotificationResponse
{
    /// <summary>
    /// 返信ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 欠席連絡ID
    /// </summary>
    public int AbsenceNotificationId { get; set; }

    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 職員ID
    /// </summary>
    public int StaffId { get; set; }

    /// <summary>
    /// 返信種別
    /// </summary>
    public string ResponseType { get; set; } = null!;

    /// <summary>
    /// 返信メッセージ
    /// </summary>
    public string? ResponseMessage { get; set; }

    /// <summary>
    /// 返信日時
    /// </summary>
    public DateTime ResponseAt { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }
}
