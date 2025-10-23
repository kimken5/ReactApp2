using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// ユーザー役割設定テーブル
/// </summary>
public partial class UserRolePreference
{
    /// <summary>
    /// 設定ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 電話番号
    /// </summary>
    public string PhoneNumber { get; set; } = null!;

    /// <summary>
    /// 優先役割
    /// </summary>
    public string PreferredRole { get; set; } = null!;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
