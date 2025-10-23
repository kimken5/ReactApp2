using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 通知ログテーブル
/// </summary>
public partial class NotificationLog
{
    /// <summary>
    /// ログID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 保護者ID
    /// </summary>
    public int ParentId { get; set; }

    /// <summary>
    /// 通知種別
    /// </summary>
    public string NotificationType { get; set; } = null!;

    /// <summary>
    /// 配信方法
    /// </summary>
    public string DeliveryMethod { get; set; } = null!;

    /// <summary>
    /// タイトル
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// 内容
    /// </summary>
    public string Content { get; set; } = null!;

    /// <summary>
    /// ステータス
    /// </summary>
    public string Status { get; set; } = null!;

    /// <summary>
    /// エラーメッセージ
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// 関連エンティティID
    /// </summary>
    public int? RelatedEntityId { get; set; }

    /// <summary>
    /// 関連エンティティ種別
    /// </summary>
    public string? RelatedEntityType { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 送信日時
    /// </summary>
    public DateTime? SentAt { get; set; }

    /// <summary>
    /// 配信日時
    /// </summary>
    public DateTime? DeliveredAt { get; set; }

    /// <summary>
    /// 既読日時
    /// </summary>
    public DateTime? ReadAt { get; set; }

    /// <summary>
    /// 再試行回数
    /// </summary>
    public int RetryCount { get; set; }

    /// <summary>
    /// 次回再試行日時
    /// </summary>
    public DateTime? NextRetryAt { get; set; }
}
