using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs.Desktop;
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
        private readonly IPhotoStorageService _photoStorageService;

        public DesktopDailyReportService(
            KindergartenDbContext context,
            ILogger<DesktopDailyReportService> logger,
            IPhotoStorageService photoStorageService)
        {
            _context = context;
            _logger = logger;
            _photoStorageService = photoStorageService;
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

                // レポート種別のフィルタリングはMapToDto後にメモリ上で実行（完全一致のため）

                if (!string.IsNullOrEmpty(filter.Status))
                {
                    query = query.Where(r => r.Status == filter.Status);
                }

                if (filter.ParentAcknowledged.HasValue)
                {
                    query = query.Where(r => r.ParentAcknowledged == filter.ParentAcknowledged.Value);
                }

                if (filter.HasPhoto.HasValue)
                {
                    if (filter.HasPhoto.Value)
                    {
                        // 写真あり: Photosフィールドが空でない
                        query = query.Where(r => !string.IsNullOrEmpty(r.Photos) && r.Photos != "[]");
                    }
                    else
                    {
                        // 写真なし: Photosフィールドが空または空配列
                        query = query.Where(r => string.IsNullOrEmpty(r.Photos) || r.Photos == "[]");
                    }
                }

                // キーワード検索はMapToDto後にメモリ上で実行（園児名・職員名を含むため）

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

                    // クラス名を取得
                    string? className = null;
                    if (child?.ClassId != null)
                    {
                        var classInfo = await _context.Classes
                            .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ClassId == child.ClassId);
                        className = classInfo?.Name;
                    }

                    result.Add(MapToDto(report, child?.Name ?? "不明", className, staff?.Name ?? "不明", responseCount));
                }

                // レポート種別フィルタリング（メモリ上で完全一致）
                if (!string.IsNullOrEmpty(filter.ReportKind))
                {
                    _logger.LogInformation("フィルター前の件数: {Count}", result.Count);
                    _logger.LogInformation("フィルター条件: ReportKind={ReportKind}", filter.ReportKind);

                    var filterKinds = filter.ReportKind.Split(',').Select(k => k.Trim()).ToList();

                    foreach (var report in result)
                    {
                        _logger.LogInformation("レポートID={Id}, ReportKind={ReportKind}", report.Id, report.ReportKind);
                    }

                    result = result.Where(r =>
                    {
                        var reportKinds = r.ReportKind.Split(',').Select(k => k.Trim()).ToList();
                        var match = filterKinds.Any(fk => reportKinds.Contains(fk));
                        _logger.LogInformation("レポートID={Id}, 一致={Match}, レポート種別={ReportKinds}", r.Id, match, string.Join(",", reportKinds));
                        return match;
                    }).ToList();

                    _logger.LogInformation("フィルター後の件数: {Count}", result.Count);
                }

                // キーワード検索で園児名・職員名もフィルタリング（メモリ上で実行）
                if (!string.IsNullOrEmpty(filter.SearchKeyword))
                {
                    var keyword = filter.SearchKeyword.ToLower();
                    result = result.Where(r =>
                        r.Title.ToLower().Contains(keyword) ||
                        r.Content.ToLower().Contains(keyword) ||
                        r.ChildName.ToLower().Contains(keyword) ||
                        r.StaffName.ToLower().Contains(keyword)
                    ).ToList();
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

                // クラス名を取得
                string? className = null;
                if (child?.ClassId != null)
                {
                    var classInfo = await _context.Classes
                        .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ClassId == child.ClassId);
                    className = classInfo?.Name;
                }

                _logger.LogInformation(
                    "日報詳細取得成功: NurseryId={NurseryId}, ReportId={ReportId}",
                    nurseryId, reportId);

                return MapToDto(report, child?.Name ?? "不明", className, staff?.Name ?? "不明", responseCount);
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
                    ReportKind = request.ReportKind,
                    Title = request.Title,
                    Content = request.Content,
                    Photos = photosJson,
                    Status = status,
                    PublishedAt = status == "published" ? DateTime.UtcNow : null,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByAdminUser = true
                };

                _context.DailyReports.Add(report);
                await _context.SaveChangesAsync();

                // クラス名を取得
                string? className = null;
                if (child?.ClassId != null)
                {
                    var classInfo = await _context.Classes
                        .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ClassId == child.ClassId);
                    className = classInfo?.Name;
                }

                _logger.LogInformation(
                    "日報作成成功: NurseryId={NurseryId}, ReportId={ReportId}, ChildId={ChildId}, StaffId={StaffId}",
                    nurseryId, report.Id, request.ChildId, request.StaffId);

                return MapToDto(report, child.Name, className, staff.Name, 0);
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

                // 日付更新
                if (request.ReportDate.Date > DateTime.UtcNow.Date)
                {
                    throw new InvalidOperationException("未来の日付の日報は作成できません");
                }
                report.ReportDate = request.ReportDate.Date;

                // その他のフィールド更新
                if (!string.IsNullOrEmpty(request.ReportKind))
                {
                    report.ReportKind = request.ReportKind;
                }

                if (!string.IsNullOrEmpty(request.Title))
                {
                    report.Title = request.Title;
                }

                if (!string.IsNullOrEmpty(request.Content))
                {
                    report.Content = request.Content;
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

                // クラス名を取得
                string? className = null;
                if (child?.ClassId != null)
                {
                    var classInfo = await _context.Classes
                        .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ClassId == child.ClassId);
                    className = classInfo?.Name;
                }

                _logger.LogInformation(
                    "日報更新成功: NurseryId={NurseryId}, ReportId={ReportId}",
                    nurseryId, reportId);

                return MapToDto(report, child?.Name ?? "不明", className, staff?.Name ?? "不明", responseCount);
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

                // 論理削除: IsActiveをfalseに設定
                report.IsActive = false;
                report.UpdatedAt = DateTime.UtcNow;
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

                // クラス名を取得
                string? className = null;
                if (child?.ClassId != null)
                {
                    var classInfo = await _context.Classes
                        .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ClassId == child.ClassId);
                    className = classInfo?.Name;
                }

                _logger.LogInformation(
                    "日報公開成功: NurseryId={NurseryId}, ReportId={ReportId}",
                    nurseryId, reportId);

                return MapToDto(report, child?.Name ?? "不明", className, staff?.Name ?? "不明", responseCount);
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

                    // クラス名を取得
                    string? className = null;
                    if (child?.ClassId != null)
                    {
                        var classInfo = await _context.Classes
                            .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ClassId == child.ClassId);
                        className = classInfo?.Name;
                    }

                    result.Add(MapToDto(report, child?.Name ?? "不明", className, staff?.Name ?? "不明", responseCount));
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

                    // クラス名を取得
                    string? className = null;
                    if (child?.ClassId != null)
                    {
                        var classInfo = await _context.Classes
                            .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ClassId == child.ClassId);
                        className = classInfo?.Name;
                    }

                    result.Add(MapToDto(report, child?.Name ?? "不明", className, staff?.Name ?? "不明", responseCount));
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

        private DailyReportDto MapToDto(DailyReport report, string childName, string? className, string staffName, int responseCount)
        {
            List<string> photos = new();
            if (!string.IsNullOrEmpty(report.Photos))
            {
                try
                {
                    var rawPhotos = JsonSerializer.Deserialize<List<string>>(report.Photos) ?? new List<string>();

                    // ファイル名だけの場合は完全なURLに変換
                    photos = rawPhotos.Select(photo =>
                    {
                        // 既にURLの場合はそのまま返す (http:// または https:// で始まる)
                        if (photo.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                            photo.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                        {
                            return photo;
                        }

                        // ファイル名だけの場合は完全なURLに変換
                        return _photoStorageService.GetPhotoUrl(photo, isOriginal: true);
                    }).ToList();
                }
                catch
                {
                    _logger.LogWarning("日報写真のJSON解析失敗: ReportId={ReportId}", report.Id);
                }
            }

            return new DailyReportDto
            {
                Id = report.Id,
                NurseryId = report.NurseryId,
                ChildId = report.ChildId,
                ChildName = childName,
                ClassName = className,
                StaffNurseryId = report.StaffNurseryId,
                StaffId = report.StaffId,
                StaffName = staffName,
                ReportDate = report.ReportDate,
                ReportKind = report.ReportKind,
                Title = report.Title,
                Content = report.Content,
                Photos = photos,
                Status = report.Status,
                PublishedAt = report.PublishedAt,
                ParentAcknowledged = report.ParentAcknowledged,
                AcknowledgedAt = report.AcknowledgedAt,
                CreatedByAdminUser = report.CreatedByAdminUser,
                CreatedAt = report.CreatedAt,
                UpdatedAt = report.UpdatedAt,
                ResponseCount = responseCount
            };
        }
    }
}
