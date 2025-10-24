using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs;
using ReactApp.Server.Services;
using System.Security.Claims;
using PhotoDto = ReactApp.Server.DTOs.Desktop.PhotoDto;
using PhotoFilterDto = ReactApp.Server.DTOs.Desktop.PhotoFilterDto;
using UploadPhotoRequestDto = ReactApp.Server.DTOs.Desktop.UploadPhotoRequestDto;
using UpdatePhotoRequestDto = ReactApp.Server.DTOs.Desktop.UpdatePhotoRequestDto;

namespace ReactApp.Server.Controllers
{
    /// <summary>
    /// デスクトップアプリ用写真管理コントローラー
    /// 写真のCRUD操作、フィルタ検索、園児・クラス別取得機能を提供
    /// </summary>
    [ApiController]
    [Route("api/desktop/photos")]
    [Authorize]
    public class DesktopPhotoController : ControllerBase
    {
        private readonly IDesktopPhotoService _photoService;
        private readonly ILogger<DesktopPhotoController> _logger;

        public DesktopPhotoController(
            IDesktopPhotoService photoService,
            ILogger<DesktopPhotoController> logger)
        {
            _photoService = photoService;
            _logger = logger;
        }

        /// <summary>
        /// 写真一覧取得（フィルタ対応）
        /// </summary>
        /// <param name="filter">フィルタ条件</param>
        /// <returns>写真一覧</returns>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<PhotoDto>>>> GetPhotos([FromQuery] PhotoFilterDto filter)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var photos = await _photoService.GetPhotosAsync(nurseryId, filter);

                return Ok(new ApiResponse<List<PhotoDto>>
                {
                    Success = true,
                    Data = photos,
                    Message = "写真一覧取得成功"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "写真一覧取得エラー");
                return StatusCode(500, new ApiResponse<List<PhotoDto>>
                {
                    Success = false,
                    Message = "写真一覧取得に失敗しました"
                });
            }
        }

        /// <summary>
        /// 写真詳細取得
        /// </summary>
        /// <param name="id">写真ID</param>
        /// <returns>写真詳細</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<PhotoDto>>> GetPhoto(int id)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var photo = await _photoService.GetPhotoByIdAsync(nurseryId, id);

                if (photo == null)
                {
                    return NotFound(new ApiResponse<PhotoDto>
                    {
                        Success = false,
                        Message = "写真が見つかりません"
                    });
                }

                return Ok(new ApiResponse<PhotoDto>
                {
                    Success = true,
                    Data = photo,
                    Message = "写真詳細取得成功"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "写真詳細取得エラー: PhotoId={PhotoId}", id);
                return StatusCode(500, new ApiResponse<PhotoDto>
                {
                    Success = false,
                    Message = "写真詳細取得に失敗しました"
                });
            }
        }

        /// <summary>
        /// 写真アップロード
        /// </summary>
        /// <param name="request">アップロードリクエスト</param>
        /// <returns>アップロードされた写真情報</returns>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<PhotoDto>>> UploadPhoto([FromForm] UploadPhotoRequestDto request)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var photo = await _photoService.UploadPhotoAsync(nurseryId, request);

                return Ok(new ApiResponse<PhotoDto>
                {
                    Success = true,
                    Data = photo,
                    Message = "写真アップロード成功"
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "写真アップロードエラー（無効な操作）");
                return BadRequest(new ApiResponse<PhotoDto>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "写真アップロードエラー");
                return StatusCode(500, new ApiResponse<PhotoDto>
                {
                    Success = false,
                    Message = "写真アップロードに失敗しました"
                });
            }
        }

        /// <summary>
        /// 写真メタデータ更新
        /// </summary>
        /// <param name="id">写真ID</param>
        /// <param name="request">更新リクエスト</param>
        /// <returns>更新後の写真情報</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<PhotoDto>>> UpdatePhoto(int id, [FromBody] UpdatePhotoRequestDto request)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var photo = await _photoService.UpdatePhotoAsync(nurseryId, id, request);

                return Ok(new ApiResponse<PhotoDto>
                {
                    Success = true,
                    Data = photo,
                    Message = "写真更新成功"
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "写真更新エラー（無効な操作）: PhotoId={PhotoId}", id);
                return BadRequest(new ApiResponse<PhotoDto>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "写真更新エラー: PhotoId={PhotoId}", id);
                return StatusCode(500, new ApiResponse<PhotoDto>
                {
                    Success = false,
                    Message = "写真更新に失敗しました"
                });
            }
        }

        /// <summary>
        /// 写真削除
        /// </summary>
        /// <param name="id">写真ID</param>
        /// <returns>削除結果</returns>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeletePhoto(int id)
        {
            try
            {
                var nurseryId = GetNurseryId();
                await _photoService.DeletePhotoAsync(nurseryId, id);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "写真削除成功"
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "写真削除エラー（無効な操作）: PhotoId={PhotoId}", id);
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "写真削除エラー: PhotoId={PhotoId}", id);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "写真削除に失敗しました"
                });
            }
        }

        /// <summary>
        /// 園児別写真一覧取得
        /// </summary>
        /// <param name="childId">園児ID</param>
        /// <returns>写真一覧</returns>
        [HttpGet("child/{childId}")]
        public async Task<ActionResult<ApiResponse<List<PhotoDto>>>> GetPhotosByChild(int childId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var photos = await _photoService.GetPhotosByChildAsync(nurseryId, childId);

                return Ok(new ApiResponse<List<PhotoDto>>
                {
                    Success = true,
                    Data = photos,
                    Message = "園児別写真一覧取得成功"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "園児別写真一覧取得エラー: ChildId={ChildId}", childId);
                return StatusCode(500, new ApiResponse<List<PhotoDto>>
                {
                    Success = false,
                    Message = "園児別写真一覧取得に失敗しました"
                });
            }
        }

        /// <summary>
        /// クラス別写真一覧取得
        /// </summary>
        /// <param name="classId">クラスID</param>
        /// <returns>写真一覧</returns>
        [HttpGet("class/{classId}")]
        public async Task<ActionResult<ApiResponse<List<PhotoDto>>>> GetPhotosByClass(string classId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var photos = await _photoService.GetPhotosByClassAsync(nurseryId, classId);

                return Ok(new ApiResponse<List<PhotoDto>>
                {
                    Success = true,
                    Data = photos,
                    Message = "クラス別写真一覧取得成功"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラス別写真一覧取得エラー: ClassId={ClassId}", classId);
                return StatusCode(500, new ApiResponse<List<PhotoDto>>
                {
                    Success = false,
                    Message = "クラス別写真一覧取得に失敗しました"
                });
            }
        }

        /// <summary>
        /// JWTクレームから保育園IDを取得
        /// </summary>
        private int GetNurseryId()
        {
            var nurseryIdClaim = User.FindFirst("NurseryId")?.Value;
            if (string.IsNullOrEmpty(nurseryIdClaim) || !int.TryParse(nurseryIdClaim, out var nurseryId))
            {
                throw new UnauthorizedAccessException("保育園IDが見つかりません");
            }
            return nurseryId;
        }
    }
}
