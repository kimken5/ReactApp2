using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 欠席連絡テーブル
/// </summary>
public partial class AbsenceNotification
{
    /// <summary>
    /// 欠席連絡ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 保護者ID
    /// </summary>
    public int ParentId { get; set; }

    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 園児ID
    /// </summary>
    public int ChildId { get; set; }

    /// <summary>
    /// 連絡種別
    /// </summary>
    public string NotificationType { get; set; } = null!;

    /// <summary>
    /// 開始日
    /// </summary>
    public DateTime StartDate { get; set; }

    /// <summary>
    /// 終了日
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// 到着予定時刻
    /// </summary>
    public TimeOnly? ExpectedArrivalTime { get; set; }

    /// <summary>
    /// 理由
    /// </summary>
    public string Reason { get; set; } = null!;

    /// <summary>
    /// 追加メモ
    /// </summary>
    public string? AdditionalNotes { get; set; }

    /// <summary>
    /// 提出日時
    /// </summary>
    public DateTime SubmittedAt { get; set; }

    /// <summary>
    /// ステータス
    /// </summary>
    public string Status { get; set; } = null!;

    /// <summary>
    /// 職員返信
    /// </summary>
    public string? StaffResponse { get; set; }

    /// <summary>
    /// 確認日時
    /// </summary>
    public DateTime? AcknowledgedAt { get; set; }

    /// <summary>
    /// 確認職員ID
    /// </summary>
    public int? AcknowledgedBy { get; set; }
}
