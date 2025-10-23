using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using System.Linq.Expressions;

namespace ReactApp.Server.Repositories
{
    /// <summary>
    /// ジェネリックリポジトリ実装クラス
    /// Entity Framework Coreを使用した基本的なCRUD操作を提供する汎用リポジトリ
    /// </summary>
    /// <typeparam name="T">エンティティ型</typeparam>
    public class Repository<T> : IRepository<T> where T : class
    {
        /// <summary>
        /// データベースコンテキスト
        /// Entity Framework Coreのデータベース接続管理オブジェクト
        /// </summary>
        protected readonly KindergartenDbContext _context;

        /// <summary>
        /// エンティティセット
        /// 特定のエンティティ型に対するDbSetオブジェクト
        /// </summary>
        protected readonly DbSet<T> _dbSet;

        /// <summary>
        /// Repositoryコンストラクタ
        /// データベースコンテキストを受け取り、エンティティセットを初期化する
        /// </summary>
        /// <param name="context">データベースコンテキスト</param>
        public Repository(KindergartenDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        /// <summary>
        /// IDによるエンティティ取得
        /// 指定したIDに一致するエンティティを非同期で取得する
        /// </summary>
        /// <param name="id">取得対象のエンティティID</param>
        /// <returns>一致するエンティティまたはnull</returns>
        public virtual async Task<T?> GetByIdAsync(int id)
        {
            return await _dbSet.FindAsync(id);
        }

        /// <summary>
        /// 全エンティティ取得
        /// テーブル内のすべてのエンティティを非同期で取得する
        /// </summary>
        /// <returns>全エンティティのコレクション</returns>
        public virtual async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }

        /// <summary>
        /// 条件によるエンティティ検索
        /// 指定した条件式に一致するエンティティを非同期で検索する
        /// </summary>
        /// <param name="predicate">検索条件式</param>
        /// <returns>条件に一致するエンティティのコレクション</returns>
        public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.Where(predicate).ToListAsync();
        }

        /// <summary>
        /// 条件による最初のエンティティ取得
        /// 指定した条件式に一致する最初のエンティティを非同期で取得する
        /// </summary>
        /// <param name="predicate">検索条件式</param>
        /// <returns>最初に一致するエンティティまたはnull</returns>
        public virtual async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.FirstOrDefaultAsync(predicate);
        }

        /// <summary>
        /// エンティティ追加
        /// 指定したエンティティをデータベースに非同期で追加する
        /// </summary>
        /// <param name="entity">追加するエンティティ</param>
        /// <returns>非同期タスク</returns>
        public virtual async Task AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
        }

        /// <summary>
        /// 複数エンティティ一括追加
        /// 指定したエンティティコレクションをデータベースに非同期で一括追加する
        /// </summary>
        /// <param name="entities">追加するエンティティのコレクション</param>
        /// <returns>非同期タスク</returns>
        public virtual async Task AddRangeAsync(IEnumerable<T> entities)
        {
            await _dbSet.AddRangeAsync(entities);
        }

        /// <summary>
        /// エンティティ更新
        /// 指定したエンティティを更新状態にマークする
        /// </summary>
        /// <param name="entity">更新するエンティティ</param>
        public virtual void Update(T entity)
        {
            _dbSet.Update(entity);
        }

        /// <summary>
        /// エンティティ削除
        /// 指定したエンティティを削除状態にマークする
        /// </summary>
        /// <param name="entity">削除するエンティティ</param>
        public virtual void Remove(T entity)
        {
            _dbSet.Remove(entity);
        }

        /// <summary>
        /// 複数エンティティ一括削除
        /// 指定したエンティティコレクションを削除状態にマークする
        /// </summary>
        /// <param name="entities">削除するエンティティのコレクション</param>
        public virtual void RemoveRange(IEnumerable<T> entities)
        {
            _dbSet.RemoveRange(entities);
        }

        /// <summary>
        /// 全エンティティ数取得
        /// テーブル内の全エンティティ数を非同期で取得する
        /// </summary>
        /// <returns>全エンティティ数</returns>
        public virtual async Task<int> CountAsync()
        {
            return await _dbSet.CountAsync();
        }

        /// <summary>
        /// 条件によるエンティティ数取得
        /// 指定した条件式に一致するエンティティ数を非同期で取得する
        /// </summary>
        /// <param name="predicate">カウント条件式</param>
        /// <returns>条件に一致するエンティティ数</returns>
        public virtual async Task<int> CountAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.CountAsync(predicate);
        }

        /// <summary>
        /// エンティティ存在確認
        /// 指定した条件式に一致するエンティティが存在するか非同期で確認する
        /// </summary>
        /// <param name="predicate">存在確認条件式</param>
        /// <returns>エンティティが存在するtrue、そうでなければfalse</returns>
        public virtual async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.AnyAsync(predicate);
        }
    }
}