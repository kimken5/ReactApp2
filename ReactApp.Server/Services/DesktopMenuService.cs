using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Helpers;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services;

/// <summary>
/// デスクトップアプリ用献立管理サービス
/// </summary>
public class DesktopMenuService : IDesktopMenuService
{
    private readonly KindergartenDbContext _context;
    private readonly ILogger<DesktopMenuService> _logger;

    public DesktopMenuService(KindergartenDbContext context, ILogger<DesktopMenuService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region 献立マスター管理

    public async Task<List<MenuMasterDto>> GetMenuMastersAsync(int nurseryId)
    {
        var masters = await _context.MenuMasters
            .Where(m => m.NurseryId == nurseryId)
            .OrderBy(m => m.MenuName)
            .ToListAsync();

        // アレルゲンマスター取得
        var allergenMasters = await _context.AllergenMasters
            .OrderBy(a => a.SortOrder)
            .ToListAsync();

        var allergenDict = allergenMasters.ToDictionary(a => a.Id, a => a.AllergenName);

        return masters.Select(m => new MenuMasterDto
        {
            Id = m.Id,
            NurseryId = m.NurseryId,
            MenuName = m.MenuName,
            IngredientName = m.IngredientName,
            Allergens = m.Allergens,
            AllergenNames = ConvertAllergenIdsToNames(m.Allergens, allergenDict),
            Description = m.Description,
            CreatedAt = m.CreatedAt,
            UpdatedAt = m.UpdatedAt
        }).ToList();
    }

    public async Task<MenuMasterDto?> GetMenuMasterByIdAsync(int nurseryId, int id)
    {
        var master = await _context.MenuMasters
            .FirstOrDefaultAsync(m => m.Id == id && m.NurseryId == nurseryId);

        if (master == null) return null;

        // アレルゲンマスター取得
        var allergenMasters = await _context.AllergenMasters.ToListAsync();
        var allergenDict = allergenMasters.ToDictionary(a => a.Id, a => a.AllergenName);

        return new MenuMasterDto
        {
            Id = master.Id,
            NurseryId = master.NurseryId,
            MenuName = master.MenuName,
            IngredientName = master.IngredientName,
            Allergens = master.Allergens,
            AllergenNames = ConvertAllergenIdsToNames(master.Allergens, allergenDict),
            Description = master.Description,
            CreatedAt = master.CreatedAt,
            UpdatedAt = master.UpdatedAt
        };
    }

    public async Task<List<MenuMasterSearchDto>> SearchMenuMastersAsync(int nurseryId, string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new List<MenuMasterSearchDto>();
        }

        var masters = await _context.MenuMasters
            .Where(m => m.NurseryId == nurseryId && m.MenuName.Contains(query))
            .OrderBy(m => m.MenuName)
            .Take(10) // 最大10件
            .ToListAsync();

        // アレルゲンマスター取得
        var allergenMasters = await _context.AllergenMasters.ToListAsync();
        var allergenDict = allergenMasters.ToDictionary(a => a.Id, a => a.AllergenName);

        return masters.Select(m => new MenuMasterSearchDto
        {
            Id = m.Id,
            MenuName = m.MenuName,
            IngredientName = m.IngredientName,
            Allergens = m.Allergens,
            AllergenNames = ConvertAllergenIdsToNames(m.Allergens, allergenDict),
            Description = m.Description
        }).ToList();
    }

