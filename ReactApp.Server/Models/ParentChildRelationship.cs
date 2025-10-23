using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

/// <summary>
/// 保護者-園児関係エンティティ
/// 保護者と園児の関係性と権限管理を定義
/// 続柄、お迎え権限、緊急連絡権限などの詳細管理を実現
/// </summary>
public class ParentChildRelationship
{
    /// <summary>
    /// 保護者ID（複合主キー1、必須）
    /// 関係の保護者側を特定
    /// </summary>
    [Key, Column(Order = 0)]
    [Required]
    public int ParentId { get; set; }

    /// <summary>
    /// 保護者ナビゲーションプロパティ
    /// 関係保護者エンティティへの参照
    /// </summary>
    public Parent Parent { get; set; } = null!;

    /// <summary>
    /// 保育園ID（複合主キー2、必須）
    /// 園児が所属する保育園の識別子
    /// </summary>
    [Key, Column(Order = 1)]
    [Required]
    public int NurseryId { get; set; }

    /// <summary>
    /// 園児ID（複合主キー3、必須）
    /// 関係の園児側を特定
    /// </summary>
    [Key, Column(Order = 2)]
    [Required]
    public int ChildId { get; set; }

    /// <summary>
    /// 園児ナビゲーションプロパティ
    /// 関係園児エンティティへの参照
    /// </summary>
    public Child Child { get; set; } = null!;
    
    /// <summary>
    /// 続柄タイプ（必須、20文字以内）
    /// 保護者と園児の関係性を表す識別子
    /// "mother", "father", "guardian", "grandparent"
    /// </summary>
    [Required]
    [StringLength(20)]
    public string RelationshipType { get; set; } = string.Empty;

    /// <summary>
    /// 主連絡担当者フラグ（必須）
    /// この関係が主要連絡先かどうか
    /// </summary>
    [Required]
    public bool IsPrimaryContact { get; set; } = false;

    /// <summary>
    /// お迎え権限（必須）
    /// この保護者にお迎え権限があるかどうか
    /// </summary>
    [Required]
    public bool HasPickupPermission { get; set; } = true;

    /// <summary>
    /// 緊急連絡受信可能（必須）
    /// 緊急時にこの保護者に連絡するかどうか
    /// </summary>
    [Required]
    public bool CanReceiveEmergencyNotifications { get; set; } = true;
    
    /// <summary>
    /// 作成日時（必須）
    /// 関係が作成された日時（UTC）
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時（任意）
    /// 関係が最後に更新された日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// アクティブ状態（必須、論理削除フラグ）
    /// true: 有効、false: 論理削除済み
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = true;
}