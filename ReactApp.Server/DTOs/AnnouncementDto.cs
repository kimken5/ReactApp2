using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// お知らせDTO
    /// お知らせ情報をクライアントとサーバー間で伝送するためのデータ転送オブジェクト
    /// </summary>
    public class AnnouncementDto
    {
        /// <summary>
        /// お知らせID
        /// </summary>
        [JsonPropertyName("announcementId")]
        public int Id { get; set; }

        /// <summary>
        /// 保育園ID
        /// </summary>
        public int NurseryId { get; set; }

        /// <summary>
        /// スタッフID
        /// </summary>
        public int StaffId { get; set; }

        /// <summary>
        /// スタッフ名
        /// </summary>
        public string StaffName { get; set; } = string.Empty;

        /// <summary>
        /// タイトル
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// 本文
        /// </summary>
        public string Content { get; set; } = string.Empty;

        /// <summary>
        /// 本文プレビュー（最初の100文字）
        /// </summary>
        public string ContentPreview { get; set; } = string.Empty;

        /// <summary>
        /// カテゴリ
        /// </summary>
        public string Category { get; set; } = string.Empty;

        /// <summary>
        /// 対象範囲
        /// </summary>
        public string TargetScope { get; set; } = string.Empty;

        /// <summary>
        /// 対象クラスID配列
        /// </summary>
        public List<string> TargetClassIds { get; set; } = new List<string>();

        /// <summary>
        /// 対象園児ID配列
        /// </summary>
        public List<string> TargetChildIds { get; set; } = new List<string>();

        /// <summary>
        /// 添付ファイル一覧
        /// </summary>
        public List<AttachmentDto> Attachments { get; set; } = new List<AttachmentDto>();

        /// <summary>
        /// ステータス
        /// </summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// 重要度
        /// </summary>
        public string Priority { get; set; } = string.Empty;

        /// <summary>
        /// コメント許可フラグ
        /// </summary>
        public bool AllowComments { get; set; }

        /// <summary>
        /// 公開日時
        /// </summary>
        public DateTime? PublishedAt { get; set; }

        /// <summary>
        /// 予約公開日時
        /// </summary>
        public DateTime? ScheduledAt { get; set; }

        /// <summary>
        /// 作成日時
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// 更新日時
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// 既読数
        /// </summary>
        public int ReadCount { get; set; }

        /// <summary>
        /// コメント数
        /// </summary>
        public int CommentCount { get; set; }
    }

    /// <summary>
    /// お知らせ作成DTO
    /// 新規お知らせ作成時に使用
    /// </summary>
    public class CreateAnnouncementDto
    {
        [Required(ErrorMessage = "タイトルは必須です")]
        [StringLength(100, ErrorMessage = "タイトルは100文字以内で入力してください")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "本文は必須です")]
        [StringLength(5000, ErrorMessage = "本文は5000文字以内で入力してください")]
        public string Content { get; set; } = string.Empty;

        [Required(ErrorMessage = "カテゴリは必須です")]
        public string Category { get; set; } = string.Empty;

        [Required(ErrorMessage = "対象範囲は必須です")]
        public string TargetScope { get; set; } = string.Empty;

        public List<string> TargetClassIds { get; set; } = new List<string>();

        public List<string> TargetChildIds { get; set; } = new List<string>();

        public List<AttachmentDto> Attachments { get; set; } = new List<AttachmentDto>();

        [Required(ErrorMessage = "ステータスは必須です")]
        public string Status { get; set; } = "draft";

        public string Priority { get; set; } = "normal";

        public bool AllowComments { get; set; } = true;

        public DateTime? ScheduledAt { get; set; }
    }

    /// <summary>
    /// お知らせ更新DTO
    /// 既存お知らせの更新時に使用
    /// </summary>
    public class UpdateAnnouncementDto
    {
        [Required(ErrorMessage = "タイトルは必須です")]
        [StringLength(100, ErrorMessage = "タイトルは100文字以内で入力してください")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "本文は必須です")]
        [StringLength(5000, ErrorMessage = "本文は5000文字以内で入力してください")]
        public string Content { get; set; } = string.Empty;

        [Required(ErrorMessage = "カテゴリは必須です")]
        public string Category { get; set; } = string.Empty;

        [Required(ErrorMessage = "配信対象範囲は必須です")]
        public string TargetScope { get; set; } = string.Empty;

        public List<string> TargetClassIds { get; set; } = new List<string>();

        public List<string> TargetChildIds { get; set; } = new List<string>();

        public DateTime? ScheduledAt { get; set; }

        public List<AttachmentDto> Attachments { get; set; } = new List<AttachmentDto>();

        [Required(ErrorMessage = "ステータスは必須です")]
        public string Status { get; set; } = string.Empty;

        public string Priority { get; set; } = string.Empty;

        public bool AllowComments { get; set; }
    }

    /// <summary>
    /// 添付ファイルDTO
    /// </summary>
    public class AttachmentDto
    {
        public string FileName { get; set; } = string.Empty;

        public string FileUrl { get; set; } = string.Empty;

        public long FileSize { get; set; }

        public string MimeType { get; set; } = string.Empty;
    }
}
