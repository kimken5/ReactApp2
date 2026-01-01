using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Services;

namespace ReactApp.Server.Controllers;

/// <summary>
/// デスクトップアプリ用献立管理コントローラー
/// </summary>
[ApiController]
[Route("api/desktop/menus")]
[Authorize]
public class DesktopMenuController : ControllerBase
{
    private readonly IDesktopMenuService _menuService;
    private readonly ILogger<DesktopMenuController> _logger;

    public DesktopMenuController(IDesktopMenuService menuService, ILogger<DesktopMenuController> logger)
    {
        _menuService = menuService;
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

    #region 献立マスター管理

    /// <summary>
    /// 献立マスター一覧取得
    /// </summary>
    [HttpGet("masters")]
    public async Task<ActionResult<ApiResponse<List<MenuMasterDto>>>> GetMenuMasters()
    {
        try
        {
            var nurseryId = GetNurseryId();
            var data = await _menuService.GetMenuMastersAsync(nurseryId);
            return Ok(new ApiResponse<List<MenuMasterDto>>
            {
                Success = true,
                Data = data
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "献立マスター一覧取得エラー");
            return StatusCode(500, new ApiResponse<List<MenuMasterDto>>
            {
                Success = false,
                Error = new ApiError { Message = "献立マスター一覧の取得に失敗しました" }
            });
        }
    }

    /// <summary>
    /// 献立マスター検索（オートコンプリート用）
    /// </summary>
    [HttpGet("masters/search")]
    public async Task<ActionResult<ApiResponse<List<MenuMasterSearchDto>>>> SearchMenuMasters([FromQuery] string query)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var data = await _menuService.SearchMenuMastersAsync(nurseryId, query);
            return Ok(new ApiResponse<List<MenuMasterSearchDto>>
            {
                Success = true,
                Data = data
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "献立マスター検索エラー: Query={Query}", query);
            return StatusCode(500, new ApiResponse<List<MenuMasterSearchDto>>
            {
                Success = false,
                Error = new ApiError { Message = "献立マスター検索に失敗しました" }
            });
        }
    }

    /// <summary>
    /// 献立マスター詳細取得
    /// </summary>
    [HttpGet("masters/{id}")]
    public async Task<ActionResult<ApiResponse<MenuMasterDto>>> GetMenuMaster(int id)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var data = await _menuService.GetMenuMasterByIdAsync(nurseryId, id);

            if (data == null)
            {
                return NotFound(new ApiResponse<MenuMasterDto>
                {
                    Success = false,
                    Error = new ApiError { Message = "献立マスターが見つかりません" }
                });
            }

            return Ok(new ApiResponse<MenuMasterDto>
            {
                Success = true,
                Data = data
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "献立マスター詳細取得エラー: Id={Id}", id);
            return StatusCode(500, new ApiResponse<MenuMasterDto>
            {
                Success = false,
                Error = new ApiError { Message = "献立マスター詳細の取得に失敗しました" }
            });
        }
    }

    /// <summary>
    /// 献立マスター作成
    /// </summary>
    [HttpPost("masters")]
    public async Task<ActionResult<ApiResponse<MenuMasterDto>>> CreateMenuMaster([FromBody] CreateMenuMasterDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var data = await _menuService.CreateMenuMasterAsync(nurseryId, dto);
            return Ok(new ApiResponse<MenuMasterDto>
            {
                Success = true,
                Data = data,
                Message = "献立マスターを作成しました"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "献立マスター作成エラー: MenuName={MenuName}", dto.MenuName);
            return StatusCode(500, new ApiResponse<MenuMasterDto>
            {
                Success = false,
                Error = new ApiError { Message = "献立マスターの作成に失敗しました" }
            });
        }
    }

