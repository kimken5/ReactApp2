using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs.InfantRecords;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services;

public class InfantRecordService : IInfantRecordService
{
    private readonly KindergartenDbContext _context;
    private readonly ILogger<InfantRecordService> _logger;
    private static readonly TimeZoneInfo JapanTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Tokyo Standard Time");

    public InfantRecordService(
        KindergartenDbContext context,
        ILogger<InfantRecordService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 現在時刻をUTCで取得し、日本時間に変換してから再度UTCに戻ぁE
    /// �E�データベ�EスにはUTCで保存するが、実質皁E��日本時間の値になる！E
    /// </summary>
    private DateTime GetJapanDateTime()
    {
        var utcNow = DateTime.UtcNow;
        var japanNow = TimeZoneInfo.ConvertTimeFromUtc(utcNow, JapanTimeZone);
        return DateTime.SpecifyKind(japanNow, DateTimeKind.Utc);
    }

    public async Task<WeeklyRecordResponseDto> GetWeeklyRecordsAsync(
        int nurseryId,
        string classId,
        DateTime weekStartDate,
        CancellationToken cancellationToken = default)
    {
        var weekEndDate = weekStartDate.AddDays(6);

        var children = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.ClassId == classId)
            .OrderBy(c => c.FirstName)
            .Select(c => new { c.ChildId, c.FirstName })
            .ToListAsync(cancellationToken);

        var childIds = children.Select(c => c.ChildId).ToList();

        var temperatures = await _context.InfantTemperatures
            .Where(t => t.NurseryId == nurseryId
                && childIds.Contains(t.ChildId)
                && t.RecordDate >= weekStartDate
                && t.RecordDate <= weekEndDate)
            .ToListAsync(cancellationToken);

        var meals = await _context.InfantMeals
            .Where(m => m.NurseryId == nurseryId
                && childIds.Contains(m.ChildId)
                && m.RecordDate >= weekStartDate
                && m.RecordDate <= weekEndDate)
            .ToListAsync(cancellationToken);

        var moods = await _context.InfantMoods
            .Where(m => m.NurseryId == nurseryId
                && childIds.Contains(m.ChildId)
                && m.RecordDate >= weekStartDate
                && m.RecordDate <= weekEndDate)
            .ToListAsync(cancellationToken);

        var sleeps = await _context.InfantSleeps
            .Where(s => s.NurseryId == nurseryId
                && childIds.Contains(s.ChildId)
                && s.RecordDate >= weekStartDate
                && s.RecordDate <= weekEndDate)
            .ToListAsync(cancellationToken);

        var toileting = await _context.InfantToiletings
            .Where(t => t.NurseryId == nurseryId
                && childIds.Contains(t.ChildId)
                && t.RecordDate >= weekStartDate
                && t.RecordDate <= weekEndDate)
            .ToListAsync(cancellationToken);

        var parentNotes = await _context.ParentMorningNotes
            .Where(p => p.NurseryId == nurseryId
                && childIds.Contains(p.ChildId)
                && p.RecordDate >= weekStartDate
                && p.RecordDate <= weekEndDate
                && !p.IsDraft)
            .ToListAsync(cancellationToken);

        var childRecords = children.Select(child =>
        {
            var dailyRecords = BuildDailyRecords(
                child.ChildId,
                weekStartDate,
                weekEndDate,
                temperatures,
                meals,
                moods,
                sleeps,
                toileting,
                parentNotes);

            return new ChildWeeklyRecordDto
            {
                ChildId = child.ChildId,
                FirstName = child.FirstName,
                DailyRecords = dailyRecords
            };
        }).ToList();

        return new WeeklyRecordResponseDto
        {
            Children = childRecords
        };
    }

