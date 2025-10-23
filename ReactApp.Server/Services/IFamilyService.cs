using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 家族管理サービスインターフェース
    /// 家族招待・メンバー管理・アクセス権限制御機能を提供
    /// 保護者間の関係構築とセキュアな情報共有を実現
    /// </summary>
    public interface IFamilyService
    {
        // 家族メンバー管理機能
        /// <summary>
        /// 家族メンバー直接登録
        /// </summary>
        /// <param name="inviterParentId">登録者の保護者ID</param>
        /// <param name="dto">登録データ</param>
        /// <returns>作成された家族メンバー情報</returns>
        Task<FamilyMemberDto> CreateFamilyMemberAsync(int inviterParentId, CreateFamilyMemberDto dto);

        /// <summary>
        /// 園児の家族メンバー一覧取得
        /// </summary>
        /// <param name="childId">園児ID</param>
        /// <returns>該当園児の家族メンバー一覧</returns>
        Task<IEnumerable<FamilyMemberDto>> GetFamilyMembersByChildAsync(int childId);

        /// <summary>
        /// 保護者の関連家族メンバー一覧取得
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <returns>該当保護者に関連する家族メンバー一覧</returns>
        Task<IEnumerable<FamilyMemberDto>> GetFamilyMembersByParentAsync(int parentId);

        /// <summary>
        /// 特定家族メンバーの詳細取得
        /// </summary>
        /// <param name="memberId">家族メンバーID</param>
        /// <returns>家族メンバー詳細情報（見つからない場合はnull）</returns>
        Task<FamilyMemberDto?> GetFamilyMemberAsync(int memberId);

        /// <summary>
        /// 家族メンバー情報更新
        /// </summary>
        /// <param name="memberId">家族メンバーID</param>
        /// <param name="requestingParentId">更新要求者の保護者ID</param>
        /// <param name="dto">更新データ</param>
        /// <returns>更新処理の成功可否</returns>
        Task<bool> UpdateFamilyMemberAsync(int memberId, int requestingParentId, UpdateFamilyMemberDto dto);

        /// <summary>
        /// 家族メンバー削除
        /// </summary>
        /// <param name="memberId">家族メンバーID</param>
        /// <param name="requestingParentId">削除要求者の保護者ID</param>
        /// <returns>削除処理の成功可否</returns>
        Task<bool> RemoveFamilyMemberAsync(int memberId, int requestingParentId);

        // 家族統計・アクセス制御機能
        /// <summary>
        /// 園児アクセス権限チェック
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <param name="childId">園児ID</param>
        /// <returns>アクセス権限の有無</returns>
        Task<bool> CanParentAccessChildAsync(int parentId, int childId);

        /// <summary>
        /// アクセス可能な園児一覧取得
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <returns>アクセス権限のある園児ID一覧</returns>
        Task<IEnumerable<int>> GetAccessibleChildrenAsync(int parentId);
    }
}