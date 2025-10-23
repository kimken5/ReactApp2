using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 職員マスタ
/// </summary>
public partial class Staff
{
    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 職員ID
    /// </summary>
    public int StaffId { get; set; }

    /// <summary>
    /// 氏名
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// 電話番号
    /// </summary>
    public string PhoneNumber { get; set; } = null!;

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// 役職
    /// </summary>
    public string Role { get; set; } = null!;

    /// <summary>
    /// 職位
    /// </summary>
    public string? Position { get; set; }

    /// <summary>
    /// 最終ログイン日時
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

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
}
