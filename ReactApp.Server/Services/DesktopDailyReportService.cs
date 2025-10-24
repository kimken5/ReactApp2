using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;
using System.Text.Json;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デスクトップアプリ用日報管理サービス実装
    /// 日報のCRUD操作、フィルタ検索、公開処理を提供
    /// </summary>
    public class DesktopDailyReportService : IDesktopDailyReportService
    {
        private readonly KindergartenDbContext _context;
        private readonly ILogger<DesktopDailyReportService> _logger;

        public DesktopDailyReportService(
            KindergartenDbContext context,
            ILogger<DesktopDailyReportService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<DailyReportDto>> GetDailyReportsAsync(int nurseryId, DailyReportFilterDto filter)
        {
            try
            {
                var query = _context.DailyReports
                    .Where(r => r.NurseryId == nurseryId);

                // フィルタ適用
                if (filter.ChildId.HasValue)
                {
                    query = query.Where(r => r.ChildId == filter.ChildId.Value);
                }

                if (!string.IsNullOrEmpty(filter.ClassId))
                {
                    // ClassId経由でフィルタ
                    query = query.Where(r => _context.Children
                        .Any(c => c.NurseryId == nurseryId
                            && c.ChildId == r.ChildId
                            && c.ClassId == filter.ClassId));
                }

                if (filter.StaffId.HasValue)
                {
                    query = query.Where(r => r.StaffId == filter.StaffId.Value);
                }

                if (filter.StartDate.HasValue)
                {
                    query = query.Where(r => r.ReportDate >= filter.StartDate.Value.Date);
                }

                if (filter.EndDate.HasValue)
                {
                    query = query.Where(r => r.ReportDate <= filter.EndDate.Value.Date);
                }

                if (!string.IsNullOrEmpty(filter.Category))
                {
                    query = query.Where(r => r.Category == filter.Category);
                }

                if (!string.IsNullOrEmpty(filter.Status))
                {
                    query = query.Where(r => r.Status == filter.Status);
                }

                if (filter.ParentAcknowledged.HasValue)
                {
                    query = query.Where(r => r.ParentAcknowledged == filter.ParentAcknowledged.Value);
                }

                if (!string.IsNullOrEmpty(filter.Keyword))
                {
                    var keyword = filter.Keyword.ToLower();
                    query = query.Where(r => r.Title.ToLower().Contains(keyword)
                        || r.Content.ToLower().Contains(keyword));
                }

                // 日報取得とマッピング
                var reports = await query
                    .OrderByDescending(r => r.ReportDate)
                    .ThenByDescending(r => r.CreatedAt)
                    .ToListAsync();

                // 園児名とスタッフ名を取得してマッピング
                var result = new List<DailyReportDto>();
                foreach (var report in reports)
                {
                    var child = await _context.Children
                        .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ChildId == report.ChildId);

                    var staff = await _context.Staff
                        .FirstOrDefaultAsync(s => s.NurseryId == report.StaffNurseryId && s.StaffId == report.StaffId);

                    var responseCount = await _context.DailyReportResponses
                        .CountAsync(r => r.DailyReportId == report.Id);

                    result.Add(MapToDto(report, child?.Name ?? "不明", staff?.Name ?? "不明", responseCount));
                }

                _logger.LogInformation(
                    "日報一覧取得成功: NurseryId={NurseryId}, 件数={Count}",
                    nurseryId, result.Count);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "日報一覧取得エラー: NurseryId={NurseryId}", nurseryId);
                throw;
            }
        }

        public async Task<DailyReportDto?> GetDailyReportByIdAsync(int nurseryId, int reportId)
        {
            try
            {
                var report = await _context.DailyReports
                    .FirstOrDefaultAsync(r => r.NurseryId == nurseryId && r.Id == reportId);

                if (report == null)
                {
                    return null;
                }

                var child = await _context.Children
                    .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ChildId == report.ChildId);

                var staff = await _context.Staff
                    .FirstOrDefaultAsync(s => s.NurseryId == report.StaffNurseryId && s.StaffId == report.StaffId);

                var responseCount = await _context.DailyReportResponses
                    .CountAsync(r => r.DailyReportId == report.Id);

                _logger.LogInformation(
                    "日報詳細取得成功: NurseryId={NurseryId}, ReportId={ReportId}",
                    nurseryId, reportId);

                return MapToDto(report, child?.Name ?? "不明", staff?.Name ?? "不明", responseCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "日報詳細取得エラー: NurseryId={NurseryId}, ReportId={ReportId}",
                    nurseryId, reportId);
                throw;
            }
        }

        public async Task<DailyReportDto> CreateDailyReportAsync(int nurseryId, CreateDailyReportRequestDto request)
        {
            try
            {
                // 園児存在確認
                var child = await _context.Children
                    .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ChildId == request.ChildId);

                if (child == null)
                {
                    throw new InvalidOperationException($"園児が見つかりません: ChildId={request.ChildId}");
                }

                // 職員存在確認
                var staff = await _context.Staff
                    .FirstOrDefaultAsync(s => s.NurseryId == nurseryId && s.StaffId == request.StaffId);

                if (staff == null)
                {
                    throw new InvalidOperationException($"職員が見つかりません: StaffId={request.StaffId}");
                }

                // 未来の日付チェック
                if (request.ReportDate.Date > DateTime.UtcNow.Date)
                {
                    throw new InvalidOperationException("未来の日付の日報は作成できません");
                }

                // JSON変換
                var tagsJson = request.Tags != null && request.Tags.Any()
                    ? JsonSerializer.Serialize(request.Tags)
                    : null;

                var photosJson = request.Photos != null && request.Photos.Any()
                    ? JsonSerializer.Serialize(request.Photos)
                    : null;

                var status = string.IsNullOrEmpty(request.Status) ? "draft" : request.Status;

                var report = new DailyReport
                {
                    NurseryId = nurseryId,
                    ChildId = request.ChildId,
                    StaffNurseryId = nurseryId,
                    StaffId = request.StaffId,
                    ReportDate = request.ReportDate.Date,
                    Category = request.Category,
                    Title = request.Title,
                    Content = request.Content,
                    Tags = tagsJson,
                    Photos = photosJson,
                    Status = status,
                    PublishedAt = status == "published" ? DateTime.UtcNow : null,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByAdminUser = true
                };

                _context.DailyReports.Add(report);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "日報作成成功: NurseryId={NurseryId}, ReportId={ReportId}, ChildId={ChildId}, StaffId={StaffId}",
                    nurseryId, report.Id, request.ChildId, request.StaffId);

                return MapToDto(report, child.Name, staff.Name, 0);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "日報作成エラー: NurseryId={NurseryId}", nurseryId);
                throw;
            }
        }

        public async Task<DailyReportDto> UpdateDailyReportAsync(
            int nurseryId,
            int reportId,
            UpdateDailyReportRequestDto request)
        {
            try
            {
                var report = await _context.DailyReports
                    .FirstOrDefaultAsync(r => r.NurseryId == nurseryId && r.Id == reportId);

                if (report == null)
                {
                    throw new InvalidOperationException($"日報が見つかりません: ReportId={reportId}");
                }

                // 園児ID変更（下書き状態のみ）
                if (request.ChildId.HasValue && request.ChildId.Value != report.ChildId)
                {
                    if (report.Status != "draft")
                    {
                        throw new InvalidOperationException("公開済みの日報は園児を変更できません");
                    }

                    var childForUpdate = await _context.Children
                        .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ChildId == request.ChildId.Value);

                    if (childForUpdate == null)
                    {
                        throw new InvalidOperationException($"園児が見つかりません: ChildId={request.ChildId.Value}");
                    }

                    report.ChildId = request.ChildId.Value;
                }

                // 日付更新
                if (request.ReportDate.HasValue)
                {
                    if (request.ReportDate.Value.Date > DateTime.UtcNow.Date)
                    {
                        throw new InvalidOperationException("未来の日付の日報は作成できません");
                    }
                    report.ReportDate = request.ReportDate.Value.Date;
                }

                // その他のフィールド更新
                if (!string.IsNullOrEmpty(request.Category))
                {
                    report.Category = request.Category;
                }

                if (!string.IsNullOrEmpty(request.Title))
                {
                    report.Title = request.Title;
                }

                if (!string.IsNullOrEmpty(request.Content))
                {
                    report.Content = request.Content;
                }

                if (request.Tags != null)
                {
                    report.Tags = request.Tags.Any()
                        ? JsonSerializer.Serialize(request.Tags)
                        : null;
                }

                if (request.Photos != null)
                {
                    report.Photos = request.Photos.Any()
                        ? JsonSerializer.Serialize(request.Photos)
                        : null;
                }

                // ステータス更新（published → draft への変更は不可）
                if (!string.IsNullOrEmpty(request.Status))
                {
                    if (report.Status == "published" && request.Status == "draft")
                    {
                        throw new InvalidOperationException("公開済みの日報を下書きに戻すことはできません");
                    }

                    report.Status = request.Status;
                    if (request.Status == "published" && !report.PublishedAt.HasValue)
                    {
                        report.PublishedAt = DateTime.UtcNow;
                    }
                }

                report.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // 最新情報を取得
                var child = await _context.Children
                    .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ChildId == report.ChildId);

                var staff = await _context.Staff
                    .FirstOrDefaultAsync(s => s.NurseryId == report.StaffNurseryId && s.StaffId == report.StaffId);

                var responseCount = await _context.DailyReportResponses
                    .CountAsync(r => r.DailyReportId == report.Id);

                _logger.LogInformation(
                    "日報更新成功: NurseryId={NurseryId}, ReportId={ReportId}",
                    nurseryId, reportId);

                return MapToDto(report, child?.Name ?? "不明", staff?.Name ?? "不明", responseCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "日報更新エラー: NurseryId={NurseryId}, ReportId={ReportId}",
                    nurseryId, reportId);
                throw;
            }
        }

        public async Task DeleteDailyReportAsync(int nurseryId, int reportId)
        {
            try
            {
                var report = await _context.DailyReports
                    .FirstOrDefaultAsync(r => r.NurseryId == nurseryId && r.Id == reportId);

                if (report == null)
                {
                    throw new InvalidOperationException($"日報が見つかりません: ReportId={reportId}");
                }

                // ビジネスルール: Publishedステータスの日報は削除不可
                if (report.Status == "published")
                {
                    throw new InvalidOperationException("公開済みの日報は削除できません (BR-RM-001)");
                }

                _context.DailyReports.Remove(report);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "日報削除成功: NurseryId={NurseryId}, ReportId={ReportId}",
                    nurseryId, reportId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "日報削除エラー: NurseryId={NurseryId}, ReportId={ReportId}",
                    nurseryId, reportId);
                throw;
            }
        }

        public async Task<DailyReportDto> PublishDailyReportAsync(int nurseryId, int reportId)
        {
            try
            {
                var report = await _context.DailyReports
                    .FirstOrDefaultAsync(r => r.NurseryId == nurseryId && r.Id == reportId);

                if (report == null)
                {
                    throw new InvalidOperationException($"日報が見つかりません: ReportId={reportId}");
                }

                report.Status = "published";
                report.PublishedAt = DateTime.UtcNow;
                report.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var child = await _context.Children
                    .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ChildId == report.ChildId);

                var staff = await _context.Staff
                    .FirstOrDefaultAsync(s => s.NurseryId == report.StaffNurseryId && s.StaffId == report.StaffId);

                var responseCount = await _context.DailyReportResponses
                    .CountAsync(r => r.DailyReportId == report.Id);

                _logger.LogInformation(
                    "日報公開成功: NurseryId={NurseryId}, ReportId={ReportId}",
                    nurseryId, reportId);

                return MapToDto(report, child?.Name ?? "不明", staff?.Name ?? "不明", responseCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "日報公開エラー: NurseryId={NurseryId}, ReportId={ReportId}",
                    nurseryId, reportId);
                throw;
            }
        }

        public async Task<List<DailyReportDto>> GetDraftReportsAsync(int nurseryId, int staffId)
        {
            try
            {
                var reports = await _context.DailyReports
                    .Where(r => r.NurseryId == nurseryId
                        && r.StaffId == staffId
                        && r.Status == "draft")
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                var result = new List<DailyReportDto>();
                foreach (var report in reports)
                {
                    var child = await _context.Children
                        .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ChildId == report.ChildId);

                    var staff = await _context.Staff
                        .FirstOrDefaultAsync(s => s.NurseryId == report.StaffNurseryId && s.StaffId == report.StaffId);

                    var responseCount = await _context.DailyReportResponses
                        .CountAsync(r => r.DailyReportId == report.Id);

                    result.Add(MapToDto(report, child?.Name ?? "不明", staff?.Name ?? "不明", responseCount));
                }

                _logger.LogInformation(
                    "下書き日報一覧取得成功: NurseryId={NurseryId}, StaffId={StaffId}, 件数={Count}",
                    nurseryId, staffId, result.Count);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "下書き日報一覧取得エラー: NurseryId={NurseryId}, StaffId={StaffId}",
                    nurseryId, staffId);
                throw;
            }
        }

        public async Task<List<DailyReportDto>> GetReportsByDateAsync(int nurseryId, DateTime date)
        {
            try
            {
                var targetDate = date.Date;

                var reports = await _context.DailyReports
                    .Where(r => r.NurseryId == nurseryId && r.ReportDate == targetDate)
                    .OrderBy(r => r.ChildId)
                    .ToListAsync();

                var result = new List<DailyReportDto>();
                foreach (var report in reports)
                {
                    var child = await _context.Children
                        .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ChildId == report.ChildId);

                    var staff = await _context.Staff
                        .FirstOrDefaultAsync(s => s.NurseryId == report.StaffNurseryId && s.StaffId == report.StaffId);

                    var responseCount = await _context.DailyReportResponses
                        .CountAsync(r => r.DailyReportId == report.Id);

                    result.Add(MapToDto(report, child?.Name ?? "不明", staff?.Name ?? "不明", responseCount));
                }

                _logger.LogInformation(
                    "日付別日報一覧取得成功: NurseryId={NurseryId}, Date={Date}, 件数={Count}",
                    nurseryId, targetDate, result.Count);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "日付別日報一覧取得エラー: NurseryId={NurseryId}, Date={Date}",
                    nurseryId, date);
                throw;
            }
        }

        private DailyReportDto MapToDto(DailyReport report, string childName, string staffName, int responseCount)
        {
            List<string> tags = new();
            if (!string.IsNullOrEmpty(report.Tags))
            {
                try
                {
                    tags = JsonSerializer.Deserialize<List<string>>(report.Tags) ?? new List<string>();
                }
                catch
                {
                    _logger.LogWarning("日報タグのJSON解析失敗: ReportId={ReportId}", report.Id);
                }
            }

            List<string> photos = new();
            if (!string.IsNullOrEmpty(report.Photos))
            {
                try
                {
                    photos = JsonSerializer.Deserialize<List<string>>(report.Photos) ?? new List<string>();
                }
                catch
                {
                    _logger.LogWarning("日報写真のJSON解析失敗: ReportId={ReportId}", report.Id);
                }
            }

            return new DailyReportDto
            {
                Id = report.Id,
                ChildId = report.ChildId,
                ChildName = childName,
                StaffId = report.StaffId,
                StaffName = staffName,
                ReportDate = report.ReportDate,
                Category = report.Category,
                Title = report.Title,
                Content = report.Content,
                Tags = tags,
                Photos = photos,
                Status = report.Status,
                PublishedAt = report.PublishedAt,
                ParentAcknowledged = report.ParentAcknowledged,
                AcknowledgedAt = report.AcknowledgedAt,
                CreatedAt = report.CreatedAt,
                UpdatedAt = report.UpdatedAt,
                Responses = new List<DailyReportResponseDto>() // 簡易版ではレスポンスは空
            };
        }
    }
}