    private Dictionary<string, DailyRecordDto> BuildDailyRecords(
        int childId,
        DateTime weekStartDate,
        DateTime weekEndDate,
        List<InfantTemperature> temperatures,
        List<InfantMeal> meals,
        List<InfantMood> moods,
        List<InfantSleep> sleeps,
        List<InfantToileting> toileting,
        List<ParentMorningNote> parentNotes)
    {
        var dailyRecords = new Dictionary<string, DailyRecordDto>();

        for (var date = weekStartDate; date <= weekEndDate; date = date.AddDays(1))
        {
            var dateKey = date.ToString("yyyy-MM-dd");

            var homeTemp = temperatures.FirstOrDefault(t =>
                t.ChildId == childId
                && t.RecordDate.Date == date.Date
                && t.MeasurementType == "Home");

            var parentNote = parentNotes.FirstOrDefault(p =>
                p.ChildId == childId
                && p.RecordDate.Date == date.Date);

            var morningTemp = temperatures.FirstOrDefault(t =>
                t.ChildId == childId
                && t.RecordDate.Date == date.Date
                && t.MeasurementType == "Morning");

            var morningMood = moods.FirstOrDefault(m =>
                m.ChildId == childId
                && m.RecordDate.Date == date.Date
                && m.MoodTime == "Morning");

            var breakfast = meals.FirstOrDefault(m =>
                m.ChildId == childId
                && m.RecordDate.Date == date.Date
                && m.MealType == "Breakfast");

            var afternoonTemp = temperatures.FirstOrDefault(t =>
                t.ChildId == childId
                && t.RecordDate.Date == date.Date
                && t.MeasurementType == "Afternoon");

            var afternoonMood = moods.FirstOrDefault(m =>
                m.ChildId == childId
                && m.RecordDate.Date == date.Date
                && m.MoodTime == "Afternoon");

            var lunch = meals.FirstOrDefault(m =>
                m.ChildId == childId
                && m.RecordDate.Date == date.Date
                && m.MealType == "Lunch");

            var snack = meals.FirstOrDefault(m =>
                m.ChildId == childId
                && m.RecordDate.Date == date.Date
                && m.MealType == "Snack");

            var sleep = sleeps.FirstOrDefault(s =>
                s.ChildId == childId
                && s.RecordDate.Date == date.Date
                && s.SleepSequence == 1);

            var toiletingRecord = toileting.FirstOrDefault(t =>
                t.ChildId == childId
                && t.RecordDate.Date == date.Date);

            dailyRecords[dateKey] = new DailyRecordDto
            {
                Home = new HomeRecordDto
                {
                    Temperature = homeTemp != null ? new TemperatureRecordDto
                    {
                        Value = homeTemp.Temperature.ToString("F1"), // 小数点1桁の文字列 (例: "36.0")
                        Time = homeTemp.MeasuredAt.ToString("HH:mm"),
                        Readonly = homeTemp.CreatedByType == "Parent"
                    } : null,
                    ParentNote = parentNote != null ? new ParentNoteRecordDto
                    {
                        Text = parentNote.Note,
                        Readonly = true
                    } : null
                },
                Morning = new MorningRecordDto
                {
                    Temperature = morningTemp != null ? new TemperatureRecordDto
                    {
                        Value = morningTemp.Temperature.ToString("F1"), // 小数点1桁の文字列 (例: "36.0")
                        Time = morningTemp.MeasuredAt.ToString("HH:mm"),
                        Readonly = false
                    } : null,
                    Mood = morningMood != null ? new MoodRecordDto
                    {
                        State = morningMood.MoodState,
                        Readonly = false
                    } : null,
                    Snack = breakfast != null ? new MealRecordDto
                    {
                        Amount = breakfast.OverallAmount,
                        Readonly = false
                    } : null
                },
                Afternoon = new AfternoonRecordDto
                {
                    Temperature = afternoonTemp != null ? new TemperatureRecordDto
                    {
                        Value = afternoonTemp.Temperature.ToString("F1"), // 小数点1桁の文字列 (例: "36.0")
                        Time = afternoonTemp.MeasuredAt.ToString("HH:mm"),
                        Readonly = false
                    } : null,
                    Mood = afternoonMood != null ? new MoodRecordDto
                    {
                        State = afternoonMood.MoodState,
                        Readonly = false
                    } : null,
                    Lunch = lunch != null ? new MealRecordDto
                    {
                        Amount = lunch.OverallAmount,
                        Readonly = false
                    } : null,
                    Snack = snack != null ? new MealRecordDto
                    {
                        Amount = snack.OverallAmount,
                        Readonly = false
                    } : null,
                    Nap = sleep != null ? new SleepRecordDto
                    {
                        Start = sleep.StartTime.ToString("HH:mm"),
                        End = sleep.EndTime?.ToString("HH:mm"),
                        Duration = sleep.DurationMinutes,
                        SleepQuality = sleep.SleepQuality,
                        Readonly = false
                    } : null
                },
                Toileting = toiletingRecord != null ? new ToiletingRecordDto
                {
                    UrineAmount = toiletingRecord.UrineAmount,
                    BowelCondition = toiletingRecord.BowelCondition,
                    BowelColor = toiletingRecord.BowelColor,
                    DiaperChangeCount = toiletingRecord.DiaperChangeCount,
                    Readonly = false
                } : null
            };
        }

        return dailyRecords;
    }

