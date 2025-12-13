using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// スタッフクラス割り当てサービス実装
    /// </summary>
    public class StaffClassAssignmentService : IStaffClassAssignmentService
    {
        private readonly KindergartenDbContext _context;
        private readonly ILogger<StaffClassAssignmentService> _logger;

        public StaffClassAssignmentService(
            KindergartenDbContext context,
            ILogger<StaffClassAssignmentService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// 指定年度のクラス別担任割り当て一覧を取得
        /// </summary>
        public async Task<List<ClassStaffAssignmentDto>> GetClassStaffAssignmentsAsync(int nurseryId, int academicYear)
        {
            try
            {
                // 全クラスを取得
                var classes = await _context.Classes
                    .Where(c => c.NurseryId == nurseryId && c.IsActive)
                    .OrderBy(c => c.AgeGroupMin)
                    .ThenBy(c => c.Name)
                    .ToListAsync();

                // 指定年度のスタッフ割り当てを取得
                var assignments = await _context.StaffClassAssignments
                    .Where(a => a.NurseryId == nurseryId
                        && a.AcademicYear == academicYear
                        && a.IsActive)
                    .ToListAsync();

                // スタッフ情報を取得
                var staffIds = assignments.Select(a => a.StaffId).Distinct().ToList();
                var staff = await _context.Staff
                    .Where(s => s.NurseryId == nurseryId && staffIds.Contains(s.StaffId))
                    .ToListAsync();

                // クラス別に整理
                var result = classes.Select(cls => new ClassStaffAssignmentDto
                {
                    ClassId = cls.ClassId,
                    ClassName = cls.Name,
                    AgeGroupMin = cls.AgeGroupMin,
                    AgeGroupMax = cls.AgeGroupMax,
                    MaxCapacity = cls.MaxCapacity,
                    AssignedStaff = assignments
                        .Where(a => a.ClassId == cls.ClassId)
                        .Select(a =>
                        {
                            var staffMember = staff.FirstOrDefault(s => s.StaffId == a.StaffId);
                            return new AssignedStaffDto
                            {
                                StaffId = a.StaffId,
                                StaffName = staffMember?.Name ?? "不明",
                                Role = staffMember?.Role,
                                AssignmentRole = a.AssignmentRole,
                                Notes = a.Notes,
                                AssignedAt = a.AssignedAt
                            };
                        })
                        .OrderBy(s => s.AssignmentRole == "MainTeacher" ? 0 : 1)
                        .ThenBy(s => s.StaffName)
                        .ToList()
                }).ToList();

                _logger.LogInformation(
                    "クラス別担任割り当て一覧を取得しました: NurseryId={NurseryId}, AcademicYear={AcademicYear}, クラス数={ClassCount}",
                    nurseryId, academicYear, result.Count);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラス別担任割り当て一覧の取得に失敗: NurseryId={NurseryId}, AcademicYear={AcademicYear}",
                    nurseryId, academicYear);
                throw;
            }
        }

        /// <summary>
        /// 利用可能なスタッフ一覧を取得
        /// </summary>
        public async Task<List<AvailableStaffDto>> GetAvailableStaffAsync(int nurseryId, int academicYear)
        {
            try
            {
                // アクティブなスタッフを取得
                var staff = await _context.Staff
                    .Where(s => s.NurseryId == nurseryId && s.IsActive)
                    .OrderBy(s => s.Name)
                    .ToListAsync();

                // 指定年度の割り当て情報を取得
                var assignments = await _context.StaffClassAssignments
                    .Where(a => a.NurseryId == nurseryId
                        && a.AcademicYear == academicYear
                        && a.IsActive)
                    .ToListAsync();

                // クラス名を取得
                var classIds = assignments.Select(a => a.ClassId).Distinct().ToList();
                var classes = await _context.Classes
                    .Where(c => c.NurseryId == nurseryId && classIds.Contains(c.ClassId))
                    .ToListAsync();

                var result = staff.Select(s => new AvailableStaffDto
                {
                    StaffId = s.StaffId,
                    Name = s.Name,
                    Role = s.Role,
                    Position = s.Position,
                    CurrentAssignedClasses = assignments
                        .Where(a => a.StaffId == s.StaffId)
                        .Select(a =>
                        {
                            var cls = classes.FirstOrDefault(c => c.ClassId == a.ClassId);
                            var roleSuffix = a.AssignmentRole == "MainTeacher" ? " (主担任)" :
                                           a.AssignmentRole == "AssistantTeacher" ? " (副担任)" : "";
                            return $"{cls?.Name ?? a.ClassId}{roleSuffix}";
                        })
                        .ToList()
                }).ToList();

                _logger.LogInformation(
                    "利用可能なスタッフ一覧を取得しました: NurseryId={NurseryId}, AcademicYear={AcademicYear}, スタッフ数={StaffCount}",
                    nurseryId, academicYear, result.Count);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "利用可能なスタッフ一覧の取得に失敗: NurseryId={NurseryId}, AcademicYear={AcademicYear}",
                    nurseryId, academicYear);
                throw;
            }
        }

        /// <summary>
        /// スタッフをクラスに割り当て
        /// </summary>
        public async Task<StaffClassAssignmentDto> AssignStaffToClassAsync(AssignStaffToClassRequest request)
        {
            try
            {
                // 既に割り当て済みかチェック
                var existing = await _context.StaffClassAssignments
                    .FirstOrDefaultAsync(a =>
                        a.NurseryId == request.NurseryId
                        && a.AcademicYear == request.AcademicYear
                        && a.StaffId == request.StaffId
                        && a.ClassId == request.ClassId
                        && a.IsActive);

                if (existing != null)
                {
                    throw new InvalidOperationException("このスタッフは既にこのクラスに割り当てられています。");
                }

                // 年度情報を確認
                var academicYear = await _context.AcademicYears
                    .FirstOrDefaultAsync(y => y.NurseryId == request.NurseryId && y.Year == request.AcademicYear);

                if (academicYear == null)
                {
                    throw new InvalidOperationException($"年度 {request.AcademicYear} が見つかりません。");
                }

                // 割り当てを作成
                var assignment = new StaffClassAssignment
                {
                    NurseryId = request.NurseryId,
                    AcademicYear = request.AcademicYear,
                    StaffId = request.StaffId,
                    ClassId = request.ClassId,
                    AssignmentRole = request.AssignmentRole,
                    IsCurrent = academicYear.IsCurrent,
                    IsFuture = academicYear.IsFuture,
                    IsActive = true,
                    AssignedByUserId = request.AssignedByUserId,
                    Notes = request.Notes,
                    AssignedAt = DateTimeHelper.GetJstNow(),
                    CreatedAt = DateTimeHelper.GetJstNow()
                };

                _context.StaffClassAssignments.Add(assignment);
                await _context.SaveChangesAsync();

                // スタッフとクラス名を取得
                var staff = await _context.Staff
                    .FirstOrDefaultAsync(s => s.NurseryId == request.NurseryId && s.StaffId == request.StaffId);

                var cls = await _context.Classes
                    .FirstOrDefaultAsync(c => c.NurseryId == request.NurseryId && c.ClassId == request.ClassId);

                _logger.LogInformation(
                    "スタッフをクラスに割り当てました: StaffId={StaffId}, ClassId={ClassId}, Year={Year}, Role={Role}",
                    request.StaffId, request.ClassId, request.AcademicYear, request.AssignmentRole);

                return new StaffClassAssignmentDto
                {
                    AcademicYear = assignment.AcademicYear,
                    NurseryId = assignment.NurseryId,
                    StaffId = assignment.StaffId,
                    StaffName = staff?.Name ?? "不明",
                    ClassId = assignment.ClassId,
                    ClassName = cls?.Name ?? "不明",
                    AssignmentRole = assignment.AssignmentRole,
                    IsCurrent = assignment.IsCurrent,
                    IsFuture = assignment.IsFuture,
                    IsActive = assignment.IsActive,
                    Notes = assignment.Notes,
                    AssignedAt = assignment.AssignedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "スタッフのクラス割り当てに失敗: StaffId={StaffId}, ClassId={ClassId}",
                    request.StaffId, request.ClassId);
                throw;
            }
        }

        /// <summary>
        /// スタッフのクラス割り当てを解除
        /// </summary>
        public async Task UnassignStaffFromClassAsync(UnassignStaffFromClassRequest request)
        {
            try
            {
                var assignment = await _context.StaffClassAssignments
                    .FirstOrDefaultAsync(a =>
                        a.NurseryId == request.NurseryId
                        && a.AcademicYear == request.AcademicYear
                        && a.StaffId == request.StaffId
                        && a.ClassId == request.ClassId
                        && a.IsActive);

                if (assignment == null)
                {
                    throw new InvalidOperationException("指定された割り当てが見つかりません。");
                }

                // 論理削除
                assignment.IsActive = false;
                assignment.UpdatedAt = DateTimeHelper.GetJstNow();

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "スタッフのクラス割り当てを解除しました: StaffId={StaffId}, ClassId={ClassId}, Year={Year}",
                    request.StaffId, request.ClassId, request.AcademicYear);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "スタッフのクラス割り当て解除に失敗: StaffId={StaffId}, ClassId={ClassId}",
                    request.StaffId, request.ClassId);
                throw;
            }
        }

        /// <summary>
        /// スタッフの割り当て役割を更新
        /// </summary>
        public async Task<StaffClassAssignmentDto> UpdateAssignmentRoleAsync(
            int nurseryId,
            int academicYear,
            int staffId,
            string classId,
            string? assignmentRole,
            string? notes)
        {
            try
            {
                var assignment = await _context.StaffClassAssignments
                    .FirstOrDefaultAsync(a =>
                        a.NurseryId == nurseryId
                        && a.AcademicYear == academicYear
                        && a.StaffId == staffId
                        && a.ClassId == classId
                        && a.IsActive);

                if (assignment == null)
                {
                    throw new InvalidOperationException("指定された割り当てが見つかりません。");
                }

                assignment.AssignmentRole = assignmentRole;
                assignment.Notes = notes;
                assignment.UpdatedAt = DateTimeHelper.GetJstNow();

                await _context.SaveChangesAsync();

                // スタッフとクラス名を取得
                var staff = await _context.Staff
                    .FirstOrDefaultAsync(s => s.NurseryId == nurseryId && s.StaffId == staffId);

                var cls = await _context.Classes
                    .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ClassId == classId);

                _logger.LogInformation(
                    "スタッフの割り当て役割を更新しました: StaffId={StaffId}, ClassId={ClassId}, Role={Role}",
                    staffId, classId, assignmentRole);

                return new StaffClassAssignmentDto
                {
                    AcademicYear = assignment.AcademicYear,
                    NurseryId = assignment.NurseryId,
                    StaffId = assignment.StaffId,
                    StaffName = staff?.Name ?? "不明",
                    ClassId = assignment.ClassId,
                    ClassName = cls?.Name ?? "不明",
                    AssignmentRole = assignment.AssignmentRole,
                    IsCurrent = assignment.IsCurrent,
                    IsFuture = assignment.IsFuture,
                    IsActive = assignment.IsActive,
                    Notes = assignment.Notes,
                    AssignedAt = assignment.AssignedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "スタッフの割り当て役割更新に失敗: StaffId={StaffId}, ClassId={ClassId}",
                    staffId, classId);
                throw;
            }
        }
    }
}
