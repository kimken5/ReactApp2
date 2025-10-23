using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// スタッフクラス割り当てエンティティ
    /// スタッフと担当クラスの多対多リレーションシップを管理
    /// 1人のスタッフが複数のクラスを担当可能
    /// 複合主キー: (NurseryId, StaffId, ClassId)
    /// </summary>
    public class StaffClassAssignment
    {
        /// <summary>
        /// 保育園ID（複合主キーの一部）
        /// </summary>
        [Required]
        public int NurseryId { get; set; }

        /// <summary>
        /// スタッフID（複合主キーの一部）
        /// </summary>
        [Required]
        public int StaffId { get; set; }

        /// <summary>
        /// クラスID（複合主キーの一部）
        /// 例: "sakura", "himawari"
        /// </summary>
        [Required]
        [StringLength(50)]
        public string ClassId { get; set; } = string.Empty;

        /// <summary>
        /// 割り当て役割
        /// "MainTeacher": 担任、"AssistantTeacher": 副担任
        /// </summary>
        [Required]
        [StringLength(50)]
        public string AssignmentRole { get; set; } = string.Empty;

        /// <summary>
        /// 作成日時
        /// 割り当てが作成された日時（UTC）
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// 更新日時（任意）
        /// 割り当てが最後に更新された日時（UTC）
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        /// <summary>
        /// 割り当てられたスタッフ
        /// </summary>
        public virtual Staff? Staff { get; set; }

        /// <summary>
        /// 割り当てられたクラス
        /// </summary>
        public virtual Class? Class { get; set; }
    }
}
