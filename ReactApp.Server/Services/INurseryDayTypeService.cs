using ReactApp.Server.DTOs.Desktop;

namespace ReactApp.Server.Services;

/// <summary>
/// 休園日・休日保育サービスインターフェース
/// </summary>
public interface INurseryDayTypeService
{
    /// <summary>
    /// 期間内の休園日・休日保育一覧を取得
    /// </summary>
    Task<List<NurseryDayTypeDto>> GetNurseryDayTypesAsync(string nurseryId, DateOnly startDate, DateOnly endDate);

    /// <summary>
    /// 特定日付の休園日・休日保育を取得
    /// </summary>
    Task<NurseryDayTypeDto?> GetNurseryDayTypeByDateAsync(string nurseryId, DateOnly date);

    /// <summary>
    /// 休園日・休日保育を作成
    /// </summary>
    Task<NurseryDayTypeDto> CreateNurseryDayTypeAsync(string nurseryId, CreateNurseryDayTypeRequestDto request, int createdBy);

    /// <summary>
    /// 休園日・休日保育を更新
    /// </summary>
    Task<NurseryDayTypeDto> UpdateNurseryDayTypeAsync(string nurseryId, int id, UpdateNurseryDayTypeRequestDto request);

    /// <summary>
    /// 休園日・休日保育を削除
    /// </summary>
    Task<bool> DeleteNurseryDayTypeAsync(string nurseryId, int id);
}
