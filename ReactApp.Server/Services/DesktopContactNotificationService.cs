using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デスクトップアプリ用連絡通知管理サービス実装
    /// </summary>
    public class DesktopContactNotificationService : IDesktopContactNotificationService
    {
        private readonly KindergartenDbContext _context;
        private readonly ILogger<DesktopContactNotificationService> _logger;

        public DesktopContactNotificationService(
            KindergartenDbContext context,
            ILogger<DesktopContactNotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// 連絡通知一覧を取得（フィルタ対応）
        /// </summary>
        public async Task<List<ContactNotificationDto>> GetContactNotificationsAsync(ContactNotificationFilterDto filter)
        {
            try
            {
                var query = _context.AbsenceNotifications.AsQueryable();

                // 日付範囲フィルタ
                if (filter.StartDate.HasValue)
                {
                    query = query.Where(n => n.Ymd >= filter.StartDate.Value);
                }
                if (filter.EndDate.HasValue)
                {
                    query = query.Where(n => n.Ymd <= filter.EndDate.Value);
                }

                // 連絡種別フィルタ
                if (!string.IsNullOrEmpty(filter.NotificationType))
                {
                    query = query.Where(n => n.NotificationType == filter.NotificationType);
                }

                // ステータスフィルタ
                if (!string.IsNullOrEmpty(filter.Status))
                {
                    query = query.Where(n => n.Status == filter.Status);
                }

                // 園児フィルタ
                if (filter.ChildId.HasValue)
                {
                    query = query.Where(n => n.ChildId == filter.ChildId.Value);
                }

                // 確認状態フィルタ
                if (filter.AcknowledgedByAdminUser.HasValue)
                {
                    query = query.Where(n => n.AcknowledgedByAdminUser == filter.AcknowledgedByAdminUser.Value);
                }

                var notifications = await query
                    .OrderByDescending(n => n.SubmittedAt)
                    .ToListAsync();

                // 関連情報を手動で読み込み
                var parentIds = notifications.Select(n => n.ParentId).Distinct().ToList();
                var childIds = notifications.Select(n => n.ChildId).Distinct().ToList();
                var staffIds = notifications.Where(n => n.RespondedByStaffId.HasValue)
                    .Select(n => n.RespondedByStaffId!.Value).Distinct().ToList();

                var parents = await _context.Parents
                    .Where(p => parentIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id, p => p.Name);

                var children = await _context.Children
                    .Where(c => childIds.Contains(c.ChildId))
                    .ToDictionaryAsync(c => c.ChildId, c => new { c.Name, c.ClassId });

                var classes = await _context.Classes
                    .ToDictionaryAsync(c => c.ClassId, c => c.Name);

                var staff = staffIds.Any()
                    ? await _context.Staff
                        .Where(s => staffIds.Contains(s.StaffId))
                        .ToDictionaryAsync(s => s.StaffId, s => s.Name)
                    : new Dictionary<int, string>();

                // 最新の返信を取得
                var notificationIds = notifications.Select(n => n.Id).ToList();
                var responses = await _context.AbsenceNotificationResponses
                    .Where(r => notificationIds.Contains(r.AbsenceNotificationId) && r.IsActive)
                    .OrderByDescending(r => r.ResponseAt)
                    .ToListAsync();

                var latestResponses = responses
                    .GroupBy(r => r.AbsenceNotificationId)
                    .ToDictionary(g => g.Key, g => g.First());

                var responseStaffIds = responses.Select(r => r.StaffId).Distinct().ToList();
                var responseStaff = await _context.Staff
                    .Where(s => responseStaffIds.Contains(s.StaffId))
                    .ToDictionaryAsync(s => s.StaffId, s => s.Name);

                // DTOにマッピング
                var result = notifications.Select(n =>
                {
                    var childInfo = children.GetValueOrDefault(n.ChildId);
                    var className = childInfo != null && !string.IsNullOrEmpty(childInfo.ClassId)
                        ? classes.GetValueOrDefault(childInfo.ClassId)
                        : null;

                    ContactNotificationResponseDto? latestResponseDto = null;
                    if (latestResponses.TryGetValue(n.Id, out var latestResponse))
                    {
                        latestResponseDto = new ContactNotificationResponseDto
                        {
                            Id = latestResponse.Id,
                            AbsenceNotificationId = latestResponse.AbsenceNotificationId,
                            NurseryId = latestResponse.NurseryId,
                            StaffId = latestResponse.StaffId,
                            StaffName = responseStaff.GetValueOrDefault(latestResponse.StaffId, "不明"),
                            ResponseType = latestResponse.ResponseType,
                            ResponseMessage = latestResponse.ResponseMessage,
                            ResponseAt = latestResponse.ResponseAt,
                            IsActive = latestResponse.IsActive
                        };
                    }

                    return new ContactNotificationDto
                    {
                        Id = n.Id,
                        ParentId = n.ParentId,
                        ParentName = parents.GetValueOrDefault(n.ParentId, "不明"),
                        NurseryId = n.NurseryId,
                        ChildId = n.ChildId,
                        ChildName = childInfo?.Name ?? "不明",
                        ClassName = className,
                        NotificationType = n.NotificationType,
                        Ymd = n.Ymd,
                        ExpectedArrivalTime = n.ExpectedArrivalTime,
                        Reason = n.Reason,
                        AdditionalNotes = n.AdditionalNotes,
                        SubmittedAt = n.SubmittedAt,
                        Status = n.Status,
                        StaffResponse = n.StaffResponse,
                        AcknowledgedAt = n.AcknowledgedAt,
                        AcknowledgedBy = n.AcknowledgedBy,
                        AcknowledgedByAdminUser = n.AcknowledgedByAdminUser,
                        RespondedByStaffId = n.RespondedByStaffId,
                        RespondedByStaffName = n.RespondedByStaffId.HasValue
                            ? staff.GetValueOrDefault(n.RespondedByStaffId.Value, "不明")
                            : null,
                        AcknowledgedByAdminAt = n.AcknowledgedByAdminAt,
                        LatestResponse = latestResponseDto
                    };
                }).ToList();

                // キーワード検索（メモリ上でフィルタ）
                if (!string.IsNullOrEmpty(filter.SearchKeyword))
                {
                    var keyword = filter.SearchKeyword.ToLower();
                    result = result.Where(n =>
                        n.ParentName.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                        n.ChildName.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                        (n.AdditionalNotes != null && n.AdditionalNotes.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                    ).ToList();
                }

                // クラスフィルタ（メモリ上でフィルタ）
                if (!string.IsNullOrEmpty(filter.ClassId))
                {
                    result = result.Where(n => n.ClassName == filter.ClassId).ToList();
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "連絡通知一覧の取得中にエラーが発生しました。");
                throw;
            }
        }

        /// <summary>
        /// 連絡通知詳細を取得
        /// </summary>
        public async Task<ContactNotificationDto?> GetContactNotificationByIdAsync(int id)
        {
            try
            {
                var notification = await _context.AbsenceNotifications
                    .FirstOrDefaultAsync(n => n.Id == id);

                if (notification == null)
                {
                    return null;
                }

                // 関連情報を読み込み
                var parent = await _context.Parents.FindAsync(notification.ParentId);
                var child = await _context.Children
                    .FirstOrDefaultAsync(c => c.ChildId == notification.ChildId);

                string? className = null;
                if (child != null && !string.IsNullOrEmpty(child.ClassId))
                {
                    var classInfo = await _context.Classes.FindAsync(child.ClassId);
                    className = classInfo?.Name;
                }

                string? respondedByStaffName = null;
                if (notification.RespondedByStaffId.HasValue)
                {
                    var staff = await _context.Staff
                        .FirstOrDefaultAsync(s => s.StaffId == notification.RespondedByStaffId.Value);
                    respondedByStaffName = staff?.Name;
                }

                // 最新の返信を取得
                var latestResponse = await _context.AbsenceNotificationResponses
                    .Where(r => r.AbsenceNotificationId == id && r.IsActive)
                    .OrderByDescending(r => r.ResponseAt)
                    .FirstOrDefaultAsync();

                ContactNotificationResponseDto? latestResponseDto = null;
                if (latestResponse != null)
                {
                    var responseStaff = await _context.Staff
                        .FirstOrDefaultAsync(s => s.StaffId == latestResponse.StaffId);

                    latestResponseDto = new ContactNotificationResponseDto
                    {
                        Id = latestResponse.Id,
                        AbsenceNotificationId = latestResponse.AbsenceNotificationId,
                        NurseryId = latestResponse.NurseryId,
                        StaffId = latestResponse.StaffId,
                        StaffName = responseStaff?.Name ?? "不明",
                        ResponseType = latestResponse.ResponseType,
                        ResponseMessage = latestResponse.ResponseMessage,
                        ResponseAt = latestResponse.ResponseAt,
                        IsActive = latestResponse.IsActive
                    };
                }

                return new ContactNotificationDto
                {
                    Id = notification.Id,
                    ParentId = notification.ParentId,
                    ParentName = parent?.Name ?? "不明",
                    NurseryId = notification.NurseryId,
                    ChildId = notification.ChildId,
                    ChildName = child?.Name ?? "不明",
                    ClassName = className,
                    NotificationType = notification.NotificationType,
                    Ymd = notification.Ymd,
                    ExpectedArrivalTime = notification.ExpectedArrivalTime,
                    Reason = notification.Reason,
                    AdditionalNotes = notification.AdditionalNotes,
                    SubmittedAt = notification.SubmittedAt,
                    Status = notification.Status,
                    StaffResponse = notification.StaffResponse,
                    AcknowledgedAt = notification.AcknowledgedAt,
                    AcknowledgedBy = notification.AcknowledgedBy,
                    AcknowledgedByAdminUser = notification.AcknowledgedByAdminUser,
                    RespondedByStaffId = notification.RespondedByStaffId,
                    RespondedByStaffName = respondedByStaffName,
                    AcknowledgedByAdminAt = notification.AcknowledgedByAdminAt,
                    LatestResponse = latestResponseDto
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "連絡通知詳細の取得中にエラーが発生しました。ID: {Id}", id);
                throw;
            }
        }

        /// <summary>
        /// 連絡通知を確認済みにする
        /// </summary>
        public async Task<ContactNotificationDto> AcknowledgeNotificationAsync(int id, AcknowledgeNotificationRequestDto request)
        {
            try
            {
                var notification = await _context.AbsenceNotifications.FindAsync(id);
                if (notification == null)
                {
                    throw new KeyNotFoundException($"連絡通知が見つかりません。ID: {id}");
                }

                notification.AcknowledgedByAdminUser = true;
                notification.AcknowledgedByAdminAt = DateTime.UtcNow;
                notification.RespondedByStaffId = request.RespondedByStaffId;
                notification.StaffResponse = request.StaffResponse;
                notification.Status = "acknowledged";

                await _context.SaveChangesAsync();

                var result = await GetContactNotificationByIdAsync(id);
                return result!;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "連絡通知の確認中にエラーが発生しました。ID: {Id}", id);
                throw;
            }
        }

        /// <summary>
        /// 連絡通知に返信を追加
        /// </summary>
        public async Task<ContactNotificationResponseDto> CreateResponseAsync(int notificationId, CreateResponseRequestDto request)
        {
            try
            {
                var notification = await _context.AbsenceNotifications.FindAsync(notificationId);
                if (notification == null)
                {
                    throw new KeyNotFoundException($"連絡通知が見つかりません。ID: {notificationId}");
                }

                var response = new AbsenceNotificationResponse
                {
                    AbsenceNotificationId = notificationId,
                    NurseryId = notification.NurseryId,
                    StaffId = request.StaffId,
                    ResponseType = request.ResponseType,
                    ResponseMessage = request.ResponseMessage,
                    ResponseAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.AbsenceNotificationResponses.Add(response);

                // 通知ステータスを更新
                notification.Status = "acknowledged";
                notification.AcknowledgedByAdminUser = true;
                notification.AcknowledgedByAdminAt = DateTime.UtcNow;
                notification.RespondedByStaffId = request.StaffId;

                await _context.SaveChangesAsync();

                var staff = await _context.Staff
                    .FirstOrDefaultAsync(s => s.StaffId == request.StaffId);

                return new ContactNotificationResponseDto
                {
                    Id = response.Id,
                    AbsenceNotificationId = response.AbsenceNotificationId,
                    NurseryId = response.NurseryId,
                    StaffId = response.StaffId,
                    StaffName = staff?.Name ?? "不明",
                    ResponseType = response.ResponseType,
                    ResponseMessage = response.ResponseMessage,
                    ResponseAt = response.ResponseAt,
                    IsActive = response.IsActive
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "連絡通知への返信作成中にエラーが発生しました。NotificationID: {NotificationId}", notificationId);
                throw;
            }
        }

        /// <summary>
        /// 連絡通知を削除（論理削除）
        /// </summary>
        public async Task<bool> DeleteContactNotificationAsync(int id)
        {
            try
            {
                var notification = await _context.AbsenceNotifications.FindAsync(id);
                if (notification == null)
                {
                    return false;
                }

                _context.AbsenceNotifications.Remove(notification);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "連絡通知の削除中にエラーが発生しました。ID: {Id}", id);
                throw;
            }
        }

        /// <summary>
        /// 未確認の連絡通知数を取得
        /// </summary>
        public async Task<int> GetUnacknowledgedCountAsync()
        {
            try
            {
                return await _context.AbsenceNotifications
                    .Where(n => !n.AcknowledgedByAdminUser)
                    .CountAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "未確認連絡通知数の取得中にエラーが発生しました。");
                throw;
            }
        }
    }
}
