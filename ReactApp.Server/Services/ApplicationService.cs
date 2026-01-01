using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Models;
using System.Text.RegularExpressions;
using ReactApp.Server.Helpers;

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
                    NurseryId = nursery.Id,
                    PhotoFunction = nursery.PhotoFunction
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
        /// 複数園児対応（Children配列で最大4人まで）
        /// </summary>
        public async Task<CreateApplicationResponse> CreateApplicationAsync(CreateApplicationRequest request, string applicationKey)
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
                var normalizedHomePhone = request.HomePhone != null ? NormalizePhoneNumber(request.HomePhone) : null;

                var applications = new List<ApplicationWork>();

                // 各園児ごとにApplicationWorkレコードを作成
                foreach (var child in request.Children)
                {
                    var application = new ApplicationWork
                    {
                        NurseryId = nursery.Id,

                        // 保護者情報（全レコード共通）
                        ApplicantName = request.ApplicantName,
                        ApplicantNameKana = request.ApplicantNameKana,
                        DateOfBirth = request.DateOfBirth,
                        PostalCode = request.PostalCode,
                        Prefecture = request.Prefecture,
                        City = request.City,
                        AddressLine = request.AddressLine,
                        MobilePhone = normalizedMobilePhone,
                        HomePhone = normalizedHomePhone,
                        Email = request.Email,
                        RelationshipToChild = request.RelationshipToChild,

                        // 園児情報（各レコード異なる）
                        ChildFamilyName = child.ChildFamilyName,
                        ChildFirstName = child.ChildFirstName,
                        ChildFamilyNameKana = child.ChildFamilyNameKana,
                        ChildFirstNameKana = child.ChildFirstNameKana,
                        ChildDateOfBirth = child.ChildDateOfBirth,
                        ChildGender = child.ChildGender,
                        ChildBloodType = child.ChildBloodType,
                        ChildAllergy = child.ChildAllergy,
                        ChildMedicalNotes = child.ChildMedicalNotes,
                        ChildSpecialInstructions = child.ChildSpecialInstructions,
                        ChildNoPhoto = child.ChildNoPhoto, // 撮影禁止フラグ（デフォルト: false）

                        // 申込管理情報
                        ApplicationStatus = "Pending",
                        IsImported = false,
                        CreatedAt = DateTimeHelper.GetJstNow()
                    };

                    applications.Add(application);
                    _context.ApplicationWorks.Add(application);
                }

                // 一括保存（EF Coreが自動的にトランザクション管理）
                await _context.SaveChangesAsync();

                // 保存後にIDを取得
                var applicationIds = applications.Select(a => a.Id).ToList();

                var childCount = request.Children.Count;
                var message = childCount == 1
                    ? "申込を受け付けました。保育園からの連絡をお待ちください。"
                    : $"申込を受け付けました。（園児{childCount}人分）保育園からの連絡をお待ちください。";

                _logger.LogInformation(
                    "入園申込完了。NurseryId: {NurseryId}, ChildCount: {ChildCount}, ApplicationIds: [{Ids}]",
                    nursery.Id, childCount, string.Join(", ", applicationIds));

                return new CreateApplicationResponse
                {
                    ApplicationIds = applicationIds,
                    ChildCount = childCount,
                    Message = message
                };
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
                    ChildFamilyName = a.ChildFamilyName,
                    ChildFirstName = a.ChildFirstName,
                    ChildDateOfBirth = a.ChildDateOfBirth,
                    RelationshipToChild = a.RelationshipToChild,
                    MobilePhone = a.MobilePhone,
                    ApplicationStatus = a.ApplicationStatus,
                    CreatedAt = a.CreatedAt,
                    ImportedAt = a.ImportedAt,
                    HasDuplicateParent = duplicatePhones.Contains(a.MobilePhone),
                    ChildNoPhoto = a.ChildNoPhoto
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
                    ChildFamilyName = application.ChildFamilyName,
                    ChildFirstName = application.ChildFirstName,
                    ChildFamilyNameKana = application.ChildFamilyNameKana,
                    ChildFirstNameKana = application.ChildFirstNameKana,
                    ChildDateOfBirth = application.ChildDateOfBirth,
                    ChildGender = application.ChildGender,
                    ChildBloodType = application.ChildBloodType,
                    ChildAllergy = application.ChildAllergy,
                    ChildMedicalNotes = application.ChildMedicalNotes,
                    ChildSpecialInstructions = application.ChildSpecialInstructions,
                    ChildNoPhoto = application.ChildNoPhoto,
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
                        existingParent.NameKana = application.ApplicantNameKana;
                        existingParent.Email = application.Email;
                        existingParent.DateOfBirth = application.DateOfBirth;
                        existingParent.PostalCode = application.PostalCode;
                        existingParent.Prefecture = application.Prefecture;
                        existingParent.City = application.City;
                        existingParent.AddressLine = application.AddressLine;
                        existingParent.HomePhone = application.HomePhone;
                        existingParent.UpdatedAt = DateTimeHelper.GetJstNow();
                    }
                }
                else
                {
                    // 新規保護者作成（IDはIDENTITY列なので自動採番）
                    isNewParent = true;

                    var newParent = new Parent
                    {
                        // Id は IDENTITY 列なので設定しない（自動採番）
                        NurseryId = nurseryId,
                        Name = application.ApplicantName,
                        NameKana = application.ApplicantNameKana,
                        PhoneNumber = application.MobilePhone,
                        Email = application.Email,
                        DateOfBirth = application.DateOfBirth,
                        PostalCode = application.PostalCode,
                        Prefecture = application.Prefecture,
                        City = application.City,
                        AddressLine = application.AddressLine,
                        HomePhone = application.HomePhone,
                        IsActive = true,
                        CreatedAt = DateTimeHelper.GetJstNow()
                    };

                    _context.Parents.Add(newParent);

                    // SaveChangesAsync後にIDが自動的に設定される
                    // 一旦保存してIDを取得する必要がある
                    await _context.SaveChangesAsync();
                    parentId = newParent.Id;
                }

                // 園児マスタ作成（常に新規）
                var childId = await GetNextChildIdAsync(nurseryId);

                var newChild = new Child
                {
                    NurseryId = nurseryId,
                    ChildId = childId,
                    FamilyName = application.ChildFamilyName,
                    FirstName = application.ChildFirstName,
                    FamilyFurigana = application.ChildFamilyNameKana,
                    FirstFurigana = application.ChildFirstNameKana,
                    DateOfBirth = application.ChildDateOfBirth,
                    Gender = application.ChildGender == "男" ? "Male" : "Female",
                    BloodType = application.ChildBloodType,
                    Allergy = application.ChildAllergy,
                    MedicalNotes = application.ChildMedicalNotes,
                    SpecialInstructions = application.ChildSpecialInstructions,
                    NoPhoto = application.ChildNoPhoto, // 撮影禁止フラグを引き継ぐ
                    GraduationStatus = "Active", // 入園申し込み承認時は在籍中
                    IsActive = true,
                    ClassId = null, // 初期値はnull（後でクラス割り当て）
                    CreatedAt = DateTimeHelper.GetJstNow()
                };

                _context.Children.Add(newChild);

                // ParentChildRelationship作成
                var relationship = new ParentChildRelationship
                {
                    ParentId = parentId,
                    NurseryId = nurseryId,
                    ChildId = childId,
                    RelationshipType = application.RelationshipToChild,
                    CreatedAt = DateTimeHelper.GetJstNow()
                };

                _context.ParentChildRelationships.Add(relationship);

                // ApplicationWork更新
                application.ApplicationStatus = "Imported";
                application.IsImported = true;
                application.ImportedAt = DateTimeHelper.GetJstNow();
                application.ImportedByUserId = userId;
                application.UpdatedAt = DateTimeHelper.GetJstNow();

                // 一括保存（EF Coreが自動的にトランザクション管理）
                // 注: 新規保護者の場合は既に1回SaveChangesAsyncを実行済み
                // ここでは園児、リレーションシップ、申込ステータス更新を保存
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "入園申込を取り込みました。ApplicationId: {ApplicationId}, ParentId: {ParentId}, ChildId: {ChildId}, IsNewParent: {IsNewParent}",
                    id, parentId, childId, isNewParent);

                return new ImportApplicationResult
                {
                    ParentId = parentId,
                    ChildId = childId,
                    IsNewParent = isNewParent,
                    IsNewChild = true,
                    Message = "入園申込を取り込みました。",
                    ParentName = application.ApplicantName,
                    ChildName = $"{application.ChildFamilyName} {application.ChildFirstName}",
                    WasParentCreated = isNewParent,
                    WasParentUpdated = !isNewParent && request.OverwriteParent,
                    NoPhotoSet = application.ChildNoPhoto // 撮影禁止設定
                };
            }
            catch (Exception ex)
            {
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
                application.UpdatedAt = DateTimeHelper.GetJstNow();

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
