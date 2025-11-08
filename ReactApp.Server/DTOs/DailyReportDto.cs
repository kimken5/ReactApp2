using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 日報レDTO
    /// 園児の日報情報をクライアントとサーバー間で伝送するためのデータ転送オブジェクト
    /// </summary>
    public class DailyReportDto
    {
        /// <summary>
        /// 日報ID
        /// システム内の日報一意識別子
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 園児ID
        /// 日報対象の園児識別子
        /// </summary>
        public int ChildId { get; set; }

        /// <summary>
        /// 園児名
        /// 日報対象の園児氏名
        /// </summary>
        public string ChildName { get; set; } = string.Empty;

        /// <summary>
        /// スタッフID
        /// 日報作成者のスタッフ識別子
        /// </summary>
        public int StaffId { get; set; }

        /// <summary>
        /// スタッフ名
        /// 日報作成者のスタッフ氏名
        /// </summary>
        public string StaffName { get; set; } = string.Empty;

        /// <summary>
        /// 日報日付
        /// 日報対象の日付（時刻なし）
        /// </summary>
        public DateTime ReportDate { get; set; }

        /// <summary>
        /// レポート種別
        /// 日報の分類（活動・食事・睡眠・健康・事故・行動）
        /// </summary>
        public string ReportKind { get; set; } = string.Empty;

        /// <summary>
        /// タイトル
        /// 日報の表題
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// 内容
        /// 日報の詳細内容
        /// </summary>
        public string Content { get; set; } = string.Empty;

        /// <summary>
        /// 写真一覧
        /// 日報に添付された写真のファイルパス一覧
        /// </summary>
        public List<string> Photos { get; set; } = new List<string>();

        /// <summary>
        /// 公開状態
        /// 日報の公開状態（下書き・公開済み・非公開など）
        /// </summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// 公開日時（任意）
        /// 日報が公開された日時
        /// </summary>
        public DateTime? PublishedAt { get; set; }

        /// <summary>
        /// 保護者確認済みフラグ
        /// 保護者が日報を確認したかどうか
        /// </summary>
        public bool ParentAcknowledged { get; set; }

        /// <summary>
        /// 確認日時（任意）
        /// 保護者が日報を確認した日時
        /// </summary>
        public DateTime? AcknowledgedAt { get; set; }

        /// <summary>
        /// 作成日時
        /// 日報が作成された日時
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// 更新日時（任意）
        /// 日報が最後に更新された日時
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// 保護者回答一覧
        /// この日報に対する保護者からの回答・コメント一覧
        /// </summary>
        public List<DailyReportResponseDto> Responses { get; set; } = new List<DailyReportResponseDto>();
    }

    /// <summary>
    /// 日報作成DTO
    /// 新規日報作成時に使用
    /// </summary>
    public class CreateDailyReportDto
    {
        /// <summary>
        /// 園児ID（必須）
        /// </summary>
        [Required]
        public int ChildId { get; set; }

        /// <summary>
        /// 日報日付（必須、時刻なし）
        /// </summary>
        [Required]
        public DateTime ReportDate { get; set; }

        [Required]
        [StringLength(50)]
        public string ReportKind { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Content { get; set; } = string.Empty;

        public List<string> Photos { get; set; } = new List<string>();

        /// <summary>
        /// ステータス（オプション、デフォルトは"draft"）
        /// "draft" または "published" を指定可能
        /// </summary>
        [StringLength(20)]
        public string? Status { get; set; }
    }

    /// <summary>
    /// 日報更新DTO
    /// 既存日報の更新時に使用（下書き状態の場合は園児IDも変更可能）
    /// </summary>
    public class UpdateDailyReportDto
    {
        /// <summary>
        /// 園児ID（下書き状態のみ変更可能）
        /// </summary>
        public int? ChildId { get; set; }

        /// <summary>
        /// 日報日付（時刻なし）
        /// </summary>
        public DateTime? ReportDate { get; set; }

        [StringLength(50)]
        public string? ReportKind { get; set; }

        [StringLength(200)]
        public string? Title { get; set; }

        [StringLength(1000)]
        public string? Content { get; set; }

        public List<string>? Photos { get; set; }

        [StringLength(20)]
        public string? Status { get; set; }
    }

    public class DailyReportResponseDto
    {
        public int Id { get; set; }
        public int ParentId { get; set; }
        public string ParentName { get; set; } = string.Empty;
        public string? ResponseMessage { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateDailyReportResponseDto
    {
        [Required]
        public int DailyReportId { get; set; }

        [StringLength(500)]
        public string? ResponseMessage { get; set; }
    }
}