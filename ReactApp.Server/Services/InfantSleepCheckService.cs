using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs.InfantRecords;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services;

/// <summary>
/// 乳児午睡チェックサービス実装クラス
/// 午睡中の園児の安全チェックを5分間隔で管理
/// </summary>
public class InfantSleepCheckService : IInfantSleepCheckService
{
    private readonly KindergartenDbContext _context;
    private readonly ILogger<InfantSleepCheckService> _logger;

    public InfantSleepCheckService(
        KindergartenDbContext context,
        ILogger<InfantSleepCheckService> logger)
    {
        _context = context;
        _logger = logger;
    }

    private DateTime GetJstNow() => TimeZoneInfo.ConvertTimeFromUtc(
        DateTime.UtcNow,
        TimeZoneInfo.FindSystemTimeZoneById("Tokyo Standard Time")
    );

    /// <summary>
    /// CreatedByから入力者名を取得する共通メソッド
    /// </summary>
    private string GetCreatedByName(int createdBy, Dictionary<int, string> staffDictionary)
    {
        if (createdBy == -1)
        {
            return "管理者";
        }

        return staffDictionary.TryGetValue(createdBy, out var staffName)
            ? staffName
            : "不明";
    }

    public async Task<SleepCheckGridDto> GetSleepCheckGridAsync(int nurseryId, string classId, DateTime date)
    {
        _logger.LogInformation("午睡チェック表取得開始: NurseryId={NurseryId}, ClassId={ClassId}, Date={Date}",
            nurseryId, classId, date.Date);

        // クラス情報取得
        var classInfo = await _context.Classes
            .Where(c => c.NurseryId == nurseryId && c.ClassId == classId)
            .Select(c => new { c.Name })
            .FirstOrDefaultAsync();

        if (classInfo == null)
        {
            throw new ArgumentException($"クラスが見つかりません: ClassId={classId}");
        }

        // クラスの全園児を取得
        var children = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ClassId == classId && c.IsActive)
            .Select(c => new { c.ChildId, c.FamilyName, c.FirstName, c.DateOfBirth })
            .OrderBy(c => c.FamilyName)
            .ThenBy(c => c.FirstName)
            .ToListAsync();

        _logger.LogInformation("園児数: {Count}", children.Count);

        var childIds = children.Select(c => c.ChildId).ToList();

        // 午睡記録を取得（開始・終了時刻を把握するため）
        var sleepRecords = await _context.InfantSleeps
            .Where(s => s.NurseryId == nurseryId &&
                       childIds.Contains(s.ChildId) &&
                       s.RecordDate == date.Date)
            .OrderBy(s => s.ChildId)
            .ThenBy(s => s.SleepSequence)
            .ToListAsync();

        _logger.LogInformation("午睡記録数: {Count}", sleepRecords.Count);

        // 午睡チェック記録を取得
        var sleepChecks = await _context.InfantSleepChecks
            .Where(sc => sc.NurseryId == nurseryId &&
                        childIds.Contains(sc.ChildId) &&
                        sc.RecordDate == date.Date)
            .ToListAsync();

        _logger.LogInformation("午睡チェック記録数: {Count}", sleepChecks.Count);

        // CreatedBy用のStaffを取得
        var staffIds = sleepChecks.Where(r => r.CreatedBy != -1).Select(r => r.CreatedBy).Distinct().ToList();
        var staff = await _context.Staff
            .Where(s => s.NurseryId == nurseryId && staffIds.Contains(s.StaffId))
            .Select(s => new { s.StaffId, s.Name })
            .ToDictionaryAsync(s => s.StaffId, s => s.Name);

        // 室温・湿度記録を取得
        var roomEnvironment = await _context.RoomEnvironmentRecords
            .Where(r => r.NurseryId == nurseryId && r.ClassId == classId && r.RecordDate == date.Date)
            .OrderByDescending(r => r.RecordedAt)
            .FirstOrDefaultAsync();

