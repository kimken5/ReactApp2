namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// スタッフクラス割り当て情報DTO
    /// </summary>
    public class StaffClassAssignmentDto
    {
        public int AcademicYear { get; set; }
        public int NurseryId { get; set; }
        public int StaffId { get; set; }
        public string StaffName { get; set; } = string.Empty;
        public string ClassId { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public string? AssignmentRole { get; set; }
        public bool IsCurrent { get; set; }
        public bool IsFuture { get; set; }
        public bool IsActive { get; set; }
        public string? Notes { get; set; }
        public DateTime AssignedAt { get; set; }
    }

    /// <summary>
    /// クラス別担任割り当て情報DTO
    /// </summary>
    public class ClassStaffAssignmentDto
    {
        public string ClassId { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public int AgeGroupMin { get; set; }
        public int AgeGroupMax { get; set; }
        public int MaxCapacity { get; set; }
        public List<AssignedStaffDto> AssignedStaff { get; set; } = new();
    }

    /// <summary>
    /// 割り当て済みスタッフ情報DTO
    /// </summary>
    public class AssignedStaffDto
    {
        public int StaffId { get; set; }
        public string StaffName { get; set; } = string.Empty;
        public string? Role { get; set; }
        public string? AssignmentRole { get; set; }
        public string? Notes { get; set; }
        public DateTime AssignedAt { get; set; }
    }

    /// <summary>
    /// スタッフクラス割り当てリクエストDTO
    /// </summary>
    public class AssignStaffToClassRequest
    {
        public int NurseryId { get; set; }
        public int AcademicYear { get; set; }
        public int StaffId { get; set; }
        public string ClassId { get; set; } = string.Empty;
        public string? AssignmentRole { get; set; }
        public string? Notes { get; set; }
        public int? AssignedByUserId { get; set; }
    }

    /// <summary>
    /// スタッフクラス割り当て解除リクエストDTO
    /// </summary>
    public class UnassignStaffFromClassRequest
    {
        public int NurseryId { get; set; }
        public int AcademicYear { get; set; }
        public int StaffId { get; set; }
        public string ClassId { get; set; } = string.Empty;
    }

    /// <summary>
    /// 利用可能なスタッフDTO
    /// </summary>
    public class AvailableStaffDto
    {
        public int StaffId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Position { get; set; }
        public List<string> CurrentAssignedClasses { get; set; } = new();
    }
}
