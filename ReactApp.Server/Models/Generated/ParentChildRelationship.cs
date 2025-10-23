using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 保護者園児関係テーブル
/// </summary>
public partial class ParentChildRelationship
{
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
    /// 主連絡先フラグ
    /// </summary>
    public bool IsPrimaryContact { get; set; }

    public bool HasPickupPermission { get; set; }

    public bool CanReceiveEmergencyNotifications { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    public bool IsActive { get; set; }
}
