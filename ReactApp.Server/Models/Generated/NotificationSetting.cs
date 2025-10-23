using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 通知設定テーブル
/// </summary>
public partial class NotificationSetting
{
    /// <summary>
    /// 設定ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 保護者ID
    /// </summary>
    public int ParentId { get; set; }

    /// <summary>
    /// プッシュ通知有効フラグ
    /// </summary>
    public bool PushNotificationsEnabled { get; set; }

    /// <summary>
    /// 欠席確認通知有効フラグ
    /// </summary>
    public bool AbsenceConfirmationEnabled { get; set; }

    /// <summary>
    /// 連絡帳通知有効フラグ
    /// </summary>
    public bool DailyReportEnabled { get; set; }

    /// <summary>
    /// イベント通知有効フラグ
    /// </summary>
    public bool EventNotificationEnabled { get; set; }

    /// <summary>
    /// お知らせ通知有効フラグ
    /// </summary>
    public bool AnnouncementEnabled { get; set; }

    /// <summary>
    /// SMS通知有効フラグ
    /// </summary>
    public bool SmsNotificationsEnabled { get; set; }

    /// <summary>
    /// メール通知有効フラグ
    /// </summary>
    public bool EmailNotificationsEnabled { get; set; }

    /// <summary>
    /// デバイストークン
    /// </summary>
    public string? DeviceToken { get; set; }

    /// <summary>
    /// デバイスプラットフォーム
    /// </summary>
    public string? DevicePlatform { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
