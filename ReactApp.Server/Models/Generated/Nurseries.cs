using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 保育園マスタ
/// </summary>
public partial class Nurseries
{
    /// <summary>
    /// 保育園ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 保育園名
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// 住所
    /// </summary>
    public string Address { get; set; } = null!;

    /// <summary>
    /// 電話番号
    /// </summary>
    public string PhoneNumber { get; set; } = null!;

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string Email { get; set; } = null!;

    /// <summary>
    /// 園長名
    /// </summary>
    public string PrincipalName { get; set; } = null!;

    /// <summary>
    /// 設立日
    /// </summary>
    public DateTime EstablishedDate { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
