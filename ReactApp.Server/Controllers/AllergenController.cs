using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;

namespace ReactApp.Server.Controllers;

/// <summary>
/// アレルゲンマスターAPI
/// AllergenMasterテーブルから28項目のアレルゲン一覧を提供
/// 認証不要（公開API）
/// </summary>
[ApiController]
[Route("api/allergens")]
[AllowAnonymous]
public class AllergenController : ControllerBase
{
    private readonly KindergartenDbContext _context;
    private readonly ILogger<AllergenController> _logger;

    public AllergenController(
        KindergartenDbContext context,
        ILogger<AllergenController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// アレルゲン一覧取得
    /// </summary>
    /// <returns>SortOrder順で並んだアレルゲン名の配列</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<AllergenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllergens()
    {
        try
        {
            var allergens = await _context.AllergenMasters
                .OrderBy(a => a.SortOrder)
                .Select(a => new AllergenDto
                {
                    Id = a.Id,
                    AllergenName = a.AllergenName,
                    SortOrder = a.SortOrder
                })
                .ToListAsync();

            return Ok(allergens);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "アレルゲン一覧取得エラー");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = "アレルゲン情報の取得に失敗しました"
            });
        }
    }
}

/// <summary>
/// アレルゲンDTO
/// </summary>
public class AllergenDto
{
    public int Id { get; set; }
    public string AllergenName { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
