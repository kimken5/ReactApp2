using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs.InfantRecords;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services;

/// <summary>
/// 乳児生活記録管理サービス実装クラス
/// 0歳児向けの生活記録の業務ロジックを提供
/// </summary>
public class InfantRecordService : IInfantRecordService
{
    private readonly KindergartenDbContext _context;
    private readonly ILogger<InfantRecordService> _logger;

    public InfantRecordService(
        KindergartenDbContext context,
        ILogger<InfantRecordService> logger)
    {
        _context = context;
        _logger = logger;
    }

    private DateTime GetJstNow() => TimeZoneInfo.ConvertTimeFromUtc(
        DateTime.UtcNow,
        TimeZoneInfo.FindSystemTimeZoneById("Tokyo Standard Time")
    );

    // ===== ミルク記録 =====
    public async Task<IEnumerable<InfantMilkDto>> GetMilkRecordsAsync(int nurseryId, string classId, DateTime date)
    {
        var childIds = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ClassId == classId && c.IsActive)
            .Select(c => c.ChildId)
            .ToListAsync();

        _logger.LogInformation("ミルク記録取得: NurseryId={NurseryId}, ClassId={ClassId}, Date={Date}, ChildIds={ChildIds}",
            nurseryId, classId, date.Date, string.Join(",", childIds));

        var records = await _context.InfantMilks
            .Where(m => m.NurseryId == nurseryId &&
                       childIds.Contains(m.ChildId) &&
                       m.RecordDate == date.Date)
            .ToListAsync();

        _logger.LogInformation("ミルク記録取得結果: {Count}件", records.Count);

        var children = await _context.Children
            .Where(c => c.NurseryId == nurseryId && childIds.Contains(c.ChildId))
            .Select(c => new { c.ChildId, c.FamilyName, c.FirstName })
            .ToDictionaryAsync(c => c.ChildId);

