using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs;
using ReactApp.Server.Services;

namespace ReactApp.Server.Controllers;

/// <summary>
/// 年度管理API
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AcademicYearController : ControllerBase
{
    private readonly IAcademicYearService _academicYearService;
    private readonly ILogger<AcademicYearController> _logger;

    public AcademicYearController(
        IAcademicYearService academicYearService,
        ILogger<AcademicYearController> logger)
    {
        _academicYearService = academicYearService;
        _logger = logger;
    }

    /// <summary>
    /// 指定保育園の年度一覧を取得
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <returns>年度一覧</returns>
    [HttpGet("{nurseryId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<AcademicYearDto>>> GetAcademicYears(int nurseryId)
    {
        try
        {
            var years = await _academicYearService.GetAcademicYearsAsync(nurseryId);
            return Ok(years);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "年度一覧取得エラー: NurseryId={NurseryId}", nurseryId);
            return StatusCode(500, new { error = "年度一覧の取得に失敗しました。" });
        }
    }

    /// <summary>
    /// 現在年度を取得
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <returns>現在年度</returns>
    [HttpGet("{nurseryId}/current")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AcademicYearDto>> GetCurrentYear(int nurseryId)
    {
        try
        {
            var currentYear = await _academicYearService.GetCurrentYearAsync(nurseryId);

            if (currentYear == null)
            {
                return NotFound(new { error = "現在年度が設定されていません。" });
            }

            return Ok(currentYear);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "現在年度取得エラー: NurseryId={NurseryId}", nurseryId);
            return StatusCode(500, new { error = "現在年度の取得に失敗しました。" });
        }
    }

    /// <summary>
    /// 指定年度を取得
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <param name="year">年度</param>
    /// <returns>年度情報</returns>
    [HttpGet("{nurseryId}/{year}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AcademicYearDto>> GetAcademicYear(int nurseryId, int year)
    {
        try
        {
            var academicYear = await _academicYearService.GetAcademicYearAsync(nurseryId, year);

            if (academicYear == null)
            {
                return NotFound(new { error = $"年度 {year} が見つかりません。" });
            }

            return Ok(academicYear);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "年度取得エラー: NurseryId={NurseryId}, Year={Year}", nurseryId, year);
            return StatusCode(500, new { error = "年度の取得に失敗しました。" });
        }
    }

    /// <summary>
    /// 新規年度を作成
    /// </summary>
    /// <param name="dto">作成リクエスト</param>
    /// <returns>作成された年度情報</returns>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AcademicYearDto>> CreateAcademicYear([FromBody] CreateAcademicYearDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdYear = await _academicYearService.CreateAcademicYearAsync(dto);

            return CreatedAtAction(
                nameof(GetAcademicYear),
                new { nurseryId = createdYear.NurseryId, year = createdYear.Year },
                createdYear);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "年度作成失敗（重複）: NurseryId={NurseryId}, Year={Year}",
                dto.NurseryId, dto.Year);
            return Conflict(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "年度作成失敗（不正な引数）: NurseryId={NurseryId}, Year={Year}",
                dto.NurseryId, dto.Year);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "年度作成エラー: NurseryId={NurseryId}, Year={Year}",
                dto.NurseryId, dto.Year);
            return StatusCode(500, new { error = "年度の作成に失敗しました。" });
        }
    }

    /// <summary>
    /// 年度を更新
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <param name="year">年度</param>
    /// <param name="dto">更新リクエスト</param>
    /// <returns>更新された年度情報</returns>
    [HttpPut("{nurseryId}/{year}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AcademicYearDto>> UpdateAcademicYear(
        int nurseryId,
        int year,
        [FromBody] CreateAcademicYearDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedYear = await _academicYearService.UpdateAcademicYearAsync(nurseryId, year, dto);
            return Ok(updatedYear);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "年度更新失敗（Not Found）: NurseryId={NurseryId}, Year={Year}",
                nurseryId, year);
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "年度更新失敗（不正な引数）: NurseryId={NurseryId}, Year={Year}",
                nurseryId, year);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "年度更新エラー: NurseryId={NurseryId}, Year={Year}",
                nurseryId, year);
            return StatusCode(500, new { error = "年度の更新に失敗しました。" });
        }
    }

    /// <summary>
    /// 年度スライドのプレビューを取得
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <param name="targetYear">スライド先年度</param>
    /// <returns>プレビュー情報</returns>
    [HttpGet("{nurseryId}/slide/preview")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<YearSlidePreviewDto>> GetYearSlidePreview(
        int nurseryId,
        [FromQuery] int targetYear)
    {
        try
        {
            var preview = await _academicYearService.GetYearSlidePreviewAsync(nurseryId, targetYear);
            return Ok(preview);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "年度スライドプレビュー取得失敗: NurseryId={NurseryId}, TargetYear={TargetYear}",
                nurseryId, targetYear);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "年度スライドプレビューエラー: NurseryId={NurseryId}, TargetYear={TargetYear}",
                nurseryId, targetYear);
            return StatusCode(500, new { error = "プレビューの取得に失敗しました。" });
        }
    }

    /// <summary>
    /// 年度スライドを実行
    /// </summary>
    /// <param name="request">スライド実行リクエスト</param>
    /// <returns>実行結果</returns>
    [HttpPost("slide")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<YearSlideResultDto>> ExecuteYearSlide([FromBody] YearSlideRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // 確認フラグチェック
            if (!request.Confirmed)
            {
                return BadRequest(new { error = "年度スライドには確認フラグが必要です。" });
            }

            var result = await _academicYearService.ExecuteYearSlideAsync(request);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "年度スライド実行失敗: NurseryId={NurseryId}, TargetYear={TargetYear}",
                request.NurseryId, request.TargetYear);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "年度スライドエラー: NurseryId={NurseryId}, TargetYear={TargetYear}",
                request.NurseryId, request.TargetYear);
            return StatusCode(500, new { error = "年度スライドの実行に失敗しました。" });
        }
    }

    /// <summary>
    /// 年度が存在するか確認
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <param name="year">年度</param>
    /// <returns>存在する場合true</returns>
    [HttpGet("{nurseryId}/{year}/exists")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> CheckExists(int nurseryId, int year)
    {
        try
        {
            var exists = await _academicYearService.ExistsAsync(nurseryId, year);
            return Ok(new { exists });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "年度存在チェックエラー: NurseryId={NurseryId}, Year={Year}",
                nurseryId, year);
            return StatusCode(500, new { error = "年度の存在確認に失敗しました。" });
        }
    }
}
