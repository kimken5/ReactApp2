using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// 保護者エンティティ
    /// 保育園に通う園児の保護者情報を管理するデータモデル
    /// SMS認証によるログイン、園児との関係性、通知設定等を含む
    /// </summary>
    public class Parent
    {
        /// <summary>
        /// 保護者ID（主キー）
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 電話番号（必須、SMS認証用）
        /// 最大15桁、認証とログインに使用される一意の識別子
        /// </summary>
        [Required]
        [StringLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        /// <summary>
        /// 保護者名（任意）
        /// 最大100文字、表示名として使用
        /// </summary>
        [StringLength(100)]
        public string? Name { get; set; }

        /// <summary>
        /// メールアドレス（任意）
        /// 最大200文字、連絡先情報として使用
        /// </summary>
        [StringLength(200)]
        public string? Email { get; set; }

        /// <summary>
        /// 住所（任意）
        /// 最大200文字、緊急連絡先情報として使用
        /// </summary>
        [StringLength(200)]
        public string? Address { get; set; }

        /// <summary>
        /// 保育園ID（必須）
        /// この保護者が所属する保育園のID
        /// 複数保育園対応のため、保護者は必ず1つの保育園に所属する
        /// </summary>
        [Required]
        public int NurseryId { get; set; }

        /// <summary>
        /// アクティブ状態フラグ
        /// デフォルト：true、無効化された保護者はfalse
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// 作成日時
        /// 保護者アカウント作成時刻（UTC）
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// 更新日時（任意）
        /// 保護者情報の最終更新時刻（UTC）
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// 最終ログイン日時（任意）
        /// 最後にログインした時刻（UTC）
        /// </summary>
        public DateTime? LastLoginAt { get; set; }

        // 通知設定（NotificationSettingsから統合、2025/10/20）

        /// <summary>
        /// プッシュ通知有効化フラグ
        /// 全体的なプッシュ通知の有効・無効を制御
        /// デフォルト：true（有効）
        /// </summary>
        public bool PushNotificationsEnabled { get; set; } = true;

        /// <summary>
        /// 欠席確認通知有効化フラグ
        /// 欠席・遅刻通知の受信可否設定
        /// デフォルト：true（有効）
        /// </summary>
        public bool AbsenceConfirmationEnabled { get; set; } = true;

        /// <summary>
        /// 日報通知有効化フラグ
        /// 日報関連通知の受信可否設定
        /// デフォルト：true（有効）
        /// </summary>
        public bool DailyReportEnabled { get; set; } = true;

        /// <summary>
        /// イベント通知有効化フラグ
        /// イベント関連通知の受信可否設定
        /// デフォルト：true（有効）
        /// </summary>
        public bool EventNotificationEnabled { get; set; } = true;

        /// <summary>
        /// お知らせ通知有効化フラグ
        /// 一般的なお知らせ通知の受信可否設定
        /// デフォルト：true（有効）
        /// </summary>
        public bool AnnouncementEnabled { get; set; } = true;

        // カスタマイズ設定（2025/10/20追加）

        /// <summary>
        /// フォントサイズ設定
        /// 値：small, medium, large, xlarge
        /// デフォルト：medium
        /// </summary>
        [StringLength(10)]
        public string FontSize { get; set; } = "medium";

        /// <summary>
        /// 言語設定
        /// 値：ja, en, zh-CN, ko
        /// デフォルト：ja（日本語）
        /// </summary>
        [StringLength(10)]
        public string Language { get; set; } = "ja";

        /// <summary>
        /// 主親フラグ
        /// true: デスクトップアプリで保育園が登録した主保護者（デスクトップで表示）
        /// false: スマホアプリの家族追加機能で追加された保護者（デスクトップでは非表示）
        /// デフォルト：true
        /// </summary>
        public bool IsPrimary { get; set; } = true;

        // ナビゲーションプロパティ（関連エンティティとの関係性）

        /// <summary>
        /// SMS認証記録コレクション
        /// この保護者に関連するSMS認証履歴
        /// </summary>
        public virtual ICollection<SmsAuthentication> SmsAuthentications { get; set; } = new List<SmsAuthentication>();

        /// <summary>
        /// リフレッシュトークンコレクション
        /// この保護者のJWTリフレッシュトークン管理
        /// </summary>
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

        /// <summary>
        /// 保護者-園児関係コレクション
        /// この保護者と園児の関係性（親、祖父母等）
        /// </summary>
        public virtual ICollection<ParentChildRelationship> ParentRelationships { get; set; } = new List<ParentChildRelationship>();
    }
}