    public async Task UpdateTemperatureAsync(
        int nurseryId,
        int temperatureId,
        UpdateTemperatureDto dto,
        CancellationToken cancellationToken = default)
    {
        var measuredAt = DateTime.Parse($"{dto.RecordDate:yyyy-MM-dd} {dto.MeasurementTime}");

        var temperature = await _context.InfantTemperatures
            .FirstOrDefaultAsync(t =>
                t.NurseryId == nurseryId
                && t.ChildId == dto.ChildId
                && t.RecordDate == dto.RecordDate
                && t.MeasurementType == dto.MeasurementType,
                cancellationToken);

        if (temperature == null)
        {
            temperature = new InfantTemperature
            {
                NurseryId = nurseryId,
                ChildId = dto.ChildId,
                RecordDate = dto.RecordDate,
                MeasurementType = dto.MeasurementType,
                Temperature = dto.Temperature,
                MeasuredAt = measuredAt,
                IsAbnormal = dto.Temperature >= 37.5m,
                CreatedByType = "Staff",
                CreatedBy = dto.UpdatedBy,
                UpdatedBy = dto.UpdatedBy,
                CreatedAt = GetJapanDateTime(),
                UpdatedAt = GetJapanDateTime()
            };
            _context.InfantTemperatures.Add(temperature);
        }
        else
        {
            temperature.Temperature = dto.Temperature;
            temperature.MeasuredAt = measuredAt;
            temperature.IsAbnormal = dto.Temperature >= 37.5m;
            temperature.UpdatedBy = dto.UpdatedBy;
            temperature.UpdatedAt = GetJapanDateTime();
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateMealAsync(
        int nurseryId,
        int mealId,
        UpdateMealDto dto,
        CancellationToken cancellationToken = default)
    {
        var meal = await _context.InfantMeals
            .FirstOrDefaultAsync(m =>
                m.NurseryId == nurseryId
                && m.ChildId == dto.ChildId
                && m.RecordDate == dto.RecordDate
                && m.MealType == dto.MealType,
                cancellationToken);

        if (meal == null)
        {
            meal = new InfantMeal
            {
                NurseryId = nurseryId,
                ChildId = dto.ChildId,
                RecordDate = dto.RecordDate,
                MealType = dto.MealType,
                OverallAmount = dto.Amount,
                CreatedBy = dto.UpdatedBy,
                UpdatedBy = dto.UpdatedBy,
                CreatedAt = GetJapanDateTime(),
                UpdatedAt = GetJapanDateTime()
            };
            _context.InfantMeals.Add(meal);
        }
        else
        {
            meal.OverallAmount = dto.Amount;
            meal.UpdatedBy = dto.UpdatedBy;
            meal.UpdatedAt = GetJapanDateTime();
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateMoodAsync(
        int nurseryId,
        int moodId,
        UpdateMoodDto dto,
        CancellationToken cancellationToken = default)
    {
        var mood = await _context.InfantMoods
            .FirstOrDefaultAsync(m =>
                m.NurseryId == nurseryId
                && m.ChildId == dto.ChildId
                && m.RecordDate == dto.RecordDate
                && m.MoodTime == dto.MoodTime,
                cancellationToken);

        if (mood == null)
        {
            mood = new InfantMood
            {
                NurseryId = nurseryId,
                ChildId = dto.ChildId,
                RecordDate = dto.RecordDate,
                MoodTime = dto.MoodTime,
                MoodState = dto.State,
                CreatedBy = dto.UpdatedBy,
                UpdatedBy = dto.UpdatedBy,
                CreatedAt = GetJapanDateTime(),
                UpdatedAt = GetJapanDateTime()
            };
            _context.InfantMoods.Add(mood);
        }
        else
        {
            mood.MoodState = dto.State;
            mood.UpdatedBy = dto.UpdatedBy;
            mood.UpdatedAt = GetJapanDateTime();
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateSleepAsync(
        int nurseryId,
        int sleepId,
        UpdateSleepDto dto,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.Parse($"{dto.RecordDate:yyyy-MM-dd} {dto.StartTime}");
        var endTime = !string.IsNullOrEmpty(dto.EndTime)
            ? DateTime.Parse($"{dto.RecordDate:yyyy-MM-dd} {dto.EndTime}")
            : (DateTime?)null;

        var sleep = await _context.InfantSleeps
            .FirstOrDefaultAsync(s =>
                s.NurseryId == nurseryId
                && s.ChildId == dto.ChildId
                && s.RecordDate == dto.RecordDate
                && s.SleepSequence == dto.SleepSequence,
                cancellationToken);

        if (sleep == null)
        {
            sleep = new InfantSleep
            {
                NurseryId = nurseryId,
                ChildId = dto.ChildId,
                RecordDate = dto.RecordDate,
                SleepSequence = dto.SleepSequence,
                StartTime = startTime,
                EndTime = endTime,
                CreatedBy = dto.UpdatedBy,
                UpdatedBy = dto.UpdatedBy,
                CreatedAt = GetJapanDateTime(),
                UpdatedAt = GetJapanDateTime()
            };
            _context.InfantSleeps.Add(sleep);
        }
        else
        {
            sleep.StartTime = startTime;
            sleep.EndTime = endTime;
            sleep.UpdatedBy = dto.UpdatedBy;
            sleep.UpdatedAt = GetJapanDateTime();
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateToiletingAsync(
        int nurseryId,
        int childId,
        DateTime recordDate,
        UpdateToiletingDto dto,
        CancellationToken cancellationToken = default)
    {
        var toileting = await _context.InfantToiletings
            .FirstOrDefaultAsync(t =>
                t.NurseryId == nurseryId
                && t.ChildId == childId
                && t.RecordDate == recordDate,
                cancellationToken);

        if (toileting == null)
        {
            toileting = new InfantToileting
            {
                NurseryId = nurseryId,
                ChildId = childId,
                RecordDate = recordDate,
                ToiletingTime = GetJapanDateTime(),
                ToiletingType = "Mixed",
                UrineAmount = dto.UrineAmount,
                BowelCondition = dto.BowelCondition,
                BowelColor = dto.BowelColor,
                DiaperChangeCount = dto.DiaperChangeCount,
                CreatedBy = dto.UpdatedBy,
                UpdatedBy = dto.UpdatedBy,
                CreatedAt = GetJapanDateTime(),
                UpdatedAt = GetJapanDateTime()
            };
            _context.InfantToiletings.Add(toileting);
        }
        else
        {
            toileting.UrineAmount = dto.UrineAmount;
            toileting.BowelCondition = dto.BowelCondition;
            toileting.BowelColor = dto.BowelColor;
            toileting.DiaperChangeCount = dto.DiaperChangeCount;
            toileting.ToiletingTime = GetJapanDateTime();
            toileting.UpdatedBy = dto.UpdatedBy;
            toileting.UpdatedAt = GetJapanDateTime();
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> UpsertTemperatureAsync(
        int nurseryId,
        UpsertTemperatureDto dto,
        CancellationToken cancellationToken = default)
    {
        var existing = await _context.InfantTemperatures
            .FirstOrDefaultAsync(t =>
                t.NurseryId == nurseryId
                && t.ChildId == dto.ChildId
                && t.RecordDate.Date == dto.RecordDate.Date
                && t.MeasurementType == dto.MeasurementType,
                cancellationToken);

        if (existing == null)
        {
            var newRecord = new InfantTemperature
            {
                NurseryId = nurseryId,
                ChildId = dto.ChildId,
                RecordDate = dto.RecordDate,
                MeasurementType = dto.MeasurementType,
                Temperature = dto.Temperature,
                MeasuredAt = GetJapanDateTime(),
                CreatedBy = 1, // チE��クトップユーザー
                UpdatedBy = 1,
                CreatedAt = GetJapanDateTime(),
                UpdatedAt = GetJapanDateTime()
            };
            _context.InfantTemperatures.Add(newRecord);
            await _context.SaveChangesAsync(cancellationToken);
            return newRecord.ChildId; // 主キーがなぁE�EでChildIdを返す
        }
        else
        {
            existing.Temperature = dto.Temperature;
            existing.MeasuredAt = GetJapanDateTime();
            existing.UpdatedBy = 1;
            existing.UpdatedAt = GetJapanDateTime();
            await _context.SaveChangesAsync(cancellationToken);
            return existing.ChildId;
        }
    }

    public async Task<int> UpsertMealAsync(
        int nurseryId,
        UpsertMealDto dto,
        CancellationToken cancellationToken = default)
    {
        var existing = await _context.InfantMeals
            .FirstOrDefaultAsync(m =>
                m.NurseryId == nurseryId
                && m.ChildId == dto.ChildId
                && m.RecordDate.Date == dto.RecordDate.Date
                && m.MealType == dto.MealType,
                cancellationToken);

        if (existing == null)
        {
            var newRecord = new InfantMeal
            {
                NurseryId = nurseryId,
                ChildId = dto.ChildId,
                RecordDate = dto.RecordDate,
                MealType = dto.MealType,
                OverallAmount = dto.Amount,
                CreatedBy = 1, // チE��クトップユーザー
                UpdatedBy = 1,
                CreatedAt = GetJapanDateTime(),
                UpdatedAt = GetJapanDateTime()
            };
            _context.InfantMeals.Add(newRecord);
            await _context.SaveChangesAsync(cancellationToken);
            return newRecord.ChildId;
        }
        else
        {
            existing.OverallAmount = dto.Amount;
            existing.UpdatedBy = 1;
            existing.UpdatedAt = GetJapanDateTime();
            await _context.SaveChangesAsync(cancellationToken);
            return existing.ChildId;
        }
    }

    public async Task<int> UpsertMoodAsync(
        int nurseryId,
        UpsertMoodDto dto,
        CancellationToken cancellationToken = default)
    {
        var existing = await _context.InfantMoods
            .FirstOrDefaultAsync(m =>
                m.NurseryId == nurseryId
                && m.ChildId == dto.ChildId
                && m.RecordDate.Date == dto.RecordDate.Date
                && m.MoodTime == dto.MoodTime,
                cancellationToken);

        if (existing == null)
        {
            var newRecord = new InfantMood
            {
                NurseryId = nurseryId,
                ChildId = dto.ChildId,
                RecordDate = dto.RecordDate,
                MoodTime = dto.MoodTime,
                MoodState = dto.State,
                CreatedBy = 1, // チE��クトップユーザー
                UpdatedBy = 1,
                CreatedAt = GetJapanDateTime(),
                UpdatedAt = GetJapanDateTime()
            };
            _context.InfantMoods.Add(newRecord);
            await _context.SaveChangesAsync(cancellationToken);
            return newRecord.ChildId;
        }
        else
        {
            existing.MoodState = dto.State;
            existing.UpdatedBy = 1;
            existing.UpdatedAt = GetJapanDateTime();
            await _context.SaveChangesAsync(cancellationToken);
            return existing.ChildId;
        }
    }

    public async Task<int> UpsertToiletingAsync(
        int nurseryId,
        UpsertToiletingDto dto,
        CancellationToken cancellationToken = default)
    {
        var existing = await _context.InfantToiletings
            .FirstOrDefaultAsync(t =>
                t.NurseryId == nurseryId
                && t.ChildId == dto.ChildId
                && t.RecordDate.Date == dto.RecordDate.Date,
                cancellationToken);

        if (existing == null)
        {
            var newRecord = new InfantToileting
            {
                NurseryId = nurseryId,
                ChildId = dto.ChildId,
                RecordDate = dto.RecordDate,
                ToiletingTime = GetJapanDateTime(),
                ToiletingType = "Mixed",
                UrineAmount = dto.UrineAmount,
                BowelCondition = dto.BowelCondition,
                BowelColor = dto.BowelColor,
                DiaperChangeCount = dto.DiaperChangeCount,
                CreatedBy = 1, // チE��クトップユーザー
                UpdatedBy = 1,
                CreatedAt = GetJapanDateTime(),
                UpdatedAt = GetJapanDateTime()
            };
            _context.InfantToiletings.Add(newRecord);
            await _context.SaveChangesAsync(cancellationToken);
            return newRecord.ChildId;
        }
        else
        {
            existing.UrineAmount = dto.UrineAmount;
            existing.BowelCondition = dto.BowelCondition;
            existing.BowelColor = dto.BowelColor;
            existing.DiaperChangeCount = dto.DiaperChangeCount;
            existing.ToiletingTime = GetJapanDateTime();
            existing.UpdatedBy = 1;
            existing.UpdatedAt = GetJapanDateTime();
            await _context.SaveChangesAsync(cancellationToken);
            return existing.ChildId;
        }
    }

    public async Task<int> UpsertSleepAsync(
        int nurseryId,
        UpsertSleepDto dto,
        CancellationToken cancellationToken = default)
    {
        var existing = await _context.InfantSleeps
            .FirstOrDefaultAsync(s =>
                s.NurseryId == nurseryId
                && s.ChildId == dto.ChildId
                && s.RecordDate.Date == dto.RecordDate.Date,
                cancellationToken);

        if (existing == null)
        {
            // StartTimeとEndTimeをDateTime型に変換（RecordDateの日付に時刻を追加）
            var startTime = !string.IsNullOrEmpty(dto.StartTime)
                ? ParseTimeToDateTime(dto.RecordDate, dto.StartTime)
                : GetJapanDateTime();

            var endTime = !string.IsNullOrEmpty(dto.EndTime)
                ? ParseTimeToDateTime(dto.RecordDate, dto.EndTime)
                : (DateTime?)null;

            var newRecord = new InfantSleep
            {
                NurseryId = nurseryId,
                ChildId = dto.ChildId,
                RecordDate = dto.RecordDate,
                SleepSequence = 1,
                StartTime = startTime,
                EndTime = endTime,
                SleepQuality = dto.SleepQuality,
                CreatedBy = 1, // デスクトップユーザー
                UpdatedBy = 1,
                CreatedAt = GetJapanDateTime(),
                UpdatedAt = GetJapanDateTime()
            };
            _context.InfantSleeps.Add(newRecord);
            await _context.SaveChangesAsync(cancellationToken);
            return newRecord.ChildId;
        }
        else
        {
            if (!string.IsNullOrEmpty(dto.StartTime))
            {
                existing.StartTime = ParseTimeToDateTime(dto.RecordDate, dto.StartTime);
            }

            if (!string.IsNullOrEmpty(dto.EndTime))
            {
                existing.EndTime = ParseTimeToDateTime(dto.RecordDate, dto.EndTime);
            }
            else
            {
                existing.EndTime = null;
            }

            existing.SleepQuality = dto.SleepQuality;
            existing.UpdatedBy = 1;
            existing.UpdatedAt = GetJapanDateTime();
            await _context.SaveChangesAsync(cancellationToken);
            return existing.ChildId;
        }
    }

    /// <summary>
    /// "HH:mm"形式の時刻文字列をDateTimeに変換
    /// </summary>
    private DateTime ParseTimeToDateTime(DateTime date, string timeString)
    {
        if (TimeSpan.TryParse(timeString, out var time))
        {
            return date.Date.Add(time);
        }
        return date.Date;
    }
}
