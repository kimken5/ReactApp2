using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services;

/// <summary>
/// デスクトップアプリ用カレンダーサービス実装
/// </summary>
public class DesktopCalendarService : IDesktopCalendarService
{
    private readonly KindergartenDbContext _context;
    private readonly ILogger<DesktopCalendarService> _logger;

    public DesktopCalendarService(
        KindergartenDbContext context,
        ILogger<DesktopCalendarService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<CalendarEventDto>> GetEventsAsync(int nurseryId, DateTime startDate, DateTime endDate)
    {
        try
        {
            var events = await _context.Set<Event>()
                .Where(e => e.NurseryId == nurseryId
                    && e.IsActive
                    && e.StartDateTime >= startDate
                    && e.StartDateTime <= endDate.AddDays(1)) // Include events that start on endDate
                .OrderBy(e => e.StartDateTime)
                .Select(e => new CalendarEventDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Category = e.Category,
                    StartDateTime = e.StartDateTime,
                    EndDateTime = e.EndDateTime,
                    Description = e.Description,
                    Location = null, // Eventモデルにlocationフィールドがないため
                    IsAllDay = e.IsAllDay,
                    TargetClassId = e.TargetClassId,
                    TargetGrade = e.TargetGradeLevel,
                    CreatedBy = e.CreatedBy,
                    CreatedAt = e.CreatedAt
                })
                .ToListAsync();

            return events;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "イベント一覧取得エラー (NurseryId={NurseryId}, StartDate={StartDate}, EndDate={EndDate})",
                nurseryId, startDate, endDate);
            throw;
        }
    }

    public async Task<CalendarEventDto?> GetEventByIdAsync(int nurseryId, int eventId)
    {
        try
        {
            var eventEntity = await _context.Set<Event>()
                .Where(e => e.Id == eventId && e.NurseryId == nurseryId && e.IsActive)
                .Select(e => new CalendarEventDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Category = e.Category,
                    StartDateTime = e.StartDateTime,
                    EndDateTime = e.EndDateTime,
                    Description = e.Description,
                    Location = null,
                    IsAllDay = e.IsAllDay,
                    TargetClassId = e.TargetClassId,
                    TargetGrade = e.TargetGradeLevel,
                    CreatedBy = e.CreatedBy,
                    CreatedAt = e.CreatedAt
                })
                .FirstOrDefaultAsync();

            return eventEntity;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "イベント詳細取得エラー (EventId={EventId}, NurseryId={NurseryId})", eventId, nurseryId);
            throw;
        }
    }

    public async Task<CalendarEventDto> CreateEventAsync(int nurseryId, CreateCalendarEventRequestDto request, string createdBy)
    {
        try
        {
            var now = DateTime.UtcNow;
            var eventEntity = new Event
            {
                NurseryId = nurseryId,
                Title = request.Title,
                Category = request.Category,
                StartDateTime = request.StartDateTime,
                EndDateTime = request.EndDateTime,
                Description = request.Description,
                IsAllDay = request.IsAllDay,
                TargetClassId = request.TargetClassId,
                TargetGradeLevel = request.TargetGrade,
                CreatedBy = createdBy,
                CreatedAt = now,
                LastModified = now,
                IsActive = true,
                RecurrencePattern = "none",
                TargetAudience = "all",
                RequiresPreparation = false
            };

            _context.Set<Event>().Add(eventEntity);
            await _context.SaveChangesAsync();

            return new CalendarEventDto
            {
                Id = eventEntity.Id,
                Title = eventEntity.Title,
                Category = eventEntity.Category,
                StartDateTime = eventEntity.StartDateTime,
                EndDateTime = eventEntity.EndDateTime,
                Description = eventEntity.Description,
                Location = null,
                IsAllDay = eventEntity.IsAllDay,
                TargetClassId = eventEntity.TargetClassId,
                TargetGrade = eventEntity.TargetGradeLevel,
                CreatedBy = eventEntity.CreatedBy,
                CreatedAt = eventEntity.CreatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "イベント作成エラー (NurseryId={NurseryId}, Title={Title})", nurseryId, request.Title);
            throw;
        }
    }

    public async Task<CalendarEventDto> UpdateEventAsync(int nurseryId, int eventId, UpdateCalendarEventRequestDto request)
    {
        try
        {
            var eventEntity = await _context.Set<Event>()
                .FirstOrDefaultAsync(e => e.Id == eventId && e.NurseryId == nurseryId && e.IsActive);

            if (eventEntity == null)
            {
                throw new KeyNotFoundException($"イベントが見つかりません (EventId={eventId})");
            }

            eventEntity.Title = request.Title;
            eventEntity.Category = request.Category;
            eventEntity.StartDateTime = request.StartDateTime;
            eventEntity.EndDateTime = request.EndDateTime;
            eventEntity.Description = request.Description;
            eventEntity.IsAllDay = request.IsAllDay;
            eventEntity.TargetClassId = request.TargetClassId;
            eventEntity.TargetGradeLevel = request.TargetGrade;
            eventEntity.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new CalendarEventDto
            {
                Id = eventEntity.Id,
                Title = eventEntity.Title,
                Category = eventEntity.Category,
                StartDateTime = eventEntity.StartDateTime,
                EndDateTime = eventEntity.EndDateTime,
                Description = eventEntity.Description,
                Location = null,
                IsAllDay = eventEntity.IsAllDay,
                TargetClassId = eventEntity.TargetClassId,
                TargetGrade = eventEntity.TargetGradeLevel,
                CreatedBy = eventEntity.CreatedBy,
                CreatedAt = eventEntity.CreatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "イベント更新エラー (EventId={EventId}, NurseryId={NurseryId})", eventId, nurseryId);
            throw;
        }
    }

    public async Task<bool> DeleteEventAsync(int nurseryId, int eventId)
    {
        try
        {
            var eventEntity = await _context.Set<Event>()
                .FirstOrDefaultAsync(e => e.Id == eventId && e.NurseryId == nurseryId && e.IsActive);

            if (eventEntity == null)
            {
                return false;
            }

            // 論理削除
            eventEntity.IsActive = false;
            eventEntity.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "イベント削除エラー (EventId={EventId}, NurseryId={NurseryId})", eventId, nurseryId);
            throw;
        }
    }
}
