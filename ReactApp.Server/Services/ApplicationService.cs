using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Models;
using System.Text.RegularExpressions;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 入園申込管理サービス実装
    /// 保護者Web申込からデスクトップアプリ取込までのワークフローを管理
    /// </summary>
    public class ApplicationService : IApplicationService
    {
        private readonly KindergartenDbContext _context;
        private readonly ILogger<ApplicationService> _logger;

        public ApplicationService(
            KindergartenDbContext context,
            ILogger<ApplicationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// ApplicationKey検証
        /// </summary>
        public async Task<ValidateApplicationKeyResult> ValidateApplicationKeyAsync(string applicationKey)
        {
            try
            {
                var nursery = await _context.Nurseries
                    .Where(n => n.ApplicationKey == applicationKey)
                    .FirstOrDefaultAsync();

                if (nursery == null)
                {
                    return new ValidateApplicationKeyResult
                    {
                        IsValid = false
                    };
                }

                return new ValidateApplicationKeyResult
                {
                    IsValid = true,
                    NurseryName = nursery.Name,
                    NurseryId = nursery.Id
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ApplicationKey検証に失敗しました。Key: {Key}", applicationKey);
                throw;
            }
        }

        /// <summary>
        /// 入園申込作成（保護者向けWeb申込）
        /// </summary>
        public async Task<int> CreateApplicationAsync(CreateApplicationRequest request, string applicationKey)
        {
            try
            {
                // ApplicationKeyで保育園を特定
                var nursery = await _context.Nurseries
                    .Where(n => n.ApplicationKey == applicationKey)
                    .FirstOrDefaultAsync();

                if (nursery == null)
                {
                    throw new InvalidOperationException("無効な申込キーです。");
                }

                // 携帯電話番号を正規化（ハイフン除去）
                var normalizedMobilePhone = NormalizePhoneNumber(request.MobilePhone);

                var application = new ApplicationWork
                {
                    NurseryId = nursery.Id,
                    ApplicantName = request.ApplicantName,
                    ApplicantNameKana = request.ApplicantNameKana,
                    DateOfBirth = request.DateOfBirth,
                    PostalCode = request.PostalCode,
                    Prefecture = request.Prefecture,
                    City = request.City,
                    AddressLine = request.AddressLine,
                    MobilePhone = normalizedMobilePhone,
                    HomePhone = request.HomePhone != null ? NormalizePhoneNumber(request.HomePhone) : null,
                    Email = request.Email,
                    RelationshipToChild = request.RelationshipToChild,
                    ChildName = request.ChildName,
                    ChildNameKana = request.ChildNameKana,
                    ChildDateOfBirth = request.ChildDateOfBirth,
                    ChildGender = request.ChildGender,
                    ChildBloodType = request.ChildBloodType,
                    ChildMedicalNotes = request.ChildMedicalNotes,
                    ChildSpecialInstructions = request.ChildSpecialInstructions,
                    ApplicationStatus = "Pending",
                    IsImported = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ApplicationWorks.Add(application);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "入園申込を受け付けました。ApplicationId: {Id}, NurseryId: {NurseryId}, ChildName: {ChildName}",
                    application.Id, nursery.Id, request.ChildName);

                return application.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "入園申込の作成に失敗しました。ApplicationKey: {Key}", applicationKey);
                throw;
            }
        }

        /// <summary>
        /// 入園申込一覧取得（デスクトップアプリ）
        /// </summary>
        public async Task<PaginatedResult<ApplicationListItemDto>> GetApplicationListAsync(
            int nurseryId,
            string? status = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int page = 1,
            int pageSize = 20)
        {
            try
            {
                var query = _context.ApplicationWorks
                    .Where(a => a.NurseryId == nurseryId);

                // ステータスフィルター
                if (!string.IsNullOrWhiteSpace(status))
                {
                    query = query.Where(a => a.ApplicationStatus == status);
                }

                // 日付範囲フィルター
                if (startDate.HasValue)
                {
                    query = query.Where(a => a.CreatedAt >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    var endOfDay = endDate.Value.Date.AddDays(1);
                    query = query.Where(a => a.CreatedAt < endOfDay);
                }

                // 総件数取得
                var totalItems = await query.CountAsync();

                // ページネーション + ソート（最新順）
                var applications = await query
                    .OrderByDescending(a => a.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // 重複保護者チェック用：携帯電話番号リスト
                var mobilePhones = applications.Select(a => a.MobilePhone).Distinct().ToList();
                var duplicatePhones = await _context.Parents
                    .Where(p => p.NurseryId == nurseryId && mobilePhones.Contains(p.PhoneNumber) && p.IsActive)
                    .Select(p => p.PhoneNumber)
                    .Distinct()
                    .ToListAsync();

                // DTO変換
                var applicationDtos = applications.Select(a => new ApplicationListItemDto
                {
                    Id = a.Id,
                    ApplicantName = a.ApplicantName,
                    ChildName = a.ChildName,
                    ChildDateOfBirth = a.ChildDateOfBirth,
                    RelationshipToChild = a.RelationshipToChild,
                    MobilePhone = a.MobilePhone,
                    ApplicationStatus = a.ApplicationStatus,
                    CreatedAt = a.CreatedAt,
                    ImportedAt = a.ImportedAt,
                    HasDuplicateParent = duplicatePhones.Contains(a.MobilePhone)
                }).ToList();

                return new PaginatedResult<ApplicationListItemDto>
                {
                    Items = applicationDtos,
                    TotalCount = totalItems,
                    CurrentPage = page,
                    PageSize = pageSize
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "入園申込一覧の取得に失敗しました。NurseryId: {NurseryId}", nurseryId);
                throw;
            }
        }

        /// <summary>
        /// 入園申込詳細取得（デスクトップアプリ）
        /// </summary>
        public async Task<ApplicationWorkDto?> GetApplicationDetailAsync(int id, int nurseryId)
        {
            try
            {
                var application = await _context.ApplicationWorks
                    .Where(a => a.Id == id && a.NurseryId == nurseryId)
                    .FirstOrDefaultAsync();

                if (application == null)
                {
                    return null;
                }

                // 携帯電話番号で重複保護者をチェック
                var duplicateParentInfo = await CheckDuplicateParentAsync(application.NurseryId, application.MobilePhone);

                return new ApplicationWorkDto
                {
                    Id = application.Id,
                    NurseryId = application.NurseryId,
                    ApplicantName = application.ApplicantName,
                    ApplicantNameKana = application.ApplicantNameKana,
                    DateOfBirth = application.DateOfBirth,
                    PostalCode = application.PostalCode,
                    Prefecture = application.Prefecture,
                    City = application.City,
                    AddressLine = application.AddressLine,
                    MobilePhone = application.MobilePhone,
                    HomePhone = application.HomePhone,
                    Email = application.Email,
                    RelationshipToChild = application.RelationshipToChild,
                    ChildName = application.ChildName,
                    ChildNameKana = application.ChildNameKana,
                    ChildDateOfBirth = application.ChildDateOfBirth,
                    ChildGender = application.ChildGender,
                    ChildBloodType = application.ChildBloodType,
                    ChildMedicalNotes = application.ChildMedicalNotes,
                    ChildSpecialInstructions = application.ChildSpecialInstructions,
                    ApplicationStatus = application.ApplicationStatus,
                    IsImported = application.IsImported,
                    ImportedAt = application.ImportedAt,
                    ImportedByUserId = application.ImportedByUserId,
                    CreatedAt = application.CreatedAt,
                    UpdatedAt = application.UpdatedAt,
                    RejectionReason = application.RejectionReason,
                    DuplicateParentInfo = duplicateParentInfo
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "入園申込詳細の取得に失敗しました。Id: {Id}, NurseryId: {NurseryId}", id, nurseryId);
                throw;
            }
        }

        /// <summary>
        /// 入園申込取込（デスクトップアプリ）
        /// </summary>
        public async Task<ImportApplicationResult> ImportApplicationAsync(
            int id,
            int nurseryId,
            ImportApplicationRequest request,
            int userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 申込データ取得
                var application = await _context.ApplicationWorks
                    .Where(a => a.Id == id && a.NurseryId == nurseryId)
                    .FirstOrDefaultAsync();

                if (application == null)
                {
                    throw new InvalidOperationException($"入園申込が見つかりません。ID: {id}");
                }

                if (application.IsImported)
                {
                    throw new InvalidOperationException("既に取込済みの申込です。");
                }

                if (application.ApplicationStatus != "Pending")
                {
                    throw new InvalidOperationException($"取込できない申込状態です。Status: {application.ApplicationStatus}");
                }

                // 携帯電話番号で保護者マスタ検索
                var existingParent = await _context.Parents
                    .Where(p => p.NurseryId == nurseryId && p.PhoneNumber == application.MobilePhone && p.IsActive)
                    .FirstOrDefaultAsync();

                int parentId;
                bool isNewParent;

                if (existingParent != null)
                {
                    // 既存保護者あり
                    parentId = existingParent.Id;
                    isNewParent = false;

                    if (request.OverwriteParent)
                    {
                        // 保護者情報更新
                        existingParent.Name = application.ApplicantName;
                        existingParent.Email = application.Email;
                        existingParent.Address = BuildFullAddress(application.Prefecture, application.City, application.AddressLine);
                        existingParent.UpdatedAt = DateTime.UtcNow;
                    }
                }
                else
                {
                    // 新規保護者作成
                    parentId = await GetNextParentIdAsync(nurseryId);
                    isNewParent = true;

                    var newParent = new Parent
                    {
                        Id = parentId,
                        NurseryId = nurseryId,
                        Name = application.ApplicantName,
                        PhoneNumber = application.MobilePhone,
                        Email = application.Email,
                        Address = BuildFullAddress(application.Prefecture, application.City, application.AddressLine),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Parents.Add(newParent);
                }

                // 園児マスタ作成（常に新規）
                var childId = await GetNextChildIdAsync(nurseryId);

                var newChild = new Child
                {
                    NurseryId = nurseryId,
                    ChildId = childId,
                    Name = application.ChildName,
                    Furigana = application.ChildNameKana,
                    DateOfBirth = application.ChildDateOfBirth,
                    Gender = application.ChildGender == "男" ? "male" : "female",
                    BloodType = application.ChildBloodType,
                    MedicalNotes = application.ChildMedicalNotes,
                    SpecialInstructions = application.ChildSpecialInstructions,
                    IsActive = true,
                    ClassId = null, // 初期値はnull（後でクラス割り当て）
                    CreatedAt = DateTime.UtcNow
                };

                _context.Children.Add(newChild);

                // ParentChildRelationship作成
                var relationship = new ParentChildRelationship
                {
                    ParentId = parentId,
                    NurseryId = nurseryId,
                    ChildId = childId,
                    RelationshipType = application.RelationshipToChild,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ParentChildRelationships.Add(relationship);

                // ApplicationWork更新
                application.ApplicationStatus = "Imported";
                application.IsImported = true;
                application.ImportedAt = DateTime.UtcNow;
                application.ImportedByUserId = userId;
                application.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation(
                    "入園申込を取り込みました。ApplicationId: {ApplicationId}, ParentId: {ParentId}, ChildId: {ChildId}, IsNewParent: {IsNewParent}",
                    id, parentId, childId, isNewParent);

                return new ImportApplicationResult
                {
                    ParentId = parentId,
                    ChildId = childId,
                    IsNewParent = isNewParent,
                    IsNewChild = true,
                    Message = "入園申込を取り込みました。"
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "入園申込の取込に失敗しました。Id: {Id}, NurseryId: {NurseryId}", id, nurseryId);
                throw;
            }
        }

        /// <summary>
        /// 入園申込却下（デスクトップアプリ）
        /// </summary>
        public async Task RejectApplicationAsync(int id, int nurseryId, RejectApplicationRequest request)
        {
            try
            {
                var application = await _context.ApplicationWorks
                    .Where(a => a.Id == id && a.NurseryId == nurseryId)
                    .FirstOrDefaultAsync();

                if (application == null)
                {
                    throw new InvalidOperationException($"入園申込が見つかりません。ID: {id}");
                }

                if (application.IsImported)
                {
                    throw new InvalidOperationException("既に取込済みの申込は却下できません。");
                }

                if (application.ApplicationStatus == "Rejected")
                {
                    throw new InvalidOperationException("既に却下済みの申込です。");
                }

                application.ApplicationStatus = "Rejected";
                application.RejectionReason = request.RejectionReason;
                application.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "入園申込を却下しました。ApplicationId: {Id}, Reason: {Reason}",
                    id, request.RejectionReason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "入園申込の却下に失敗しました。Id: {Id}, NurseryId: {NurseryId}", id, nurseryId);
                throw;
            }
        }

        #region プライベートメソッド

        /// <summary>
        /// 電話番号正規化（ハイフン除去）
        /// </summary>
        private string NormalizePhoneNumber(string phoneNumber)
        {
            return Regex.Replace(phoneNumber, @"[-\s]", "");
        }

        /// <summary>
        /// 完全住所文字列を生成
        /// </summary>
        private string? BuildFullAddress(string? prefecture, string? city, string? addressLine)
        {
            var parts = new[] { prefecture, city, addressLine }
                .Where(s => !string.IsNullOrWhiteSpace(s));

            var fullAddress = string.Join("", parts);
            return string.IsNullOrWhiteSpace(fullAddress) ? null : fullAddress;
        }

        /// <summary>
        /// 重複保護者チェック
        /// </summary>
        private async Task<DuplicateParentInfo> CheckDuplicateParentAsync(int nurseryId, string mobilePhone)
        {
            var existingParent = await _context.Parents
                .Where(p => p.NurseryId == nurseryId && p.PhoneNumber == mobilePhone && p.IsActive)
                .FirstOrDefaultAsync();

            if (existingParent == null)
            {
                return new DuplicateParentInfo
                {
                    HasDuplicate = false
                };
            }

            // 既存保護者の園児数をカウント
            var childCount = await _context.ParentChildRelationships
                .Where(r => r.ParentId == existingParent.Id && r.NurseryId == nurseryId)
                .CountAsync();

            return new DuplicateParentInfo
            {
                HasDuplicate = true,
                ExistingParentId = existingParent.Id,
                ExistingParentName = existingParent.Name,
                ChildCount = childCount
            };
        }

        /// <summary>
        /// 次の保護者ID取得（MAX + 1）
        /// </summary>
        private async Task<int> GetNextParentIdAsync(int nurseryId)
        {
            var maxId = await _context.Parents
                .Where(p => p.NurseryId == nurseryId)
                .Select(p => (int?)p.Id)
                .MaxAsync();

            return (maxId ?? 0) + 1;
        }

        /// <summary>
        /// 次の園児ID取得（MAX + 1）
        /// </summary>
        private async Task<int> GetNextChildIdAsync(int nurseryId)
        {
            var maxId = await _context.Children
                .Where(c => c.NurseryId == nurseryId)
                .Select(c => (int?)c.ChildId)
                .MaxAsync();

            return (maxId ?? 0) + 1;
        }

        #endregion
    }
}
