using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop
{
    /// <summary>
    /// クラス構成情報DTO
    /// </summary>
    public class ClassCompositionDto
    {
        /// <summary>
        /// クラスID
        /// </summary>
        public string ClassId { get; set; } = string.Empty;

        /// <summary>
        /// クラス名
        /// </summary>
        public string ClassName { get; set; } = string.Empty;

        /// <summary>
        /// 割り当て済み職員リスト
        /// </summary>
        public List<AssignedStaffDto> AssignedStaff { get; set; } = new();

        /// <summary>
        /// 割り当て済み園児リスト
        /// </summary>
        public List<AssignedChildDto> AssignedChildren { get; set; } = new();
    }

    /// <summary>
    /// 割り当て済み職員情報
    /// </summary>
    public class AssignedStaffDto
    {
        /// <summary>
        /// 職員ID
        /// </summary>
        public int StaffId { get; set; }

        /// <summary>
        /// 職員名
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 役割（MainTeacher/AssistantTeacher）
        /// </summary>
        public string AssignmentRole { get; set; } = "MainTeacher";
    }

    /// <summary>
    /// 割り当て済み園児情報
    /// </summary>
    public class AssignedChildDto
    {
        /// <summary>
        /// 園児ID
        /// </summary>
        public int ChildId { get; set; }

        /// <summary>
        /// 園児名
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// ふりがな
        /// </summary>
        public string? Furigana { get; set; }
    }

    /// <summary>
    /// クラス構成更新リクエストDTO
    /// </summary>
    public class UpdateClassCompositionRequestDto
    {
        /// <summary>
        /// 割り当て職員IDリスト
        /// </summary>
        [Required]
        public List<int> StaffIds { get; set; } = new();

        /// <summary>
        /// 割り当て園児IDリスト
        /// </summary>
        [Required]
        public List<int> ChildIds { get; set; } = new();
    }
}
