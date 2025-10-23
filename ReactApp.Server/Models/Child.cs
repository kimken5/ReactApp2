using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

/// <summary>
/// 園児エンティティ
/// 保育園に通う子どもの基本情報を管理するデータモデル
/// 保護者との関係性、医療情報、クラス所属情報等を含む
/// 複合主キー: (NurseryId, ChildId)
/// </summary>
public class Child
{
    /// <summary>
    /// 保育園ID（複合主キーの第1カラム）
    /// 所属する保育園の識別子
    /// </summary>
    [Required]
    [Column(Order = 0)]
    public int NurseryId { get; set; }

    /// <summary>
    /// 園児ID（複合主キーの第2カラム）
    /// 保育園内での園児の識別子
    /// </summary>
    [Required]
    [Column(Order = 1)]
    public int ChildId { get; set; }

    /// <summary>
    /// 園児名（必須）
    /// 最大100文字、園児の氏名
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 生年月日（必須）
    /// 年齢計算や成長記録管理に使用
    /// </summary>
    [Required]
    public DateTime DateOfBirth { get; set; }

    /// <summary>
    /// 性別（必須）
    /// 最大10文字、"male"または"female"
    /// </summary>
    [Required]
    [StringLength(10)]
    public string Gender { get; set; } = string.Empty;

    // public Nursery Nursery { get; set; } = null!; // 将来の実装用

    /// <summary>
    /// クラスID（任意）
    /// 最大50文字、所属クラスの識別子
    /// </summary>
    [StringLength(50)]
    public string? ClassId { get; set; }

    /// <summary>
    /// クラスナビゲーションプロパティ
    /// 園児が所属するクラス情報へのナビゲーション
    /// </summary>
    public Class? Class { get; set; }

    /// <summary>
    /// 医療メモ（任意）
    /// 最大500文字、アレルギーや医療情報
    /// </summary>
    [StringLength(500)]
    public string? MedicalNotes { get; set; }

    /// <summary>
    /// 特別指示（任意）
    /// 最大500文字、保育に関する特別な指示事項
    /// </summary>
    [StringLength(500)]
    public string? SpecialInstructions { get; set; }

    /// <summary>
    /// 作成日時（必須）
    /// 園児情報の登録日時
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時（任意）
    /// 園児情報の最終更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// アクティブ状態フラグ（必須）
    /// デフォルト：true、退園した園児はfalse
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = true;

    // ナビゲーションプロパティ（関連エンティティとの関係性）

    /// <summary>
    /// 保護者-園児関係コレクション
    /// この園児と保護者の関係性管理
    /// </summary>
    public ICollection<ParentChildRelationship> ParentRelationships { get; set; } = new List<ParentChildRelationship>();

    /// <summary>
    /// 欠席通知コレクション
    /// この園児に関する欠席・遅刻の通知記録
    /// </summary>
    public ICollection<AbsenceNotification> AbsenceNotifications { get; set; } = new List<AbsenceNotification>();
}