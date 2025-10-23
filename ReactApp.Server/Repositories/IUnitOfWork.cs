using ReactApp.Server.Models;

namespace ReactApp.Server.Repositories
{
    /// <summary>
    /// Unit of Workパターンインターフェース
    /// 複数のリポジトリ間でのトランザクション管理と一括保存を提供
    /// データ整合性の保証とリソースの適切な解放を実現
    /// </summary>
    public interface IUnitOfWork : IDisposable
    {
        /// <summary>園児リポジトリ</summary>
        IChildRepository Children { get; }

        /// <summary>保護者リポジトリ</summary>
        IRepository<Parent> Parents { get; }

        /// <summary>保護者-園児関係リポジトリ</summary>
        IRepository<ParentChildRelationship> ParentChildRelationships { get; }

        /// <summary>欠席・遅刻通知リポジトリ</summary>
        IRepository<AbsenceNotification> AbsenceNotifications { get; }

        /// <summary>イベントリポジトリ</summary>
        IRepository<Event> Events { get; }

        /// <summary>SMS認証リポジトリ</summary>
        IRepository<SmsAuthentication> SmsAuthentications { get; }

        /// <summary>リフレッシュトークンリポジトリ</summary>
        IRepository<RefreshToken> RefreshTokens { get; }

        /// <summary>
        /// 全リポジトリの変更をデータベースに一括保存
        /// </summary>
        /// <returns>影響したレコード数</returns>
        Task<int> SaveAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}