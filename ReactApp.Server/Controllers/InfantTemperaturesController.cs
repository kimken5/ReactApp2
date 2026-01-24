using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;

namespace ReactApp.Server.Controllers;

[ApiController]
[Route("api/desktop/infant-temperatures")]
[Authorize]
public class InfantTemperaturesController : ControllerBase
{
    private readonly KindergartenDbContext _context;
    private readonly ILogger<InfantTemperaturesController> _logger;

    public InfantTemperaturesController(
        KindergartenDbContext context,
        ILogger<InfantTemperaturesController> logger)
    {
        _context = context;
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
            throw new UnauthorizedAccessException("職員IDが取得できません");
        }
        return staffId;
    }

    /// <summary>
    /// クラス全員の体温一覧を取得
    /// </summary>
    [HttpGet("class-bulk")]
    public async Task<ActionResult<ClassTemperatureListResponse>> GetClassTemperatures(
        [FromQuery] string classId,
        [FromQuery] DateTime date)
    {
        try
        {
            var nurseryId = GetNurseryId();

            // クラス情報取得
            var classInfo = await _context.Classes
                .Where(c => c.ClassId == classId && c.NurseryId == nurseryId)
                .Select(c => new { c.Name })
                .FirstOrDefaultAsync();

            if (classInfo == null)
            {
                return NotFound("クラスが見つかりません");
            }

            // クラスの園児一覧を取得（出欠表管理と同じロジック）
            var children = await _context.Children
                .Where(c => c.NurseryId == nurseryId && c.ClassId == classId && c.IsActive)
                .OrderBy(c => c.ChildId)
                .Select(c => new
                {
                    c.ChildId,
                    c.FirstName,
                    c.FamilyName,
                    c.DateOfBirth
                })
                .ToListAsync();

            _logger.LogInformation("クラス体温取得: ClassId={ClassId}, Date={Date}, 園児数={Count}",
                classId, date, children.Count);

            // 該当日の体温記録を取得
            var temperatures = await _context.InfantTemperatures
                .Where(t => t.RecordDate == date.Date &&
                           children.Select(c => c.ChildId).Contains(t.ChildId))
                .ToListAsync();

            // レスポンス作成
            var response = new ClassTemperatureListResponse
            {
                ClassId = classId,
                ClassName = classInfo.Name,
                RecordDate = date.Date,
                Children = children.Select(c =>
                {
                    var ageMonths = CalculateAgeInMonths(c.DateOfBirth);
                    var homeTemp = temperatures.FirstOrDefault(t =>
                        t.ChildId == c.ChildId && t.MeasurementType == "Home");
                    var morningTemp = temperatures.FirstOrDefault(t =>
                        t.ChildId == c.ChildId && t.MeasurementType == "Morning");
                    var afternoonTemp = temperatures.FirstOrDefault(t =>
                        t.ChildId == c.ChildId && t.MeasurementType == "Afternoon");

                    return new ChildTemperatureInfo
                    {
                        ChildId = c.ChildId,
                        ChildName = $"{c.FamilyName} {c.FirstName}",
                        AgeMonths = ageMonths,
                        Home = homeTemp != null ? new HomeTemperatureInfo
                        {
                            Temperature = homeTemp.Temperature,
                            MeasurementLocation = homeTemp.MeasurementLocation,
                            MeasuredAt = homeTemp.MeasuredAt,
                            IsAbnormal = homeTemp.IsAbnormal
                        } : null,
                        Morning = morningTemp != null ? new MorningTemperatureInfo
                        {
                            Temperature = morningTemp.Temperature,
                            MeasurementLocation = morningTemp.MeasurementLocation,
                            MeasuredAt = morningTemp.MeasuredAt,
                            IsParentInput = morningTemp.CreatedByType == "Parent",
                            IsAbnormal = morningTemp.IsAbnormal
                        } : null,
                        Afternoon = afternoonTemp != null ? new AfternoonTemperatureInfo
                        {
                            Temperature = afternoonTemp.Temperature,
                            MeasurementLocation = afternoonTemp.MeasurementLocation,
                            MeasuredAt = afternoonTemp.MeasuredAt,
                            IsAbnormal = afternoonTemp.IsAbnormal
                        } : null
                    };
                }).ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "クラス体温一覧取得エラー: ClassId={ClassId}, Date={Date}", classId, date);
            return StatusCode(500, "体温一覧の取得中にエラーが発生しました");
        }
    }

    /// <summary>
    /// クラス全員の体温を一括保存
    /// </summary>
    [HttpPost("class-bulk")]
    public async Task<ActionResult<ClassTemperatureBulkResponse>> SaveClassTemperatures(
        [FromBody] ClassTemperatureBulkRequest request)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var staffId = GetStaffId();
            var now = DateTime.UtcNow;

            var savedCount = 0;
            var skippedCount = 0;
            var warnings = new List<TemperatureWarning>();

            // 園児情報を取得（警告メッセージ用）
            var childIds = request.Temperatures.Select(t => t.ChildId).ToList();
            var children = await _context.Children
                .Where(c => childIds.Contains(c.ChildId))
                .Select(c => new { c.ChildId, c.FirstName, c.FamilyName })
                .ToDictionaryAsync(c => c.ChildId);

            foreach (var childTemp in request.Temperatures)
            {
                // 朝の体温
                if (childTemp.Morning != null)
                {
                    var saved = await SaveTemperature(
                        nurseryId,
                        childTemp.ChildId,
                        request.RecordDate,
                        "Morning",
                        childTemp.Morning,
                        staffId,
                        now);

                    if (saved) savedCount++;
                    else skippedCount++;

                    // 異常値チェック
                    if (childTemp.Morning.Temperature >= 37.5m && children.TryGetValue(childTemp.ChildId, out var child))
                    {
                        warnings.Add(new TemperatureWarning
                        {
                            ChildId = childTemp.ChildId,
                            ChildName = $"{child.FamilyName} {child.FirstName}",
                            MeasurementType = "Morning",
                            Temperature = childTemp.Morning.Temperature,
                            Message = childTemp.Morning.Temperature >= 37.5m ?
                                "発熱（37.5℃以上）" :
                                "異常値（37.5℃未満ですが注意）"
                        });
                    }
                }

                // 午後の体温
                if (childTemp.Afternoon != null)
                {
                    var saved = await SaveTemperature(
                        nurseryId,
                        childTemp.ChildId,
                        request.RecordDate,
                        "Afternoon",
                        childTemp.Afternoon,
                        staffId,
                        now);

                    if (saved) savedCount++;
                    else skippedCount++;

                    // 異常値チェック
                    if (childTemp.Afternoon.Temperature >= 37.5m && children.TryGetValue(childTemp.ChildId, out var child))
                    {
                        warnings.Add(new TemperatureWarning
                        {
                            ChildId = childTemp.ChildId,
                            ChildName = $"{child.FamilyName} {child.FirstName}",
                            MeasurementType = "Afternoon",
                            Temperature = childTemp.Afternoon.Temperature,
                            Message = "発熱（37.5℃以上）"
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new ClassTemperatureBulkResponse
            {
                Success = true,
                SavedCount = savedCount,
                SkippedCount = skippedCount,
                Warnings = warnings
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "クラス体温一括保存エラー: ClassId={ClassId}", request.ClassId);
            return StatusCode(500, "体温の保存中にエラーが発生しました");
        }
    }

    private async Task<bool> SaveTemperature(
        int nurseryId,
        int childId,
        DateTime recordDate,
        string measurementType,
        TemperatureMeasurement measurement,
        int staffId,
        DateTime now)
    {
        try
        {
            // 既存レコードを検索
            var existing = await _context.InfantTemperatures
                .FirstOrDefaultAsync(t =>
                    t.NurseryId == nurseryId &&
                    t.ChildId == childId &&
                    t.RecordDate == recordDate.Date &&
                    t.MeasurementType == measurementType);

            if (existing != null)
            {
                // 更新
                existing.Temperature = measurement.Temperature;
                existing.MeasurementLocation = measurement.MeasurementLocation;
                existing.MeasuredAt = measurement.MeasuredAt;
                existing.Notes = measurement.Notes;
                existing.IsAbnormal = measurement.Temperature >= 37.5m;
                existing.UpdatedAt = now;
                existing.UpdatedBy = staffId;
            }
            else
            {
                // 新規作成
                var newTemp = new InfantTemperature
                {
                    NurseryId = nurseryId,
                    ChildId = childId,
                    RecordDate = recordDate.Date,
                    MeasurementType = measurementType,
                    Temperature = measurement.Temperature,
                    MeasurementLocation = measurement.MeasurementLocation,
                    MeasuredAt = measurement.MeasuredAt,
                    Notes = measurement.Notes,
                    IsAbnormal = measurement.Temperature >= 37.5m,
                    CreatedByType = "Staff",
                    IsDraft = false,
                    CreatedAt = now,
                    CreatedBy = staffId,
                    UpdatedAt = now,
                    UpdatedBy = staffId
                };

                _context.InfantTemperatures.Add(newTemp);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "体温保存エラー: ChildId={ChildId}, Type={Type}", childId, measurementType);
            return false;
        }
    }

    private int CalculateAgeInMonths(DateTime birthDate)
    {
        var today = DateTime.Today;
        var months = ((today.Year - birthDate.Year) * 12) + today.Month - birthDate.Month;
        if (today.Day < birthDate.Day) months--;
        return months;
    }
}
