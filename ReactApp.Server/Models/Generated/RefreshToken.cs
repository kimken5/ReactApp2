using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// リフレッシュトークンテーブル
/// </summary>
public partial class RefreshToken
{
    /// <summary>
    /// トークンID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 保護者ID
    /// </summary>
    public int? ParentId { get; set; }

    /// <summary>
    /// トークン
    /// </summary>
    public string Token { get; set; } = null!;

    /// <summary>
    /// JWT ID
    /// </summary>
    public string JwtId { get; set; } = null!;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 有効期限
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// 失効フラグ
    /// </summary>
    public bool IsRevoked { get; set; }

    /// <summary>
    /// 失効日時
    /// </summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// クライアントIPアドレス
    /// </summary>
    public string? ClientIpAddress { get; set; }

    /// <summary>
    /// ユーザーエージェント
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// 職員保育園ID
    /// </summary>
    public int? StaffNurseryId { get; set; }

    /// <summary>
    /// 職員ID
    /// </summary>
    public int? StaffId { get; set; }
}
