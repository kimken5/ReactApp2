using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 通知テンプレートテーブル
/// </summary>
public partial class NotificationTemplate
{
    /// <summary>
    /// テンプレートID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 通知種別
    /// </summary>
    public string NotificationType { get; set; } = null!;

    /// <summary>
    /// プラットフォーム
    /// </summary>
    public string Platform { get; set; } = null!;

    /// <summary>
    /// テンプレートJSON
    /// </summary>
    public string TemplateJson { get; set; } = null!;

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
