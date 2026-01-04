using ReactApp.Server.DTOs.InfantRecords;

namespace ReactApp.Server.Services;

public interface IInfantRecordService
{
    /// <summary>
    /// 指定されたクラスの週次生活記録を取得
    /// </summary>
    Task<WeeklyRecordResponseDto> GetWeeklyRecordsAsync(
        int nurseryId,
        string classId,
        DateTime weekStartDate,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 体温記録を更新
    /// </summary>
    Task UpdateTemperatureAsync(
        int nurseryId,
        int temperatureId,
        UpdateTemperatureDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 食事記録を更新
    /// </summary>
    Task UpdateMealAsync(
        int nurseryId,
        int mealId,
        UpdateMealDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 機嫌記録を更新
    /// </summary>
    Task UpdateMoodAsync(
        int nurseryId,
        int moodId,
        UpdateMoodDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 睡眠記録を更新
    /// </summary>
    Task UpdateSleepAsync(
        int nurseryId,
        int sleepId,
        UpdateSleepDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 排泄記録を更新
    /// </summary>
    Task UpdateToiletingAsync(
        int nurseryId,
        int childId,
        DateTime recordDate,
        UpdateToiletingDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 体温記録を作成または更新（Upsert）
    /// </summary>
    Task<int> UpsertTemperatureAsync(
        int nurseryId,
        UpsertTemperatureDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 食事記録を作成または更新（Upsert）
    /// </summary>
    Task<int> UpsertMealAsync(
        int nurseryId,
        UpsertMealDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 機嫌記録を作成または更新（Upsert）
    /// </summary>
    Task<int> UpsertMoodAsync(
        int nurseryId,
        UpsertMoodDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 排泄記録を作成または更新（Upsert）
    /// </summary>
    Task<int> UpsertToiletingAsync(
        int nurseryId,
        UpsertToiletingDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 睡眠記録を作成または更新（Upsert）
    /// </summary>
    Task<int> UpsertSleepAsync(
        int nurseryId,
        UpsertSleepDto dto,
        CancellationToken cancellationToken = default);
}
