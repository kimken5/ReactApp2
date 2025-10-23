using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// スタッフのクラスアクセス権限検証サービス実装
    /// </summary>
    public class StaffClassAccessValidator : IStaffClassAccessValidator
    {
        private readonly KindergartenDbContext _context;
        private readonly ILogger<StaffClassAccessValidator> _logger;

        public StaffClassAccessValidator(
            KindergartenDbContext context,
            ILogger<StaffClassAccessValidator> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// スタッフの特定クラスへのアクセス権限を検証
        /// </summary>
        public async Task<bool> ValidateAccessAsync(int nurseryId, int staffId, string classId)
        {
            try
            {
                var hasAccess = await _context.StaffClassAssignments
                    .AnyAsync(sca =>
                        sca.NurseryId == nurseryId &&
                        sca.StaffId == staffId &&
                        sca.ClassId == classId);

                _logger.LogDebug(
                    "クラスアクセス検証: NurseryId={NurseryId}, StaffId={StaffId}, ClassId={ClassId}, Result={HasAccess}",
                    nurseryId, staffId, classId, hasAccess);

                return hasAccess;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "クラスアクセス検証エラー: NurseryId={NurseryId}, StaffId={StaffId}, ClassId={ClassId}",
                    nurseryId, staffId, classId);
                return false;
            }
        }

        /// <summary>
        /// スタッフのクラス割り当て情報を取得
        /// </summary>
        public async Task<List<ClassAssignmentDto>> GetStaffClassAssignmentsAsync(int nurseryId, int staffId)
        {
            try
            {
                var classAssignments = await _context.StaffClassAssignments
                    .Where(sca => sca.NurseryId == nurseryId && sca.StaffId == staffId)
                    .Join(_context.Classes,
                        sca => new { sca.NurseryId, sca.ClassId },
                        c => new { c.NurseryId, c.ClassId },
                        (sca, c) => new ClassAssignmentDto
                        {
                            ClassId = sca.ClassId,
                            ClassName = c.Name,
                            AssignmentRole = sca.AssignmentRole
                        })
                    .OrderByDescending(c => c.AssignmentRole) // MainTeacherを先に
                    .ThenBy(c => c.ClassName)
                    .ToListAsync();

                _logger.LogDebug(
                    "クラス割り当て取得: NurseryId={NurseryId}, StaffId={StaffId}, Count={Count}",
                    nurseryId, staffId, classAssignments.Count);

                return classAssignments;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "クラス割り当て取得エラー: NurseryId={NurseryId}, StaffId={StaffId}",
                    nurseryId, staffId);
                return new List<ClassAssignmentDto>();
            }
        }

        /// <summary>
        /// スタッフの特定クラスでの役割を取得
        /// </summary>
        public async Task<string?> GetAssignmentRoleAsync(int nurseryId, int staffId, string classId)
        {
            try
            {
                var assignment = await _context.StaffClassAssignments
                    .Where(sca =>
                        sca.NurseryId == nurseryId &&
                        sca.StaffId == staffId &&
                        sca.ClassId == classId)
                    .FirstOrDefaultAsync();

                return assignment?.AssignmentRole;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "役割取得エラー: NurseryId={NurseryId}, StaffId={StaffId}, ClassId={ClassId}",
                    nurseryId, staffId, classId);
                return null;
            }
        }
    }
}
