using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.Models;

/// <summary>
/// 保育園エンティティ
/// 保育園の基本情報を管理するデータモデル
/// </summary>
public class Nursery
{
    /// <summary>
    /// 保育園ID（主キー）
    /// システム内の保育園一意識別子
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// 保育園名（必須、100文字以内）
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 住所（必須、500文字以内）
    /// </summary>
    [Required]
    [StringLength(500)]
    public string Address { get; set; } = string.Empty;

    /// <summary>
    /// 電話番号（必須、20文字以内）
    /// </summary>
    [Required]
    [StringLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    /// <summary>
    /// メールアドレス（必須、255文字以内）
    /// </summary>
    [Required]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 園長名（必須、100文字以内）
    /// </summary>
    [Required]
    [StringLength(100)]
    public string PrincipalName { get; set; } = string.Empty;

    /// <summary>
    /// 設立日（必須）
    /// </summary>
    [Required]
    public DateTime EstablishedDate { get; set; }

    /// <summary>
    /// ロゴ画像URL（任意、500文字以内）
    /// </summary>
    [StringLength(500)]
    public string? LogoUrl { get; set; }

    /// <summary>
    /// 作成日時（必須）
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新日時（任意）
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
