using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 保護者マスタ
/// </summary>
public partial class Parent
{
    /// <summary>
    /// 保護者ID
    /// </summary>
    public int Id { get; set; }

    public string PhoneNumber { get; set; } = null!;

    /// <summary>
    /// 氏名
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// 住所
    /// </summary>
    public string? Address { get; set; }

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
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 最終ログイン日時
    /// </summary>
    public DateTime? LastLoginAt { get; set; }
}
