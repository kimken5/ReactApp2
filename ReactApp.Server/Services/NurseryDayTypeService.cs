using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services;

/// <summary>
/// 休園日・休日保育サービス実装
/// </summary>
public class NurseryDayTypeService : INurseryDayTypeService
{
    private readonly KindergartenDbContext _context;
    private readonly ILogger<NurseryDayTypeService> _logger;

    public NurseryDayTypeService(
        KindergartenDbContext context,
        ILogger<NurseryDayTypeService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<NurseryDayTypeDto>> GetNurseryDayTypesAsync(string nurseryId, DateOnly startDate, DateOnly endDate)
    {
        try
        {
            var nurseryDayTypes = await _context.NurseryDayTypes
                .Where(ndt => ndt.NurseryId == nurseryId
                    && ndt.Date >= startDate
                    && ndt.Date <= endDate)
                .OrderBy(ndt => ndt.Date)
                .Select(ndt => new NurseryDayTypeDto
                {
                    Id = ndt.Id,
                    NurseryId = ndt.NurseryId,
                    Date = ndt.Date.ToString("yyyy-MM-dd"),
                    DayType = ndt.DayType,
                    CreatedBy = ndt.CreatedBy,
                    CreatedAt = ndt.CreatedAt,
                    UpdatedAt = ndt.UpdatedAt
                })
                .ToListAsync();

            return nurseryDayTypes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "休園日・休日保育一覧取得エラー (NurseryId={NurseryId}, StartDate={StartDate}, EndDate={EndDate})",
                nurseryId, startDate, endDate);
            throw;
        }
    }

    public async Task<NurseryDayTypeDto?> GetNurseryDayTypeByDateAsync(string nurseryId, DateOnly date)
    {
        try
        {
            var nurseryDayType = await _context.NurseryDayTypes
                .Where(ndt => ndt.NurseryId == nurseryId && ndt.Date == date)
                .Select(ndt => new NurseryDayTypeDto
                {
                    Id = ndt.Id,
                    NurseryId = ndt.NurseryId,
                    Date = ndt.Date.ToString("yyyy-MM-dd"),
                    DayType = ndt.DayType,
                    CreatedBy = ndt.CreatedBy,
                    CreatedAt = ndt.CreatedAt,
                    UpdatedAt = ndt.UpdatedAt
                })
                .FirstOrDefaultAsync();

            return nurseryDayType;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "休園日・休日保育取得エラー (NurseryId={NurseryId}, Date={Date})",
                nurseryId, date);
            throw;
        }
    }

    public async Task<NurseryDayTypeDto> CreateNurseryDayTypeAsync(string nurseryId, CreateNurseryDayTypeRequestDto request, int createdBy)
    {
        try
        {
            // 日付パース
            if (!DateOnly.TryParse(request.Date, out var date))
            {
                throw new ArgumentException("無効な日付形式です", nameof(request.Date));
            }

            // 同じ日付の既存データをチェック
            var existing = await _context.NurseryDayTypes
                .FirstOrDefaultAsync(ndt => ndt.NurseryId == nurseryId && ndt.Date == date);

            if (existing != null)
            {
                throw new InvalidOperationException($"{date:yyyy/MM/dd}は既に登録されています");
            }

            // 新規作成
            var nurseryDayType = new NurseryDayType
            {
                NurseryId = nurseryId,
                Date = date,
                DayType = request.DayType,
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.NurseryDayTypes.Add(nurseryDayType);
            await _context.SaveChangesAsync();

            return new NurseryDayTypeDto
            {
                Id = nurseryDayType.Id,
                NurseryId = nurseryDayType.NurseryId,
                Date = nurseryDayType.Date.ToString("yyyy-MM-dd"),
                DayType = nurseryDayType.DayType,
                CreatedBy = nurseryDayType.CreatedBy,
                CreatedAt = nurseryDayType.CreatedAt,
                UpdatedAt = nurseryDayType.UpdatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "休園日・休日保育作成エラー (NurseryId={NurseryId}, Date={Date})",
                nurseryId, request.Date);
            throw;
        }
    }

    public async Task<NurseryDayTypeDto> UpdateNurseryDayTypeAsync(string nurseryId, int id, UpdateNurseryDayTypeRequestDto request)
    {
        try
        {
            var nurseryDayType = await _context.NurseryDayTypes
                .FirstOrDefaultAsync(ndt => ndt.Id == id && ndt.NurseryId == nurseryId);

            if (nurseryDayType == null)
            {
                throw new KeyNotFoundException($"ID={id}の休園日・休日保育が見つかりません");
            }

            // 種別を更新
            nurseryDayType.DayType = request.DayType;
            nurseryDayType.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new NurseryDayTypeDto
            {
                Id = nurseryDayType.Id,
                NurseryId = nurseryDayType.NurseryId,
                Date = nurseryDayType.Date.ToString("yyyy-MM-dd"),
                DayType = nurseryDayType.DayType,
                CreatedBy = nurseryDayType.CreatedBy,
                CreatedAt = nurseryDayType.CreatedAt,
                UpdatedAt = nurseryDayType.UpdatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "休園日・休日保育更新エラー (NurseryId={NurseryId}, Id={Id})",
                nurseryId, id);
            throw;
        }
    }

    public async Task<bool> DeleteNurseryDayTypeAsync(string nurseryId, int id)
    {
        try
        {
            var nurseryDayType = await _context.NurseryDayTypes
                .FirstOrDefaultAsync(ndt => ndt.Id == id && ndt.NurseryId == nurseryId);

            if (nurseryDayType == null)
            {
                return false;
            }

            _context.NurseryDayTypes.Remove(nurseryDayType);
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "休園日・休日保育削除エラー (NurseryId={NurseryId}, Id={Id})",
                nurseryId, id);
            throw;
        }
    }
}