    /// <summary>
    /// 献立マスター更新
    /// </summary>
    [HttpPut("masters/{id}")]
    public async Task<ActionResult<ApiResponse<MenuMasterDto>>> UpdateMenuMaster(int id, [FromBody] UpdateMenuMasterDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var data = await _menuService.UpdateMenuMasterAsync(nurseryId, id, dto);
            return Ok(new ApiResponse<MenuMasterDto>
            {
                Success = true,
                Data = data,
                Message = "献立マスターを更新しました"
            });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiResponse<MenuMasterDto>
            {
                Success = false,
                Error = new ApiError { Message = "献立マスターが見つかりません" }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "献立マスター更新エラー: Id={Id}", id);
            return StatusCode(500, new ApiResponse<MenuMasterDto>
            {
                Success = false,
                Error = new ApiError { Message = "献立マスターの更新に失敗しました" }
            });
        }
    }

    /// <summary>
    /// 献立マスター削除
    /// </summary>
    [HttpDelete("masters/{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteMenuMaster(int id)
    {
        try
        {
            var nurseryId = GetNurseryId();
            await _menuService.DeleteMenuMasterAsync(nurseryId, id);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "献立マスターを削除しました"
            });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError { Message = "献立マスターが見つかりません" }
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError { Message = ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "献立マスター削除エラー: Id={Id}", id);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError { Message = "献立マスターの削除に失敗しました" }
            });
        }
    }

    #endregion

    #region 日別献立管理

    /// <summary>
    /// 日別献立一覧取得（期間指定）
    /// </summary>
    [HttpGet("daily")]
    public async Task<ActionResult<ApiResponse<List<DailyMenuDto>>>> GetDailyMenus(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var data = await _menuService.GetDailyMenusAsync(nurseryId, startDate, endDate);
            return Ok(new ApiResponse<List<DailyMenuDto>>
            {
                Success = true,
                Data = data
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "日別献立一覧取得エラー: StartDate={StartDate}, EndDate={EndDate}", startDate, endDate);
            return StatusCode(500, new ApiResponse<List<DailyMenuDto>>
            {
                Success = false,
                Error = new ApiError { Message = "日別献立一覧の取得に失敗しました" }
            });
        }
    }

    /// <summary>
    /// 日別献立取得（日付指定）
    /// </summary>
    [HttpGet("daily/{date}")]
    public async Task<ActionResult<ApiResponse<List<DailyMenuDto>>>> GetDailyMenusByDate(DateTime date)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var data = await _menuService.GetDailyMenusByDateAsync(nurseryId, date);
            return Ok(new ApiResponse<List<DailyMenuDto>>
            {
                Success = true,
                Data = data
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "日別献立取得エラー: Date={Date}", date);
            return StatusCode(500, new ApiResponse<List<DailyMenuDto>>
            {
                Success = false,
                Error = new ApiError { Message = "日別献立の取得に失敗しました" }
            });
        }
    }

    /// <summary>
    /// 日別献立作成（個別）
    /// </summary>
    [HttpPost("daily")]
    public async Task<ActionResult<ApiResponse<DailyMenuDto>>> CreateDailyMenu([FromBody] CreateDailyMenuDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var data = await _menuService.CreateDailyMenuAsync(nurseryId, dto);
            return Ok(new ApiResponse<DailyMenuDto>
            {
                Success = true,
                Data = data,
                Message = "日別献立を登録しました"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "日別献立作成エラー: MenuDate={MenuDate}, MenuType={MenuType}", dto.MenuDate, dto.MenuType);
            return StatusCode(500, new ApiResponse<DailyMenuDto>
            {
                Success = false,
                Error = new ApiError { Message = "日別献立の登録に失敗しました" }
            });
        }
    }

    /// <summary>
    /// 日別献立更新
    /// </summary>
    [HttpPut("daily/{id}")]
    public async Task<ActionResult<ApiResponse<DailyMenuDto>>> UpdateDailyMenu(int id, [FromBody] UpdateDailyMenuDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var data = await _menuService.UpdateDailyMenuAsync(nurseryId, id, dto);
            return Ok(new ApiResponse<DailyMenuDto>
            {
                Success = true,
                Data = data,
                Message = "日別献立を更新しました"
            });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiResponse<DailyMenuDto>
            {
                Success = false,
                Error = new ApiError { Message = "日別献立が見つかりません" }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "日別献立更新エラー: Id={Id}", id);
            return StatusCode(500, new ApiResponse<DailyMenuDto>
            {
                Success = false,
                Error = new ApiError { Message = "日別献立の更新に失敗しました" }
            });
        }
    }

    /// <summary>
    /// 日別献立削除（個別）
    /// </summary>
    [HttpDelete("daily/{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteDailyMenu(int id)
    {
        try
        {
            var nurseryId = GetNurseryId();
            await _menuService.DeleteDailyMenuAsync(nurseryId, id);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "日別献立を削除しました"
            });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError { Message = "日別献立が見つかりません" }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "日別献立削除エラー: Id={Id}", id);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError { Message = "日別献立の削除に失敗しました" }
            });
        }
    }

    /// <summary>
    /// 日別献立一括作成
    /// </summary>
    [HttpPost("daily/bulk")]
    public async Task<ActionResult<ApiResponse<object>>> BulkCreateDailyMenus([FromBody] BulkCreateDailyMenusDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            await _menuService.BulkCreateDailyMenusAsync(nurseryId, dto);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "日別献立を登録しました"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "日別献立一括作成エラー: MenuDate={MenuDate}", dto.MenuDate);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError { Message = "日別献立の登録に失敗しました" }
            });
        }
    }

    /// <summary>
    /// 日別献立削除（日付指定）
    /// </summary>
    [HttpDelete("daily/date/{date}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteDailyMenusByDate(DateTime date)
    {
        try
        {
            var nurseryId = GetNurseryId();
            await _menuService.DeleteDailyMenusByDateAsync(nurseryId, date);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "日別献立を削除しました"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "日別献立削除エラー: Date={Date}", date);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError { Message = "日別献立の削除に失敗しました" }
            });
        }
    }

    #endregion
}
