using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// スタッフのクラスアクセス権限検証サービスインターフェース
    /// スタッフが特定のクラスにアクセス可能かどうかを検証する
    /// </summary>
    public interface IStaffClassAccessValidator
    {
        /// <summary>
        /// スタッフの特定クラスへのアクセス権限を検証
        /// StaffClassAssignmentsテーブルで割り当てを確認
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="staffId">スタッフID</param>
        /// <param name="classId">クラスID</param>
        /// <returns>アクセス権限がある場合はtrue</returns>
        Task<bool> ValidateAccessAsync(int nurseryId, int staffId, string classId);

        /// <summary>
        /// スタッフのクラス割り当て情報を取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="staffId">スタッフID</param>
        /// <returns>クラス割り当て情報のリスト</returns>
        Task<List<ClassAssignmentDto>> GetStaffClassAssignmentsAsync(int nurseryId, int staffId);

        /// <summary>
        /// スタッフの特定クラスでの役割を取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="staffId">スタッフID</param>
        /// <param name="classId">クラスID</param>
        /// <returns>役割名（MainTeacher/AssistantTeacher）、割り当てがない場合はnull</returns>
        Task<string?> GetAssignmentRoleAsync(int nurseryId, int staffId, string classId);
    }
}
