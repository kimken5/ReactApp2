using System;
using System.Collections.Generic;

namespace ReactApp.Server;

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
    /// ログインID
    /// </summary>
    public string? LoginId { get; set; }

    /// <summary>
    /// パスワード
    /// </summary>
    public string? Password { get; set; }

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
    /// ロゴURL
    /// </summary>
    public string? LogoUrl { get; set; }

    /// <summary>
    /// 入園申込キー
    /// </summary>
    public string? ApplicationKey { get; set; }

    /// <summary>
    /// 最終ログイン日時
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// ログイン試行回数
    /// </summary>
    public int LoginAttempts { get; set; }

    /// <summary>
    /// アカウントロック状態
    /// </summary>
    public bool IsLocked { get; set; }

    /// <summary>
    /// ロック解除日時
    /// </summary>
    public DateTime? LockedUntil { get; set; }

    /// <summary>
    /// 現在の年度
    /// </summary>
    public int CurrentAcademicYear { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
