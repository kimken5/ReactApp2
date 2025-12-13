using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;
using ReactApp.Server.Exceptions;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 日報管理サービス実装クラス
    /// 園児の日々の活動記録・保護者への情報共有の業務ロジックを提供
    /// 作成・更新・公開・アーカイブの全ライフサイクル管理
    /// </summary>
    public class DailyReportService : IDailyReportService
    {
        // 依存サービス
        private readonly KindergartenDbContext _context;           // データベースコンテキスト
        private readonly IMapper _mapper;                          // オブジェクトマッピングサービス
        private readonly ILogger<DailyReportService> _logger;      // ログ出力サービス
        private readonly INotificationService _notificationService; // 通知サービス
        private readonly IConfiguration _configuration;             // アプリケーション設定
        private readonly TranslationHelper _translationHelper;      // 翻訳ヘルパー

        /// <summary>
        /// DailyReportServiceコンストラクタ
        /// 必要な依存サービスを注入により受け取り初期化
        /// </summary>
        /// <param name="context">データベースコンテキスト</param>
        /// <param name="mapper">オブジェクトマッピングサービス</param>
        /// <param name="logger">ログ出力サービス</param>
        /// <param name="notificationService">通知サービス</param>
        /// <param name="configuration">アプリケーション設定</param>
        /// <param name="translationHelper">翻訳ヘルパー</param>
        public DailyReportService(
            KindergartenDbContext context,
            IMapper mapper,
            ILogger<DailyReportService> logger,
            INotificationService notificationService,
            IConfiguration configuration,
            TranslationHelper translationHelper)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _notificationService = notificationService;
            _configuration = configuration;
            _translationHelper = translationHelper;
        }

        public async Task<IEnumerable<DailyReportDto>> GetReportsByChildIdAsync(int childId)
        {
            var reports = await _context.DailyReports
                .Where(r => r.ChildId == childId && r.Status == "published")
                .OrderByDescending(r => r.ReportDate)
                .ToListAsync();

            var dtos = _mapper.Map<IEnumerable<DailyReportDto>>(reports);
            foreach (var dto in dtos)
            {
                ConvertPhotoUrlsToFullUrls(dto);
            }
            return dtos;
        }

        public async Task<IEnumerable<DailyReportDto>> GetReportsByDateAsync(DateTime date)
        {
            var reports = await _context.DailyReports
                .Where(r => r.ReportDate.Date == date.Date && r.Status == "published")
                .OrderBy(r => r.ChildId)
                .ToListAsync();

            var dtos = _mapper.Map<IEnumerable<DailyReportDto>>(reports);
            foreach (var dto in dtos)
            {
                ConvertPhotoUrlsToFullUrls(dto);
            }
            return dtos;
        }

        public async Task<IEnumerable<DailyReportDto>> GetReportsByStaffIdAsync(int staffId)
        {
            var reports = await _context.DailyReports
                .Where(r => r.StaffId == staffId)
                .OrderByDescending(r => r.ReportDate)
                .ToListAsync();

            var dtos = _mapper.Map<IEnumerable<DailyReportDto>>(reports);
            foreach (var dto in dtos)
            {
                ConvertPhotoUrlsToFullUrls(dto);
            }
            return dtos;
        }

        public async Task<IEnumerable<DailyReportDto>> GetReportsByReportKindAsync(string reportKind)
        {
            var reports = await _context.DailyReports
                .Where(r => r.ReportKind == reportKind && r.Status == "published")
                .OrderByDescending(r => r.ReportDate)
                .ToListAsync();

            var dtos = _mapper.Map<IEnumerable<DailyReportDto>>(reports);
            foreach (var dto in dtos)
            {
                ConvertPhotoUrlsToFullUrls(dto);
            }
            return dtos;
        }

        public async Task<IEnumerable<DailyReportDto>> GetPublishedReportsAsync(int parentId)
        {
            // 保護者の情報を取得（言語設定取得のため）
            var parent = await _context.Parents.FindAsync(parentId);
            var targetLanguage = parent?.Language ?? "ja";

            // 保護者の子供IDを取得
            var childIds = await _context.ParentChildRelationships
                .Where(r => r.ParentId == parentId && r.IsActive)
                .Select(r => r.ChildId)
                .ToListAsync();

            _logger.LogInformation("GetPublishedReportsAsync: ParentId={ParentId}, Language={Language}, ChildIds={ChildIds}",
                parentId, targetLanguage, string.Join(",", childIds));

            // 保護者の子供に関連する公開済みレポートを取得
            var reports = await _context.DailyReports
                .Where(r => r.Status == "published" && childIds.Contains(r.ChildId))
                .OrderByDescending(r => r.ReportDate)
                .ToListAsync();

            // レポートIDを収集
            var reportIds = reports.Select(r => r.Id).ToList();

            // 返信データを一括取得
            var responses = await _context.DailyReportResponses
                .Where(resp => reportIds.Contains(resp.DailyReportId))
                .ToListAsync();

            // 返信に紐づく保護者IDを収集
            var parentIds = responses.Select(r => r.ParentId).Distinct().ToList();

            // 保護者情報を一括取得
            var parents = await _context.Parents
                .Where(p => parentIds.Contains(p.Id))
                .ToListAsync();

            // 返信に保護者情報を手動で割り当て
            foreach (var response in responses)
            {
                response.Parent = parents.FirstOrDefault(p => p.Id == response.ParentId)!;
            }

            // レポートに返信を手動で割り当て
            foreach (var report in reports)
            {
                report.Responses = responses.Where(r => r.DailyReportId == report.Id).ToList();
            }

            _logger.LogInformation("GetPublishedReportsAsync: Found {Count} published reports", reports.Count);
            foreach (var r in reports)
            {
                _logger.LogInformation("Report {Id}: ParentAcknowledged={ParentAcknowledged}, AcknowledgedAt={AcknowledgedAt}, Responses={ResponseCount}",
                    r.Id, r.ParentAcknowledged, r.AcknowledgedAt, r.Responses?.Count ?? 0);
            }

            var dtos = _mapper.Map<IEnumerable<DailyReportDto>>(reports);

            _logger.LogInformation("After mapping to DTO:");
            foreach (var dto in dtos)
            {
                _logger.LogInformation("DTO Report {Id}: Responses={ResponseCount}", dto.Id, dto.Responses?.Count ?? 0);
                if (dto.Responses != null && dto.Responses.Any())
                {
                    foreach (var resp in dto.Responses)
                    {
                        _logger.LogInformation("  Response {RespId}: ParentName={ParentName}, Message={Message}",
                            resp.Id, resp.ParentName, resp.ResponseMessage?.Substring(0, Math.Min(20, resp.ResponseMessage?.Length ?? 0)));
                    }
                }
                ConvertPhotoUrlsToFullUrls(dto);

                // 翻訳処理（日本語以外の場合のみ）
                await TranslateReportContentAsync(dto, targetLanguage);
            }
            return dtos;
        }

        public async Task<DailyReportDto?> GetReportByIdAsync(int id)
        {
            var report = await _context.DailyReports
                .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);

            if (report == null) return null;

            var dto = _mapper.Map<DailyReportDto>(report);
            ConvertPhotoUrlsToFullUrls(dto);
            return dto;
        }

        public async Task<DailyReportDto> CreateReportAsync(CreateDailyReportDto dto, int staffId)
        {
            _logger.LogInformation("CreateReportAsync called with ChildId={ChildId}, StaffId={StaffId}", dto.ChildId, staffId);

            var child = await _context.Children
                .FirstOrDefaultAsync(c => c.ChildId == dto.ChildId && c.IsActive);
            if (child == null)
            {
                _logger.LogWarning("Child not found: ChildId={ChildId}", dto.ChildId);
                throw new BusinessException("指定された園児が見つかりません。");
            }
            _logger.LogInformation("Child found: ChildId={ChildId}, NurseryId={NurseryId}", child.ChildId, child.NurseryId);

            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.NurseryId == child.NurseryId && s.StaffId == staffId && s.IsActive);
            if (staff == null)
            {
                _logger.LogWarning("Staff not found: StaffId={StaffId}", staffId);
                throw new BusinessException("スタッフが見つかりません。");
            }
            _logger.LogInformation("Staff found: StaffId={StaffId}, NurseryId={NurseryId}", staff.StaffId, staff.NurseryId);
            _logger.LogInformation("CreateReportAsync: dto.Status = '{Status}'", dto.Status);

            var report = new DailyReport
            {
                NurseryId = child.NurseryId,
                ChildId = dto.ChildId,
                StaffNurseryId = staff.NurseryId,
                StaffId = staffId,
                ReportDate = dto.ReportDate,
                ReportKind = dto.ReportKind,
                Title = dto.Title,
                Content = dto.Content,
                Photos = string.Join(",", dto.Photos),
                Status = dto.Status ?? "draft",
                PublishedAt = dto.Status == "published" ? DateTimeHelper.GetJstNow() : null,
                IsActive = true,
                CreatedAt = DateTimeHelper.GetJstNow()
            };

            _logger.LogInformation("CreateReportAsync: Creating report with Status = '{Status}', PublishedAt = {PublishedAt}", report.Status, report.PublishedAt);

            _context.DailyReports.Add(report);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Daily report created: {ReportId} for child {ChildId} by staff {StaffId} with Status='{Status}'", report.Id, dto.ChildId, staffId, report.Status);

            var createdReport = await GetReportByIdAsync(report.Id);
            _logger.LogInformation("GetReportByIdAsync returned report with Status='{Status}'", createdReport?.Status);

            return createdReport!;
        }

        public async Task<bool> UpdateReportAsync(int id, UpdateDailyReportDto dto)
        {
            _logger.LogInformation("UpdateReportAsync called for ReportId: {ReportId}", id);
            _logger.LogInformation("Update DTO - ReportKind: {ReportKind}, Title: {Title}, Content: {Content}, Photos: {Photos}, Status: {Status}",
                dto.ReportKind, dto.Title, dto.Content?.Substring(0, Math.Min(50, dto.Content?.Length ?? 0)),
                dto.Photos != null ? string.Join(",", dto.Photos) : "null",
                dto.Status);

            var report = await _context.DailyReports.FindAsync(id);
            if (report == null)
            {
                _logger.LogWarning("Report not found: {ReportId}", id);
                return false;
            }

            _logger.LogInformation("Current report - Photos: {CurrentPhotos}, Status: {CurrentStatus}", report.Photos, report.Status);

            // 公開済みレポートの編集を許可（再編集・更新のため）
            // ただし、アーカイブ済みは編集不可
            if (report.Status == "archived")
            {
                throw new BusinessException("アーカイブ済みのレポートは編集できません。");
            }

            // 下書き状態の場合のみ、園児の変更を許可
            if (dto.ChildId.HasValue && report.Status == "draft")
            {
                report.ChildId = dto.ChildId.Value;
                _logger.LogInformation("ChildId updated to: {ChildId} (draft mode)", dto.ChildId.Value);
            }
            else if (dto.ChildId.HasValue && report.Status == "published")
            {
                _logger.LogWarning("Attempted to change ChildId on published report (blocked)");
            }

            if (dto.ReportDate.HasValue)
                report.ReportDate = dto.ReportDate.Value;
            if (!string.IsNullOrEmpty(dto.ReportKind))
                report.ReportKind = dto.ReportKind;
            if (!string.IsNullOrEmpty(dto.Title))
                report.Title = dto.Title;
            if (!string.IsNullOrEmpty(dto.Content))
                report.Content = dto.Content;
            if (dto.Photos != null)
            {
                report.Photos = string.Join(",", dto.Photos);
                _logger.LogInformation("Photos updated to: {UpdatedPhotos}", report.Photos);
            }
            if (!string.IsNullOrEmpty(dto.Status))
            {
                report.Status = dto.Status;
                // 公開状態に変更された場合はPublishedAtを設定
                if (dto.Status == "published" && report.PublishedAt == null)
                {
                    report.PublishedAt = DateTimeHelper.GetJstNow();
                }
            }

            report.UpdatedAt = DateTimeHelper.GetJstNow();

            _logger.LogInformation("Saving changes for ReportId: {ReportId}", id);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Daily report updated: {ReportId}", id);
            return true;
        }

        public async Task<bool> PublishReportAsync(int id)
        {
            var report = await _context.DailyReports
                .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);

            if (report == null || report.Status != "draft")
            {
                return false;
            }

            report.Status = "published";
            report.PublishedAt = DateTimeHelper.GetJstNow();
            report.UpdatedAt = DateTimeHelper.GetJstNow();

            await _context.SaveChangesAsync();

            // Fetch child data separately
            var child = await _context.Children
                .FirstOrDefaultAsync(c => c.NurseryId == report.NurseryId && c.ChildId == report.ChildId);

            if (child != null)
            {
                // Get active parent relationships for this child
                var parentIds = await _context.ParentChildRelationships
                    .Where(pr => pr.NurseryId == child.NurseryId && pr.ChildId == child.ChildId && pr.IsActive)
                    .Select(pr => pr.ParentId)
                    .ToListAsync();

                if (parentIds.Any())
                {
                    var notificationDto = new SendNotificationDto
                    {
                        ParentIds = parentIds,
                        NotificationType = "report",
                        Title = $"{child.Name}さんの日報が投稿されました",
                        Content = $"レポート種別: {report.ReportKind} - {report.Title}",
                        DeliveryMethod = "push",
                        RelatedEntityId = report.Id,
                        RelatedEntityType = "DailyReport"
                    };

                    await _notificationService.SendNotificationAsync(notificationDto);
                }
            }

            _logger.LogInformation("Daily report published: {ReportId}", id);
            return true;
        }

        public async Task<bool> ArchiveReportAsync(int id)
        {
            var report = await _context.DailyReports.FindAsync(id);
            if (report == null)
            {
                return false;
            }

            report.Status = "archived";
            report.UpdatedAt = DateTimeHelper.GetJstNow();

            await _context.SaveChangesAsync();

            _logger.LogInformation("Daily report archived: {ReportId}", id);
            return true;
        }

        public async Task<bool> DeleteReportAsync(int id)
        {
            var report = await _context.DailyReports.FindAsync(id);
            if (report == null)
            {
                return false;
            }

            // 論理削除: IsActiveをfalseに設定
            report.IsActive = false;
            report.UpdatedAt = DateTimeHelper.GetJstNow();
            await _context.SaveChangesAsync();

            _logger.LogInformation("Daily report deleted (logical): {ReportId}", id);
            return true;
        }

        public async Task<bool> AddResponseAsync(CreateDailyReportResponseDto dto, int parentId)
        {
            var report = await _context.DailyReports.FindAsync(dto.DailyReportId);
            if (report == null || report.Status != "published")
            {
                return false;
            }

            // 既存の返信を検索
            var existingResponse = await _context.DailyReportResponses
                .FirstOrDefaultAsync(r => r.DailyReportId == dto.DailyReportId && r.ParentId == parentId);

            if (existingResponse != null)
            {
                // 既存の返信を更新
                existingResponse.ResponseMessage = dto.ResponseMessage;
                existingResponse.CreatedAt = DateTimeHelper.GetJstNow(); // 更新日時を記録
                _context.DailyReportResponses.Update(existingResponse);
                _logger.LogInformation("Daily report response updated: {ResponseId} for report {ReportId}",
                    existingResponse.Id, dto.DailyReportId);
            }
            else
            {
                // 新規返信を追加
                var response = new DailyReportResponse
                {
                    DailyReportId = dto.DailyReportId,
                    ParentId = parentId,
                    ResponseMessage = dto.ResponseMessage,
                    IsRead = false,
                    CreatedAt = DateTimeHelper.GetJstNow()
                };

                _context.DailyReportResponses.Add(response);
                _logger.LogInformation("Daily report response added: {ResponseId} for report {ReportId}",
                    response.Id, dto.DailyReportId);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarkReportAsReadAsync(int reportId, int parentId)
        {
            var response = await _context.DailyReportResponses
                .FirstOrDefaultAsync(r => r.DailyReportId == reportId && r.ParentId == parentId);

            if (response == null)
            {
                response = new DailyReportResponse
                {
                    DailyReportId = reportId,
                    ParentId = parentId,
                    IsRead = true,
                    ReadAt = DateTimeHelper.GetJstNow(),
                    CreatedAt = DateTimeHelper.GetJstNow()
                };
                _context.DailyReportResponses.Add(response);
            }
            else
            {
                response.IsRead = true;
                response.ReadAt = DateTimeHelper.GetJstNow();
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Daily report marked as read: {ReportId} by parent {ParentId}", reportId, parentId);
            return true;
        }

        /// <summary>
        /// 写真URLを完全なAzure Blob Storage URLに変換するヘルパーメソッド
        /// </summary>
        private void ConvertPhotoUrlsToFullUrls(DailyReportDto dto)
        {
            var blobBaseUrl = _configuration["AzureBlobStorage:BaseUrl"];
            var containerName = _configuration["AzureBlobStorage:ContainerName"];

            if (!string.IsNullOrEmpty(blobBaseUrl) && !string.IsNullOrEmpty(containerName) && dto.Photos.Any())
            {
                dto.Photos = dto.Photos.Select(fileName =>
                {
                    // 既に完全なURLの場合はそのまま返す
                    if (fileName.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                        fileName.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                    {
                        return fileName;
                    }
                    // ファイル名のみの場合は完全なURLに変換
                    return $"{blobBaseUrl}/{containerName}/{fileName}";
                }).ToList();
            }
        }

        /// <summary>
        /// レポート内容を指定された言語に翻訳するヘルパーメソッド
        /// </summary>
        /// <param name="dto">翻訳対象のレポートDTO</param>
        /// <param name="targetLanguage">翻訳先言語コード</param>
        private async Task TranslateReportContentAsync(DailyReportDto dto, string targetLanguage)
        {
            // TranslationHelperを使用して翻訳
            await _translationHelper.TranslatePropertiesAsync(dto, new List<string> { "Title", "Content" }, targetLanguage);
        }
    }
}
