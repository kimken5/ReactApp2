using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

/// <summary>
/// お知らせエンティティ
/// スタッフが保護者向けに作成するお知らせ情報を管理するデータモデル
/// </summary>
public class Announcement
{
    /// <summary>
    /// お知らせID（主キー）
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// 保育園ID（必須）
    /// </summary>
    [Required]
    public int NurseryId { get; set; }

    /// <summary>
    /// 作成したスタッフID（必須）
    /// </summary>
    [Required]
    public int StaffId { get; set; }

    /// <summary>
    /// タイトル（必須）
    /// 最大100文字
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 本文（必須）
    /// 最大5000文字
    /// </summary>
    [Required]
    [StringLength(5000)]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// カテゴリ（必須）
    /// general/urgent/event/health/meal/belongings/other
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Category { get; set; } = "general";

    /// <summary>
    /// 対象範囲（必須）
    /// all: 全体、class: クラス単位、individual: 個別
    /// </summary>
    [Required]
    [StringLength(20)]
    public string TargetScope { get; set; } = "all";

    /// <summary>
    /// 対象クラスID
    /// TargetScope=classの場合に使用
    /// </summary>
    [StringLength(50)]
    [Column("TargetClassId")]
    public string? TargetClassId { get; set; }

    /// <summary>
    /// 対象園児ID
    /// TargetScope=individualの場合に使用
    /// </summary>
    [Column("TargetChildId")]
    public int? TargetChildId { get; set; }

    /// <summary>
    /// 添付ファイル（JSON配列）
    /// ファイル名、URL、サイズ、MIME Typeを含む
    /// </summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? Attachments { get; set; }

    /// <summary>
    /// ステータス（必須）
    /// draft: 下書き、published: 公開済み、archived: アーカイブ
    /// </summary>
    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "draft";

    /// <summary>
    /// コメント許可フラグ
    /// </summary>
    [Required]
    public bool AllowComments { get; set; } = true;

    /// <summary>
    /// 公開日時（任意）
    /// Statusがpublishedに変更された時刻
    /// </summary>
    public DateTime? PublishedAt { get; set; }

    /// <summary>
    /// 予約公開日時（任意）
    /// 指定時刻に自動公開
    /// </summary>
    public DateTime? ScheduledAt { get; set; }

    /// <summary>
    /// 既読数
    /// </summary>
    [Required]
    public int ReadCount { get; set; } = 0;

    /// <summary>
    /// コメント数
    /// </summary>
    [Required]
    public int CommentCount { get; set; } = 0;

    /// <summary>
    /// 作成日時（必須）
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新日時（任意）
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 有効フラグ（論理削除用）
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = true;

    // ===== デスクトップアプリ用追加プロパティ =====

    /// <summary>
    /// 管理者作成フラグ（必須）
    /// デフォルト: false
    /// 管理者がスタッフに成り代わって作成した場合にtrue
    /// </summary>
    [Required]
    public bool CreatedByAdminUser { get; set; } = false;

    // ナビゲーションプロパティ

    /// <summary>
    /// 作成したスタッフ
    /// </summary>
    public Staff? Staff { get; set; }
}
