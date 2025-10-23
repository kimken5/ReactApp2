using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// イベントマスタ
/// </summary>
public partial class Event
{
    /// <summary>
    /// イベントID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// タイトル
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// 説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// カテゴリー
    /// </summary>
    public string Category { get; set; } = null!;

    /// <summary>
    /// 開始日時
    /// </summary>
    public DateTime StartDateTime { get; set; }

    /// <summary>
    /// 終了日時
    /// </summary>
    public DateTime EndDateTime { get; set; }

    /// <summary>
    /// 終日フラグ
    /// </summary>
    public bool IsAllDay { get; set; }

    /// <summary>
    /// 繰り返しパターン
    /// </summary>
    public string RecurrencePattern { get; set; } = null!;

    /// <summary>
    /// 対象者
    /// </summary>
    public string TargetAudience { get; set; } = null!;

    /// <summary>
    /// 準備必要フラグ
    /// </summary>
    public bool RequiresPreparation { get; set; }

    /// <summary>
    /// 準備指示
    /// </summary>
    public string? PreparationInstructions { get; set; }

    /// <summary>
    /// 作成者
    /// </summary>
    public string CreatedBy { get; set; } = null!;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 最終更新日時
    /// </summary>
    public DateTime LastModified { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 対象クラスID
    /// </summary>
    public string? TargetClassId { get; set; }

    /// <summary>
    /// 対象園児ID
    /// </summary>
    public int? TargetChildId { get; set; }

    /// <summary>
    /// 職員ID
    /// </summary>
    public int? StaffId { get; set; }

    /// <summary>
    /// 職員保育園ID
    /// </summary>
    public int? StaffNurseryId { get; set; }
}
