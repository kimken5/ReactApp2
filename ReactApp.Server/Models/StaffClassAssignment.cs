using System.ComponentModel.DataAnnotations;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// スタッフクラス割り当てエンティティ
    /// スタッフと担当クラスの多対多リレーションシップを年度別に管理
    /// 年度スライド機能に対応
    /// 複合主キー: (AcademicYear, NurseryId, StaffId, ClassId)
    /// </summary>
    public class StaffClassAssignment
    {
        /// <summary>
        /// 年度(西暦)(複合主キー 1/4)(必須)
        /// 例: 2025
        /// </summary>
        [Required]
        public int AcademicYear { get; set; }

        /// <summary>
        /// 保育園ID(複合主キー 2/4)(必須)
        /// </summary>
        [Required]
        public int NurseryId { get; set; }

        /// <summary>
        /// スタッフID(複合主キー 3/4)(必須)
        /// </summary>
        [Required]
        public int StaffId { get; set; }

        /// <summary>
        /// クラスID(複合主キー 4/4)(必須)
        /// 例: "sakura", "himawari"
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string ClassId { get; set; } = string.Empty;

        /// <summary>
        /// 割り当て役割（任意）
        /// "MainTeacher": 主担任、"AssistantTeacher": 副担任
        /// </summary>
        [MaxLength(50)]
        public string? AssignmentRole { get; set; }

        /// <summary>
        /// 現在年度フラグ（必須）
        /// デフォルト: false
        /// 現在年度の担任割り当てを示す
        /// </summary>
        [Required]
        public bool IsCurrent { get; set; } = false;

        /// <summary>
        /// 未来年度フラグ（必須）
        /// デフォルト: false
        /// 未来年度の事前設定を示す
        /// 年度スライド時に IsFuture=true → IsCurrent=true に変更される
        /// </summary>
        [Required]
        public bool IsFuture { get; set; } = false;

        /// <summary>
        /// 有効フラグ（必須）
        /// デフォルト: true
        /// 過去年度の割り当てはfalse
        /// </summary>
        [Required]
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// 割り当て実行者ID（任意）
        /// この担任割り当てを設定したユーザーのID
        /// </summary>
        public int? AssignedByUserId { get; set; }

        /// <summary>
        /// 備考（任意）
        /// 最大200文字
        /// </summary>
        [MaxLength(200)]
        public string? Notes { get; set; }

        /// <summary>
        /// 割り当て日時（必須）
        /// </summary>
        [Required]
        public DateTime AssignedAt { get; set; } = DateTimeHelper.GetJstNow();

        /// <summary>
        /// 作成日時（必須）
        /// </summary>
        [Required]
        public DateTime CreatedAt { get; set; } = DateTimeHelper.GetJstNow();

        /// <summary>
        /// 更新日時（任意）
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties are ignored in DbContext configuration
        // Manual joins required when loading related entities
    }
}
