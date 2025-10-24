using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デスクトップアプリ用マスタ管理サービス実装
    /// 保育園、クラス、園児、保護者、職員の全マスタデータを管理
    /// </summary>
    public class DesktopMasterService : IDesktopMasterService
    {
        private readonly KindergartenDbContext _context;
        private readonly ILogger<DesktopMasterService> _logger;

        public DesktopMasterService(
            KindergartenDbContext context,
            ILogger<DesktopMasterService> logger)
        {
            _context = context;
            _logger = logger;
        }

        #region 保育園情報管理

        /// <summary>
        /// 保育園情報を取得
        /// </summary>
        public async Task<NurseryDto?> GetNurseryAsync(int nurseryId)
        {
            try
            {
                var nursery = await _context.Nurseries
                    .Where(n => n.Id == nurseryId)
                    .FirstOrDefaultAsync();

                if (nursery == null)
                {
                    return null;
                }

                return new NurseryDto
                {
                    Id = nursery.Id,
                    Name = nursery.Name,
                    Address = nursery.Address,
                    PhoneNumber = nursery.PhoneNumber,
                    Email = nursery.Email,
                    CurrentAcademicYear = nursery.CurrentAcademicYear,
                    LoginId = nursery.LoginId,
                    LastLoginAt = nursery.LastLoginAt,
                    IsLocked = nursery.IsLocked,
                    LockedUntil = nursery.LockedUntil,
                    LoginAttempts = nursery.LoginAttempts
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保育園情報の取得に失敗しました。NurseryId: {NurseryId}", nurseryId);
                throw;
            }
        }

        /// <summary>
        /// 保育園情報を更新
        /// </summary>
        public async Task<NurseryDto> UpdateNurseryAsync(int nurseryId, UpdateNurseryRequestDto request)
        {
            try
            {
                var nursery = await _context.Nurseries
                    .Where(n => n.Id == nurseryId)
                    .FirstOrDefaultAsync();

                if (nursery == null)
                {
                    throw new InvalidOperationException($"保育園が見つかりません。ID: {nurseryId}");
                }

                nursery.Name = request.Name;
                nursery.Address = request.Address;
                nursery.PhoneNumber = request.PhoneNumber;
                nursery.Email = request.Email;
                nursery.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("保育園情報を更新しました。NurseryId: {NurseryId}", nurseryId);

                return new NurseryDto
                {
                    Id = nursery.Id,
                    Name = nursery.Name,
                    Address = nursery.Address,
                    PhoneNumber = nursery.PhoneNumber,
                    Email = nursery.Email,
                    CurrentAcademicYear = nursery.CurrentAcademicYear,
                    LoginId = nursery.LoginId,
                    LastLoginAt = nursery.LastLoginAt,
                    IsLocked = nursery.IsLocked,
                    LockedUntil = nursery.LockedUntil,
                    LoginAttempts = nursery.LoginAttempts
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保育園情報の更新に失敗しました。NurseryId: {NurseryId}", nurseryId);
                throw;
            }
        }

        #endregion

        #region クラス管理

        /// <summary>
        /// クラス一覧を取得（フィルタ対応）
        /// </summary>
        public async Task<List<ClassDto>> GetClassesAsync(int nurseryId, ClassFilterDto filter)
        {
            try
            {
                var query = _context.Classes
                    .Where(c => c.NurseryId == nurseryId);

                // フィルタ適用
                if (filter.AcademicYear.HasValue)
                {
                    query = query.Where(c => c.AcademicYear == filter.AcademicYear.Value);
                }

                if (filter.AgeGroupMin.HasValue)
                {
                    query = query.Where(c => c.AgeGroupMin >= filter.AgeGroupMin.Value);
                }

                if (filter.AgeGroupMax.HasValue)
                {
                    query = query.Where(c => c.AgeGroupMax <= filter.AgeGroupMax.Value);
                }

                if (filter.IsActive.HasValue)
                {
                    query = query.Where(c => c.IsActive == filter.IsActive.Value);
                }

                if (!string.IsNullOrWhiteSpace(filter.SearchKeyword))
                {
                    var keyword = filter.SearchKeyword.ToLower();
                    query = query.Where(c => c.Name.ToLower().Contains(keyword) || c.ClassId.ToLower().Contains(keyword));
                }

                var classes = await query
                    .OrderBy(c => c.AcademicYear)
                    .ThenBy(c => c.ClassId)
                    .ToListAsync();

                // クラスごとの在籍数と担当職員を取得
                var classIds = classes.Select(c => c.ClassId).ToList();

                var enrollmentCounts = await _context.Children
                    .Where(ch => ch.NurseryId == nurseryId && classIds.Contains(ch.ClassId) && ch.IsActive)
                    .GroupBy(ch => ch.ClassId)
                    .Select(g => new { ClassId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.ClassId, x => x.Count);

                var staffAssignments = await _context.StaffClassAssignments
                    .Where(sca => sca.NurseryId == nurseryId && classIds.Contains(sca.ClassId) && sca.IsActive)
                    .Join(_context.Staff,
                        sca => new { sca.NurseryId, sca.StaffId },
                        s => new { s.NurseryId, s.StaffId },
                        (sca, s) => new { sca.ClassId, s.Name })
                    .GroupBy(x => x.ClassId)
                    .Select(g => new { ClassId = g.Key, StaffNames = g.Select(x => x.Name).ToList() })
                    .ToDictionaryAsync(x => x.ClassId, x => x.StaffNames);

                return classes.Select(c => new ClassDto
                {
                    NurseryId = c.NurseryId,
                    ClassId = c.ClassId,
                    Name = c.Name,
                    AgeGroupMin = c.AgeGroupMin,
                    AgeGroupMax = c.AgeGroupMax,
                    MaxCapacity = c.MaxCapacity,
                    AcademicYear = c.AcademicYear,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    CurrentEnrollment = enrollmentCounts.ContainsKey(c.ClassId) ? enrollmentCounts[c.ClassId] : 0,
                    AssignedStaffNames = staffAssignments.ContainsKey(c.ClassId) ? staffAssignments[c.ClassId] : new List<string>()
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラス一覧の取得に失敗しました。NurseryId: {NurseryId}", nurseryId);
                throw;
            }
        }

        /// <summary>
        /// クラス情報を取得
        /// </summary>
        public async Task<ClassDto?> GetClassByIdAsync(int nurseryId, string classId)
        {
            try
            {
                var classEntity = await _context.Classes
                    .Where(c => c.NurseryId == nurseryId && c.ClassId == classId)
                    .FirstOrDefaultAsync();

                if (classEntity == null)
                {
                    return null;
                }

                // 在籍数を取得
                var enrollmentCount = await _context.Children
                    .Where(ch => ch.NurseryId == nurseryId && ch.ClassId == classId && ch.IsActive)
                    .CountAsync();

                // 担当職員名を取得
                var staffNames = await _context.StaffClassAssignments
                    .Where(sca => sca.NurseryId == nurseryId && sca.ClassId == classId && sca.IsActive)
                    .Join(_context.Staff,
                        sca => new { sca.NurseryId, sca.StaffId },
                        s => new { s.NurseryId, s.StaffId },
                        (sca, s) => s.Name)
                    .ToListAsync();

                return new ClassDto
                {
                    NurseryId = classEntity.NurseryId,
                    ClassId = classEntity.ClassId,
                    Name = classEntity.Name,
                    AgeGroupMin = classEntity.AgeGroupMin,
                    AgeGroupMax = classEntity.AgeGroupMax,
                    MaxCapacity = classEntity.MaxCapacity,
                    AcademicYear = classEntity.AcademicYear,
                    IsActive = classEntity.IsActive,
                    CreatedAt = classEntity.CreatedAt,
                    UpdatedAt = classEntity.UpdatedAt,
                    CurrentEnrollment = enrollmentCount,
                    AssignedStaffNames = staffNames
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラス情報の取得に失敗しました。NurseryId: {NurseryId}, ClassId: {ClassId}", nurseryId, classId);
                throw;
            }
        }

        /// <summary>
        /// クラスを作成
        /// </summary>
        public async Task<ClassDto> CreateClassAsync(int nurseryId, CreateClassRequestDto request)
        {
            try
            {
                // 重複チェック
                var exists = await _context.Classes
                    .AnyAsync(c => c.NurseryId == nurseryId && c.ClassId == request.ClassId);

                if (exists)
                {
                    throw new InvalidOperationException($"クラスIDが既に存在します。ClassId: {request.ClassId}");
                }

                var now = DateTime.UtcNow;
                var classEntity = new Class
                {
                    NurseryId = nurseryId,
                    ClassId = request.ClassId,
                    Name = request.Name,
                    AgeGroupMin = request.AgeGroupMin,
                    AgeGroupMax = request.AgeGroupMax,
                    MaxCapacity = request.MaxCapacity,
                    AcademicYear = request.AcademicYear ?? DateTime.UtcNow.Year,
                    IsActive = true,
                    CreatedAt = now
                };

                _context.Classes.Add(classEntity);
                await _context.SaveChangesAsync();

                _logger.LogInformation("クラスを作成しました。NurseryId: {NurseryId}, ClassId: {ClassId}", nurseryId, request.ClassId);

                return new ClassDto
                {
                    NurseryId = classEntity.NurseryId,
                    ClassId = classEntity.ClassId,
                    Name = classEntity.Name,
                    AgeGroupMin = classEntity.AgeGroupMin,
                    AgeGroupMax = classEntity.AgeGroupMax,
                    MaxCapacity = classEntity.MaxCapacity,
                    AcademicYear = classEntity.AcademicYear,
                    IsActive = classEntity.IsActive,
                    CreatedAt = classEntity.CreatedAt,
                    UpdatedAt = classEntity.UpdatedAt,
                    CurrentEnrollment = 0,
                    AssignedStaffNames = new List<string>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラスの作成に失敗しました。NurseryId: {NurseryId}", nurseryId);
                throw;
            }
        }

        /// <summary>
        /// クラス情報を更新
        /// </summary>
        public async Task<ClassDto> UpdateClassAsync(int nurseryId, string classId, UpdateClassRequestDto request)
        {
            try
            {
                var classEntity = await _context.Classes
                    .Where(c => c.NurseryId == nurseryId && c.ClassId == classId)
                    .FirstOrDefaultAsync();

                if (classEntity == null)
                {
                    throw new InvalidOperationException($"クラスが見つかりません。ClassId: {classId}");
                }

                classEntity.Name = request.Name;
                classEntity.AgeGroupMin = request.AgeGroupMin;
                classEntity.AgeGroupMax = request.AgeGroupMax;
                classEntity.MaxCapacity = request.MaxCapacity;

                if (request.AcademicYear.HasValue)
                {
                    classEntity.AcademicYear = request.AcademicYear.Value;
                }

                if (request.IsActive.HasValue)
                {
                    classEntity.IsActive = request.IsActive.Value;
                }

                classEntity.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("クラス情報を更新しました。NurseryId: {NurseryId}, ClassId: {ClassId}", nurseryId, classId);

                // 更新後のデータを取得
                return await GetClassByIdAsync(nurseryId, classId)
                    ?? throw new InvalidOperationException("更新後のクラス情報の取得に失敗しました");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラス情報の更新に失敗しました。NurseryId: {NurseryId}, ClassId: {ClassId}", nurseryId, classId);
                throw;
            }
        }

        /// <summary>
        /// クラスを削除（園児が所属している場合は削除不可）
        /// </summary>
        public async Task DeleteClassAsync(int nurseryId, string classId)
        {
            try
            {
                var classEntity = await _context.Classes
                    .Where(c => c.NurseryId == nurseryId && c.ClassId == classId)
                    .FirstOrDefaultAsync();

                if (classEntity == null)
                {
                    throw new InvalidOperationException($"クラスが見つかりません。ClassId: {classId}");
                }

                // 園児が所属しているかチェック
                var hasChildren = await _context.Children
                    .AnyAsync(ch => ch.NurseryId == nurseryId && ch.ClassId == classId && ch.IsActive);

                if (hasChildren)
                {
                    throw new InvalidOperationException($"園児が所属しているため、クラスを削除できません。ClassId: {classId}");
                }

                // 職員割り当てを削除
                var assignments = await _context.StaffClassAssignments
                    .Where(sca => sca.NurseryId == nurseryId && sca.ClassId == classId)
                    .ToListAsync();

                _context.StaffClassAssignments.RemoveRange(assignments);

                // クラスを削除
                _context.Classes.Remove(classEntity);
                await _context.SaveChangesAsync();

                _logger.LogInformation("クラスを削除しました。NurseryId: {NurseryId}, ClassId: {ClassId}", nurseryId, classId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラスの削除に失敗しました。NurseryId: {NurseryId}, ClassId: {ClassId}", nurseryId, classId);
                throw;
            }
        }

        #endregion

        #region 園児管理

        /// <summary>
        /// 園児一覧を取得（フィルタ対応）
        /// </summary>
        public async Task<List<ChildDto>> GetChildrenAsync(int nurseryId, ChildFilterDto filter)
        {
            try
            {
                var query = _context.Children
                    .Where(c => c.NurseryId == nurseryId);

                // フィルタ適用
                if (!string.IsNullOrWhiteSpace(filter.ClassId))
                {
                    query = query.Where(c => c.ClassId == filter.ClassId);
                }

                if (!string.IsNullOrWhiteSpace(filter.GraduationStatus))
                {
                    query = query.Where(c => c.GraduationStatus == filter.GraduationStatus);
                }

                if (filter.IsActive.HasValue)
                {
                    query = query.Where(c => c.IsActive == filter.IsActive.Value);
                }

                if (!string.IsNullOrWhiteSpace(filter.SearchKeyword))
                {
                    var keyword = filter.SearchKeyword.ToLower();
                    query = query.Where(c => c.Name.ToLower().Contains(keyword));
                }

                var children = await query
                    .OrderBy(c => c.ClassId)
                    .ThenBy(c => c.Name)
                    .ToListAsync();

                // クラス名を取得
                var classIds = children.Where(c => !string.IsNullOrEmpty(c.ClassId)).Select(c => c.ClassId).Distinct().ToList();
                var classNames = await _context.Classes
                    .Where(cl => cl.NurseryId == nurseryId && classIds.Contains(cl.ClassId))
                    .ToDictionaryAsync(cl => cl.ClassId, cl => cl.Name);

                // 保護者情報を取得
                var childIds = children.Select(c => c.ChildId).ToList();
                var parentRelationships = await _context.ParentChildRelationships
                    .Where(pcr => pcr.NurseryId == nurseryId && childIds.Contains(pcr.ChildId) && pcr.IsActive)
                    .Join(_context.Parents,
                        pcr => pcr.ParentId,
                        p => p.Id,
                        (pcr, p) => new { pcr.ChildId, Parent = p })
                    .Where(x => x.Parent.IsActive)
                    .GroupBy(x => x.ChildId)
                    .Select(g => new
                    {
                        ChildId = g.Key,
                        Parents = g.Select(x => new ParentBasicInfoDto
                        {
                            Id = x.Parent.Id,
                            Name = x.Parent.Name ?? "",
                            PhoneNumber = x.Parent.PhoneNumber,
                            Email = x.Parent.Email
                        }).ToList()
                    })
                    .ToDictionaryAsync(x => x.ChildId, x => x.Parents);

                return children.Select(c => new ChildDto
                {
                    NurseryId = c.NurseryId,
                    ChildId = c.ChildId,
                    Name = c.Name,
                    DateOfBirth = c.DateOfBirth,
                    Gender = c.Gender,
                    ClassId = c.ClassId,
                    ClassName = !string.IsNullOrEmpty(c.ClassId) && classNames.ContainsKey(c.ClassId) ? classNames[c.ClassId] : null,
                    MedicalNotes = c.MedicalNotes,
                    SpecialInstructions = c.SpecialInstructions,
                    IsActive = c.IsActive,
                    GraduationDate = c.GraduationDate,
                    GraduationStatus = c.GraduationStatus,
                    WithdrawalReason = c.WithdrawalReason,
                    BloodType = c.BloodType,
                    LastAttendanceDate = c.LastAttendanceDate,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    Age = CalculateAge(c.DateOfBirth),
                    Parents = parentRelationships.ContainsKey(c.ChildId) ? parentRelationships[c.ChildId] : new List<ParentBasicInfoDto>()
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "園児一覧の取得に失敗しました。NurseryId: {NurseryId}", nurseryId);
                throw;
            }
        }

        /// <summary>
        /// 園児情報を取得
        /// </summary>
        public async Task<ChildDto?> GetChildByIdAsync(int nurseryId, int childId)
        {
            try
            {
                var child = await _context.Children
                    .Where(c => c.NurseryId == nurseryId && c.ChildId == childId)
                    .FirstOrDefaultAsync();

                if (child == null)
                {
                    return null;
                }

                // クラス名を取得
                string? className = null;
                if (!string.IsNullOrEmpty(child.ClassId))
                {
                    className = await _context.Classes
                        .Where(cl => cl.NurseryId == nurseryId && cl.ClassId == child.ClassId)
                        .Select(cl => cl.Name)
                        .FirstOrDefaultAsync();
                }

                // 保護者情報を取得
                var parents = await _context.ParentChildRelationships
                    .Where(pcr => pcr.NurseryId == nurseryId && pcr.ChildId == childId && pcr.IsActive)
                    .Join(_context.Parents,
                        pcr => pcr.ParentId,
                        p => p.Id,
                        (pcr, p) => p)
                    .Where(p => p.IsActive)
                    .Select(p => new ParentBasicInfoDto
                    {
                        Id = p.Id,
                        Name = p.Name ?? "",
                        PhoneNumber = p.PhoneNumber,
                        Email = p.Email
                    })
                    .ToListAsync();

                return new ChildDto
                {
                    NurseryId = child.NurseryId,
                    ChildId = child.ChildId,
                    Name = child.Name,
                    DateOfBirth = child.DateOfBirth,
                    Gender = child.Gender,
                    ClassId = child.ClassId,
                    ClassName = className,
                    MedicalNotes = child.MedicalNotes,
                    SpecialInstructions = child.SpecialInstructions,
                    IsActive = child.IsActive,
                    GraduationDate = child.GraduationDate,
                    GraduationStatus = child.GraduationStatus,
                    WithdrawalReason = child.WithdrawalReason,
                    BloodType = child.BloodType,
                    LastAttendanceDate = child.LastAttendanceDate,
                    CreatedAt = child.CreatedAt,
                    UpdatedAt = child.UpdatedAt,
                    Age = CalculateAge(child.DateOfBirth),
                    Parents = parents
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "園児情報の取得に失敗しました。NurseryId: {NurseryId}, ChildId: {ChildId}", nurseryId, childId);
                throw;
            }
        }

        /// <summary>
        /// 園児を作成
        /// </summary>
        public async Task<ChildDto> CreateChildAsync(int nurseryId, CreateChildRequestDto request)
        {
            try
            {
                // 新しいChildIdを採番
                var maxChildId = await _context.Children
                    .Where(c => c.NurseryId == nurseryId)
                    .MaxAsync(c => (int?)c.ChildId) ?? 0;

                var newChildId = maxChildId + 1;

                var now = DateTime.UtcNow;
                var child = new Child
                {
                    NurseryId = nurseryId,
                    ChildId = newChildId,
                    Name = request.Name,
                    DateOfBirth = request.DateOfBirth,
                    Gender = request.Gender,
                    ClassId = request.ClassId,
                    BloodType = request.BloodType,
                    MedicalNotes = request.MedicalNotes,
                    SpecialInstructions = request.SpecialInstructions,
                    IsActive = true,
                    CreatedAt = now
                };

                _context.Children.Add(child);

                // 保護者との関連付け
                if (request.ParentIds != null && request.ParentIds.Any())
                {
                    foreach (var parentId in request.ParentIds)
                    {
                        var relationship = new ParentChildRelationship
                        {
                            ParentId = parentId,
                            NurseryId = nurseryId,
                            ChildId = newChildId,
                            RelationshipType = "parent",
                            IsPrimaryContact = false,
                            HasPickupPermission = true,
                            CanReceiveEmergencyNotifications = true,
                            IsActive = true,
                            CreatedAt = now
                        };
                        _context.ParentChildRelationships.Add(relationship);
                    }
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("園児を作成しました。NurseryId: {NurseryId}, ChildId: {ChildId}", nurseryId, newChildId);

                return await GetChildByIdAsync(nurseryId, newChildId)
                    ?? throw new InvalidOperationException("作成した園児情報の取得に失敗しました");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "園児の作成に失敗しました。NurseryId: {NurseryId}", nurseryId);
                throw;
            }
        }

        /// <summary>
        /// 園児情報を更新
        /// </summary>
        public async Task<ChildDto> UpdateChildAsync(int nurseryId, int childId, UpdateChildRequestDto request)
        {
            try
            {
                var child = await _context.Children
                    .Where(c => c.NurseryId == nurseryId && c.ChildId == childId)
                    .FirstOrDefaultAsync();

                if (child == null)
                {
                    throw new InvalidOperationException($"園児が見つかりません。ChildId: {childId}");
                }

                child.Name = request.Name;
                child.DateOfBirth = request.DateOfBirth;
                child.Gender = request.Gender;
                child.ClassId = request.ClassId;
                child.BloodType = request.BloodType;
                child.MedicalNotes = request.MedicalNotes;
                child.SpecialInstructions = request.SpecialInstructions;
                child.GraduationDate = request.GraduationDate;
                child.GraduationStatus = request.GraduationStatus;
                child.WithdrawalReason = request.WithdrawalReason;
                child.LastAttendanceDate = request.LastAttendanceDate;
                child.IsActive = request.IsActive;
                child.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("園児情報を更新しました。NurseryId: {NurseryId}, ChildId: {ChildId}", nurseryId, childId);

                return await GetChildByIdAsync(nurseryId, childId)
                    ?? throw new InvalidOperationException("更新後の園児情報の取得に失敗しました");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "園児情報の更新に失敗しました。NurseryId: {NurseryId}, ChildId: {ChildId}", nurseryId, childId);
                throw;
            }
        }

        /// <summary>
        /// 園児を削除（関連する保護者関係も削除）
        /// </summary>
        public async Task DeleteChildAsync(int nurseryId, int childId)
        {
            try
            {
                var child = await _context.Children
                    .Where(c => c.NurseryId == nurseryId && c.ChildId == childId)
                    .FirstOrDefaultAsync();

                if (child == null)
                {
                    throw new InvalidOperationException($"園児が見つかりません。ChildId: {childId}");
                }

                // 保護者との関連を削除
                var relationships = await _context.ParentChildRelationships
                    .Where(pcr => pcr.NurseryId == nurseryId && pcr.ChildId == childId)
                    .ToListAsync();

                _context.ParentChildRelationships.RemoveRange(relationships);

                // 園児を削除
                _context.Children.Remove(child);
                await _context.SaveChangesAsync();

                _logger.LogInformation("園児を削除しました。NurseryId: {NurseryId}, ChildId: {ChildId}", nurseryId, childId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "園児の削除に失敗しました。NurseryId: {NurseryId}, ChildId: {ChildId}", nurseryId, childId);
                throw;
            }
        }

        #endregion

        #region 保護者管理

        /// <summary>
        /// 保護者一覧を取得（フィルタ対応）
        /// </summary>
        public async Task<List<ParentDto>> GetParentsAsync(int nurseryId, ParentFilterDto filter)
        {
            try
            {
                var query = _context.Parents.AsQueryable();

                // NurseryIdでフィルタ（保護者-園児関係を通じて）
                if (filter.NurseryId.HasValue)
                {
                    var parentIdsInNursery = await _context.ParentChildRelationships
                        .Where(pcr => pcr.NurseryId == filter.NurseryId.Value && pcr.IsActive)
                        .Select(pcr => pcr.ParentId)
                        .Distinct()
                        .ToListAsync();

                    query = query.Where(p => parentIdsInNursery.Contains(p.Id));
                }

                // ClassIdでフィルタ
                if (!string.IsNullOrWhiteSpace(filter.ClassId))
                {
                    var parentIdsInClass = await _context.ParentChildRelationships
                        .Where(pcr => pcr.NurseryId == nurseryId && pcr.IsActive)
                        .Join(_context.Children,
                            pcr => new { pcr.NurseryId, pcr.ChildId },
                            c => new { c.NurseryId, c.ChildId },
                            (pcr, c) => new { pcr.ParentId, c.ClassId })
                        .Where(x => x.ClassId == filter.ClassId)
                        .Select(x => x.ParentId)
                        .Distinct()
                        .ToListAsync();

                    query = query.Where(p => parentIdsInClass.Contains(p.Id));
                }

                if (filter.IsActive.HasValue)
                {
                    query = query.Where(p => p.IsActive == filter.IsActive.Value);
                }

                if (!string.IsNullOrWhiteSpace(filter.SearchKeyword))
                {
                    var keyword = filter.SearchKeyword.ToLower();
                    query = query.Where(p =>
                        (p.Name != null && p.Name.ToLower().Contains(keyword)) ||
                        p.PhoneNumber.Contains(keyword) ||
                        (p.Email != null && p.Email.ToLower().Contains(keyword)));
                }

                var parents = await query
                    .OrderBy(p => p.Name)
                    .ToListAsync();

                // 各保護者の園児情報を取得
                var parentIds = parents.Select(p => p.Id).ToList();
                var childRelationships = await _context.ParentChildRelationships
                    .Where(pcr => pcr.NurseryId == nurseryId && parentIds.Contains(pcr.ParentId) && pcr.IsActive)
                    .Join(_context.Children,
                        pcr => new { pcr.NurseryId, pcr.ChildId },
                        c => new { c.NurseryId, c.ChildId },
                        (pcr, c) => new { pcr.ParentId, Child = c })
                    .Where(x => x.Child.IsActive)
                    .ToListAsync();

                // クラス名を取得
                var classIds = childRelationships.Where(cr => !string.IsNullOrEmpty(cr.Child.ClassId))
                    .Select(cr => cr.Child.ClassId!)
                    .Distinct()
                    .ToList();

                var classNames = await _context.Classes
                    .Where(cl => cl.NurseryId == nurseryId && classIds.Contains(cl.ClassId))
                    .ToDictionaryAsync(cl => cl.ClassId, cl => cl.Name);

                var childrenByParent = childRelationships
                    .GroupBy(x => x.ParentId)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(x => new ChildBasicInfoDto
                        {
                            NurseryId = x.Child.NurseryId,
                            ChildId = x.Child.ChildId,
                            Name = x.Child.Name,
                            ClassId = x.Child.ClassId,
                            ClassName = !string.IsNullOrEmpty(x.Child.ClassId) && classNames.ContainsKey(x.Child.ClassId)
                                ? classNames[x.Child.ClassId]
                                : null,
                            Age = CalculateAge(x.Child.DateOfBirth)
                        }).ToList()
                    );

                return parents.Select(p => new ParentDto
                {
                    Id = p.Id,
                    PhoneNumber = p.PhoneNumber,
                    Name = p.Name,
                    Email = p.Email,
                    Address = p.Address,
                    PushNotificationsEnabled = p.PushNotificationsEnabled,
                    AbsenceConfirmationEnabled = p.AbsenceConfirmationEnabled,
                    DailyReportEnabled = p.DailyReportEnabled,
                    EventNotificationEnabled = p.EventNotificationEnabled,
                    AnnouncementEnabled = p.AnnouncementEnabled,
                    FontSize = p.FontSize,
                    Language = p.Language,
                    IsActive = p.IsActive,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    LastLoginAt = p.LastLoginAt,
                    Children = childrenByParent.ContainsKey(p.Id) ? childrenByParent[p.Id] : new List<ChildBasicInfoDto>()
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保護者一覧の取得に失敗しました。NurseryId: {NurseryId}", nurseryId);
                throw;
            }
        }

        /// <summary>
        /// 保護者情報を取得
        /// </summary>
        public async Task<ParentDto?> GetParentByIdAsync(int nurseryId, int parentId)
        {
            try
            {
                var parent = await _context.Parents
                    .Where(p => p.Id == parentId)
                    .FirstOrDefaultAsync();

                if (parent == null)
                {
                    return null;
                }

                // 園児情報を取得
                var children = await _context.ParentChildRelationships
                    .Where(pcr => pcr.NurseryId == nurseryId && pcr.ParentId == parentId && pcr.IsActive)
                    .Join(_context.Children,
                        pcr => new { pcr.NurseryId, pcr.ChildId },
                        c => new { c.NurseryId, c.ChildId },
                        (pcr, c) => c)
                    .Where(c => c.IsActive)
                    .ToListAsync();

                // クラス名を取得
                var classIds = children.Where(c => !string.IsNullOrEmpty(c.ClassId))
                    .Select(c => c.ClassId!)
                    .Distinct()
                    .ToList();

                var classNames = await _context.Classes
                    .Where(cl => cl.NurseryId == nurseryId && classIds.Contains(cl.ClassId))
                    .ToDictionaryAsync(cl => cl.ClassId, cl => cl.Name);

                return new ParentDto
                {
                    Id = parent.Id,
                    PhoneNumber = parent.PhoneNumber,
                    Name = parent.Name,
                    Email = parent.Email,
                    Address = parent.Address,
                    PushNotificationsEnabled = parent.PushNotificationsEnabled,
                    AbsenceConfirmationEnabled = parent.AbsenceConfirmationEnabled,
                    DailyReportEnabled = parent.DailyReportEnabled,
                    EventNotificationEnabled = parent.EventNotificationEnabled,
                    AnnouncementEnabled = parent.AnnouncementEnabled,
                    FontSize = parent.FontSize,
                    Language = parent.Language,
                    IsActive = parent.IsActive,
                    CreatedAt = parent.CreatedAt,
                    UpdatedAt = parent.UpdatedAt,
                    LastLoginAt = parent.LastLoginAt,
                    Children = children.Select(c => new ChildBasicInfoDto
                    {
                        NurseryId = c.NurseryId,
                        ChildId = c.ChildId,
                        Name = c.Name,
                        ClassId = c.ClassId,
                        ClassName = !string.IsNullOrEmpty(c.ClassId) && classNames.ContainsKey(c.ClassId)
                            ? classNames[c.ClassId]
                            : null,
                        Age = CalculateAge(c.DateOfBirth)
                    }).ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保護者情報の取得に失敗しました。ParentId: {ParentId}", parentId);
                throw;
            }
        }

        /// <summary>
        /// 保護者を作成
        /// </summary>
        public async Task<ParentDto> CreateParentAsync(int nurseryId, CreateParentRequestDto request)
        {
            try
            {
                // 電話番号を正規化
                var normalizedPhone = request.PhoneNumber.Replace("-", "").Replace(" ", "");

                // 重複チェック
                var exists = await _context.Parents
                    .AnyAsync(p => p.PhoneNumber == normalizedPhone);

                if (exists)
                {
                    throw new InvalidOperationException($"電話番号が既に登録されています。PhoneNumber: {request.PhoneNumber}");
                }

                var now = DateTime.UtcNow;
                var parent = new Parent
                {
                    PhoneNumber = normalizedPhone,
                    Name = request.Name,
                    Email = request.Email,
                    Address = request.Address,
                    IsActive = true,
                    CreatedAt = now
                };

                _context.Parents.Add(parent);
                await _context.SaveChangesAsync();

                // 園児との関連付け
                if (request.ChildIds != null && request.ChildIds.Any())
                {
                    foreach (var childIdentifier in request.ChildIds)
                    {
                        var relationship = new ParentChildRelationship
                        {
                            ParentId = parent.Id,
                            NurseryId = childIdentifier.NurseryId,
                            ChildId = childIdentifier.ChildId,
                            RelationshipType = "parent",
                            IsPrimaryContact = false,
                            HasPickupPermission = true,
                            CanReceiveEmergencyNotifications = true,
                            IsActive = true,
                            CreatedAt = now
                        };
                        _context.ParentChildRelationships.Add(relationship);
                    }
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation("保護者を作成しました。ParentId: {ParentId}", parent.Id);

                return await GetParentByIdAsync(nurseryId, parent.Id)
                    ?? throw new InvalidOperationException("作成した保護者情報の取得に失敗しました");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保護者の作成に失敗しました。NurseryId: {NurseryId}", nurseryId);
                throw;
            }
        }

        /// <summary>
        /// 保護者情報を更新
        /// </summary>
        public async Task<ParentDto> UpdateParentAsync(int nurseryId, int parentId, UpdateParentRequestDto request)
        {
            try
            {
                var parent = await _context.Parents
                    .Where(p => p.Id == parentId)
                    .FirstOrDefaultAsync();

                if (parent == null)
                {
                    throw new InvalidOperationException($"保護者が見つかりません。ParentId: {parentId}");
                }

                if (request.Name != null)
                {
                    parent.Name = request.Name;
                }

                if (request.Email != null)
                {
                    parent.Email = request.Email;
                }

                if (request.Address != null)
                {
                    parent.Address = request.Address;
                }

                if (request.PushNotificationsEnabled.HasValue)
                {
                    parent.PushNotificationsEnabled = request.PushNotificationsEnabled.Value;
                }

                if (request.AbsenceConfirmationEnabled.HasValue)
                {
                    parent.AbsenceConfirmationEnabled = request.AbsenceConfirmationEnabled.Value;
                }

                if (request.DailyReportEnabled.HasValue)
                {
                    parent.DailyReportEnabled = request.DailyReportEnabled.Value;
                }

                if (request.EventNotificationEnabled.HasValue)
                {
                    parent.EventNotificationEnabled = request.EventNotificationEnabled.Value;
                }

                if (request.AnnouncementEnabled.HasValue)
                {
                    parent.AnnouncementEnabled = request.AnnouncementEnabled.Value;
                }

                if (request.FontSize != null)
                {
                    parent.FontSize = request.FontSize;
                }

                if (request.Language != null)
                {
                    parent.Language = request.Language;
                }

                if (request.IsActive.HasValue)
                {
                    parent.IsActive = request.IsActive.Value;
                }

                parent.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("保護者情報を更新しました。ParentId: {ParentId}", parentId);

                return await GetParentByIdAsync(nurseryId, parentId)
                    ?? throw new InvalidOperationException("更新後の保護者情報の取得に失敗しました");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保護者情報の更新に失敗しました。ParentId: {ParentId}", parentId);
                throw;
            }
        }

        /// <summary>
        /// 保護者を削除（関連する園児関係も削除）
        /// </summary>
        public async Task DeleteParentAsync(int nurseryId, int parentId)
        {
            try
            {
                var parent = await _context.Parents
                    .Where(p => p.Id == parentId)
                    .FirstOrDefaultAsync();

                if (parent == null)
                {
                    throw new InvalidOperationException($"保護者が見つかりません。ParentId: {parentId}");
                }

                // 園児との関連を削除
                var relationships = await _context.ParentChildRelationships
                    .Where(pcr => pcr.ParentId == parentId)
                    .ToListAsync();

                _context.ParentChildRelationships.RemoveRange(relationships);

                // 保護者を削除
                _context.Parents.Remove(parent);
                await _context.SaveChangesAsync();

                _logger.LogInformation("保護者を削除しました。ParentId: {ParentId}", parentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保護者の削除に失敗しました。ParentId: {ParentId}", parentId);
                throw;
            }
        }

        #endregion

        #region 職員管理

        /// <summary>
        /// 職員一覧を取得（フィルタ対応）
        /// </summary>
        public async Task<List<StaffDto>> GetStaffAsync(int nurseryId, StaffFilterDto filter)
        {
            try
            {
                var query = _context.Staff
                    .Where(s => s.NurseryId == nurseryId);

                // フィルタ適用
                if (!string.IsNullOrWhiteSpace(filter.Role))
                {
                    query = query.Where(s => s.Role == filter.Role);
                }

                if (!string.IsNullOrWhiteSpace(filter.Position))
                {
                    query = query.Where(s => s.Position == filter.Position);
                }

                if (filter.IsActive.HasValue)
                {
                    query = query.Where(s => s.IsActive == filter.IsActive.Value);
                }

                if (!string.IsNullOrWhiteSpace(filter.SearchKeyword))
                {
                    var keyword = filter.SearchKeyword.ToLower();
                    query = query.Where(s =>
                        s.Name.ToLower().Contains(keyword) ||
                        s.PhoneNumber.Contains(keyword) ||
                        (s.Email != null && s.Email.ToLower().Contains(keyword)));
                }

                var staff = await query
                    .OrderBy(s => s.Name)
                    .ToListAsync();

                // 各職員のクラス割り当てを取得
                var staffIds = staff.Select(s => s.StaffId).ToList();
                var assignmentQuery = _context.StaffClassAssignments
                    .Where(sca => sca.NurseryId == nurseryId && staffIds.Contains(sca.StaffId) && sca.IsActive);

                // ClassIdでフィルタ
                if (!string.IsNullOrWhiteSpace(filter.ClassId))
                {
                    assignmentQuery = assignmentQuery.Where(sca => sca.ClassId == filter.ClassId);
                }

                // AcademicYearでフィルタ
                if (filter.AcademicYear.HasValue)
                {
                    assignmentQuery = assignmentQuery.Where(sca => sca.AcademicYear == filter.AcademicYear.Value);
                }

                var assignments = await assignmentQuery
                    .Join(_context.Classes,
                        sca => new { sca.NurseryId, sca.ClassId },
                        c => new { c.NurseryId, c.ClassId },
                        (sca, c) => new { sca.StaffId, sca.ClassId, c.Name, sca.AssignmentRole, sca.AcademicYear, sca.AssignedAt })
                    .ToListAsync();

                var assignmentsByStaff = assignments
                    .GroupBy(a => a.StaffId)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(a => new StaffClassAssignmentDto
                        {
                            ClassId = a.ClassId,
                            ClassName = a.Name,
                            Role = a.AssignmentRole,
                            AcademicYear = a.AcademicYear,
                            IsPrimary = a.AssignmentRole == "MainTeacher",
                            AssignedAt = a.AssignedAt
                        }).ToList()
                    );

                // ClassIdまたはAcademicYearでフィルタした場合、割り当てのある職員のみを返す
                if (!string.IsNullOrWhiteSpace(filter.ClassId) || filter.AcademicYear.HasValue)
                {
                    var filteredStaffIds = assignmentsByStaff.Keys.ToHashSet();
                    staff = staff.Where(s => filteredStaffIds.Contains(s.StaffId)).ToList();
                }

                return staff.Select(s => new StaffDto
                {
                    NurseryId = s.NurseryId,
                    StaffId = s.StaffId,
                    Name = s.Name,
                    PhoneNumber = s.PhoneNumber,
                    Email = s.Email,
                    Role = s.Role,
                    Position = s.Position,
                    LastLoginAt = s.LastLoginAt,
                    IsActive = s.IsActive,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                    ClassAssignments = assignmentsByStaff.ContainsKey(s.StaffId) ? assignmentsByStaff[s.StaffId] : new List<StaffClassAssignmentDto>()
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "職員一覧の取得に失敗しました。NurseryId: {NurseryId}", nurseryId);
                throw;
            }
        }

        /// <summary>
        /// 職員情報を取得
        /// </summary>
        public async Task<StaffDto?> GetStaffByIdAsync(int nurseryId, int staffId)
        {
            try
            {
                var staff = await _context.Staff
                    .Where(s => s.NurseryId == nurseryId && s.StaffId == staffId)
                    .FirstOrDefaultAsync();

                if (staff == null)
                {
                    return null;
                }

                // クラス割り当てを取得
                var assignments = await _context.StaffClassAssignments
                    .Where(sca => sca.NurseryId == nurseryId && sca.StaffId == staffId && sca.IsActive)
                    .Join(_context.Classes,
                        sca => new { sca.NurseryId, sca.ClassId },
                        c => new { c.NurseryId, c.ClassId },
                        (sca, c) => new StaffClassAssignmentDto
                        {
                            ClassId = sca.ClassId,
                            ClassName = c.Name,
                            Role = sca.AssignmentRole,
                            AcademicYear = sca.AcademicYear,
                            IsPrimary = sca.AssignmentRole == "MainTeacher",
                            AssignedAt = sca.AssignedAt
                        })
                    .ToListAsync();

                return new StaffDto
                {
                    NurseryId = staff.NurseryId,
                    StaffId = staff.StaffId,
                    Name = staff.Name,
                    PhoneNumber = staff.PhoneNumber,
                    Email = staff.Email,
                    Role = staff.Role,
                    Position = staff.Position,
                    LastLoginAt = staff.LastLoginAt,
                    IsActive = staff.IsActive,
                    CreatedAt = staff.CreatedAt,
                    UpdatedAt = staff.UpdatedAt,
                    ClassAssignments = assignments
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "職員情報の取得に失敗しました。NurseryId: {NurseryId}, StaffId: {StaffId}", nurseryId, staffId);
                throw;
            }
        }

        /// <summary>
        /// 職員を作成
        /// </summary>
        public async Task<StaffDto> CreateStaffAsync(int nurseryId, CreateStaffRequestDto request)
        {
            try
            {
                // 電話番号を正規化
                var normalizedPhone = request.PhoneNumber.Replace("-", "").Replace(" ", "");

                // 新しいStaffIdを採番
                var maxStaffId = await _context.Staff
                    .Where(s => s.NurseryId == nurseryId)
                    .MaxAsync(s => (int?)s.StaffId) ?? 0;

                var newStaffId = maxStaffId + 1;

                var now = DateTime.UtcNow;
                var staff = new Staff
                {
                    NurseryId = nurseryId,
                    StaffId = newStaffId,
                    Name = request.Name,
                    PhoneNumber = normalizedPhone,
                    Email = request.Email,
                    Role = request.Role,
                    Position = request.Position,
                    IsActive = true,
                    CreatedAt = now
                };

                _context.Staff.Add(staff);
                await _context.SaveChangesAsync();

                _logger.LogInformation("職員を作成しました。NurseryId: {NurseryId}, StaffId: {StaffId}", nurseryId, newStaffId);

                return new StaffDto
                {
                    NurseryId = staff.NurseryId,
                    StaffId = staff.StaffId,
                    Name = staff.Name,
                    PhoneNumber = staff.PhoneNumber,
                    Email = staff.Email,
                    Role = staff.Role,
                    Position = staff.Position,
                    LastLoginAt = staff.LastLoginAt,
                    IsActive = staff.IsActive,
                    CreatedAt = staff.CreatedAt,
                    UpdatedAt = staff.UpdatedAt,
                    ClassAssignments = new List<StaffClassAssignmentDto>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "職員の作成に失敗しました。NurseryId: {NurseryId}", nurseryId);
                throw;
            }
        }

        /// <summary>
        /// 職員情報を更新
        /// </summary>
        public async Task<StaffDto> UpdateStaffAsync(int nurseryId, int staffId, UpdateStaffRequestDto request)
        {
            try
            {
                var staff = await _context.Staff
                    .Where(s => s.NurseryId == nurseryId && s.StaffId == staffId)
                    .FirstOrDefaultAsync();

                if (staff == null)
                {
                    throw new InvalidOperationException($"職員が見つかりません。StaffId: {staffId}");
                }

                // 電話番号を正規化
                var normalizedPhone = request.PhoneNumber.Replace("-", "").Replace(" ", "");

                staff.Name = request.Name;
                staff.PhoneNumber = normalizedPhone;
                staff.Email = request.Email;
                staff.Role = request.Role;
                staff.Position = request.Position;

                if (request.IsActive.HasValue)
                {
                    staff.IsActive = request.IsActive.Value;
                }

                staff.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("職員情報を更新しました。NurseryId: {NurseryId}, StaffId: {StaffId}", nurseryId, staffId);

                return await GetStaffByIdAsync(nurseryId, staffId)
                    ?? throw new InvalidOperationException("更新後の職員情報の取得に失敗しました");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "職員情報の更新に失敗しました。NurseryId: {NurseryId}, StaffId: {StaffId}", nurseryId, staffId);
                throw;
            }
        }

        /// <summary>
        /// 職員を削除（クラス割り当ても削除）
        /// </summary>
        public async Task DeleteStaffAsync(int nurseryId, int staffId)
        {
            try
            {
                var staff = await _context.Staff
                    .Where(s => s.NurseryId == nurseryId && s.StaffId == staffId)
                    .FirstOrDefaultAsync();

                if (staff == null)
                {
                    throw new InvalidOperationException($"職員が見つかりません。StaffId: {staffId}");
                }

                // クラス割り当てを削除
                var assignments = await _context.StaffClassAssignments
                    .Where(sca => sca.NurseryId == nurseryId && sca.StaffId == staffId)
                    .ToListAsync();

                _context.StaffClassAssignments.RemoveRange(assignments);

                // 職員を削除
                _context.Staff.Remove(staff);
                await _context.SaveChangesAsync();

                _logger.LogInformation("職員を削除しました。NurseryId: {NurseryId}, StaffId: {StaffId}", nurseryId, staffId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "職員の削除に失敗しました。NurseryId: {NurseryId}, StaffId: {StaffId}", nurseryId, staffId);
                throw;
            }
        }

        /// <summary>
        /// 職員のクラス割り当てを更新（既存の割り当てを全削除して新規作成）
        /// </summary>
        public async Task<List<StaffClassAssignmentDto>> UpdateStaffClassAssignmentsAsync(
            int nurseryId,
            int staffId,
            List<StaffClassAssignmentRequestDto> assignments)
        {
            try
            {
                // 職員の存在確認
                var staffExists = await _context.Staff
                    .AnyAsync(s => s.NurseryId == nurseryId && s.StaffId == staffId);

                if (!staffExists)
                {
                    throw new InvalidOperationException($"職員が見つかりません。StaffId: {staffId}");
                }

                // 既存の割り当てを削除
                var existingAssignments = await _context.StaffClassAssignments
                    .Where(sca => sca.NurseryId == nurseryId && sca.StaffId == staffId)
                    .ToListAsync();

                _context.StaffClassAssignments.RemoveRange(existingAssignments);

                // 新しい割り当てを作成
                var now = DateTime.UtcNow;
                foreach (var assignment in assignments)
                {
                    // クラスの存在確認
                    var classExists = await _context.Classes
                        .AnyAsync(c => c.NurseryId == nurseryId && c.ClassId == assignment.ClassId);

                    if (!classExists)
                    {
                        throw new InvalidOperationException($"クラスが見つかりません。ClassId: {assignment.ClassId}");
                    }

                    var newAssignment = new StaffClassAssignment
                    {
                        NurseryId = nurseryId,
                        StaffId = staffId,
                        ClassId = assignment.ClassId,
                        AssignmentRole = assignment.Role,
                        AcademicYear = assignment.AcademicYear,
                        IsActive = true,
                        AssignedAt = now,
                        CreatedAt = now
                    };

                    _context.StaffClassAssignments.Add(newAssignment);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("職員のクラス割り当てを更新しました。NurseryId: {NurseryId}, StaffId: {StaffId}, AssignmentCount: {Count}",
                    nurseryId, staffId, assignments.Count);

                // 更新後の割り当てを取得
                var updatedAssignments = await _context.StaffClassAssignments
                    .Where(sca => sca.NurseryId == nurseryId && sca.StaffId == staffId && sca.IsActive)
                    .Join(_context.Classes,
                        sca => new { sca.NurseryId, sca.ClassId },
                        c => new { c.NurseryId, c.ClassId },
                        (sca, c) => new StaffClassAssignmentDto
                        {
                            ClassId = sca.ClassId,
                            ClassName = c.Name,
                            Role = sca.AssignmentRole,
                            AcademicYear = sca.AcademicYear,
                            IsPrimary = sca.AssignmentRole == "MainTeacher",
                            AssignedAt = sca.AssignedAt
                        })
                    .ToListAsync();

                return updatedAssignments;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "職員のクラス割り当ての更新に失敗しました。NurseryId: {NurseryId}, StaffId: {StaffId}", nurseryId, staffId);
                throw;
            }
        }

        #endregion

        #region ヘルパーメソッド

        /// <summary>
        /// 年齢を計算
        /// </summary>
        private int CalculateAge(DateTime dateOfBirth)
        {
            var today = DateTime.Today;
            var age = today.Year - dateOfBirth.Year;
            if (dateOfBirth.Date > today.AddYears(-age))
            {
                age--;
            }
            return age;
        }

        #endregion
    }
}
