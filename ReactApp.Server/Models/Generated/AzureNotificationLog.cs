using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// Azure通知ログテーブル
/// </summary>
public partial class AzureNotificationLog
{
    /// <summary>
    /// ログID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// デバイスID
    /// </summary>
    public string DeviceId { get; set; } = null!;

    /// <summary>
    /// 通知種別
    /// </summary>
    public string NotificationType { get; set; } = null!;

    /// <summary>
    /// タイトル
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// 本文
    /// </summary>
    public string Body { get; set; } = null!;

    /// <summary>
    /// JSONペイロード
    /// </summary>
    public string? JsonPayload { get; set; }

    /// <summary>
    /// プラットフォーム
    /// </summary>
    public string Platform { get; set; } = null!;

    /// <summary>
    /// 通知状態
    /// </summary>
    public string? NotificationState { get; set; }

    /// <summary>
    /// 送信日時
    /// </summary>
    public DateTime? SentAt { get; set; }

    /// <summary>
    /// 予定日時
    /// </summary>
    public DateTime? ScheduledAt { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
