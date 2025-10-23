using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.Models;

namespace ReactApp.Server.Repositories
{
    /// <summary>
    /// 園児リポジトリ実装クラス
    /// 園児エンティティの基本操作に加えて特化した検索機能を実装
    /// 保護者関連情報やクラス別検索などの業務ロジックを実現
    /// </summary>
    public class ChildRepository : Repository<Child>, IChildRepository
    {
        /// <summary>
        /// ChildRepositoryコンストラクタ
        /// データベースコンテキストを注入し基底クラスを初期化
        /// </summary>
        /// <param name="context">データベースコンテキスト</param>
        public ChildRepository(KindergartenDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Child>> GetChildrenByParentIdAsync(int parentId)
        {
            return await _context.Children
                .Include(c => c.ParentRelationships)
                .ThenInclude(pr => pr.Parent)
                .Where(c => c.ParentRelationships.Any(pr => pr.ParentId == parentId))
                .ToListAsync();
        }

        public async Task<IEnumerable<Child>> GetChildrenByClassAsync(string classId)
        {
            return await _context.Children
                .Include(c => c.ParentRelationships)
                .ThenInclude(pr => pr.Parent)
                .Where(c => c.ClassId == classId)
                .ToListAsync();
        }

        public async Task<Child?> GetChildWithParentsAsync(int nurseryId, int childId)
        {
            return await _context.Children
                .Include(c => c.ParentRelationships)
                .ThenInclude(pr => pr.Parent)
                .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ChildId == childId);
        }

        public async Task<IEnumerable<Child>> GetChildrenWithParentsAsync()
        {
            return await _context.Children
                .Include(c => c.ParentRelationships)
                .ThenInclude(pr => pr.Parent)
                .ToListAsync();
        }
    }
}