    public async Task<MenuMasterDto> CreateMenuMasterAsync(int nurseryId, CreateMenuMasterDto dto)
    {
        var now = DateTimeHelper.GetJstNow();

        var master = new MenuMaster
        {
            NurseryId = nurseryId,
            MenuName = dto.MenuName,
            IngredientName = dto.IngredientName,
            Allergens = dto.Allergens,
            Description = dto.Description,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.MenuMasters.Add(master);
        await _context.SaveChangesAsync();

        _logger.LogInformation("献立マスター作成: MenuMasterId={MenuMasterId}, MenuName={MenuName}", master.Id, master.MenuName);

        // アレルゲンマスター取得
        var allergenMasters = await _context.AllergenMasters.ToListAsync();
        var allergenDict = allergenMasters.ToDictionary(a => a.Id, a => a.AllergenName);

        return new MenuMasterDto
        {
            Id = master.Id,
            NurseryId = master.NurseryId,
            MenuName = master.MenuName,
            IngredientName = master.IngredientName,
            Allergens = master.Allergens,
            AllergenNames = ConvertAllergenIdsToNames(master.Allergens, allergenDict),
            Description = master.Description,
            CreatedAt = master.CreatedAt,
            UpdatedAt = master.UpdatedAt
        };
    }

    public async Task<MenuMasterDto> UpdateMenuMasterAsync(int nurseryId, int id, UpdateMenuMasterDto dto)
    {
        var master = await _context.MenuMasters
            .FirstOrDefaultAsync(m => m.Id == id && m.NurseryId == nurseryId);

        if (master == null)
        {
            throw new KeyNotFoundException($"献立マスターが見つかりません: MenuMasterId={id}");
        }

        master.MenuName = dto.MenuName;
        master.IngredientName = dto.IngredientName;
        master.Allergens = dto.Allergens;
        master.Description = dto.Description;
        master.UpdatedAt = DateTimeHelper.GetJstNow();

        await _context.SaveChangesAsync();

        _logger.LogInformation("献立マスター更新: MenuMasterId={MenuMasterId}, MenuName={MenuName}", master.Id, master.MenuName);

        // アレルゲンマスター取得
        var allergenMasters = await _context.AllergenMasters.ToListAsync();
        var allergenDict = allergenMasters.ToDictionary(a => a.Id, a => a.AllergenName);

        return new MenuMasterDto
        {
            Id = master.Id,
            NurseryId = master.NurseryId,
            MenuName = master.MenuName,
            IngredientName = master.IngredientName,
            Allergens = master.Allergens,
            AllergenNames = ConvertAllergenIdsToNames(master.Allergens, allergenDict),
            Description = master.Description,
            CreatedAt = master.CreatedAt,
            UpdatedAt = master.UpdatedAt
        };
    }

    public async Task DeleteMenuMasterAsync(int nurseryId, int id)
    {
        var master = await _context.MenuMasters
            .FirstOrDefaultAsync(m => m.Id == id && m.NurseryId == nurseryId);

        if (master == null)
        {
            throw new KeyNotFoundException($"献立マスターが見つかりません: MenuMasterId={id}");
        }

        // この献立マスターを使用している日別献立があるかチェック
        var usedInDailyMenus = await _context.DailyMenus
            .AnyAsync(d => d.MenuMasterId == id);

        if (usedInDailyMenus)
        {
            throw new InvalidOperationException("この献立マスターは日別献立で使用されているため削除できません");
        }

        _context.MenuMasters.Remove(master);
        await _context.SaveChangesAsync();

        _logger.LogInformation("献立マスター削除: MenuMasterId={MenuMasterId}, MenuName={MenuName}", id, master.MenuName);
    }

    #endregion

    #region 日別献立管理

    public async Task<List<DailyMenuDto>> GetDailyMenusAsync(int nurseryId, DateTime startDate, DateTime endDate)
    {
        var dailyMenus = await _context.DailyMenus
            .Where(d => d.NurseryId == nurseryId && d.MenuDate >= startDate && d.MenuDate <= endDate)
            .OrderBy(d => d.MenuDate)
            .ThenBy(d => d.MenuType)
            .ThenBy(d => d.SortOrder)
            .ToListAsync();

        return await MapToDailyMenuDtos(dailyMenus);
    }

    public async Task<List<DailyMenuDto>> GetDailyMenusByDateAsync(int nurseryId, DateTime menuDate)
    {
        var dailyMenus = await _context.DailyMenus
            .Where(d => d.NurseryId == nurseryId && d.MenuDate.Date == menuDate.Date)
            .OrderBy(d => d.MenuType)
            .ThenBy(d => d.SortOrder)
            .ToListAsync();

        return await MapToDailyMenuDtos(dailyMenus);
    }

    public async Task<DailyMenuDto> CreateDailyMenuAsync(int nurseryId, CreateDailyMenuDto dto)
    {
        var now = DateTimeHelper.GetJstNow();

        var dailyMenu = new DailyMenu
        {
            NurseryId = nurseryId,
            MenuDate = dto.MenuDate.Date,
            MenuType = dto.MenuType,
            MenuMasterId = dto.MenuMasterId,
            SortOrder = dto.SortOrder,
            Notes = dto.Notes,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.DailyMenus.Add(dailyMenu);
        await _context.SaveChangesAsync();

        _logger.LogInformation("日別献立作成: DailyMenuId={DailyMenuId}, MenuDate={MenuDate}, MenuType={MenuType}",
            dailyMenu.Id, dailyMenu.MenuDate, dailyMenu.MenuType);

        // 作成した献立をDTOに変換して返す
        var dailyMenus = await MapToDailyMenuDtos(new List<DailyMenu> { dailyMenu });
        return dailyMenus.First();
    }

    public async Task<DailyMenuDto> UpdateDailyMenuAsync(int nurseryId, int id, UpdateDailyMenuDto dto)
    {
        var dailyMenu = await _context.DailyMenus
            .FirstOrDefaultAsync(d => d.Id == id && d.NurseryId == nurseryId);

        if (dailyMenu == null)
        {
            throw new KeyNotFoundException($"日別献立が見つかりません: DailyMenuId={id}");
        }

        if (dto.SortOrder.HasValue)
        {
            dailyMenu.SortOrder = dto.SortOrder.Value;
        }

        if (dto.Notes != null)
        {
            dailyMenu.Notes = dto.Notes;
        }

        dailyMenu.UpdatedAt = DateTimeHelper.GetJstNow();

        await _context.SaveChangesAsync();

        _logger.LogInformation("日別献立更新: DailyMenuId={DailyMenuId}", id);

        // 更新した献立をDTOに変換して返す
        var dailyMenus = await MapToDailyMenuDtos(new List<DailyMenu> { dailyMenu });
        return dailyMenus.First();
    }

    public async Task DeleteDailyMenuAsync(int nurseryId, int id)
    {
        var dailyMenu = await _context.DailyMenus
            .FirstOrDefaultAsync(d => d.Id == id && d.NurseryId == nurseryId);

        if (dailyMenu == null)
        {
            throw new KeyNotFoundException($"日別献立が見つかりません: DailyMenuId={id}");
        }

        _context.DailyMenus.Remove(dailyMenu);
        await _context.SaveChangesAsync();

        _logger.LogInformation("日別献立削除: DailyMenuId={DailyMenuId}, MenuDate={MenuDate}, MenuType={MenuType}",
            id, dailyMenu.MenuDate, dailyMenu.MenuType);
    }

    public async Task BulkCreateDailyMenusAsync(int nurseryId, BulkCreateDailyMenusDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // 既存の同日献立を削除
            var existingMenus = await _context.DailyMenus
                .Where(d => d.NurseryId == nurseryId && d.MenuDate.Date == dto.MenuDate.Date)
                .ToListAsync();

            if (existingMenus.Any())
            {
                _context.DailyMenus.RemoveRange(existingMenus);
            }

            var now = DateTimeHelper.GetJstNow();
            var newMenus = new List<DailyMenu>();

            // 午前のおやつ
            foreach (var item in dto.MorningSnacks)
            {
                newMenus.Add(new DailyMenu
                {
                    NurseryId = nurseryId,
                    MenuDate = dto.MenuDate.Date,
                    MenuType = "MorningSnack",
                    MenuMasterId = item.MenuMasterId,
                    SortOrder = item.SortOrder,
                    Notes = item.Notes,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }

            // 給食
            foreach (var item in dto.Lunches)
            {
                newMenus.Add(new DailyMenu
                {
                    NurseryId = nurseryId,
                    MenuDate = dto.MenuDate.Date,
                    MenuType = "Lunch",
                    MenuMasterId = item.MenuMasterId,
                    SortOrder = item.SortOrder,
                    Notes = item.Notes,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }

            // 午後のおやつ
            foreach (var item in dto.AfternoonSnacks)
            {
                newMenus.Add(new DailyMenu
                {
                    NurseryId = nurseryId,
                    MenuDate = dto.MenuDate.Date,
                    MenuType = "AfternoonSnack",
                    MenuMasterId = item.MenuMasterId,
                    SortOrder = item.SortOrder,
                    Notes = item.Notes,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }

            _context.DailyMenus.AddRange(newMenus);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("日別献立一括作成: NurseryId={NurseryId}, MenuDate={MenuDate}, Count={Count}",
                nurseryId, dto.MenuDate.Date, newMenus.Count);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task DeleteDailyMenusByDateAsync(int nurseryId, DateTime menuDate)
    {
        var menus = await _context.DailyMenus
            .Where(d => d.NurseryId == nurseryId && d.MenuDate.Date == menuDate.Date)
            .ToListAsync();

        if (menus.Any())
        {
            _context.DailyMenus.RemoveRange(menus);
            await _context.SaveChangesAsync();

            _logger.LogInformation("日別献立削除: NurseryId={NurseryId}, MenuDate={MenuDate}, Count={Count}",
                nurseryId, menuDate.Date, menus.Count);
        }
    }

    #endregion

    #region Private Methods

    private async Task<List<DailyMenuDto>> MapToDailyMenuDtos(List<DailyMenu> dailyMenus)
    {
        if (!dailyMenus.Any()) return new List<DailyMenuDto>();

        // MenuMasterを一括取得
        var menuMasterIds = dailyMenus.Select(d => d.MenuMasterId).Distinct().ToList();
        var menuMasters = await _context.MenuMasters
            .Where(m => menuMasterIds.Contains(m.Id))
            .ToListAsync();

        var masterDict = menuMasters.ToDictionary(m => m.Id);

        // アレルゲンマスター取得
        var allergenMasters = await _context.AllergenMasters.ToListAsync();
        var allergenDict = allergenMasters.ToDictionary(a => a.Id, a => a.AllergenName);

        return dailyMenus.Select(d =>
        {
            var master = masterDict.GetValueOrDefault(d.MenuMasterId);

            return new DailyMenuDto
            {
                Id = d.Id,
                NurseryId = d.NurseryId,
                MenuDate = d.MenuDate,
                MenuType = d.MenuType,
                MenuMasterId = d.MenuMasterId,
                MenuName = master?.MenuName ?? string.Empty,
                IngredientName = master?.IngredientName,
                Allergens = master?.Allergens,
                AllergenNames = ConvertAllergenIdsToNames(master?.Allergens, allergenDict),
                Description = master?.Description,
                SortOrder = d.SortOrder,
                Notes = d.Notes,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt
            };
        }).ToList();
    }

    private string? ConvertAllergenIdsToNames(string? allergenIds, Dictionary<int, string> allergenDict)
    {
        if (string.IsNullOrWhiteSpace(allergenIds))
            return null;

        var ids = allergenIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(id => int.TryParse(id.Trim(), out var result) ? result : (int?)null)
            .Where(id => id.HasValue)
            .Select(id => id!.Value);

        var names = ids
            .Where(id => allergenDict.ContainsKey(id))
            .Select(id => allergenDict[id]);

        return names.Any() ? string.Join(", ", names) : null;
    }

    #endregion
}
