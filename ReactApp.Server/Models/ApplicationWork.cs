using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

/// <summary>
/// 入園申込ワークエンティティ
/// 保護者がWeb申込フォームから送信した入園申込データを一時保管するテーブル
/// デスクトップアプリで内容確認後、園児マスタ・保護者マスタへ取り込む
/// </summary>
public class ApplicationWork
{
    /// <summary>
    /// 申込ID（主キー）
    /// 自動採番される一意な識別子
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// 保育園ID（必須）
    /// 申込対象の保育園識別子
    /// </summary>
    [Required]
    public int NurseryId { get; set; }

    // ===== 申請保護者情報 =====

    /// <summary>
    /// 申請保護者氏名（必須、最大100文字）
    /// </summary>
    [Required]
    [StringLength(100)]
    public string ApplicantName { get; set; } = string.Empty;

    /// <summary>
    /// 申請保護者フリガナ（必須、最大100文字）
    /// </summary>
    [Required]
    [StringLength(100)]
    public string ApplicantNameKana { get; set; } = string.Empty;

    /// <summary>
    /// 保護者生年月日（必須）
    /// </summary>
    [Required]
    public DateTime DateOfBirth { get; set; }

    /// <summary>
    /// 郵便番号（任意、最大8文字）
    /// ハイフン含む形式も許容
    /// </summary>
    [StringLength(8)]
    public string? PostalCode { get; set; }

    /// <summary>
    /// 都道府県（任意、最大10文字）
    /// </summary>
    [StringLength(10)]
    public string? Prefecture { get; set; }

    /// <summary>
    /// 市区郡町村（任意、最大50文字）
    /// </summary>
    [StringLength(50)]
    public string? City { get; set; }

    /// <summary>
    /// 番地・ビル名等（任意、最大200文字）
    /// </summary>
    [StringLength(200)]
    public string? AddressLine { get; set; }

    /// <summary>
    /// 電話番号（携帯）（必須、最大20文字）
    /// 保護者マスタの重複チェックに使用
    /// ハイフンは自動除去して正規化
    /// </summary>
    [Required]
    [StringLength(20)]
    public string MobilePhone { get; set; } = string.Empty;

    /// <summary>
    /// 電話番号（固定）（任意、最大20文字）
    /// </summary>
    [StringLength(20)]
    public string? HomePhone { get; set; }

    /// <summary>
    /// 緊急連絡先（任意、最大20文字）
    /// </summary>
    [StringLength(20)]
    public string? EmergencyContact { get; set; }

    /// <summary>
    /// メールアドレス（任意、最大255文字）
    /// </summary>
    [StringLength(255)]
    [EmailAddress]
    public string? Email { get; set; }

    /// <summary>
    /// お子様との続柄（必須、最大20文字）
    /// 例: "父", "母", "祖父", "祖母"
    /// </summary>
    [Required]
    [StringLength(20)]
    public string RelationshipToChild { get; set; } = string.Empty;

    // ===== 園児情報 =====

    /// <summary>
    /// 園児氏名（必須、最大100文字）
    /// </summary>
    [Required]
    [StringLength(100)]
    public string ChildName { get; set; } = string.Empty;

    /// <summary>
    /// 園児フリガナ（必須、最大100文字）
    /// </summary>
    [Required]
    [StringLength(100)]
    public string ChildNameKana { get; set; } = string.Empty;

    /// <summary>
    /// 園児生年月日（必須）
    /// </summary>
    [Required]
    public DateTime ChildDateOfBirth { get; set; }

    /// <summary>
    /// 園児性別（必須、最大2文字）
    /// "男" または "女"
    /// </summary>
    [Required]
    [StringLength(2)]
    public string ChildGender { get; set; } = string.Empty;

    /// <summary>
    /// 園児血液型（任意、最大10文字）
    /// 例: "A", "B", "O", "AB"
    /// </summary>
    [StringLength(10)]
    public string? ChildBloodType { get; set; }

    /// <summary>
    /// 園児医療メモ（任意、最大1000文字）
    /// アレルギー情報、既往症等
    /// </summary>
    [StringLength(1000)]
    public string? ChildMedicalNotes { get; set; }

    /// <summary>
    /// 園児特別指示（任意、最大1000文字）
    /// 保育に関する特別な指示事項
    /// </summary>
    [StringLength(1000)]
    public string? ChildSpecialInstructions { get; set; }

    // ===== 申込管理情報 =====

    /// <summary>
    /// 申込状態（必須、最大20文字）
    /// "Pending": 受付済み（未処理）
    /// "Imported": 取込完了
    /// "Rejected": 却下
    /// </summary>
    [Required]
    [StringLength(20)]
    public string ApplicationStatus { get; set; } = "Pending";

    /// <summary>
    /// 取込済みフラグ（必須）
    /// true: 園児マスタ・保護者マスタへ取込済み
    /// false: 未取込
    /// </summary>
    [Required]
    public bool IsImported { get; set; } = false;

    /// <summary>
    /// 取込日時（任意）
    /// 取込実行時に設定
    /// </summary>
    public DateTime? ImportedAt { get; set; }

    /// <summary>
    /// 取込実行者ID（任意）
    /// デスクトップアプリで取込を実行したユーザー（Nurseries.Id）
    /// </summary>
    public int? ImportedByUserId { get; set; }

    /// <summary>
    /// 申込受付日時（必須）
    /// 保護者がWeb申込フォームから送信した日時（UTC）
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時（任意）
    /// 却下時などに設定
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 却下理由（任意、最大500文字）
    /// ApplicationStatus="Rejected"の場合に設定
    /// </summary>
    [StringLength(500)]
    public string? RejectionReason { get; set; }

    // ナビゲーションプロパティ（EF Coreの設定でIgnoreされる想定）
    // public Nursery? Nursery { get; set; }
}
