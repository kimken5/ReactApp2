using ReactApp.Server.DTOs.Desktop;

namespace ReactApp.Server.Services;

/// <summary>
/// デスクトップアプリ用献立管理サービスインターフェース
/// </summary>
public interface IDesktopMenuService
{
    // 献立マスター管理
    Task<List<MenuMasterDto>> GetMenuMastersAsync(int nurseryId);
    Task<MenuMasterDto?> GetMenuMasterByIdAsync(int nurseryId, int id);
    Task<List<MenuMasterSearchDto>> SearchMenuMastersAsync(int nurseryId, string query);
    Task<MenuMasterDto> CreateMenuMasterAsync(int nurseryId, CreateMenuMasterDto dto);
    Task<MenuMasterDto> UpdateMenuMasterAsync(int nurseryId, int id, UpdateMenuMasterDto dto);
    Task DeleteMenuMasterAsync(int nurseryId, int id);

    // 日別献立管理
    Task<List<DailyMenuDto>> GetDailyMenusAsync(int nurseryId, DateTime startDate, DateTime endDate);
    Task<List<DailyMenuDto>> GetDailyMenusByDateAsync(int nurseryId, DateTime menuDate);
    Task<DailyMenuDto> CreateDailyMenuAsync(int nurseryId, CreateDailyMenuDto dto);
    Task<DailyMenuDto> UpdateDailyMenuAsync(int nurseryId, int id, UpdateDailyMenuDto dto);
    Task DeleteDailyMenuAsync(int nurseryId, int id);
    Task BulkCreateDailyMenusAsync(int nurseryId, BulkCreateDailyMenusDto dto);
    Task DeleteDailyMenusByDateAsync(int nurseryId, DateTime menuDate);
}
