using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 写真アクセス履歴テーブル
/// </summary>
public partial class PhotoAccess
{
    /// <summary>
    /// アクセスID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 写真ID
    /// </summary>
    public int PhotoId { get; set; }

    /// <summary>
    /// 保護者ID
    /// </summary>
    public int ParentId { get; set; }

    /// <summary>
    /// アクセス種別
    /// </summary>
    public string AccessType { get; set; } = null!;

    /// <summary>
    /// アクセス日時
    /// </summary>
    public DateTime AccessedAt { get; set; }

    /// <summary>
    /// IPアドレス
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// ユーザーエージェント
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// 成功フラグ
    /// </summary>
    public bool IsSuccessful { get; set; }

    /// <summary>
    /// エラーメッセージ
    /// </summary>
    public string? ErrorMessage { get; set; }
}
