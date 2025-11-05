using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Services;

namespace ReactApp.Server.Controllers
{
    /// <summary>
    /// デスクトップアプリ用マスタ管理コントローラー
    /// 保育園情報、クラス、園児、保護者、職員の管理
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/desktop/master")]
    public class DesktopMasterController : ControllerBase
    {
        private readonly IDesktopMasterService _masterService;
        private readonly ILogger<DesktopMasterController> _logger;

        public DesktopMasterController(
            IDesktopMasterService masterService,
            ILogger<DesktopMasterController> logger)
        {
            _masterService = masterService;
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

        #region 保育園情報管理

        /// <summary>
        /// 保育園情報取得
        /// GET /api/desktop/master/nursery
        /// </summary>
        [HttpGet("nursery")]
        public async Task<ActionResult<ApiResponse<NurseryDto>>> GetNursery()
        {
            try
            {
                var nurseryId = GetNurseryId();
                var nursery = await _masterService.GetNurseryAsync(nurseryId);

                if (nursery == null)
                {
                    return NotFound(new ApiResponse<NurseryDto>
                    {
                        Success = false,
                        Error = new ApiError { Code = "NURSERY_NOT_FOUND", Message = "保育園情報が見つかりません" }
                    });
                }

                return Ok(new ApiResponse<NurseryDto> { Success = true, Data = nursery });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保育園情報の取得中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<NurseryDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 保育園情報更新
        /// PUT /api/desktop/master/nursery
        /// </summary>
        [HttpPut("nursery")]
        public async Task<ActionResult<ApiResponse<NurseryDto>>> UpdateNursery([FromBody] UpdateNurseryRequestDto request)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var nursery = await _masterService.UpdateNurseryAsync(nurseryId, request);

                return Ok(new ApiResponse<NurseryDto> { Success = true, Data = nursery });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<NurseryDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "NURSERY_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保育園情報の更新中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<NurseryDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        #endregion

        #region クラス管理

        /// <summary>
        /// クラス一覧取得
        /// GET /api/desktop/master/classes
        /// </summary>
        [HttpGet("classes")]
        public async Task<ActionResult<ApiResponse<List<ClassDto>>>> GetClasses([FromQuery] ClassFilterDto filter)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var classes = await _masterService.GetClassesAsync(nurseryId, filter);

                return Ok(new ApiResponse<List<ClassDto>> { Success = true, Data = classes });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラス一覧の取得中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<List<ClassDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// クラス詳細取得
        /// GET /api/desktop/master/classes/{classId}
        /// </summary>
        [HttpGet("classes/{classId}")]
        public async Task<ActionResult<ApiResponse<ClassDto>>> GetClass(string classId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var cls = await _masterService.GetClassByIdAsync(nurseryId, classId);

                if (cls == null)
                {
                    return NotFound(new ApiResponse<ClassDto>
                    {
                        Success = false,
                        Error = new ApiError { Code = "CLASS_NOT_FOUND", Message = "クラスが見つかりません" }
                    });
                }

                return Ok(new ApiResponse<ClassDto> { Success = true, Data = cls });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラス詳細の取得中にエラーが発生しました: ClassId={ClassId}", classId);
                return StatusCode(500, new ApiResponse<ClassDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// クラス作成
        /// POST /api/desktop/master/classes
        /// </summary>
        [HttpPost("classes")]
        public async Task<ActionResult<ApiResponse<ClassDto>>> CreateClass([FromBody] CreateClassRequestDto request)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var cls = await _masterService.CreateClassAsync(nurseryId, request);

                return CreatedAtAction(nameof(GetClass), new { classId = cls.ClassId }, new ApiResponse<ClassDto> { Success = true, Data = cls });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new ApiResponse<ClassDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "CLASS_ALREADY_EXISTS", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラスの作成中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<ClassDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// クラス更新
        /// PUT /api/desktop/master/classes/{classId}
        /// </summary>
        [HttpPut("classes/{classId}")]
        public async Task<ActionResult<ApiResponse<ClassDto>>> UpdateClass(string classId, [FromBody] UpdateClassRequestDto request)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var cls = await _masterService.UpdateClassAsync(nurseryId, classId, request);

                return Ok(new ApiResponse<ClassDto> { Success = true, Data = cls });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<ClassDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "CLASS_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラスの更新中にエラーが発生しました: ClassId={ClassId}", classId);
                return StatusCode(500, new ApiResponse<ClassDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// クラス削除
        /// DELETE /api/desktop/master/classes/{classId}
        /// </summary>
        [HttpDelete("classes/{classId}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteClass(string classId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                await _masterService.DeleteClassAsync(nurseryId, classId);

                return Ok(new ApiResponse<object> { Success = true, Message = "クラスを削除しました" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError { Code = "CLASS_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError { Code = "CLASS_HAS_CHILDREN", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラスの削除中にエラーが発生しました: ClassId={ClassId}", classId);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        #endregion

        #region 園児管理

        /// <summary>
        /// 園児一覧取得
        /// GET /api/desktop/master/children
        /// </summary>
        [HttpGet("children")]
        public async Task<ActionResult<ApiResponse<List<ChildDto>>>> GetChildren([FromQuery] ChildFilterDto filter)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var children = await _masterService.GetChildrenAsync(nurseryId, filter);

                return Ok(new ApiResponse<List<ChildDto>> { Success = true, Data = children });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "園児一覧の取得中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<List<ChildDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 園児詳細取得
        /// GET /api/desktop/master/children/{childId}
        /// </summary>
        [HttpGet("children/{childId}")]
        public async Task<ActionResult<ApiResponse<ChildDto>>> GetChild(int childId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var child = await _masterService.GetChildByIdAsync(nurseryId, childId);

                if (child == null)
                {
                    return NotFound(new ApiResponse<ChildDto>
                    {
                        Success = false,
                        Error = new ApiError { Code = "CHILD_NOT_FOUND", Message = "園児が見つかりません" }
                    });
                }

                return Ok(new ApiResponse<ChildDto> { Success = true, Data = child });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "園児詳細の取得中にエラーが発生しました: ChildId={ChildId}", childId);
                return StatusCode(500, new ApiResponse<ChildDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 園児作成
        /// POST /api/desktop/master/children
        /// </summary>
        [HttpPost("children")]
        public async Task<ActionResult<ApiResponse<ChildDto>>> CreateChild([FromBody] CreateChildRequestDto request)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var child = await _masterService.CreateChildAsync(nurseryId, request);

                return CreatedAtAction(nameof(GetChild), new { childId = child.ChildId }, new ApiResponse<ChildDto> { Success = true, Data = child });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "園児の作成中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<ChildDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 園児更新
        /// PUT /api/desktop/master/children/{childId}
        /// </summary>
        [HttpPut("children/{childId}")]
        public async Task<ActionResult<ApiResponse<ChildDto>>> UpdateChild(int childId, [FromBody] UpdateChildRequestDto request)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var child = await _masterService.UpdateChildAsync(nurseryId, childId, request);

                return Ok(new ApiResponse<ChildDto> { Success = true, Data = child });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<ChildDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "CHILD_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "園児の更新中にエラーが発生しました: ChildId={ChildId}", childId);
                return StatusCode(500, new ApiResponse<ChildDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 園児削除
        /// DELETE /api/desktop/master/children/{childId}
        /// </summary>
        [HttpDelete("children/{childId}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteChild(int childId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                await _masterService.DeleteChildAsync(nurseryId, childId);

                return Ok(new ApiResponse<object> { Success = true, Message = "園児を削除しました" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError { Code = "CHILD_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "園児の削除中にエラーが発生しました: ChildId={ChildId}", childId);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        #endregion

        #region 保護者管理

        /// <summary>
        /// 保護者一覧取得
        /// GET /api/desktop/master/parents
        /// </summary>
        [HttpGet("parents")]
        public async Task<ActionResult<ApiResponse<List<ParentDto>>>> GetParents([FromQuery] ParentFilterDto filter)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var parents = await _masterService.GetParentsAsync(nurseryId, filter);

                return Ok(new ApiResponse<List<ParentDto>> { Success = true, Data = parents });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保護者一覧の取得中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<List<ParentDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 保護者詳細取得
        /// GET /api/desktop/master/parents/{parentId}
        /// </summary>
        [HttpGet("parents/{parentId}")]
        public async Task<ActionResult<ApiResponse<ParentDto>>> GetParent(int parentId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var parent = await _masterService.GetParentByIdAsync(nurseryId, parentId);

                if (parent == null)
                {
                    return NotFound(new ApiResponse<ParentDto>
                    {
                        Success = false,
                        Error = new ApiError { Code = "PARENT_NOT_FOUND", Message = "保護者が見つかりません" }
                    });
                }

                return Ok(new ApiResponse<ParentDto> { Success = true, Data = parent });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保護者詳細の取得中にエラーが発生しました: ParentId={ParentId}", parentId);
                return StatusCode(500, new ApiResponse<ParentDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 保護者作成
        /// POST /api/desktop/master/parents
        /// </summary>
        [HttpPost("parents")]
        public async Task<ActionResult<ApiResponse<ParentDto>>> CreateParent([FromBody] CreateParentRequestDto request)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var parent = await _masterService.CreateParentAsync(nurseryId, request);

                return CreatedAtAction(nameof(GetParent), new { parentId = parent.Id }, new ApiResponse<ParentDto> { Success = true, Data = parent });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保護者の作成中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<ParentDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 保護者更新
        /// PUT /api/desktop/master/parents/{parentId}
        /// </summary>
        [HttpPut("parents/{parentId}")]
        public async Task<ActionResult<ApiResponse<ParentDto>>> UpdateParent(int parentId, [FromBody] UpdateParentRequestDto request)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var parent = await _masterService.UpdateParentAsync(nurseryId, parentId, request);

                return Ok(new ApiResponse<ParentDto> { Success = true, Data = parent });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<ParentDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "PARENT_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保護者の更新中にエラーが発生しました: ParentId={ParentId}", parentId);
                return StatusCode(500, new ApiResponse<ParentDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 保護者削除
        /// DELETE /api/desktop/master/parents/{parentId}
        /// </summary>
        [HttpDelete("parents/{parentId}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteParent(int parentId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                await _masterService.DeleteParentAsync(nurseryId, parentId);

                return Ok(new ApiResponse<object> { Success = true, Message = "保護者を削除しました" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError { Code = "PARENT_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保護者の削除中にエラーが発生しました: ParentId={ParentId}", parentId);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        #endregion

        #region クラス構成管理

        /// <summary>
        /// クラス構成取得
        /// GET /api/desktop/master/classes/{classId}/composition
        /// </summary>
        [HttpGet("classes/{classId}/composition")]
        public async Task<ActionResult<ApiResponse<ClassCompositionDto>>> GetClassComposition(string classId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var composition = await _masterService.GetClassCompositionAsync(nurseryId, classId);

                return Ok(new ApiResponse<ClassCompositionDto> { Success = true, Data = composition });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<ClassCompositionDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "CLASS_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラス構成の取得中にエラーが発生しました: ClassId={ClassId}", classId);
                return StatusCode(500, new ApiResponse<ClassCompositionDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// クラス構成更新
        /// PUT /api/desktop/master/classes/{classId}/composition
        /// </summary>
        [HttpPut("classes/{classId}/composition")]
        public async Task<ActionResult<ApiResponse<ClassCompositionDto>>> UpdateClassComposition(
            string classId,
            [FromBody] UpdateClassCompositionRequestDto request)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var composition = await _masterService.UpdateClassCompositionAsync(nurseryId, classId, request);

                return Ok(new ApiResponse<ClassCompositionDto> { Success = true, Data = composition });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<ClassCompositionDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "CLASS_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラス構成の更新中にエラーが発生しました: ClassId={ClassId}", classId);
                return StatusCode(500, new ApiResponse<ClassCompositionDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        #endregion

        #region 職員管理

        /// <summary>
        /// 職員一覧取得
        /// GET /api/desktop/master/staff
        /// </summary>
        [HttpGet("staff")]
        public async Task<ActionResult<ApiResponse<List<StaffDto>>>> GetStaff([FromQuery] StaffFilterDto filter)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var staff = await _masterService.GetStaffAsync(nurseryId, filter);

                return Ok(new ApiResponse<List<StaffDto>> { Success = true, Data = staff });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "職員一覧の取得中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<List<StaffDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 職員詳細取得
        /// GET /api/desktop/master/staff/{staffId}
        /// </summary>
        [HttpGet("staff/{staffId}")]
        public async Task<ActionResult<ApiResponse<StaffDto>>> GetStaffById(int staffId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var staff = await _masterService.GetStaffByIdAsync(nurseryId, staffId);

                // デバッグログ: StaffDtoの内容を確認
                _logger.LogInformation("GetStaffById - StaffId: {StaffId}, Remark: {Remark}, ResignationDate: {ResignationDate}",
                    staffId, staff?.Remark ?? "(null)", staff?.ResignationDate);

                if (staff == null)
                {
                    return NotFound(new ApiResponse<StaffDto>
                    {
                        Success = false,
                        Error = new ApiError { Code = "STAFF_NOT_FOUND", Message = "職員が見つかりません" }
                    });
                }

                return Ok(new ApiResponse<StaffDto> { Success = true, Data = staff });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "職員詳細の取得中にエラーが発生しました: StaffId={StaffId}", staffId);
                return StatusCode(500, new ApiResponse<StaffDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 職員作成
        /// POST /api/desktop/master/staff
        /// </summary>
        [HttpPost("staff")]
        public async Task<ActionResult<ApiResponse<StaffDto>>> CreateStaff([FromBody] CreateStaffRequestDto request)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var staff = await _masterService.CreateStaffAsync(nurseryId, request);

                return CreatedAtAction(nameof(GetStaffById), new { staffId = staff.StaffId }, new ApiResponse<StaffDto> { Success = true, Data = staff });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "職員の作成に失敗しました: {Message}", ex.Message);
                return BadRequest(new ApiResponse<StaffDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "VALIDATION_ERROR", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "職員の作成中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<StaffDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 職員更新
        /// PUT /api/desktop/master/staff/{staffId}
        /// </summary>
        [HttpPut("staff/{staffId}")]
        public async Task<ActionResult<ApiResponse<StaffDto>>> UpdateStaff(int staffId, [FromBody] UpdateStaffRequestDto request)
        {
            _logger.LogInformation("UpdateStaff controller - StaffId: {StaffId}, Request: Remark={Remark}, ResignationDate={ResignationDate}", 
                staffId, request.Remark ?? "(null)", request.ResignationDate);
            
            try
            {
                var nurseryId = GetNurseryId();
                var staff = await _masterService.UpdateStaffAsync(nurseryId, staffId, request);

                return Ok(new ApiResponse<StaffDto> { Success = true, Data = staff });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<StaffDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "STAFF_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "職員の更新に失敗しました: StaffId={StaffId}, Message={Message}", staffId, ex.Message);
                return BadRequest(new ApiResponse<StaffDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "VALIDATION_ERROR", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "職員の更新中にエラーが発生しました: StaffId={StaffId}", staffId);
                return StatusCode(500, new ApiResponse<StaffDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 職員削除
        /// DELETE /api/desktop/master/staff/{staffId}
        /// </summary>
        [HttpDelete("staff/{staffId}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteStaff(int staffId)
        {
            try
            {
                var nurseryId = GetNurseryId();
                await _masterService.DeleteStaffAsync(nurseryId, staffId);

                return Ok(new ApiResponse<object> { Success = true, Message = "職員を削除しました" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError { Code = "STAFF_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "職員の削除中にエラーが発生しました: StaffId={StaffId}", staffId);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 職員クラス担当更新
        /// PUT /api/desktop/master/staff/{staffId}/assignments
        /// </summary>
        [HttpPut("staff/{staffId}/assignments")]
        public async Task<ActionResult<ApiResponse<List<StaffClassAssignmentDto>>>> UpdateStaffClassAssignments(
            int staffId,
            [FromBody] List<StaffClassAssignmentRequestDto> assignments)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var result = await _masterService.UpdateStaffClassAssignmentsAsync(nurseryId, staffId, assignments);

                return Ok(new ApiResponse<List<StaffClassAssignmentDto>> { Success = true, Data = result });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<List<StaffClassAssignmentDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "STAFF_NOT_FOUND", Message = ex.Message }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "職員クラス担当の更新中にエラーが発生しました: StaffId={StaffId}", staffId);
                return StatusCode(500, new ApiResponse<List<StaffClassAssignmentDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        #endregion
    }
}
