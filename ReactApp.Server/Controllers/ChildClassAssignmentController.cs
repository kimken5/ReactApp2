using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs;
using ReactApp.Server.Services;

namespace ReactApp.Server.Controllers;

/// <summary>
/// 園児クラス割り当てAPIコントローラー
/// </summary>
[ApiController]
[Route("api/childclassassignment")]
[Authorize]
public class ChildClassAssignmentController : ControllerBase
{
    private readonly IChildClassAssignmentService _service;
    private readonly ILogger<ChildClassAssignmentController> _logger;

    public ChildClassAssignmentController(
        IChildClassAssignmentService service,
        ILogger<ChildClassAssignmentController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// 指定年度の全クラスと割り当て済み園児を取得
    /// </summary>
    [HttpGet("{nurseryId}/{academicYear}/classes")]
    public async Task<IActionResult> GetClassesWithChildren(int nurseryId, int academicYear)
    {
        try
        {
            var result = await _service.GetClassesWithChildren(nurseryId, academicYear);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get classes with children");
            return StatusCode(500, new { success = false, error = "クラス情報の取得に失敗しました" });
        }
    }

    /// <summary>
    /// 指定年度の割り当て可能な園児一覧を取得
    /// </summary>
    [HttpGet("{nurseryId}/{academicYear}/children")]
    public async Task<IActionResult> GetAvailableChildren(int nurseryId, int academicYear)
    {
        try
        {
            var result = await _service.GetAvailableChildren(nurseryId, academicYear);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get available children");
            return StatusCode(500, new { success = false, error = "園児情報の取得に失敗しました" });
        }
    }

    /// <summary>
    /// 園児をクラスに割り当て
    /// </summary>
    [HttpPost("assign")]
    public async Task<IActionResult> AssignChildToClass([FromBody] AssignChildToClassRequest request)
    {
        try
        {
            // TODO: 実際のユーザーIDを取得
            var userId = 1;
            var result = await _service.AssignChildToClass(request, userId);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to assign child to class");
            return StatusCode(500, new { success = false, error = "園児の割り当てに失敗しました" });
        }
    }

    /// <summary>
    /// 園児のクラス割り当てを解除
    /// </summary>
    [HttpDelete("{nurseryId}/{academicYear}/{childId}")]
    public async Task<IActionResult> UnassignChildFromClass(int nurseryId, int academicYear, int childId)
    {
        try
        {
            var result = await _service.UnassignChildFromClass(nurseryId, academicYear, childId);
            if (!result)
            {
                return NotFound(new { success = false, error = "割り当て情報が見つかりません" });
            }
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to unassign child from class");
            return StatusCode(500, new { success = false, error = "割り当て解除に失敗しました" });
        }
    }

    /// <summary>
    /// 一括で園児をクラスに割り当て
    /// </summary>
    [HttpPost("bulk-assign")]
    public async Task<IActionResult> BulkAssignChildren([FromBody] BulkAssignChildrenRequest request)
    {
        try
        {
            // TODO: 実際のユーザーIDを取得
            var userId = 1;
            var result = await _service.BulkAssignChildren(request, userId);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to bulk assign children");
            return StatusCode(500, new { success = false, error = "一括割り当てに失敗しました" });
        }
    }
}
