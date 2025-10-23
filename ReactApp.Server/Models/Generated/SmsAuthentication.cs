using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// SMS認証テーブル
/// </summary>
public partial class SmsAuthentication
{
    /// <summary>
    /// 認証ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 電話番号
    /// </summary>
    public string PhoneNumber { get; set; } = null!;

    /// <summary>
    /// 確認コード
    /// </summary>
    public string Code { get; set; } = null!;

    /// <summary>
    /// ハッシュ化コード
    /// </summary>
    public string HashedCode { get; set; } = null!;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 有効期限
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// 使用済みフラグ
    /// </summary>
    public bool IsUsed { get; set; }

    /// <summary>
    /// 使用日時
    /// </summary>
    public DateTime? UsedAt { get; set; }

    /// <summary>
    /// 試行回数
    /// </summary>
    public int AttemptCount { get; set; }

    /// <summary>
    /// クライアントIPアドレス
    /// </summary>
    public string? ClientIpAddress { get; set; }

    /// <summary>
    /// ユーザーエージェント
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// 保護者ID
    /// </summary>
    public int? ParentId { get; set; }

    /// <summary>
    /// 職員保育園ID
    /// </summary>
    public int? StaffNurseryId { get; set; }

    /// <summary>
    /// 職員ID
    /// </summary>
    public int? StaffId { get; set; }
}