        // 園児ごとにデータをまとめる
        var childSleepCheckDtos = children.Select(child =>
        {
            var ageInMonths = CalculateAgeInMonths(child.DateOfBirth);

            // この園児の午睡記録（複数回ある場合は最初の1回を取得）
            var sleepRecord = sleepRecords.FirstOrDefault(s => s.ChildId == child.ChildId);

            string? sleepStartTime = null;
            string? sleepEndTime = null;

            if (sleepRecord != null)
            {
                sleepStartTime = sleepRecord.StartTime.ToString(@"hh\:mm");
                if (sleepRecord.EndTime.HasValue)
                {
                    sleepEndTime = sleepRecord.EndTime.Value.ToString(@"hh\:mm");
                }
            }

            // この園児の午睡チェック記録を取得
            var checks = sleepChecks
                .Where(sc => sc.ChildId == child.ChildId)
                .OrderBy(sc => sc.CheckTime)
                .Select(sc => new InfantSleepCheckDto
                {
                    Id = sc.Id,
                    NurseryId = sc.NurseryId,
                    ChildId = sc.ChildId,
                    ChildName = $"{child.FamilyName} {child.FirstName}",
                    RecordDate = sc.RecordDate,
                    SleepSequence = sc.SleepSequence,
                    CheckTime = TimeSpan.FromTicks(sc.CheckTime.Ticks).ToString(@"hh\:mm"),
                    BreathingStatus = sc.BreathingStatus,
                    HeadDirection = sc.HeadDirection,
                    BodyTemperature = sc.BodyTemperature,
                    FaceColor = sc.FaceColor,
                    BodyPosition = sc.BodyPosition,
                    CreatedByName = GetCreatedByName(sc.CreatedBy, staff),
                    CreatedAt = sc.CreatedAt,
                    CreatedBy = sc.CreatedBy
                })
                .ToList();

            return new ChildSleepCheckDto
            {
                ChildId = child.ChildId,
                ChildName = $"{child.FamilyName} {child.FirstName}",
                AgeInMonths = ageInMonths,
                SleepStartTime = sleepStartTime,
                SleepEndTime = sleepEndTime,
                Checks = checks
            };
        }).ToList();

        var result = new SleepCheckGridDto
        {
            ClassId = classId,
            ClassName = classInfo.Name,
            RecordDate = date.Date,
            RoomTemperature = roomEnvironment?.Temperature,
            Humidity = roomEnvironment?.Humidity,
            Children = childSleepCheckDtos
        };

        _logger.LogInformation("午睡チェック表取得完了: 園児数={ChildCount}", result.Children.Count);