        return records.Select(r => new InfantMilkDto
        {
            NurseryId = r.NurseryId,
            ChildId = r.ChildId,
            ChildName = children.TryGetValue(r.ChildId, out var child)
                ? $"{child.FamilyName} {child.FirstName}"
                : "不明",
            RecordDate = r.RecordDate,
            MilkTime = r.MilkTime.ToString(@"hh\:mm"), // TimeSpan to hh:mm string
            AmountMl = r.AmountMl,
            Notes = r.Notes,
            CreatedAt = r.CreatedAt,
            CreatedBy = r.CreatedBy,
            UpdatedAt = r.UpdatedAt,
            UpdatedBy = r.UpdatedBy
        });
    }

    public async Task<InfantMilkDto> CreateMilkRecordAsync(CreateInfantMilkDto dto, int nurseryId, int staffId)
    {
        var now = GetJstNow();

        // HH:mm形式の文字列をTimeSpanに変換
        if (!TimeSpan.TryParse(dto.MilkTime, out var milkTime))
        {
            throw new ArgumentException($"無効な時刻形式です: {dto.MilkTime}");
        }

        var record = new InfantMilk
        {
            NurseryId = nurseryId,
            ChildId = dto.ChildId,
            RecordDate = dto.RecordDate.Date,
            MilkTime = milkTime,
            AmountMl = dto.AmountMl,
            Notes = dto.Notes,
            CreatedAt = now,
            CreatedBy = staffId,
            UpdatedAt = now,
            UpdatedBy = staffId
        };

        _context.InfantMilks.Add(record);
        await _context.SaveChangesAsync();

        var child = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ChildId == dto.ChildId)
            .Select(c => new { c.FamilyName, c.FirstName })
            .FirstOrDefaultAsync();

        return new InfantMilkDto
        {
            NurseryId = record.NurseryId,
            ChildId = record.ChildId,
            ChildName = child != null ? $"{child.FamilyName} {child.FirstName}" : "不明",
            RecordDate = record.RecordDate,
            MilkTime = record.MilkTime.ToString(@"hh\:mm"), // TimeSpan to HH:mm string
            AmountMl = record.AmountMl,
            Notes = record.Notes,
            CreatedAt = record.CreatedAt,
            CreatedBy = record.CreatedBy,
            UpdatedAt = record.UpdatedAt,
            UpdatedBy = record.UpdatedBy
        };
    }

    public async Task<bool> UpdateMilkRecordAsync(UpdateInfantMilkDto dto, int nurseryId, int staffId)
    {
        // HH:mm形式の文字列をTimeSpanに変換
        if (!TimeSpan.TryParse(dto.MilkTime, out var milkTime))
        {
            throw new ArgumentException($"無効な時刻形式です: {dto.MilkTime}");
        }

        var record = await _context.InfantMilks
            .FirstOrDefaultAsync(m => m.NurseryId == nurseryId &&
                                     m.ChildId == dto.ChildId &&
                                     m.RecordDate == dto.RecordDate.Date &&
                                     m.MilkTime == milkTime);

        if (record == null)
            return false;

        record.AmountMl = dto.AmountMl;
        record.Notes = dto.Notes;
        record.UpdatedAt = GetJstNow();
        record.UpdatedBy = staffId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteMilkRecordAsync(int nurseryId, int childId, DateTime date, TimeSpan time)
    {
        var record = await _context.InfantMilks
            .FirstOrDefaultAsync(m => m.NurseryId == nurseryId &&
                                     m.ChildId == childId &&
                                     m.RecordDate == date.Date &&
                                     m.MilkTime == time);

        if (record == null)
            return false;

        _context.InfantMilks.Remove(record);
        await _context.SaveChangesAsync();
        return true;
    }

    // ===== 食事記録 =====
    public async Task<IEnumerable<InfantMealDto>> GetMealRecordsAsync(int nurseryId, string classId, DateTime date)
    {
        var childIds = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ClassId == classId && c.IsActive)
            .Select(c => c.ChildId)
            .ToListAsync();

        var records = await _context.InfantMeals
            .Where(m => m.NurseryId == nurseryId &&
                       childIds.Contains(m.ChildId) &&
                       m.RecordDate == date.Date)
            .ToListAsync();

        var children = await _context.Children
            .Where(c => c.NurseryId == nurseryId && childIds.Contains(c.ChildId))
            .Select(c => new { c.ChildId, c.FamilyName, c.FirstName })
            .ToDictionaryAsync(c => c.ChildId);

        return records.Select(r => new InfantMealDto
        {
            NurseryId = r.NurseryId,
            ChildId = r.ChildId,
            ChildName = children.TryGetValue(r.ChildId, out var child)
                ? $"{child.FamilyName} {child.FirstName}"
                : "不明",
            RecordDate = r.RecordDate,
            MealType = r.MealType,
            MealTime = $"{r.MealTime.Hours:D2}:{r.MealTime.Minutes:D2}", // TimeSpanを文字列に変換 (24時間形式)
            OverallAmount = r.OverallAmount,
            Notes = r.Notes, // メモを追加
            CreatedAt = r.CreatedAt,
            CreatedBy = r.CreatedBy,
            UpdatedAt = r.UpdatedAt,
            UpdatedBy = r.UpdatedBy
        });
    }

    public async Task<InfantMealDto> CreateMealRecordAsync(CreateInfantMealDto dto, int nurseryId, int staffId)
    {
        // 文字列をTimeSpanに変換
        if (!TimeSpan.TryParse(dto.MealTime, out var mealTime))
        {
            throw new ArgumentException("無効な時刻形式です", nameof(dto.MealTime));
        }

        var now = GetJstNow();
        var record = new InfantMeal
        {
            NurseryId = nurseryId,
            ChildId = dto.ChildId,
            RecordDate = dto.RecordDate.Date,
            MealType = dto.MealType,
            MealTime = mealTime,
            OverallAmount = dto.OverallAmount,
            Notes = dto.Notes, // メモを保存
            CreatedAt = now,
            CreatedBy = staffId,
            UpdatedAt = now,
            UpdatedBy = staffId
        };

        _context.InfantMeals.Add(record);
        await _context.SaveChangesAsync();

        var child = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ChildId == dto.ChildId)
            .Select(c => new { c.FamilyName, c.FirstName })
            .FirstOrDefaultAsync();

        return new InfantMealDto
        {
            NurseryId = record.NurseryId,
            ChildId = record.ChildId,
            ChildName = child != null ? $"{child.FamilyName} {child.FirstName}" : "不明",
            RecordDate = record.RecordDate,
            MealType = record.MealType,
            MealTime = $"{record.MealTime.Hours:D2}:{record.MealTime.Minutes:D2}", // TimeSpanを文字列に変換 (24時間形式)
            OverallAmount = record.OverallAmount,
            Notes = record.Notes, // メモを追加
            CreatedAt = record.CreatedAt,
            CreatedBy = record.CreatedBy,
            UpdatedAt = record.UpdatedAt,
            UpdatedBy = record.UpdatedBy
        };
    }

    public async Task<bool> UpdateMealRecordAsync(UpdateInfantMealDto dto, int nurseryId, int staffId)
    {
        // 文字列をTimeSpanに変換
        if (!TimeSpan.TryParse(dto.MealTime, out var mealTime))
        {
            throw new ArgumentException("無効な時刻形式です", nameof(dto.MealTime));
        }

        var record = await _context.InfantMeals
            .FirstOrDefaultAsync(m => m.NurseryId == nurseryId &&
                                     m.ChildId == dto.ChildId &&
                                     m.RecordDate == dto.RecordDate.Date &&
                                     m.MealTime == mealTime);

        if (record == null)
            return false;

        record.MealType = dto.MealType;
        record.OverallAmount = dto.OverallAmount;
        record.Notes = dto.Notes; // メモを更新
        record.UpdatedAt = GetJstNow();
        record.UpdatedBy = staffId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteMealRecordAsync(int nurseryId, int childId, DateTime date, TimeSpan mealTime)
    {
        var record = await _context.InfantMeals
            .FirstOrDefaultAsync(m => m.NurseryId == nurseryId &&
                                     m.ChildId == childId &&
                                     m.RecordDate == date.Date &&
                                     m.MealTime == mealTime);

        if (record == null)
            return false;

        _context.InfantMeals.Remove(record);
        await _context.SaveChangesAsync();
        return true;
    }

    // ===== 睡眠記録 =====
    public async Task<IEnumerable<InfantSleepDto>> GetSleepRecordsAsync(int nurseryId, string classId, DateTime date)
    {
        var childIds = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ClassId == classId && c.IsActive)
            .Select(c => c.ChildId)
            .ToListAsync();

        var records = await _context.InfantSleeps
            .Where(s => s.NurseryId == nurseryId &&
                       childIds.Contains(s.ChildId) &&
                       s.RecordDate == date.Date)
            .ToListAsync();

        var children = await _context.Children
            .Where(c => c.NurseryId == nurseryId && childIds.Contains(c.ChildId))
            .Select(c => new { c.ChildId, c.FamilyName, c.FirstName })
            .ToDictionaryAsync(c => c.ChildId);

        return records.Select(r => new InfantSleepDto
        {
            NurseryId = r.NurseryId,
            ChildId = r.ChildId,
            ChildName = children.TryGetValue(r.ChildId, out var child)
                ? $"{child.FamilyName} {child.FirstName}"
                : "不明",
            RecordDate = r.RecordDate,
            SleepSequence = r.SleepSequence,
            StartTime = r.StartTime,
            EndTime = r.EndTime,
            DurationMinutes = r.DurationMinutes,
            SleepQuality = r.SleepQuality,
            Notes = r.Notes,
            CreatedAt = r.CreatedAt,
            CreatedBy = r.CreatedBy,
            UpdatedAt = r.UpdatedAt,
            UpdatedBy = r.UpdatedBy
        });
    }

    public async Task<InfantSleepDto> CreateSleepRecordAsync(CreateInfantSleepDto dto, int nurseryId, int staffId)
    {
        var now = GetJstNow();
        var record = new InfantSleep
        {
            NurseryId = nurseryId,
            ChildId = dto.ChildId,
            RecordDate = dto.RecordDate.Date,
            SleepSequence = dto.SleepSequence,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            SleepQuality = dto.SleepQuality,
            Notes = dto.Notes,
            CreatedAt = now,
            CreatedBy = staffId,
            UpdatedAt = now,
            UpdatedBy = staffId
        };

        _context.InfantSleeps.Add(record);
        await _context.SaveChangesAsync();

        var child = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ChildId == dto.ChildId)
            .Select(c => new { c.FamilyName, c.FirstName })
            .FirstOrDefaultAsync();

        return new InfantSleepDto
        {
            NurseryId = record.NurseryId,
            ChildId = record.ChildId,
            ChildName = child != null ? $"{child.FamilyName} {child.FirstName}" : "不明",
            RecordDate = record.RecordDate,
            SleepSequence = record.SleepSequence,
            StartTime = record.StartTime,
            EndTime = record.EndTime,
            DurationMinutes = record.DurationMinutes,
            SleepQuality = record.SleepQuality,
            Notes = record.Notes,
            CreatedAt = record.CreatedAt,
            CreatedBy = record.CreatedBy,
            UpdatedAt = record.UpdatedAt,
            UpdatedBy = record.UpdatedBy
        };
    }

    public async Task<bool> UpdateSleepRecordAsync(UpdateInfantSleepDto dto, int nurseryId, int staffId)
    {
        var record = await _context.InfantSleeps
            .FirstOrDefaultAsync(s => s.NurseryId == nurseryId &&
                                     s.ChildId == dto.ChildId &&
                                     s.RecordDate == dto.RecordDate.Date &&
                                     s.SleepSequence == dto.SleepSequence);

        if (record == null)
            return false;

        record.StartTime = dto.StartTime;
        record.EndTime = dto.EndTime;
        record.SleepQuality = dto.SleepQuality;
        record.Notes = dto.Notes;
        record.UpdatedAt = GetJstNow();
        record.UpdatedBy = staffId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteSleepRecordAsync(int nurseryId, int childId, DateTime date, int sleepSequence)
    {
        var record = await _context.InfantSleeps
            .FirstOrDefaultAsync(s => s.NurseryId == nurseryId &&
                                     s.ChildId == childId &&
                                     s.RecordDate == date.Date &&
                                     s.SleepSequence == sleepSequence);

        if (record == null)
            return false;

        _context.InfantSleeps.Remove(record);
        await _context.SaveChangesAsync();
        return true;
    }

    // ===== 排泄記録 =====
    public async Task<IEnumerable<InfantToiletingDto>> GetToiletingRecordsAsync(int nurseryId, string classId, DateTime date)
    {
        var childIds = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ClassId == classId && c.IsActive)
            .Select(c => c.ChildId)
            .ToListAsync();

        var records = await _context.InfantToiletings
            .Where(t => t.NurseryId == nurseryId &&
                       childIds.Contains(t.ChildId) &&
                       t.RecordDate == date.Date)
            .ToListAsync();

        var children = await _context.Children
            .Where(c => c.NurseryId == nurseryId && childIds.Contains(c.ChildId))
            .Select(c => new { c.ChildId, c.FamilyName, c.FirstName })
            .ToDictionaryAsync(c => c.ChildId);

        return records.Select(r => new InfantToiletingDto
        {
            NurseryId = r.NurseryId,
            ChildId = r.ChildId,
            ChildName = children.TryGetValue(r.ChildId, out var child)
                ? $"{child.FamilyName} {child.FirstName}"
                : "不明",
            RecordDate = r.RecordDate,
            ToiletingTime = r.ToiletingTime,
            HasUrine = r.HasUrine,
            UrineAmount = r.UrineAmount,
            HasStool = r.HasStool,
            BowelAmount = r.BowelAmount,
            BowelCondition = r.BowelCondition,
            // BowelColor removed
            CreatedAt = r.CreatedAt,
            CreatedBy = r.CreatedBy,
            UpdatedAt = r.UpdatedAt,
            UpdatedBy = r.UpdatedBy
        });
    }

    public async Task<InfantToiletingDto> CreateToiletingRecordAsync(CreateInfantToiletingDto dto, int nurseryId, int staffId)
    {
        var now = GetJstNow();
        var record = new InfantToileting
        {
            NurseryId = nurseryId,
            ChildId = dto.ChildId,
            RecordDate = dto.RecordDate.Date,
            ToiletingTime = dto.ToiletingTime,
            HasUrine = dto.HasUrine,
            UrineAmount = dto.UrineAmount,
            HasStool = dto.HasStool,
            BowelAmount = dto.BowelAmount,
            BowelCondition = dto.BowelCondition,
            // BowelColor removed
            CreatedAt = now,
            CreatedBy = staffId,
            UpdatedAt = now,
            UpdatedBy = staffId
        };

        _context.InfantToiletings.Add(record);
        await _context.SaveChangesAsync();

        var child = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ChildId == dto.ChildId)
            .Select(c => new { c.FamilyName, c.FirstName })
            .FirstOrDefaultAsync();

        return new InfantToiletingDto
        {
            NurseryId = record.NurseryId,
            ChildId = record.ChildId,
            ChildName = child != null ? $"{child.FamilyName} {child.FirstName}" : "不明",
            RecordDate = record.RecordDate,
            ToiletingTime = record.ToiletingTime,
            HasUrine = record.HasUrine,
            UrineAmount = record.UrineAmount,
            HasStool = record.HasStool,
            BowelAmount = record.BowelAmount,
            BowelCondition = record.BowelCondition,
            // BowelColor removed
            CreatedAt = record.CreatedAt,
            CreatedBy = record.CreatedBy,
            UpdatedAt = record.UpdatedAt,
            UpdatedBy = record.UpdatedBy
        };
    }

    public async Task<bool> UpdateToiletingRecordAsync(UpdateInfantToiletingDto dto, int nurseryId, int staffId)
    {
        var record = await _context.InfantToiletings
            .FirstOrDefaultAsync(t => t.NurseryId == nurseryId &&
                                     t.ChildId == dto.ChildId &&
                                     t.RecordDate == dto.RecordDate.Date);

        if (record == null)
            return false;

        record.ToiletingTime = dto.ToiletingTime;
        record.HasUrine = dto.HasUrine;
        record.UrineAmount = dto.UrineAmount;
        record.HasStool = dto.HasStool;
        record.BowelAmount = dto.BowelAmount;
        record.BowelCondition = dto.BowelCondition;
        // BowelColor removed
        record.UpdatedAt = GetJstNow();
        record.UpdatedBy = staffId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteToiletingRecordAsync(int nurseryId, int childId, DateTime date)
    {
        var record = await _context.InfantToiletings
            .FirstOrDefaultAsync(t => t.NurseryId == nurseryId &&
                                     t.ChildId == childId &&
                                     t.RecordDate == date.Date);

        if (record == null)
            return false;

        _context.InfantToiletings.Remove(record);
        await _context.SaveChangesAsync();
        return true;
    }

    // ===== 機嫌記録 =====
    public async Task<IEnumerable<InfantMoodDto>> GetMoodRecordsAsync(int nurseryId, string classId, DateTime date)
    {
        var childIds = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ClassId == classId && c.IsActive)
            .Select(c => c.ChildId)
            .ToListAsync();

        var records = await _context.InfantMoods
            .Where(m => m.NurseryId == nurseryId &&
                       childIds.Contains(m.ChildId) &&
                       m.RecordDate == date.Date)
            .ToListAsync();

        var children = await _context.Children
            .Where(c => c.NurseryId == nurseryId && childIds.Contains(c.ChildId))
            .Select(c => new { c.ChildId, c.FamilyName, c.FirstName })
            .ToDictionaryAsync(c => c.ChildId);

        return records.Select(r => new InfantMoodDto
        {
            NurseryId = r.NurseryId,
            ChildId = r.ChildId,
            ChildName = children.TryGetValue(r.ChildId, out var child)
                ? $"{child.FamilyName} {child.FirstName}"
                : "不明",
            RecordDate = r.RecordDate,
            RecordTime = r.RecordTime,
            MoodState = r.MoodState,
            Notes = r.Notes,
            CreatedAt = r.CreatedAt,
            CreatedBy = r.CreatedBy,
            UpdatedAt = r.UpdatedAt,
            UpdatedBy = r.UpdatedBy
        });
    }

    public async Task<InfantMoodDto> CreateMoodRecordAsync(CreateInfantMoodDto dto, int nurseryId, int staffId)
    {
        var now = GetJstNow();
        var record = new InfantMood
        {
            NurseryId = nurseryId,
            ChildId = dto.ChildId,
            RecordDate = dto.RecordDate.Date,
            RecordTime = dto.RecordTime,
            MoodState = dto.MoodState,
            Notes = dto.Notes,
            CreatedAt = now,
            CreatedBy = staffId,
            UpdatedAt = now,
            UpdatedBy = staffId
        };

        _context.InfantMoods.Add(record);
        await _context.SaveChangesAsync();

        var child = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ChildId == dto.ChildId)
            .Select(c => new { c.FamilyName, c.FirstName })
            .FirstOrDefaultAsync();

        return new InfantMoodDto
        {
            NurseryId = record.NurseryId,
            ChildId = record.ChildId,
            ChildName = child != null ? $"{child.FamilyName} {child.FirstName}" : "不明",
            RecordDate = record.RecordDate,
            RecordTime = record.RecordTime,
            MoodState = record.MoodState,
            Notes = record.Notes,
            CreatedAt = record.CreatedAt,
            CreatedBy = record.CreatedBy,
            UpdatedAt = record.UpdatedAt,
            UpdatedBy = record.UpdatedBy
        };
    }

    public async Task<bool> UpdateMoodRecordAsync(UpdateInfantMoodDto dto, int nurseryId, int staffId)
    {
        var record = await _context.InfantMoods
            .FirstOrDefaultAsync(m => m.NurseryId == nurseryId &&
                                     m.ChildId == dto.ChildId &&
                                     m.RecordDate == dto.RecordDate.Date &&
                                     m.RecordTime == dto.RecordTime);

        if (record == null)
            return false;

        record.MoodState = dto.MoodState;
        record.Notes = dto.Notes;
        record.UpdatedAt = GetJstNow();
        record.UpdatedBy = staffId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteMoodRecordAsync(int nurseryId, int childId, DateTime date, TimeOnly recordTime)
    {
        var record = await _context.InfantMoods
            .FirstOrDefaultAsync(m => m.NurseryId == nurseryId &&
                                     m.ChildId == childId &&
                                     m.RecordDate == date.Date &&
                                     m.RecordTime == recordTime);

        if (record == null)
            return false;

        _context.InfantMoods.Remove(record);
        await _context.SaveChangesAsync();
        return true;
    }

    // ===== 室温・湿度記録 =====
    public async Task<RoomEnvironmentDto?> GetRoomEnvironmentAsync(int nurseryId, string classId, DateTime date)
    {
        var record = await _context.RoomEnvironmentRecords
            .FirstOrDefaultAsync(r => r.NurseryId == nurseryId &&
                                     r.ClassId == classId &&
                                     r.RecordDate == date.Date);

        if (record == null)
            return null;

        var className = await _context.Classes
            .Where(c => c.NurseryId == nurseryId && c.ClassId == classId)
            .Select(c => c.Name)
            .FirstOrDefaultAsync();

        return new RoomEnvironmentDto
        {
            NurseryId = record.NurseryId,
            ClassId = record.ClassId,
            ClassName = className ?? "不明",
            RecordDate = record.RecordDate,
            Temperature = record.Temperature,
            Humidity = record.Humidity,
            RecordedAt = record.RecordedAt,
            Notes = record.Notes,
            CreatedAt = record.CreatedAt,
            CreatedBy = record.CreatedBy,
            UpdatedAt = record.UpdatedAt,
            UpdatedBy = record.UpdatedBy
        };
    }

    public async Task<RoomEnvironmentDto> SaveRoomEnvironmentAsync(UpdateRoomEnvironmentDto dto, int nurseryId, int staffId)
    {
        var now = GetJstNow();
        var record = await _context.RoomEnvironmentRecords
            .FirstOrDefaultAsync(r => r.NurseryId == nurseryId &&
                                     r.ClassId == dto.ClassId &&
                                     r.RecordDate == dto.RecordDate.Date);

        if (record == null)
        {
            // Create new record
            record = new RoomEnvironmentRecord
            {
                NurseryId = nurseryId,
                ClassId = dto.ClassId,
                RecordDate = dto.RecordDate.Date,
                Temperature = dto.Temperature,
                Humidity = dto.Humidity,
                RecordedAt = dto.RecordedAt,
                Notes = dto.Notes,
                CreatedAt = now,
                CreatedBy = staffId,
                UpdatedAt = now,
                UpdatedBy = staffId
            };
            _context.RoomEnvironmentRecords.Add(record);
        }
        else
        {
            // Update existing record
            record.Temperature = dto.Temperature;
            record.Humidity = dto.Humidity;
            record.RecordedAt = dto.RecordedAt;
            record.Notes = dto.Notes;
            record.UpdatedAt = now;
            record.UpdatedBy = staffId;
        }

        await _context.SaveChangesAsync();

        var className = await _context.Classes
            .Where(c => c.NurseryId == nurseryId && c.ClassId == dto.ClassId)
            .Select(c => c.Name)
            .FirstOrDefaultAsync();

        return new RoomEnvironmentDto
        {
            NurseryId = record.NurseryId,
            ClassId = record.ClassId,
            ClassName = className ?? "不明",
            RecordDate = record.RecordDate,
            Temperature = record.Temperature,
            Humidity = record.Humidity,
            RecordedAt = record.RecordedAt,
            Notes = record.Notes,
            CreatedAt = record.CreatedAt,
            CreatedBy = record.CreatedBy,
            UpdatedAt = record.UpdatedAt,
            UpdatedBy = record.UpdatedBy
        };
    }

    // ===== クラス園児一覧取得 =====

    public async Task<ClassChildrenResponse> GetClassChildrenAsync(int nurseryId, string classId, DateTime date)
    {
        // クラス情報を取得
        var classInfo = await _context.Classes
            .Where(c => c.NurseryId == nurseryId && c.ClassId == classId)
            .Select(c => new { c.ClassId, c.Name })
            .FirstOrDefaultAsync();

        if (classInfo == null)
        {
            return new ClassChildrenResponse
            {
                ClassId = classId,
                ClassName = "",
                Children = new List<ChildInfoDto>()
            };
        }

        // クラス内の園児一覧を取得（年齢を計算）
        var children = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ClassId == classId && c.IsActive)
            .OrderBy(c => c.ChildId)
            .ToListAsync();

        var childDtos = children.Select(c => new ChildInfoDto
        {
            ChildId = c.ChildId,
            ChildName = $"{c.FamilyName} {c.FirstName}",
            AgeMonths = CalculateAgeInMonths(c.DateOfBirth, date)
        }).ToList();

        return new ClassChildrenResponse
        {
            ClassId = classInfo.ClassId,
            ClassName = classInfo.Name,
            Children = childDtos
        };
    }

    private int CalculateAgeInMonths(DateTime birthDate, DateTime referenceDate)
    {
        var months = ((referenceDate.Year - birthDate.Year) * 12) + referenceDate.Month - birthDate.Month;
        if (referenceDate.Day < birthDate.Day)
        {
            months--;
        }
        return months;
    }
}
