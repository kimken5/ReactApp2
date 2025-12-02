using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs;
using ReactApp.Server.Services;

namespace ReactApp.Server.Controllers
{
    /// <summary>
    /// スタッフクラス割り当てAPI
    /// </summary>
    [ApiController]
    [Route("api/staff-class-assignments")]
    public class StaffClassAssignmentController : ControllerBase
    {
        private readonly IStaffClassAssignmentService _service;
        private readonly ILogger<StaffClassAssignmentController> _logger;

        public StaffClassAssignmentController(
            IStaffClassAssignmentService service,
            ILogger<StaffClassAssignmentController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// クラス別担任割り当て一覧を取得
        /// </summary>
        [HttpGet("{nurseryId}/{academicYear}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<ClassStaffAssignmentDto>>> GetClassStaffAssignments(
            int nurseryId,
            int academicYear)
        {
            try
            {
                var result = await _service.GetClassStaffAssignmentsAsync(nurseryId, academicYear);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラス別担任割り当て一覧の取得エラー: NurseryId={NurseryId}, Year={Year}",
                    nurseryId, academicYear);
                return StatusCode(500, new { error = "クラス別担任割り当て一覧の取得に失敗しました。" });
            }
        }

        /// <summary>
        /// 利用可能なスタッフ一覧を取得
        /// </summary>
        [HttpGet("{nurseryId}/{academicYear}/available-staff")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<AvailableStaffDto>>> GetAvailableStaff(
            int nurseryId,
            int academicYear)
        {
            try
            {
                var result = await _service.GetAvailableStaffAsync(nurseryId, academicYear);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "利用可能なスタッフ一覧の取得エラー: NurseryId={NurseryId}, Year={Year}",
                    nurseryId, academicYear);
                return StatusCode(500, new { error = "利用可能なスタッフ一覧の取得に失敗しました。" });
            }
        }

        /// <summary>
        /// スタッフをクラスに割り当て
        /// </summary>
        [HttpPost("assign")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<StaffClassAssignmentDto>> AssignStaffToClass(
            [FromBody] AssignStaffToClassRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _service.AssignStaffToClassAsync(request);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "スタッフのクラス割り当て失敗: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "スタッフのクラス割り当てエラー");
                return StatusCode(500, new { error = "スタッフのクラス割り当てに失敗しました。" });
            }
        }

        /// <summary>
        /// スタッフのクラス割り当てを解除
        /// </summary>
        [HttpPost("unassign")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> UnassignStaffFromClass(
            [FromBody] UnassignStaffFromClassRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                await _service.UnassignStaffFromClassAsync(request);
                return Ok(new { message = "スタッフのクラス割り当てを解除しました。" });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "スタッフのクラス割り当て解除失敗: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "スタッフのクラス割り当て解除エラー");
                return StatusCode(500, new { error = "スタッフのクラス割り当て解除に失敗しました。" });
            }
        }

        /// <summary>
        /// スタッフの割り当て役割を更新
        /// </summary>
        [HttpPut("{nurseryId}/{academicYear}/{staffId}/{classId}/role")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<StaffClassAssignmentDto>> UpdateAssignmentRole(
            int nurseryId,
            int academicYear,
            int staffId,
            string classId,
            [FromBody] UpdateAssignmentRoleRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _service.UpdateAssignmentRoleAsync(
                    nurseryId,
                    academicYear,
                    staffId,
                    classId,
                    request.AssignmentRole,
                    request.Notes);

                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "スタッフの割り当て役割更新失敗: {Message}", ex.Message);
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "スタッフの割り当て役割更新エラー");
                return StatusCode(500, new { error = "スタッフの割り当て役割更新に失敗しました。" });
            }
        }
    }

    /// <summary>
    /// 割り当て役割更新リクエスト
    /// </summary>
    public class UpdateAssignmentRoleRequest
    {
        public string? AssignmentRole { get; set; }
        public string? Notes { get; set; }
    }
}
