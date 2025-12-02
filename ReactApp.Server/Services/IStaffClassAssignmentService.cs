using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// スタッフクラス割り当てサービスインターフェース
    /// </summary>
    public interface IStaffClassAssignmentService
    {
        /// <summary>
        /// 指定年度のクラス別担任割り当て一覧を取得
        /// </summary>
        Task<List<ClassStaffAssignmentDto>> GetClassStaffAssignmentsAsync(int nurseryId, int academicYear);

        /// <summary>
        /// 利用可能なスタッフ一覧を取得（既に割り当て済みのクラス情報を含む）
        /// </summary>
        Task<List<AvailableStaffDto>> GetAvailableStaffAsync(int nurseryId, int academicYear);

        /// <summary>
        /// スタッフをクラスに割り当て
        /// </summary>
        Task<StaffClassAssignmentDto> AssignStaffToClassAsync(AssignStaffToClassRequest request);

        /// <summary>
        /// スタッフのクラス割り当てを解除
        /// </summary>
        Task UnassignStaffFromClassAsync(UnassignStaffFromClassRequest request);

        /// <summary>
        /// スタッフの割り当て役割を更新
        /// </summary>
        Task<StaffClassAssignmentDto> UpdateAssignmentRoleAsync(
            int nurseryId,
            int academicYear,
            int staffId,
            string classId,
            string? assignmentRole,
            string? notes);
    }
}
