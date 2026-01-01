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
    /// 苗字（必須）
    /// 最大20文字、園児の苗字
    /// </summary>
    [Required]
    [StringLength(20)]
    public string FamilyName { get; set; } = string.Empty;

    /// <summary>
    /// 名前（必須）
    /// 最大20文字、園児の名前
    /// </summary>
    [Required]
    [StringLength(20)]
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// ふりがな（苗字）（任意）
    /// 最大20文字、苗字のふりがな
    /// </summary>
    [StringLength(20)]
    public string? FamilyFurigana { get; set; }

    /// <summary>
    /// ふりがな（名前）（任意）
    /// 最大20文字、名前のふりがな
    /// </summary>
    [StringLength(20)]
    public string? FirstFurigana { get; set; }

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
    /// アレルギー情報（任意）
    /// 最大200文字、アレルギー情報
    /// </summary>
    [StringLength(200)]
    public string? Allergy { get; set; }

    /// <summary>
    /// 医療メモ（任意）
    /// 最大500文字、既往症等の医療情報
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

    // ===== デスクトップアプリ用追加プロパティ =====

    /// <summary>
    /// 卒園日（任意）
    /// 園児が卒園した日付
    /// </summary>
    public DateTime? GraduationDate { get; set; }

    /// <summary>
    /// 卒園ステータス（任意、最大20文字）
    /// "Graduated": 卒園、"Withdrawn": 途中退園
    /// </summary>
    [StringLength(20)]
    public string? GraduationStatus { get; set; }

    /// <summary>
    /// 退園理由（任意、最大200文字）
    /// 途中退園の場合の理由
    /// </summary>
    [StringLength(200)]
    public string? WithdrawalReason { get; set; }

    /// <summary>
    /// 血液型（任意、最大5文字）
    /// 例: "A", "B", "O", "AB"
    /// </summary>
    [StringLength(5)]
    public string? BloodType { get; set; }

    /// <summary>
    /// 最終登園日（任意）
    /// 園児の最終登園日
    /// </summary>
    public DateTime? LastAttendanceDate { get; set; }

    /// <summary>
    /// 撮影禁止フラグ（園児マスタ）
    /// True = 撮影禁止, False = 撮影可（デフォルト）
    /// 入園後も編集可能な設定。写真アップロード時に警告表示の判定に使用
    /// </summary>
    [Required]
    public bool NoPhoto { get; set; } = false;

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