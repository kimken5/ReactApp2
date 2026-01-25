using Microsoft.AspNetCore.Authorization;
using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs.InfantRecords;
using ReactApp.Server.Services;

namespace ReactApp.Server.Controllers;

/// <summary>
/// 乳児生活記録管理コントローラー
/// デスクトップアプリ用の乳児記録CRUD APIを提供
/// </summary>
[ApiController]
[Route("api/desktop/infant-records")]
[Authorize]
public class InfantRecordsController : ControllerBase
{
    private readonly IInfantRecordService _infantRecordService;
    private readonly ILogger<InfantRecordsController> _logger;

    public InfantRecordsController(
        IInfantRecordService infantRecordService,
        ILogger<InfantRecordsController> logger)
    {
        _infantRecordService = infantRecordService;
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
            // デスクトップアプリの場合、デフォルトで-1を返す
            return -1;
        }
        return staffId;
    }

    // ===== ミルク記録API =====

    /// <summary>
    /// 指定日のクラス内全園児のミルク記録を取得
    /// </summary>
    [HttpGet("milk")]
    public async Task<ActionResult<IEnumerable<InfantMilkDto>>> GetMilkRecords(
        [FromQuery] string classId,
        [FromQuery] DateTime date)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var records = await _infantRecordService.GetMilkRecordsAsync(nurseryId, classId, date);
            return Ok(records);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ミルク記録取得エラー: ClassId={ClassId}, Date={Date}", classId, date);
            return StatusCode(500, "ミルク記録の取得中にエラーが発生しました");
        }
    }

    /// <summary>
    /// ミルク記録を作成
    /// </summary>
    [HttpPost("milk")]
    public async Task<ActionResult<InfantMilkDto>> CreateMilkRecord([FromBody] CreateInfantMilkDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var staffId = GetStaffId();
            var record = await _infantRecordService.CreateMilkRecordAsync(dto, nurseryId, staffId);
            return CreatedAtAction(nameof(GetMilkRecords), new { classId = 0, date = dto.RecordDate }, record);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ミルク記録作成エラー: ChildId={ChildId}", dto.ChildId);
            return StatusCode(500, "ミルク記録の作成中にエラーが発生しました");
        }
    }

    /// <summary>
    /// ミルク記録を更新
    /// </summary>
    [HttpPut("milk")]
    public async Task<ActionResult> UpdateMilkRecord([FromBody] UpdateInfantMilkDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var staffId = GetStaffId();
            var success = await _infantRecordService.UpdateMilkRecordAsync(dto, nurseryId, staffId);

            if (!success)
                return NotFound("ミルク記録が見つかりません");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ミルク記録更新エラー: ChildId={ChildId}", dto.ChildId);
            return StatusCode(500, "ミルク記録の更新中にエラーが発生しました");
        }
    }

    /// <summary>
    /// ミルク記録を削除
    /// </summary>
    [HttpDelete("milk/{childId}/{date}/{time}")]
    public async Task<ActionResult> DeleteMilkRecord(int childId, DateTime date, TimeSpan time)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var success = await _infantRecordService.DeleteMilkRecordAsync(nurseryId, childId, date, time);

            if (!success)
                return NotFound("ミルク記録が見つかりません");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ミルク記録削除エラー: ChildId={ChildId}", childId);
            return StatusCode(500, "ミルク記録の削除中にエラーが発生しました");
        }
    }

    // ===== 食事記録API =====

    /// <summary>
    /// 指定日のクラス内全園児の食事記録を取得
    /// </summary>
    [HttpGet("meal")]
    public async Task<ActionResult<IEnumerable<InfantMealDto>>> GetMealRecords(
        [FromQuery] string classId,
        [FromQuery] DateTime date)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var records = await _infantRecordService.GetMealRecordsAsync(nurseryId, classId, date);
            return Ok(records);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "食事記録取得エラー: ClassId={ClassId}, Date={Date}", classId, date);
            return StatusCode(500, "食事記録の取得中にエラーが発生しました");
        }
    }

    /// <summary>
    /// 食事記録を作成
    /// </summary>
    [HttpPost("meal")]
    public async Task<ActionResult<InfantMealDto>> CreateMealRecord([FromBody] CreateInfantMealDto dto)
    {
        // デバッグ: 受け取ったデータをログ出力
        _logger.LogInformation("受信データ: ChildId={ChildId}, RecordDate={RecordDate}, MealType={MealType}, MealTime={MealTime}, OverallAmount={OverallAmount}, Notes={Notes}",
            dto.ChildId, dto.RecordDate, dto.MealType, dto.MealTime, dto.OverallAmount, dto.Notes);

        // モデルバリデーションエラーをログ出力
        if (!ModelState.IsValid)
        {
            foreach (var error in ModelState)
            {
                _logger.LogError("バリデーションエラー: Key={Key}, Errors={Errors}",
                    error.Key, string.Join(", ", error.Value.Errors.Select(e => e.ErrorMessage)));
            }
        }

        try
        {
            var nurseryId = GetNurseryId();
            var staffId = GetStaffId();
            var record = await _infantRecordService.CreateMealRecordAsync(dto, nurseryId, staffId);
            return CreatedAtAction(nameof(GetMealRecords), new { classId = 0, date = dto.RecordDate }, record);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "食事記録作成エラー: ChildId={ChildId}", dto.ChildId);
            return StatusCode(500, "食事記録の作成中にエラーが発生しました");
        }
    }

    /// <summary>
    /// 食事記録を更新
    /// </summary>
    [HttpPut("meal")]
    public async Task<ActionResult> UpdateMealRecord([FromBody] UpdateInfantMealDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var staffId = GetStaffId();
            var success = await _infantRecordService.UpdateMealRecordAsync(dto, nurseryId, staffId);

            if (!success)
                return NotFound("食事記録が見つかりません");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "食事記録更新エラー: ChildId={ChildId}", dto.ChildId);
            return StatusCode(500, "食事記録の更新中にエラーが発生しました");
        }
    }

    /// <summary>
    /// 食事記録を削除
    /// </summary>
    [HttpDelete("meal/{childId}/{date}/{mealTime}")]
    public async Task<ActionResult> DeleteMealRecord(int childId, DateTime date, string mealTime)
    {
        try
        {
            var nurseryId = GetNurseryId();
            if (!TimeSpan.TryParse(mealTime, out var parsedMealTime))
                return BadRequest("無効な時刻形式です");

            var success = await _infantRecordService.DeleteMealRecordAsync(nurseryId, childId, date, parsedMealTime);

            if (!success)
                return NotFound("食事記録が見つかりません");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "食事記録削除エラー: ChildId={ChildId}", childId);
            return StatusCode(500, "食事記録の削除中にエラーが発生しました");
        }
    }

    // ===== 睡眠記録API =====

    /// <summary>
    /// 指定日のクラス内全園児の睡眠記録を取得
    /// </summary>
    [HttpGet("sleep")]
    public async Task<ActionResult<IEnumerable<InfantSleepDto>>> GetSleepRecords(
        [FromQuery] string classId,
        [FromQuery] DateTime date)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var records = await _infantRecordService.GetSleepRecordsAsync(nurseryId, classId, date);
            return Ok(records);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "睡眠記録取得エラー: ClassId={ClassId}, Date={Date}", classId, date);
            return StatusCode(500, "睡眠記録の取得中にエラーが発生しました");
        }
    }

    /// <summary>
    /// 睡眠記録を作成
    /// </summary>
    [HttpPost("sleep")]
    public async Task<ActionResult<InfantSleepDto>> CreateSleepRecord([FromBody] CreateInfantSleepDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var staffId = GetStaffId();
            var record = await _infantRecordService.CreateSleepRecordAsync(dto, nurseryId, staffId);
            return CreatedAtAction(nameof(GetSleepRecords), new { classId = 0, date = dto.RecordDate }, record);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "睡眠記録作成エラー: ChildId={ChildId}", dto.ChildId);
            return StatusCode(500, "睡眠記録の作成中にエラーが発生しました");
        }
    }

    /// <summary>
    /// 睡眠記録を更新
    /// </summary>
    [HttpPut("sleep")]
    public async Task<ActionResult> UpdateSleepRecord([FromBody] UpdateInfantSleepDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var staffId = GetStaffId();
            var success = await _infantRecordService.UpdateSleepRecordAsync(dto, nurseryId, staffId);

            if (!success)
                return NotFound("睡眠記録が見つかりません");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "睡眠記録更新エラー: ChildId={ChildId}", dto.ChildId);
            return StatusCode(500, "睡眠記録の更新中にエラーが発生しました");
        }
    }

    /// <summary>
    /// 睡眠記録を削除
    /// </summary>
    [HttpDelete("sleep/{childId}/{date}/{sleepSequence}")]
    public async Task<ActionResult> DeleteSleepRecord(int childId, DateTime date, int sleepSequence)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var success = await _infantRecordService.DeleteSleepRecordAsync(nurseryId, childId, date, sleepSequence);

            if (!success)
                return NotFound("睡眠記録が見つかりません");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "睡眠記録削除エラー: ChildId={ChildId}", childId);
            return StatusCode(500, "睡眠記録の削除中にエラーが発生しました");
        }
    }

    // ===== 排泄記録API =====

    /// <summary>
    /// 指定日のクラス内全園児の排泄記録を取得
    /// </summary>
    [HttpGet("toileting")]
    public async Task<ActionResult<IEnumerable<InfantToiletingDto>>> GetToiletingRecords(
        [FromQuery] string classId,
        [FromQuery] DateTime date)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var records = await _infantRecordService.GetToiletingRecordsAsync(nurseryId, classId, date);
            return Ok(records);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "排泄記録取得エラー: ClassId={ClassId}, Date={Date}", classId, date);
            return StatusCode(500, "排泄記録の取得中にエラーが発生しました");
        }
    }

    /// <summary>
    /// 排泄記録を作成
    /// </summary>
    [HttpPost("toileting")]
    public async Task<ActionResult<InfantToiletingDto>> CreateToiletingRecord([FromBody] CreateInfantToiletingDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var staffId = GetStaffId();
            var record = await _infantRecordService.CreateToiletingRecordAsync(dto, nurseryId, staffId);
            return CreatedAtAction(nameof(GetToiletingRecords), new { classId = 0, date = dto.RecordDate }, record);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "排泄記録作成エラー: ChildId={ChildId}", dto.ChildId);
            return StatusCode(500, "排泄記録の作成中にエラーが発生しました");
        }
    }

    /// <summary>
    /// 排泄記録を更新
    /// </summary>
    [HttpPut("toileting")]
    public async Task<ActionResult> UpdateToiletingRecord([FromBody] UpdateInfantToiletingDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var staffId = GetStaffId();
            var success = await _infantRecordService.UpdateToiletingRecordAsync(dto, nurseryId, staffId);

            if (!success)
                return NotFound("排泄記録が見つかりません");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "排泄記録更新エラー: ChildId={ChildId}", dto.ChildId);
            return StatusCode(500, "排泄記録の更新中にエラーが発生しました");
        }
    }

    /// <summary>
    /// 排泄記録を削除
    /// </summary>
    [HttpDelete("toileting/{childId}/{date}")]
    public async Task<ActionResult> DeleteToiletingRecord(int childId, DateTime date)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var success = await _infantRecordService.DeleteToiletingRecordAsync(nurseryId, childId, date);

            if (!success)
                return NotFound("排泄記録が見つかりません");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "排泄記録削除エラー: ChildId={ChildId}", childId);
            return StatusCode(500, "排泄記録の削除中にエラーが発生しました");
        }
    }

    // ===== 機嫌記録API =====

    /// <summary>
    /// 指定日のクラス内全園児の機嫌記録を取得
    /// </summary>
    [HttpGet("mood")]
    public async Task<ActionResult<IEnumerable<InfantMoodDto>>> GetMoodRecords(
        [FromQuery] string classId,
        [FromQuery] DateTime date)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var records = await _infantRecordService.GetMoodRecordsAsync(nurseryId, classId, date);
            return Ok(records);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "機嫌記録取得エラー: ClassId={ClassId}, Date={Date}", classId, date);
            return StatusCode(500, "機嫌記録の取得中にエラーが発生しました");
        }
    }

    /// <summary>
    /// 機嫌記録を作成
    /// </summary>
    [HttpPost("mood")]
    public async Task<ActionResult<InfantMoodDto>> CreateMoodRecord([FromBody] CreateInfantMoodDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var staffId = GetStaffId();
            var record = await _infantRecordService.CreateMoodRecordAsync(dto, nurseryId, staffId);
            return CreatedAtAction(nameof(GetMoodRecords), new { classId = 0, date = dto.RecordDate }, record);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "機嫌記録作成エラー: ChildId={ChildId}", dto.ChildId);
            return StatusCode(500, "機嫌記録の作成中にエラーが発生しました");
        }
    }

    /// <summary>
    /// 機嫌記録を更新
    /// </summary>
    [HttpPut("mood")]
    public async Task<ActionResult> UpdateMoodRecord([FromBody] UpdateInfantMoodDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var staffId = GetStaffId();
            var success = await _infantRecordService.UpdateMoodRecordAsync(dto, nurseryId, staffId);

            if (!success)
                return NotFound("機嫌記録が見つかりません");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "機嫌記録更新エラー: ChildId={ChildId}", dto.ChildId);
            return StatusCode(500, "機嫌記録の更新中にエラーが発生しました");
        }
    }

    /// <summary>
    /// 機嫌記録を削除
    /// </summary>
    [HttpDelete("mood/{childId}/{date}/{recordTime}")]
    public async Task<ActionResult> DeleteMoodRecord(int childId, DateTime date, TimeOnly recordTime)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var success = await _infantRecordService.DeleteMoodRecordAsync(nurseryId, childId, date, recordTime);

            if (!success)
                return NotFound("機嫌記録が見つかりません");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "機嫌記録削除エラー: ChildId={ChildId}", childId);
            return StatusCode(500, "機嫌記録の削除中にエラーが発生しました");
        }
    }

    // ===== 室温・湿度記録API =====

    /// <summary>
    /// 指定日のクラスの室温・湿度記録を取得
    /// </summary>
    [HttpGet("environment")]
    public async Task<ActionResult<RoomEnvironmentDto>> GetRoomEnvironment(
        [FromQuery] string classId,
        [FromQuery] DateTime date)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var record = await _infantRecordService.GetRoomEnvironmentAsync(nurseryId, classId, date);

            if (record == null)
                return NotFound("室温・湿度記録が見つかりません");

            return Ok(record);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "室温・湿度記録取得エラー: ClassId={ClassId}, Date={Date}", classId, date);
            return StatusCode(500, "室温・湿度記録の取得中にエラーが発生しました");
        }
    }

    /// <summary>
    /// 室温・湿度記録を保存（Upsert）
    /// </summary>
    [HttpPost("environment")]
    public async Task<ActionResult<RoomEnvironmentDto>> SaveRoomEnvironment([FromBody] UpdateRoomEnvironmentDto dto)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var staffId = GetStaffId();
            var record = await _infantRecordService.SaveRoomEnvironmentAsync(dto, nurseryId, staffId);
            return Ok(record);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "室温・湿度記録保存エラー: ClassId={ClassId}", dto.ClassId);
            return StatusCode(500, "室温・湿度記録の保存中にエラーが発生しました");
        }
    }

    // ===== クラス園児一覧API =====

    /// <summary>
    /// 指定クラスの園児一覧を取得（モーダル用）
    /// </summary>
    [HttpGet("children")]
    [ProducesResponseType(typeof(ApiResponse<ClassChildrenResponse>), 200)]
    public async Task<ActionResult<ApiResponse<ClassChildrenResponse>>> GetClassChildren(
        [FromQuery] string classId,
        [FromQuery] string date)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var parsedDate = DateTime.ParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            var result = await _infantRecordService.GetClassChildrenAsync(nurseryId, classId, parsedDate);
            return Ok(new { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "クラス園児一覧取得エラー: ClassId={ClassId}, Date={Date}", classId, date);
            return StatusCode(500, "クラス園児一覧の取得中にエラーが発生しました");
        }
    }
}
