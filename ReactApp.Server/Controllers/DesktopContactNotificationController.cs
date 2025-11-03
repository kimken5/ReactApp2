using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Services;

namespace ReactApp.Server.Controllers
{
    /// <summary>
    /// デスクトップアプリ用連絡通知管理コントローラー
    /// 保護者からの欠席・遅刻・お迎え連絡の確認と返信機能を提供
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/desktop/contact-notifications")]
    public class DesktopContactNotificationController : ControllerBase
    {
        private readonly IDesktopContactNotificationService _notificationService;
        private readonly ILogger<DesktopContactNotificationController> _logger;

        public DesktopContactNotificationController(
            IDesktopContactNotificationService notificationService,
            ILogger<DesktopContactNotificationController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        /// <summary>
        /// 連絡通知一覧を取得
        /// GET /api/desktop/contact-notifications
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<ContactNotificationDto>>>> GetContactNotifications([FromQuery] ContactNotificationFilterDto filter)
        {
            try
            {
                var notifications = await _notificationService.GetContactNotificationsAsync(filter);

                return Ok(new ApiResponse<List<ContactNotificationDto>>
                {
                    Success = true,
                    Data = notifications
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "連絡通知一覧の取得中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<List<ContactNotificationDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 連絡通知詳細を取得
        /// GET /api/desktop/contact-notifications/{notificationId}
        /// </summary>
        [HttpGet("{notificationId}")]
        public async Task<ActionResult<ApiResponse<ContactNotificationDto>>> GetContactNotificationById(int notificationId)
        {
            try
            {
                var notification = await _notificationService.GetContactNotificationByIdAsync(notificationId);

                if (notification == null)
                {
                    return NotFound(new ApiResponse<ContactNotificationDto>
                    {
                        Success = false,
                        Error = new ApiError { Code = "NOTIFICATION_NOT_FOUND", Message = "連絡通知が見つかりません" }
                    });
                }

                return Ok(new ApiResponse<ContactNotificationDto>
                {
                    Success = true,
                    Data = notification
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "連絡通知詳細の取得中にエラーが発生しました: NotificationId={NotificationId}", notificationId);
                return StatusCode(500, new ApiResponse<ContactNotificationDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 連絡通知を確認済みにする
        /// PUT /api/desktop/contact-notifications/{notificationId}/acknowledge
        /// </summary>
        [HttpPut("{notificationId}/acknowledge")]
        public async Task<ActionResult<ApiResponse<ContactNotificationDto>>> AcknowledgeNotification(
            int notificationId,
            [FromBody] AcknowledgeNotificationRequestDto request)
        {
            try
            {
                var notification = await _notificationService.AcknowledgeNotificationAsync(notificationId, request);

                return Ok(new ApiResponse<ContactNotificationDto>
                {
                    Success = true,
                    Data = notification
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<ContactNotificationDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "NOTIFICATION_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "連絡通知の確認中にエラーが発生しました: NotificationId={NotificationId}", notificationId);
                return StatusCode(500, new ApiResponse<ContactNotificationDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 連絡通知に返信を追加
        /// POST /api/desktop/contact-notifications/{notificationId}/responses
        /// </summary>
        [HttpPost("{notificationId}/responses")]
        public async Task<ActionResult<ApiResponse<ContactNotificationResponseDto>>> CreateResponse(
            int notificationId,
            [FromBody] CreateResponseRequestDto request)
        {
            try
            {
                var response = await _notificationService.CreateResponseAsync(notificationId, request);

                return Ok(new ApiResponse<ContactNotificationResponseDto>
                {
                    Success = true,
                    Data = response
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<ContactNotificationResponseDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "NOTIFICATION_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "連絡通知への返信作成中にエラーが発生しました: NotificationId={NotificationId}", notificationId);
                return StatusCode(500, new ApiResponse<ContactNotificationResponseDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 連絡通知を削除（論理削除）
        /// DELETE /api/desktop/contact-notifications/{notificationId}
        /// </summary>
        [HttpDelete("{notificationId}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteContactNotification(int notificationId)
        {
            try
            {
                var result = await _notificationService.DeleteContactNotificationAsync(notificationId);

                if (!result)
                {
                    return NotFound(new ApiResponse<bool>
                    {
                        Success = false,
                        Error = new ApiError { Code = "NOTIFICATION_NOT_FOUND", Message = "連絡通知が見つかりません" }
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "連絡通知を削除しました"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "連絡通知の削除中にエラーが発生しました: NotificationId={NotificationId}", notificationId);
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 未確認の連絡通知数を取得
        /// GET /api/desktop/contact-notifications/unacknowledged/count
        /// </summary>
        [HttpGet("unacknowledged/count")]
        public async Task<ActionResult<ApiResponse<int>>> GetUnacknowledgedCount()
        {
            try
            {
                var count = await _notificationService.GetUnacknowledgedCountAsync();

                return Ok(new ApiResponse<int>
                {
                    Success = true,
                    Data = count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "未確認連絡通知数の取得中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<int>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }
    }
}
