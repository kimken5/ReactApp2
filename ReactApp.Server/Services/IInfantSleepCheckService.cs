using ReactApp.Server.DTOs.InfantRecords;

namespace ReactApp.Server.Services;

/// <summary>
/// 乳児午睡チェックサービスインターフェース
/// 午睡中の園児の安全チェック（5分間隔）を管理
/// </summary>
public interface IInfantSleepCheckService
{
    /// <summary>
    /// 指定クラス・日付の午睡チェック表を取得（横軸時間型グリッド用）
    /// </summary>
    Task<SleepCheckGridDto> GetSleepCheckGridAsync(int nurseryId, string classId, DateTime date);

    /// <summary>
    /// 指定園児・日付・睡眠回の午睡チェック記録を取得
    /// </summary>
    Task<IEnumerable<InfantSleepCheckDto>> GetSleepChecksAsync(int nurseryId, int childId, DateTime date, int sleepSequence);

    /// <summary>
    /// 午睡チェック記録を作成
    /// </summary>
    Task<InfantSleepCheckDto> CreateSleepCheckAsync(CreateInfantSleepCheckDto dto, int nurseryId, int staffId);

    /// <summary>
    /// 午睡チェック記録を更新
    /// </summary>
    Task<bool> UpdateSleepCheckAsync(int id, UpdateInfantSleepCheckDto dto, int nurseryId, int staffId);

    /// <summary>
    /// 午睡チェック記録を削除
    /// </summary>
    Task<bool> DeleteSleepCheckAsync(int id, int nurseryId);
}
