using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// ユーザー種別フラグ列挙型
    /// 複数の役割を持つユーザーに対応するためのフラグ形式
    /// </summary>
    [Flags]
    public enum UserTypeFlags
    {
        /// <summary>なし（未登録）</summary>
        None = 0,
        /// <summary>保護者</summary>
        Parent = 1,
        /// <summary>スタッフ</summary>
        Staff = 2,
        /// <summary>保護者兼スタッフ</summary>
        Both = Parent | Staff
    }

    /// <summary>
    /// ユーザー種別列挙型
    /// 単一役割の選択時に使用
    /// </summary>
    public enum UserType
    {
        /// <summary>保護者</summary>
        Parent,
        /// <summary>スタッフ</summary>
        Staff
    }




    /// <summary>
    /// ユーザー統合ビューモデル
    /// データベースビューからのデータマッピング用
    /// </summary>
    public class UserIntegratedView
    {
        /// <summary>ユーザー種別（"Parent" or "Staff"）</summary>
        public string UserType { get; set; } = string.Empty;

        /// <summary>ユーザーID</summary>
        public int UserId { get; set; }

        /// <summary>電話番号</summary>
        public string PhoneNumber { get; set; } = string.Empty;

        /// <summary>ユーザー名</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>メールアドレス</summary>
        public string? Email { get; set; }

        /// <summary>アクティブフラグ</summary>
        public bool IsActive { get; set; }

        /// <summary>最終ログイン時刻</summary>
        public DateTime? LastLoginAt { get; set; }

        /// <summary>園児数（保護者の場合のみ）</summary>
        public int ChildCount { get; set; }

        /// <summary>職位（スタッフの場合のみ）</summary>
        public string? Position { get; set; }
    }
}