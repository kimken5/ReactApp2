using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 写真公開同意テーブル
/// </summary>
public partial class PhotoConsent
{
    /// <summary>
    /// 同意ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 写真ID
    /// </summary>
    public int PhotoId { get; set; }

    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 園児ID
    /// </summary>
    public int ChildId { get; set; }

    /// <summary>
    /// 保護者ID
    /// </summary>
    public int ParentId { get; set; }

    /// <summary>
    /// 同意状態
    /// </summary>
    public string ConsentStatus { get; set; } = null!;

    /// <summary>
    /// メモ
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// リクエスト日時
    /// </summary>
    public DateTime RequestedAt { get; set; }

    /// <summary>
    /// 回答日時
    /// </summary>
    public DateTime? RespondedAt { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
