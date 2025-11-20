using Microsoft.Data.SqlClient;
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
                    .OrderBy(c => c.ClassId)
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
                _logger.LogInformation("=== GetChildrenAsync: NurseryId={NurseryId}, DateOfBirthFrom={DateOfBirthFrom}, DateOfBirthTo={DateOfBirthTo}, GraduationDateFrom={GraduationDateFrom}, GraduationDateTo={GraduationDateTo}",
                    nurseryId, filter.DateOfBirthFrom, filter.DateOfBirthTo, filter.GraduationDateFrom, filter.GraduationDateTo);

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

                // 卒園日フィルター (文字列からDateTimeに変換)
                if (!string.IsNullOrWhiteSpace(filter.GraduationDateFrom) && DateTime.TryParse(filter.GraduationDateFrom, out DateTime graduationDateFrom))
                {
                    query = query.Where(c => c.GraduationDate >= graduationDateFrom);
                }

                if (!string.IsNullOrWhiteSpace(filter.GraduationDateTo) && DateTime.TryParse(filter.GraduationDateTo, out DateTime graduationDateTo))
                {
                    query = query.Where(c => c.GraduationDate <= graduationDateTo);
                }

                // 生年月日フィルター (文字列からDateTimeに変換)
                if (!string.IsNullOrWhiteSpace(filter.DateOfBirthFrom) && DateTime.TryParse(filter.DateOfBirthFrom, out DateTime dateOfBirthFrom))
                {
                    query = query.Where(c => c.DateOfBirth >= dateOfBirthFrom);
                }

                if (!string.IsNullOrWhiteSpace(filter.DateOfBirthTo) && DateTime.TryParse(filter.DateOfBirthTo, out DateTime dateOfBirthTo))
                {
                    query = query.Where(c => c.DateOfBirth <= dateOfBirthTo);
                }

                var children = await query
                    .OrderBy(c => c.ClassId)
                    .ThenBy(c => c.Name)
                    .ToListAsync();

                _logger.LogInformation("=== GetChildrenAsync: Query result count = {Count}", children.Count);

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
                    Furigana = request.Furigana,
                    DateOfBirth = request.DateOfBirth,
                    Gender = request.Gender,
                    ClassId = request.ClassId,
                    BloodType = request.BloodType,
                    MedicalNotes = request.MedicalNotes,
                    SpecialInstructions = request.SpecialInstructions,
                    GraduationStatus = "Active", // 新規作成時はActiveに設定
                    IsActive = true,
                    CreatedAt = now
                };

                _context.Children.Add(child);

                var createdParentIds = new List<int>();

                // 保護者の登録方法により分岐
                _logger.LogInformation("保護者登録モード: {Mode}, Parent1: {Parent1}, Parent2: {Parent2}",
                    request.ParentRegistrationMode,
                    request.Parent1 != null ? $"{request.Parent1.Name} ({request.Parent1.PhoneNumber})" : "null",
                    request.Parent2 != null ? $"{request.Parent2.Name} ({request.Parent2.PhoneNumber})" : "null");

                if (request.ParentRegistrationMode == "create")
                {
                    // 新規保護者作成モード
                    _logger.LogInformation("新規保護者作成モードで実行します");

                    if (request.Parent1 != null)
                    {
                        _logger.LogInformation("保護者1を作成開始: {Name}, {Phone}", request.Parent1.Name, request.Parent1.PhoneNumber);
                        var parent1 = await CreateParentForChildAsync(request.Parent1, now);
                        createdParentIds.Add(parent1.Id);
                        _logger.LogInformation("保護者1を作成しました。ParentId: {ParentId}", parent1.Id);
                    }
                    else
                    {
                        _logger.LogWarning("Parent1がnullです");
                    }

                    if (request.Parent2 != null)
                    {
                        _logger.LogInformation("保護者2を作成開始: {Name}, {Phone}", request.Parent2.Name, request.Parent2.PhoneNumber);
                        var parent2 = await CreateParentForChildAsync(request.Parent2, now);
                        createdParentIds.Add(parent2.Id);
                        _logger.LogInformation("保護者2を作成しました。ParentId: {ParentId}", parent2.Id);
                    }

                    // 作成した保護者との関連付け
                    for (int i = 0; i < createdParentIds.Count; i++)
                    {
                        var relationship = new ParentChildRelationship
                        {
                            ParentId = createdParentIds[i],
                            NurseryId = nurseryId,
                            ChildId = newChildId,
                            RelationshipType = "parent",
                            IsPrimaryContact = i == 0, // 保護者1を主連絡先に設定
                            HasPickupPermission = true,
                            CanReceiveEmergencyNotifications = true,
                            IsActive = true,
                            CreatedAt = now
                        };
                        _context.ParentChildRelationships.Add(relationship);
                    }
                }
                else
                {
                    // 既存保護者選択モード
                    if (request.ParentIds != null && request.ParentIds.Any())
                    {
                        for (int i = 0; i < request.ParentIds.Count; i++)
                        {
                            var parentId = request.ParentIds[i];
                            var relationship = new ParentChildRelationship
                            {
                                ParentId = parentId,
                                NurseryId = nurseryId,
                                ChildId = newChildId,
                                RelationshipType = "parent",
                                IsPrimaryContact = i == 0, // 最初の保護者を主連絡先に設定
                                HasPickupPermission = true,
                                CanReceiveEmergencyNotifications = true,
                                IsActive = true,
                                CreatedAt = now
                            };
                            _context.ParentChildRelationships.Add(relationship);
                        }
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
        /// 園児作成時に保護者を同時作成するヘルパーメソッド
        /// </summary>
        private async Task<Parent> CreateParentForChildAsync(CreateParentWithChildDto parentDto, DateTime createdAt)
        {
            // 電話番号の正規化（ハイフン削除）
            var normalizedPhone = parentDto.PhoneNumber.Replace("-", "").Replace(" ", "");

            // 既に同じ電話番号の保護者が存在するかチェック
            var existingParent = await _context.Parents
                .FirstOrDefaultAsync(p => p.PhoneNumber == normalizedPhone);

            if (existingParent != null)
            {
                _logger.LogWarning("既に同じ電話番号の保護者が存在します。ParentId: {ParentId}, PhoneNumber: {PhoneNumber}",
                    existingParent.Id, normalizedPhone);
                return existingParent;
            }

            var parent = new Parent
            {
                PhoneNumber = normalizedPhone,
                Name = parentDto.Name,
                Email = parentDto.Email,
                Address = parentDto.Address,
                PushNotificationsEnabled = true,
                AbsenceConfirmationEnabled = true,
                DailyReportEnabled = true,
                EventNotificationEnabled = true,
                AnnouncementEnabled = true,
                FontSize = "medium",
                Language = "ja",
                IsActive = true,
                CreatedAt = createdAt
            };

            _context.Parents.Add(parent);
            await _context.SaveChangesAsync(); // 保護者IDを確定させるためここで保存

            return parent;
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
                // デスクトップアプリでは主保護者（IsPrimary=true）のみ表示
                var query = _context.Parents
                    .Where(p => p.IsPrimary)
                    .AsQueryable();

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

                // ChildGraduationStatusでフィルタ
                if (!string.IsNullOrWhiteSpace(filter.ChildGraduationStatus))
                {
                    _logger.LogInformation("=== ChildGraduationStatus Filter Applied ===");
                    _logger.LogInformation($"Filter value: {filter.ChildGraduationStatus}");
                    
                    var parentIdsWithChildStatus = await _context.ParentChildRelationships
                        .Where(pcr => pcr.NurseryId == nurseryId && pcr.IsActive)
                        .Join(_context.Children,
                            pcr => new { pcr.NurseryId, pcr.ChildId },
                            c => new { c.NurseryId, c.ChildId },
                            (pcr, c) => new { pcr.ParentId, c.GraduationStatus })
                        .Where(x => x.GraduationStatus == filter.ChildGraduationStatus)
                        .Select(x => x.ParentId)
                        .Distinct()
                        .ToListAsync();

                    _logger.LogInformation($"Found {parentIdsWithChildStatus.Count} parents with children having GraduationStatus={filter.ChildGraduationStatus}");
                    _logger.LogInformation($"ParentIds: {string.Join(", ", parentIdsWithChildStatus)}");
                    
                    query = query.Where(p => parentIdsWithChildStatus.Contains(p.Id));
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
                    IsPrimary = p.IsPrimary,
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
                    IsPrimary = parent.IsPrimary,
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
                    IsPrimary = true, // デスクトップアプリで登録する保護者は主保護者
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

                if (request.PhoneNumber != null)
                {
                    parent.PhoneNumber = request.PhoneNumber;
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
                _logger.LogInformation("GetStaffAsync called - NurseryId: {NurseryId}, Filter: Role={Role}, Position={Position}, ClassId={ClassId}, AcademicYear={AcademicYear}, IsActive={IsActive}, SearchKeyword={SearchKeyword}",
                    nurseryId, filter.Role, filter.Position, filter.ClassId, filter.AcademicYear, filter.IsActive, filter.SearchKeyword);

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

                _logger.LogInformation("Initial staff query returned {Count} staff members. StaffIds: [{StaffIds}]",
                    staff.Count, string.Join(", ", staff.Select(s => s.StaffId)));

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

                // ClassIdでフィルタした場合のみ、割り当てのある職員のみを返す
                // AcademicYearのみの場合は全職員を返す（割り当てなしも含む）
                if (!string.IsNullOrWhiteSpace(filter.ClassId))
                {
                    var filteredStaffIds = assignmentsByStaff.Keys.ToHashSet();
                    _logger.LogInformation("Filtering by ClassId. Staff with assignments: {Count} (IDs: [{StaffIds}])",
                        filteredStaffIds.Count, string.Join(", ", filteredStaffIds));
                    staff = staff.Where(s => filteredStaffIds.Contains(s.StaffId)).ToList();
                }

                _logger.LogInformation("Final staff list count: {Count}. Returning staff IDs: [{StaffIds}]",
                    staff.Count, string.Join(", ", staff.Select(s => s.StaffId)));

                return staff.Select(s => new StaffDto
                {
                    NurseryId = s.NurseryId,
                    StaffId = s.StaffId,
                    Name = s.Name,
                    PhoneNumber = s.PhoneNumber,
                    Email = s.Email,
                    Role = s.Role,
                    Position = s.Position,
                    Remark = s.Remark,
                    ResignationDate = s.ResignationDate,
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
                    Remark = staff.Remark,
                    ResignationDate = staff.ResignationDate,
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
            // 電話番号を正規化
            var normalizedPhone = request.PhoneNumber.Replace("-", "").Replace(" ", "");

            try
            {

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
            catch (DbUpdateException ex) when (ex.InnerException is SqlException sqlEx &&
                                               (sqlEx.Number == 2601 || sqlEx.Number == 2627))
            {
                // Unique constraint violation
                _logger.LogWarning(ex, "職員の作成に失敗しました(重複キー)。NurseryId: {NurseryId}, PhoneNumber: {PhoneNumber}",
                    nurseryId, normalizedPhone);
                throw new InvalidOperationException("この電話番号は既に登録されています。別の電話番号を使用してください。");
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
                _logger.LogInformation("UpdateStaffAsync - StaffId: {StaffId}, Remark: '{Remark}', ResignationDate: {ResignationDate}",
                    staffId, request.Remark ?? "(null)", request.ResignationDate);

                var staff = await _context.Staff
                    .Where(s => s.NurseryId == nurseryId && s.StaffId == staffId)
                    .FirstOrDefaultAsync();

                if (staff == null)
                {
                    throw new InvalidOperationException($"職員が見つかりません。StaffId: {staffId}");
                }

                _logger.LogInformation("Current staff data - Remark: '{CurrentRemark}', ResignationDate: {CurrentResignationDate}",
                    staff.Remark ?? "(null)", staff.ResignationDate);

                // 電話番号を正規化
                var normalizedPhone = request.PhoneNumber.Replace("-", "").Replace(" ", "");

                staff.Name = request.Name;
                staff.PhoneNumber = normalizedPhone;
                staff.Email = request.Email;
                staff.Role = request.Role;
                staff.Position = request.Position;
                staff.Remark = request.Remark;
                staff.ResignationDate = request.ResignationDate;

                if (request.IsActive.HasValue)
                {
                    staff.IsActive = request.IsActive.Value;
                }

                staff.UpdatedAt = DateTime.UtcNow;

                _logger.LogInformation("Before SaveChanges - Remark: '{Remark}', ResignationDate: {ResignationDate}",
                    staff.Remark ?? "(null)", staff.ResignationDate);

                await _context.SaveChangesAsync();

                _logger.LogInformation("職員情報を更新しました。NurseryId: {NurseryId}, StaffId: {StaffId}, UpdatedRemark: '{Remark}', UpdatedResignationDate: {ResignationDate}",
                    nurseryId, staffId, staff.Remark ?? "(null)", staff.ResignationDate);

                return await GetStaffByIdAsync(nurseryId, staffId)
                    ?? throw new InvalidOperationException("更新後の職員情報の取得に失敗しました");
            }
            catch (DbUpdateException ex) when (ex.InnerException is SqlException sqlEx &&
                                               (sqlEx.Number == 2601 || sqlEx.Number == 2627))
            {
                // Unique constraint violation
                _logger.LogWarning(ex, "職員情報の更新に失敗しました(重複キー)。NurseryId: {NurseryId}, StaffId: {StaffId}, PhoneNumber: {PhoneNumber}",
                    nurseryId, staffId, request.PhoneNumber);
                throw new InvalidOperationException("この電話番号は既に登録されています。別の電話番号を使用してください。");
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

        #region クラス構成管理

        /// <summary>
        /// クラス構成情報取得
        /// </summary>
        public async Task<ClassCompositionDto> GetClassCompositionAsync(int nurseryId, string classId)
        {
            // クラス情報取得
            var classInfo = await _context.Classes
                .Where(c => c.NurseryId == nurseryId && c.ClassId == classId)
                .FirstOrDefaultAsync();

            if (classInfo == null)
            {
                throw new KeyNotFoundException($"クラス {classId} が見つかりません");
            }

            // 割り当て済み職員を取得
            var assignedStaff = await _context.StaffClassAssignments
                .Where(sca => sca.NurseryId == nurseryId && sca.ClassId == classId && sca.IsActive)
                .Join(
                    _context.Staff,
                    sca => new { sca.NurseryId, sca.StaffId },
                    s => new { s.NurseryId, s.StaffId },
                    (sca, s) => new AssignedStaffDto
                    {
                        StaffId = s.StaffId,
                        Name = s.Name,
                        AssignmentRole = sca.AssignmentRole
                    })
                .ToListAsync();

            // 割り当て済み園児を取得（classIdが一致する園児）
            var assignedChildren = await _context.Children
                .Where(c => c.NurseryId == nurseryId && c.ClassId == classId && c.IsActive)
                .Select(c => new AssignedChildDto
                {
                    ChildId = c.ChildId,
                    Name = c.Name,
                    Furigana = c.Furigana
                })
                .ToListAsync();

            return new ClassCompositionDto
            {
                ClassId = classInfo.ClassId,
                ClassName = classInfo.Name,
                AssignedStaff = assignedStaff,
                AssignedChildren = assignedChildren
            };
        }

        /// <summary>
        /// クラス構成更新
        /// </summary>
        public async Task<ClassCompositionDto> UpdateClassCompositionAsync(int nurseryId, string classId, UpdateClassCompositionRequestDto request)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // クラス存在確認
                    var classExists = await _context.Classes
                        .AnyAsync(c => c.NurseryId == nurseryId && c.ClassId == classId);

                    if (!classExists)
                    {
                        throw new KeyNotFoundException($"クラス {classId} が見つかりません");
                    }

                    var currentYear = DateTime.UtcNow.Year;

                    // 1. 既存の職員割り当てを非アクティブ化
                    var existingStaffAssignments = await _context.StaffClassAssignments
                        .Where(sca => sca.NurseryId == nurseryId && sca.ClassId == classId && sca.IsActive)
                        .ToListAsync();

                    foreach (var assignment in existingStaffAssignments)
                    {
                        assignment.IsActive = false;
                        assignment.UpdatedAt = DateTime.UtcNow;
                    }

                    // 2. 新しい職員割り当てを作成
                    foreach (var staffId in request.StaffIds)
                    {
                        // 既存のレコードがあれば再アクティブ化、なければ新規作成
                        var existing = await _context.StaffClassAssignments
                            .FirstOrDefaultAsync(sca => sca.NurseryId == nurseryId &&
                                                       sca.StaffId == staffId &&
                                                       sca.ClassId == classId);

                        if (existing != null)
                        {
                            existing.IsActive = true;
                            existing.UpdatedAt = DateTime.UtcNow;
                            existing.AcademicYear = currentYear;
                        }
                        else
                        {
                            _context.StaffClassAssignments.Add(new StaffClassAssignment
                            {
                                NurseryId = nurseryId,
                                StaffId = staffId,
                                ClassId = classId,
                                AssignmentRole = "MainTeacher", // デフォルトは担任
                                AcademicYear = currentYear,
                                IsActive = true,
                                AssignedAt = DateTime.UtcNow,
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }

                    // 3. 園児のクラス割り当てを更新
                    // まず、現在このクラスに属する園児のclassIdをクリア
                    var currentChildren = await _context.Children
                        .Where(c => c.NurseryId == nurseryId && c.ClassId == classId)
                        .ToListAsync();

                    foreach (var child in currentChildren)
                    {
                        if (!request.ChildIds.Contains(child.ChildId))
                        {
                            child.ClassId = null; // クラスから除外
                            child.UpdatedAt = DateTime.UtcNow;
                        }
                    }

                    // 新しい園児をこのクラスに割り当て
                    foreach (var childId in request.ChildIds)
                    {
                        var child = await _context.Children
                            .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ChildId == childId);

                        if (child != null)
                        {
                            child.ClassId = classId;
                            child.UpdatedAt = DateTime.UtcNow;
                        }
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // 更新後のデータを取得して返す
                    return await GetClassCompositionAsync(nurseryId, classId);
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        #endregion
    }
}
