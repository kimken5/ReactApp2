using System.Linq.Expressions;

namespace ReactApp.Server.Repositories
{
    /// <summary>
    /// ジェネリックリポジトリインターフェース
    /// Entity Framework Coreを使用した基本的なCRUD操作の契約を定義
    /// データアクセス層の抽象化とテスト可能性を提供
    /// </summary>
    /// <typeparam name="T">操作対象のエンティティ型</typeparam>
    public interface IRepository<T> where T : class
    {
        /// <summary>IDでエンティティを取得</summary>
        /// <param name="id">エンティティID</param>
        /// <returns>該当エンティティ（見つからない場合はnull）</returns>
        Task<T?> GetByIdAsync(int id);

        /// <summary>全エンティティを取得</summary>
        /// <returns>全エンティティのコレクション</returns>
        Task<IEnumerable<T>> GetAllAsync();

        /// <summary>条件にマッチするエンティティを検索</summary>
        /// <param name="predicate">検索条件</param>
        /// <returns>条件にマッチするエンティティのコレクション</returns>
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);

        /// <summary>条件にマッチする最初のエンティティを取得</summary>
        /// <param name="predicate">検索条件</param>
        /// <returns>最初のマッチするエンティティ（見つからない場合はnull）</returns>
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);

        /// <summary>エンティティを非同期で追加</summary>
        /// <param name="entity">追加するエンティティ</param>
        Task AddAsync(T entity);

        /// <summary>複数のエンティティを非同期で一括追加</summary>
        /// <param name="entities">追加するエンティティのコレクション</param>
        Task AddRangeAsync(IEnumerable<T> entities);

        /// <summary>エンティティを更新</summary>
        /// <param name="entity">更新するエンティティ</param>
        void Update(T entity);

        /// <summary>エンティティを削除</summary>
        /// <param name="entity">削除するエンティティ</param>
        void Remove(T entity);

        /// <summary>複数のエンティティを一括削除</summary>
        /// <param name="entities">削除するエンティティのコレクション</param>
        void RemoveRange(IEnumerable<T> entities);
        Task<int> CountAsync();
        Task<int> CountAsync(Expression<Func<T, bool>> predicate);
        Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);
    }
}