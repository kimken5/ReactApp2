using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs.InfantRecords;
using ReactApp.Server.Services;
using System.Security.Claims;

namespace ReactApp.Server.Controllers;

[Authorize]
[ApiController]
[Route("api/desktop/infant-records")]
public class DesktopInfantRecordsController : ControllerBase
{
    private readonly IInfantRecordService _infantRecordService;
    private readonly ILogger<DesktopInfantRecordsController> _logger;

    public DesktopInfantRecordsController(
        IInfantRecordService infantRecordService,
        ILogger<DesktopInfantRecordsController> logger)
    {
        _infantRecordService = infantRecordService;
        _logger = logger;
    }

    /// <summary>
    /// 週次生活記録を取得
    /// </summary>
    [HttpGet("weekly")]
    public async Task<IActionResult> GetWeeklyRecords(
        [FromQuery] string classId,
        [FromQuery] string weekStartDate,
        CancellationToken cancellationToken)
    {
        try
        {
            var nurseryId = int.Parse(User.FindFirstValue("NurseryId")!);

            if (!DateTime.TryParse(weekStartDate, out var startDate))
            {
                return BadRequest(new { error = "Invalid date format. Use yyyy-MM-dd." });
            }

            var result = await _infantRecordService.GetWeeklyRecordsAsync(
                nurseryId,
                classId,
                startDate,
                cancellationToken);

            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching weekly records");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// 体温記録を更新
    /// </summary>
    [HttpPut("temperature/{temperatureId}")]
    public async Task<IActionResult> UpdateTemperature(
        int temperatureId,
        [FromBody] UpdateTemperatureDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var nurseryId = int.Parse(User.FindFirstValue("NurseryId")!);

            await _infantRecordService.UpdateTemperatureAsync(
                nurseryId,
                temperatureId,
                dto,
                cancellationToken);

            return Ok(new { success = true, message = "Temperature updated successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating temperature");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// 食事記録を更新
    /// </summary>
    [HttpPut("meal/{mealId}")]
    public async Task<IActionResult> UpdateMeal(
        int mealId,
        [FromBody] UpdateMealDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var nurseryId = int.Parse(User.FindFirstValue("NurseryId")!);

            await _infantRecordService.UpdateMealAsync(
                nurseryId,
                mealId,
                dto,
                cancellationToken);

            return Ok(new { success = true, message = "Meal record updated successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating meal");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// 機嫌記録を更新
    /// </summary>
    [HttpPut("mood/{moodId}")]
    public async Task<IActionResult> UpdateMood(
        int moodId,
        [FromBody] UpdateMoodDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var nurseryId = int.Parse(User.FindFirstValue("NurseryId")!);

            await _infantRecordService.UpdateMoodAsync(
                nurseryId,
                moodId,
                dto,
                cancellationToken);

            return Ok(new { success = true, message = "Mood record updated successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating mood");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// 睡眠記録を更新
    /// </summary>
    [HttpPut("sleep/{sleepId}")]
    public async Task<IActionResult> UpdateSleep(
        int sleepId,
        [FromBody] UpdateSleepDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var nurseryId = int.Parse(User.FindFirstValue("NurseryId")!);

            await _infantRecordService.UpdateSleepAsync(
                nurseryId,
                sleepId,
                dto,
                cancellationToken);

            return Ok(new { success = true, message = "Sleep record updated successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating sleep");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// 排泄記録を更新
    /// </summary>
    [HttpPut("toileting/{childId}")]
    public async Task<IActionResult> UpdateToileting(
        int childId,
        [FromQuery] string recordDate,
        [FromBody] UpdateToiletingDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var nurseryId = int.Parse(User.FindFirstValue("NurseryId")!);

            if (!DateTime.TryParse(recordDate, out var date))
            {
                return BadRequest(new { error = "Invalid date format. Use yyyy-MM-dd." });
            }

            await _infantRecordService.UpdateToiletingAsync(
                nurseryId,
                childId,
                date,
                dto,
                cancellationToken);

            return Ok(new { success = true, message = "Toileting record updated successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating toileting");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// 体温記録を作成または更新
    /// </summary>
    [HttpPost("temperature")]
    public async Task<IActionResult> UpsertTemperature(
        [FromBody] UpsertTemperatureDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var nurseryId = int.Parse(User.FindFirstValue("NurseryId")!);

            var recordId = await _infantRecordService.UpsertTemperatureAsync(
                nurseryId,
                dto,
                cancellationToken);

            return Ok(new { success = true, message = "Temperature record saved successfully", recordId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting temperature");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// 食事記録を作成または更新
    /// </summary>
    [HttpPost("meal")]
    public async Task<IActionResult> UpsertMeal(
        [FromBody] UpsertMealDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var nurseryId = int.Parse(User.FindFirstValue("NurseryId")!);

            var recordId = await _infantRecordService.UpsertMealAsync(
                nurseryId,
                dto,
                cancellationToken);

            return Ok(new { success = true, message = "Meal record saved successfully", recordId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting meal");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// 機嫌記録を作成または更新
    /// </summary>
    [HttpPost("mood")]
    public async Task<IActionResult> UpsertMood(
        [FromBody] UpsertMoodDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var nurseryId = int.Parse(User.FindFirstValue("NurseryId")!);

            var recordId = await _infantRecordService.UpsertMoodAsync(
                nurseryId,
                dto,
                cancellationToken);

            return Ok(new { success = true, message = "Mood record saved successfully", recordId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting mood");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// 排泄記録を作成または更新
    /// </summary>
    [HttpPost("toileting")]
    public async Task<IActionResult> UpsertToileting(
        [FromBody] UpsertToiletingDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var nurseryId = int.Parse(User.FindFirstValue("NurseryId")!);

            var recordId = await _infantRecordService.UpsertToiletingAsync(
                nurseryId,
                dto,
                cancellationToken);

            return Ok(new { success = true, message = "Toileting record saved successfully", recordId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting toileting");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// 睡眠記録を作成または更新
    /// </summary>
    [HttpPost("sleep")]
    public async Task<IActionResult> UpsertSleep(
        [FromBody] UpsertSleepDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var nurseryId = int.Parse(User.FindFirstValue("NurseryId")!);

            var recordId = await _infantRecordService.UpsertSleepAsync(
                nurseryId,
                dto,
                cancellationToken);

            return Ok(new { success = true, message = "Sleep record saved successfully", recordId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting sleep");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
