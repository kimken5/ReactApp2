using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

public partial class DeviceRegistration
{
    /// <summary>
    /// デバイスID
    /// </summary>
    public string DeviceId { get; set; } = null!;

    /// <summary>
    /// Androidフラグ
    /// </summary>
    public bool IsAndroid { get; set; }

    /// <summary>
    /// プッシュトークン
    /// </summary>
    public string? PushToken { get; set; }

    /// <summary>
    /// 登録ID
    /// </summary>
    public string? RegistrationId { get; set; }

    /// <summary>
    /// デバイス情報
    /// </summary>
    public string? DeviceInfo { get; set; }

    /// <summary>
    /// アプリバージョン
    /// </summary>
    public string? AppVersion { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 最終ログイン日時
    /// </summary>
    public DateTime LastLoginAt { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
