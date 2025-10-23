using Microsoft.EntityFrameworkCore.Storage;
using ReactApp.Server.Data;
using ReactApp.Server.Models;

namespace ReactApp.Server.Repositories
{
    /// <summary>
    /// Unit of Workパターン実装クラス
    /// 複数のリポジトリ間でのトランザクション管理と一括保存を実装
    /// データ整合性の保証とリソースの適切な解放を提供
    /// </summary>
    public class UnitOfWork : IUnitOfWork
    {
        // 依存サービスとトランザクション管理
        private readonly KindergartenDbContext _context;          // データベースコンテキスト
        private IDbContextTransaction? _transaction;              // データベーストランザクション

        // リポジトリインスタンス（遅延初期化）
        private IChildRepository? _children;                      // 園児リポジトリ
        private IRepository<Parent>? _parents;                    // 保護者リポジトリ
        private IRepository<ParentChildRelationship>? _parentChildRelationships; // 保護者-園児関係リポジトリ
        private IRepository<AbsenceNotification>? _absenceNotifications;         // 欠席・遅刻通知リポジトリ
        private IRepository<Event>? _events;                      // イベントリポジトリ
        private IRepository<SmsAuthentication>? _smsAuthentications; // SMS認証リポジトリ
        private IRepository<RefreshToken>? _refreshTokens;        // リフレッシュトークンリポジトリ

        /// <summary>
        /// UnitOfWorkコンストラクタ
        /// データベースコンテキストを注入し初期化
        /// </summary>
        /// <param name="context">データベースコンテキスト</param>
        public UnitOfWork(KindergartenDbContext context)
        {
            _context = context;
        }

        public IChildRepository Children =>
            _children ??= new ChildRepository(_context);

        public IRepository<Parent> Parents =>
            _parents ??= new Repository<Parent>(_context);

        public IRepository<ParentChildRelationship> ParentChildRelationships =>
            _parentChildRelationships ??= new Repository<ParentChildRelationship>(_context);

        public IRepository<AbsenceNotification> AbsenceNotifications =>
            _absenceNotifications ??= new Repository<AbsenceNotification>(_context);

        public IRepository<Event> Events =>
            _events ??= new Repository<Event>(_context);

        public IRepository<SmsAuthentication> SmsAuthentications =>
            _smsAuthentications ??= new Repository<SmsAuthentication>(_context);

        public IRepository<RefreshToken> RefreshTokens =>
            _refreshTokens ??= new Repository<RefreshToken>(_context);

        public async Task<int> SaveAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}