using System.ComponentModel.DataAnnotations;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// スタッフエンティティ
    /// 保育園に勤務するスタッフ情報を管理するデータモデル
    /// 教職員、管理者、園長、看護師等の役職情報を含む
    /// 複合主キー: (NurseryId, StaffId)
    /// </summary>
    public class Staff
    {
        /// <summary>
        /// 保育園ID（複合主キーの一部）
        /// スタッフが所属する保育園の識別子
        /// </summary>
        [Required]
        public int NurseryId { get; set; }

        /// <summary>
        /// スタッフID（複合主キーの一部）
        /// 保育園内でのスタッフ一意識別子
        /// </summary>
        [Required]
        public int StaffId { get; set; }

        /// <summary>
        /// 氏名（必須）
        /// 最大50文字のスタッフの氏名
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 電話番号（必須）
        /// 最大15桁のスタッフの電話番号
        /// </summary>
        [Required]
        [StringLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        /// <summary>
        /// メールアドレス（任意）
        /// 最大200文字の有効なメールアドレス形式
        /// </summary>
        [EmailAddress]
        [StringLength(200)]
        public string? Email { get; set; }

        /// <summary>
        /// 役職（必須）
        /// "teacher"（教職員）、"admin"（管理者）、"principal"（園長）、"nurse"（看護師）
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Role { get; set; } = string.Empty;

        /// <summary>
        /// 職位（任意）
        /// スタッフの詳細な職位情報（「保育士」「管理者」「園長」「看護師」等）
        /// 最大100文字まで設定可能
        /// </summary>
        [StringLength(100)]
        public string? Position { get; set; }

        /// <summary>
        /// 最終ログイン時刻（任意）
        /// スタッフが最後にシステムにログインした日時
        /// 未ログインの場合はnull
        /// </summary>
        public DateTime? LastLoginAt { get; set; }

        /// <summary>
        /// アクティブフラグ
        /// true: 有効なスタッフ、false: 無効化されたスタッフ
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// 作成日時
        /// スタッフレコードが作成された日時（UTC）
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTimeHelper.GetJstNow();

        /// <summary>
        /// 更新日時（任意）
        /// スタッフレコードが最後に更新された日時（UTC）
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        // ===== デスクトップアプリ用追加プロパティ =====

        /// <summary>
        /// 退職日（任意）
        /// 実テーブルのカラム名: ResignationDate
        /// </summary>
        public DateTime? ResignationDate { get; set; }

        /// <summary>
        /// 備考（任意、最大500文字）
        /// 実テーブルのカラム名: Remark
        /// </summary>
        [StringLength(500)]
        public string? Remark { get; set; }

        // Navigation properties
        /// <summary>
        /// 欠席通知への対応履歴
        /// </summary>
        public virtual ICollection<AbsenceNotificationResponse> AbsenceResponses { get; set; } = new List<AbsenceNotificationResponse>();

        /// <summary>
        /// 作成した日報
        /// </summary>
        public virtual ICollection<DailyReport> CreatedReports { get; set; } = new List<DailyReport>();

        /// <summary>
        /// 作成したイベント
        /// </summary>
        public virtual ICollection<Event> CreatedEvents { get; set; } = new List<Event>();

        /// <summary>
        /// クラス割り当て
        /// スタッフが担当する複数のクラス情報
        /// </summary>
        public virtual ICollection<StaffClassAssignment> ClassAssignments { get; set; } = new List<StaffClassAssignment>();
    }
}
