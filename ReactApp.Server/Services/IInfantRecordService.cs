using ReactApp.Server.DTOs.InfantRecords;

namespace ReactApp.Server.Services;

/// <summary>
/// 乳児生活記録管理サービスインターフェース
/// 0歳児向けの生活記録（ミルク、食事、睡眠、排泄、機嫌、室温）の管理機能を提供
/// </summary>
public interface IInfantRecordService
{
    // ===== ミルク記録 =====
    /// <summary>
    /// 指定日のクラス内全園児のミルク記録を取得
    /// </summary>
    Task<IEnumerable<InfantMilkDto>> GetMilkRecordsAsync(int nurseryId, string classId, DateTime date);

    /// <summary>
    /// ミルク記録を作成
    /// </summary>
    Task<InfantMilkDto> CreateMilkRecordAsync(CreateInfantMilkDto dto, int nurseryId, int staffId);

    /// <summary>
    /// ミルク記録を更新
    /// </summary>
    Task<bool> UpdateMilkRecordAsync(UpdateInfantMilkDto dto, int nurseryId, int staffId);

    /// <summary>
    /// ミルク記録を削除
    /// </summary>
    Task<bool> DeleteMilkRecordAsync(int nurseryId, int childId, DateTime date, TimeSpan time);

    // ===== 食事記録 =====
    /// <summary>
    /// 指定日のクラス内全園児の食事記録を取得
    /// </summary>
    Task<IEnumerable<InfantMealDto>> GetMealRecordsAsync(int nurseryId, string classId, DateTime date);

    /// <summary>
    /// 食事記録を作成
    /// </summary>
    Task<InfantMealDto> CreateMealRecordAsync(CreateInfantMealDto dto, int nurseryId, int staffId);

    /// <summary>
    /// 食事記録を更新
    /// </summary>
    Task<bool> UpdateMealRecordAsync(UpdateInfantMealDto dto, int nurseryId, int staffId);

    /// <summary>
    /// 食事記録を削除
    /// </summary>
    Task<bool> DeleteMealRecordAsync(int nurseryId, int childId, DateTime date, TimeSpan mealTime);

    // ===== 睡眠記録 =====
    /// <summary>
    /// 指定日のクラス内全園児の睡眠記録を取得
    /// </summary>
    Task<IEnumerable<InfantSleepDto>> GetSleepRecordsAsync(int nurseryId, string classId, DateTime date);

    /// <summary>
    /// 睡眠記録を作成
    /// </summary>
    Task<InfantSleepDto> CreateSleepRecordAsync(CreateInfantSleepDto dto, int nurseryId, int staffId);

    /// <summary>
    /// 睡眠記録を更新
    /// </summary>
    Task<bool> UpdateSleepRecordAsync(UpdateInfantSleepDto dto, int nurseryId, int staffId);

    /// <summary>
    /// 睡眠記録を削除
    /// </summary>
    Task<bool> DeleteSleepRecordAsync(int nurseryId, int childId, DateTime date, int sleepSequence);

    // ===== 排泄記録 =====
    /// <summary>
    /// 指定日のクラス内全園児の排泄記録を取得
    /// </summary>
    Task<IEnumerable<InfantToiletingDto>> GetToiletingRecordsAsync(int nurseryId, string classId, DateTime date);

    /// <summary>
    /// 排泄記録を作成
    /// </summary>
    Task<InfantToiletingDto> CreateToiletingRecordAsync(CreateInfantToiletingDto dto, int nurseryId, int staffId);

    /// <summary>
    /// 排泄記録を更新
    /// </summary>
    Task<bool> UpdateToiletingRecordAsync(UpdateInfantToiletingDto dto, int nurseryId, int staffId);

    /// <summary>
    /// 排泄記録を削除
    /// </summary>
    Task<bool> DeleteToiletingRecordAsync(int nurseryId, int childId, DateTime date);

    // ===== 機嫌記録 =====
    /// <summary>
    /// 指定日のクラス内全園児の機嫌記録を取得
    /// </summary>
    Task<IEnumerable<InfantMoodDto>> GetMoodRecordsAsync(int nurseryId, string classId, DateTime date);

    /// <summary>
    /// 機嫌記録を作成
    /// </summary>
    Task<InfantMoodDto> CreateMoodRecordAsync(CreateInfantMoodDto dto, int nurseryId, int staffId);

    /// <summary>
    /// 機嫌記録を更新
    /// </summary>
    Task<bool> UpdateMoodRecordAsync(UpdateInfantMoodDto dto, int nurseryId, int staffId);

    /// <summary>
    /// 機嫌記録を削除
    /// </summary>
    Task<bool> DeleteMoodRecordAsync(int nurseryId, int childId, DateTime date, TimeOnly recordTime);

    // ===== 室温・湿度記録 =====
    /// <summary>
    /// 指定日のクラスの室温・湿度記録を取得
    /// </summary>
    Task<RoomEnvironmentDto?> GetRoomEnvironmentAsync(int nurseryId, string classId, DateTime date);

    /// <summary>
    /// 室温・湿度記録を保存（Upsert）
    /// </summary>
    Task<RoomEnvironmentDto> SaveRoomEnvironmentAsync(UpdateRoomEnvironmentDto dto, int nurseryId, int staffId);

    // ===== クラス園児一覧 =====
    /// <summary>
    /// 指定クラスの園児一覧を取得（モーダル用）
    /// </summary>
    Task<ClassChildrenResponse> GetClassChildrenAsync(int nurseryId, string classId, DateTime date);
}
