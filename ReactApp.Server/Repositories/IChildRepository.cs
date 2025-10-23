using ReactApp.Server.Models;

namespace ReactApp.Server.Repositories
{
    /// <summary>
    /// 園児専用リポジトリインターフェース
    /// 園児エンティティの基本操作に加えて特化した検索機能を提供
    /// 保護者関連情報やクラス別検索などの業務ロジックを含む
    /// </summary>
    public interface IChildRepository : IRepository<Child>
    {
        /// <summary>
        /// 特定保護者の園児一覧を取得
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <returns>該当保護者の園児一覧</returns>
        Task<IEnumerable<Child>> GetChildrenByParentIdAsync(int parentId);

        /// <summary>
        /// 特定クラスの園児一覧を取得
        /// </summary>
        /// <param name="classId">クラスID</param>
        /// <returns>該当クラスの園児一覧</returns>
        Task<IEnumerable<Child>> GetChildrenByClassAsync(string classId);

        /// <summary>
        /// 保護者情報を含む園児詳細を取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="childId">園児ID</param>
        /// <returns>保護者情報を含む園児詳細（見つからない場合はnull）</returns>
        Task<Child?> GetChildWithParentsAsync(int nurseryId, int childId);

        /// <summary>
        /// 全園児とその保護者情報を一括取得
        /// </summary>
        /// <returns>保護者情報を含む全園児一覧</returns>
        Task<IEnumerable<Child>> GetChildrenWithParentsAsync();
    }
}