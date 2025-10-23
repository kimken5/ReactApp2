using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;
using ReactApp.Server.Exceptions;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// スタッフ管理サービス実装クラス
    /// 保育園スタッフの登録・更新・検索の業務ロジックを提供
    /// 役職・クラス別の管理とアクセス制御を含む
    /// </summary>
    public class StaffService : IStaffService
    {
        // 依存サービス
        private readonly KindergartenDbContext _context;        // データベースコンテキスト
        private readonly IMapper _mapper;                       // オブジェクトマッピングサービス
        private readonly ILogger<StaffService> _logger;         // ログ出力サービス

        /// <summary>
        /// StaffServiceコンストラクタ
        /// 必要な依存サービスを注入により受け取り初期化
        /// </summary>
        /// <param name="context">データベースコンテキスト</param>
        /// <param name="mapper">オブジェクトマッピングサービス</param>
        /// <param name="logger">ログ出力サービス</param>
        public StaffService(
            KindergartenDbContext context,
            IMapper mapper,
            ILogger<StaffService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<IEnumerable<StaffDto>> GetAllStaffAsync()
        {
            var staff = await _context.Staff
                .Where(s => s.IsActive)
                .OrderBy(s => s.Name)
                .ToListAsync();

            return _mapper.Map<IEnumerable<StaffDto>>(staff);
        }

        public async Task<StaffDto?> GetStaffByIdAsync(int id)
        {
            // TODO: Update to use compound key (NurseryId, StaffId)
            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.StaffId == id && s.IsActive);

            return staff != null ? _mapper.Map<StaffDto>(staff) : null;
        }

        public async Task<StaffDto?> GetStaffByPhoneNumberAsync(string phoneNumber)
        {
            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.PhoneNumber == phoneNumber && s.IsActive);

            return staff != null ? _mapper.Map<StaffDto>(staff) : null;
        }

        public async Task<IEnumerable<StaffDto>> GetStaffByRoleAsync(string role)
        {
            var staff = await _context.Staff
                .Where(s => s.Role == role && s.IsActive)
                .OrderBy(s => s.Name)
                .ToListAsync();

            return _mapper.Map<IEnumerable<StaffDto>>(staff);
        }

        public async Task<IEnumerable<StaffDto>> GetStaffByClassIdAsync(string classId)
        {
            // TODO: Update to use StaffClassAssignments for multi-class support
            var staff = await _context.StaffClassAssignments
                .Where(sca => sca.ClassId == classId)
                .Join(_context.Staff,
                    sca => new { sca.NurseryId, sca.StaffId },
                    s => new { s.NurseryId, s.StaffId },
                    (sca, s) => s)
                .Where(s => s.IsActive)
                .OrderBy(s => s.Name)
                .ToListAsync();

            return _mapper.Map<IEnumerable<StaffDto>>(staff);
        }

        public async Task<StaffDto> CreateStaffAsync(CreateStaffDto dto)
        {
            var existingStaff = await _context.Staff
                .FirstOrDefaultAsync(s => s.PhoneNumber == dto.PhoneNumber);

            if (existingStaff != null)
            {
                throw new BusinessException("同じ電話番号のスタッフが既に存在します。");
            }

            // TODO: Update to use compound key (NurseryId, StaffId) and StaffClassAssignments
            throw new NotImplementedException("CreateStaffAsync needs to be updated for multi-class support");
        }

        public async Task<bool> UpdateStaffAsync(int id, UpdateStaffDto dto)
        {
            // TODO: Update to use compound key (NurseryId, StaffId) and StaffClassAssignments
            throw new NotImplementedException("UpdateStaffAsync needs to be updated for multi-class support");
        }

        public async Task<bool> DeactivateStaffAsync(int id)
        {
            // TODO: Update to use compound key (NurseryId, StaffId)
            throw new NotImplementedException("DeactivateStaffAsync needs to be updated for multi-class support");
        }

        public async Task<bool> DeleteStaffAsync(int id)
        {
            // TODO: Update to use compound key (NurseryId, StaffId)
            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.StaffId == id);
            if (staff == null)
            {
                return false;
            }

            var hasReports = await _context.DailyReports
                .AnyAsync(r => r.StaffId == staff.StaffId);

            var hasResponses = await _context.AbsenceNotificationResponses
                .AnyAsync(r => r.StaffId == staff.StaffId);

            if (hasReports || hasResponses)
            {
                throw new BusinessException("レポートまたは対応履歴があるため、このスタッフは削除できません。");
            }

            _context.Staff.Remove(staff);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Staff deleted: {StaffId}", id);
            return true;
        }
    }
}