using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs;
using ReactApp.Server.Services;

namespace ReactApp.Server.Controllers
{
    /// <summary>
    /// デスクトップアプリ用お知らせ管理コントローラー
    /// お知らせのCRUD操作、公開、配信状況確認機能を提供
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/desktop/announcements")]
    public class DesktopAnnouncementController : ControllerBase
    {
        private readonly IDesktopAnnouncementService _announcementService;
        private readonly ILogger<DesktopAnnouncementController> _logger;

        public DesktopAnnouncementController(
            IDesktopAnnouncementService announcementService,
            ILogger<DesktopAnnouncementController> logger)
        {
            _announcementService = announcementService;
            _logger = logger;
        }

        private int GetNurseryId()
        {
            var nurseryIdClaim = User.FindFirst("NurseryId")?.Value;
            if (string.IsNullOrEmpty(nurseryIdClaim) || !int.TryParse(nurseryIdClaim, out var nurseryId))
            {
                throw new UnauthorizedAccessException("保育園IDが取得できません");
            }
            return nurseryId;
        }

        private int GetStaffId()
        {
            var staffIdClaim = User.FindFirst("StaffId")?.Value;
            if (string.IsNullOrEmpty(staffIdClaim) || !int.TryParse(staffIdClaim, out var staffId))
            {
                throw new UnauthorizedAccessException("スタッフIDが取得できません");
            }
            return staffId;
        }

        /// <summary>
        /// お知らせ一覧を取得
        /// GET /api/desktop/announcements
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<AnnouncementDto>>>> GetAnnouncements([FromQuery] AnnouncementFilterDto? filter)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var announcements = await _announcementService.GetAnnouncementsAsync(nurseryId, filter);

                return Ok(new ApiResponse<List<AnnouncementDto>>
                {
                    Success = true,
                    Data = announcements
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "お知らせ一覧の取得中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<List<AnnouncementDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// お知らせ詳細を取得
        /// GET /api/desktop/announcements/{announcementId}
        /// </summary>
        [HttpGet("{announcementId}")]
        public async Task<ActionResult<ApiResponse<AnnouncementDto>>> GetAnnouncementById(int announcementId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var announcement = await _announcementService.GetAnnouncementByIdAsync(nurseryId, announcementId);

                if (announcement == null)
                {
                    return NotFound(new ApiResponse<AnnouncementDto>
                    {
                        Success = false,
                        Error = new ApiError { Code = "ANNOUNCEMENT_NOT_FOUND", Message = "お知らせが見つかりません" }
                    });
                }

                return Ok(new ApiResponse<AnnouncementDto>
                {
                    Success = true,
                    Data = announcement
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "お知らせ詳細の取得中にエラーが発生しました: AnnouncementId={AnnouncementId}", announcementId);
                return StatusCode(500, new ApiResponse<AnnouncementDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// お知らせを作成
        /// POST /api/desktop/announcements
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<AnnouncementDto>>> CreateAnnouncement([FromBody] CreateAnnouncementDto request)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var staffId = GetStaffId();
                var announcement = await _announcementService.CreateAnnouncementAsync(nurseryId, staffId, request);

                return CreatedAtAction(
                    nameof(GetAnnouncementById),
                    new { announcementId = announcement.Id },
                    new ApiResponse<AnnouncementDto>
                    {
                        Success = true,
                        Data = announcement
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "お知らせの作成中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<AnnouncementDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// お知らせを更新
        /// PUT /api/desktop/announcements/{announcementId}
        /// </summary>
        [HttpPut("{announcementId}")]
        public async Task<ActionResult<ApiResponse<AnnouncementDto>>> UpdateAnnouncement(int announcementId, [FromBody] UpdateAnnouncementDto request)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var announcement = await _announcementService.UpdateAnnouncementAsync(nurseryId, announcementId, request);

                return Ok(new ApiResponse<AnnouncementDto>
                {
                    Success = true,
                    Data = announcement
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<AnnouncementDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "ANNOUNCEMENT_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "お知らせの更新中にエラーが発生しました: AnnouncementId={AnnouncementId}", announcementId);
                return StatusCode(500, new ApiResponse<AnnouncementDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// お知らせを削除
        /// DELETE /api/desktop/announcements/{announcementId}
        /// </summary>
        [HttpDelete("{announcementId}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteAnnouncement(int announcementId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                await _announcementService.DeleteAnnouncementAsync(nurseryId, announcementId);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "お知らせを削除しました"
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError { Code = "ANNOUNCEMENT_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "お知らせの削除中にエラーが発生しました: AnnouncementId={AnnouncementId}", announcementId);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// お知らせを即時公開
        /// POST /api/desktop/announcements/{announcementId}/publish
        /// </summary>
        [HttpPost("{announcementId}/publish")]
        public async Task<ActionResult<ApiResponse<AnnouncementDto>>> PublishAnnouncement(int announcementId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var announcement = await _announcementService.PublishAnnouncementAsync(nurseryId, announcementId);

                return Ok(new ApiResponse<AnnouncementDto>
                {
                    Success = true,
                    Data = announcement
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<AnnouncementDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "ANNOUNCEMENT_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "お知らせの公開中にエラーが発生しました: AnnouncementId={AnnouncementId}", announcementId);
                return StatusCode(500, new ApiResponse<AnnouncementDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 未読保護者リストを取得
        /// GET /api/desktop/announcements/{announcementId}/unread-parents
        /// </summary>
        [HttpGet("{announcementId}/unread-parents")]
        public async Task<ActionResult<ApiResponse<List<UnreadParentDto>>>> GetUnreadParents(int announcementId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var unreadParents = await _announcementService.GetUnreadParentsAsync(nurseryId, announcementId);

                return Ok(new ApiResponse<List<UnreadParentDto>>
                {
                    Success = true,
                    Data = unreadParents
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<List<UnreadParentDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "ANNOUNCEMENT_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "未読保護者リストの取得中にエラーが発生しました: AnnouncementId={AnnouncementId}", announcementId);
                return StatusCode(500, new ApiResponse<List<UnreadParentDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 既読保護者リストを取得
        /// GET /api/desktop/announcements/{announcementId}/read-parents
        /// </summary>
        [HttpGet("{announcementId}/read-parents")]
        public async Task<ActionResult<ApiResponse<List<ReadParentDto>>>> GetReadParents(int announcementId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var readParents = await _announcementService.GetReadParentsAsync(nurseryId, announcementId);

                return Ok(new ApiResponse<List<ReadParentDto>>
                {
                    Success = true,
                    Data = readParents
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<List<ReadParentDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "ANNOUNCEMENT_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "既読保護者リストの取得中にエラーが発生しました: AnnouncementId={AnnouncementId}", announcementId);
                return StatusCode(500, new ApiResponse<List<ReadParentDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }
    }
}