        return result;
    }

    public async Task<IEnumerable<InfantSleepCheckDto>> GetSleepChecksAsync(int nurseryId, int childId, DateTime date, int sleepSequence)
    {
        var checks = await _context.InfantSleepChecks
            .Where(sc => sc.NurseryId == nurseryId &&
                        sc.ChildId == childId &&
                        sc.RecordDate == date.Date &&
                        sc.SleepSequence == sleepSequence)
            .OrderBy(sc => sc.CheckTime)
            .ToListAsync();

        var child = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ChildId == childId)
            .Select(c => new { c.FamilyName, c.FirstName })
            .FirstOrDefaultAsync();

        var childName = child != null ? $"{child.FamilyName} {child.FirstName}" : "不明";

        // CreatedBy用のStaffを取得
        var staffIds = checks.Where(r => r.CreatedBy != -1).Select(r => r.CreatedBy).Distinct().ToList();
        var staff = await _context.Staff
            .Where(s => s.NurseryId == nurseryId && staffIds.Contains(s.StaffId))
            .Select(s => new { s.StaffId, s.Name })
            .ToDictionaryAsync(s => s.StaffId, s => s.Name);

        return checks.Select(sc => new InfantSleepCheckDto
        {
            Id = sc.Id,
            NurseryId = sc.NurseryId,
            ChildId = sc.ChildId,
            ChildName = childName,
            RecordDate = sc.RecordDate,
            SleepSequence = sc.SleepSequence,
            CheckTime = TimeSpan.FromTicks(sc.CheckTime.Ticks).ToString(@"hh\:mm"),
            BreathingStatus = sc.BreathingStatus,
            HeadDirection = sc.HeadDirection,
            BodyTemperature = sc.BodyTemperature,
            FaceColor = sc.FaceColor,
            BodyPosition = sc.BodyPosition,
            CreatedByName = GetCreatedByName(sc.CreatedBy, staff),
            CreatedAt = sc.CreatedAt,
            CreatedBy = sc.CreatedBy
        });
    }

    public async Task<InfantSleepCheckDto> CreateSleepCheckAsync(CreateInfantSleepCheckDto dto, int nurseryId, int staffId)
    {
        var now = GetJstNow();

        // HH:mm形式の文字列をTimeSpanに変換
        if (!TimeSpan.TryParse(dto.CheckTime, out var checkTime))
        {
            throw new ArgumentException($"無効な時刻形式です: {dto.CheckTime}");
        }

        var record = new InfantSleepCheck
        {
            NurseryId = nurseryId,
            ChildId = dto.ChildId,
            RecordDate = dto.RecordDate.Date,
            SleepSequence = dto.SleepSequence,
            CheckTime = checkTime,
            BreathingStatus = dto.BreathingStatus,
            HeadDirection = dto.HeadDirection,
            BodyTemperature = dto.BodyTemperature,
            FaceColor = dto.FaceColor,
            BodyPosition = dto.BodyPosition,
            CreatedAt = now,
            CreatedBy = staffId
        };

        _context.InfantSleepChecks.Add(record);
        await _context.SaveChangesAsync();

        var child = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ChildId == dto.ChildId)
            .Select(c => new { c.FamilyName, c.FirstName })
            .FirstOrDefaultAsync();

        var staff = await _context.Staff
            .Where(s => s.NurseryId == nurseryId && s.StaffId == staffId)
            .Select(s => s.Name)
            .FirstOrDefaultAsync();

        return new InfantSleepCheckDto
        {
            Id = record.Id,
            NurseryId = record.NurseryId,
            ChildId = record.ChildId,
            ChildName = child != null ? $"{child.FamilyName} {child.FirstName}" : "不明",
            RecordDate = record.RecordDate,
            SleepSequence = record.SleepSequence,
            CheckTime = checkTime.ToString(@"hh\:mm"),
            BreathingStatus = record.BreathingStatus,
            HeadDirection = record.HeadDirection,
            BodyTemperature = record.BodyTemperature,
            FaceColor = record.FaceColor,
            BodyPosition = record.BodyPosition,
            CreatedByName = staff ?? "不明",
            CreatedAt = record.CreatedAt,
            CreatedBy = record.CreatedBy
        };
    }

    public async Task<bool> UpdateSleepCheckAsync(int id, UpdateInfantSleepCheckDto dto, int nurseryId, int staffId)
    {
        var record = await _context.InfantSleepChecks
            .FirstOrDefaultAsync(sc => sc.Id == id && sc.NurseryId == nurseryId);

        if (record == null)
        {
            return false;
        }

        var now = GetJstNow();

        record.BreathingStatus = dto.BreathingStatus;
        record.HeadDirection = dto.HeadDirection;
        record.BodyTemperature = dto.BodyTemperature;
        record.FaceColor = dto.FaceColor;
        record.BodyPosition = dto.BodyPosition;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteSleepCheckAsync(int id, int nurseryId)
    {
        var record = await _context.InfantSleepChecks
            .FirstOrDefaultAsync(sc => sc.Id == id && sc.NurseryId == nurseryId);

        if (record == null)
        {
            return false;
        }

        _context.InfantSleepChecks.Remove(record);
        await _context.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// 生年月日から月齢を計算
    /// </summary>
    private int CalculateAgeInMonths(DateTime birthDate)
    {
        var today = GetJstNow().Date;
        var months = (today.Year - birthDate.Year) * 12 + today.Month - birthDate.Month;
        if (today.Day < birthDate.Day)
        {
            months--;
        }
        return Math.Max(0, months);
    }
}
