using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 家族メンバーテーブル
/// </summary>
public partial class FamilyMember
{
    /// <summary>
    /// メンバーID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 保護者ID
    /// </summary>
    public int ParentId { get; set; }

    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 園児ID
    /// </summary>
    public int ChildId { get; set; }

    /// <summary>
    /// 続柄
    /// </summary>
    public string RelationshipType { get; set; } = null!;

    /// <summary>
    /// 表示名
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// 主連絡先フラグ
    /// </summary>
    public bool IsPrimaryContact { get; set; }

    /// <summary>
    /// 通知受信可能フラグ
    /// </summary>
    public bool CanReceiveNotifications { get; set; }

    /// <summary>
    /// 連絡帳閲覧可能フラグ
    /// </summary>
    public bool CanViewReports { get; set; }

    /// <summary>
    /// 写真閲覧可能フラグ
    /// </summary>
    public bool CanViewPhotos { get; set; }

    /// <summary>
    /// お迎え許可フラグ
    /// </summary>
    public bool HasPickupPermission { get; set; }

    /// <summary>
    /// 参加日時
    /// </summary>
    public DateTime JoinedAt { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 招待元保護者ID
    /// </summary>
    public int? InvitedByParentId { get; set; }
}
