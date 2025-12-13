using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Models;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Services;

/// <summary>
/// デスクトップアプリ用出欠表管理サービス実装
/// </summary>
public class DesktopAttendanceService : IDesktopAttendanceService
{
    private readonly KindergartenDbContext _context;
    private readonly ILogger<DesktopAttendanceService> _logger;

    public DesktopAttendanceService(
        KindergartenDbContext context,
        ILogger<DesktopAttendanceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<AttendanceDto>> GetAttendanceByClassAndDateAsync(int nurseryId, string classId, DateTime date)
    {
        try
        {
            // クラスの全園児を取得
            var children = await _context.Children
                .Where(c => c.NurseryId == nurseryId && c.ClassId == classId && c.IsActive)
                .OrderBy(c => c.ChildId)
                .Select(c => new { c.ChildId, c.Name })
                .ToListAsync();

            if (!children.Any())
            {
                return new List<AttendanceDto>();
            }

            var childIds = children.Select(c => c.ChildId).ToList();

            // 出欠記録を取得
            var attendances = await _context.DailyAttendances
                .Where(a => a.NurseryId == nurseryId && childIds.Contains(a.ChildId) && a.AttendanceDate == date.Date && a.IsActive)
                .ToListAsync();

            var attendanceDict = attendances.ToDictionary(a => a.ChildId);

            // 記録スタッフ名を取得
            var staffIds = attendances
                .Where(a => a.RecordedByStaffId.HasValue)
                .Select(a => new { NurseryId = a.RecordedByStaffNurseryId!.Value, StaffId = a.RecordedByStaffId!.Value })
                .Distinct()
                .ToList();

            var staffNames = await _context.Staff
                .Where(s => staffIds.Select(x => x.NurseryId).Contains(s.NurseryId) &&
                           staffIds.Select(x => x.StaffId).Contains(s.StaffId))
                .Select(s => new { s.NurseryId, s.StaffId, s.Name })
                .ToListAsync();

            var staffNameDict = staffNames.ToDictionary(s => (s.NurseryId, s.StaffId), s => s.Name);

            // 更新スタッフ名を取得
            var updateStaffIds = attendances
                .Where(a => a.UpdatedByStaffId.HasValue)
                .Select(a => new { NurseryId = a.UpdatedByStaffNurseryId!.Value, StaffId = a.UpdatedByStaffId!.Value })
                .Distinct()
                .ToList();

            var updateStaffNames = await _context.Staff
                .Where(s => updateStaffIds.Select(x => x.NurseryId).Contains(s.NurseryId) &&
                           updateStaffIds.Select(x => x.StaffId).Contains(s.StaffId))
                .Select(s => new { s.NurseryId, s.StaffId, s.Name })
                .ToListAsync();

            var updateStaffNameDict = updateStaffNames.ToDictionary(s => (s.NurseryId, s.StaffId), s => s.Name);

            // 結果を組み立て
            var result = children.Select(child =>
            {
                if (attendanceDict.TryGetValue(child.ChildId, out var attendance))
                {
                    return new AttendanceDto
                    {
                        NurseryId = attendance.NurseryId,
                        ChildId = attendance.ChildId,
                        ChildName = child.Name,
                        AttendanceDate = attendance.AttendanceDate,
                        Status = attendance.Status,
                        ArrivalTime = attendance.ArrivalTime,
                        Notes = attendance.Notes,
                        AbsenceNotificationId = attendance.AbsenceNotificationId,
                        RecordedByStaffId = attendance.RecordedByStaffId,
                        RecordedByStaffName = attendance.RecordedByStaffId.HasValue && attendance.RecordedByStaffNurseryId.HasValue
                            ? staffNameDict.GetValueOrDefault((attendance.RecordedByStaffNurseryId.Value, attendance.RecordedByStaffId.Value))
                            : null,
                        RecordedAt = attendance.RecordedAt,
                        UpdatedByStaffId = attendance.UpdatedByStaffId,
                        UpdatedByStaffName = attendance.UpdatedByStaffId.HasValue && attendance.UpdatedByStaffNurseryId.HasValue
                            ? updateStaffNameDict.GetValueOrDefault((attendance.UpdatedByStaffNurseryId.Value, attendance.UpdatedByStaffId.Value))
                            : null,
                        UpdatedAt = attendance.UpdatedAt,
                        IsActive = attendance.IsActive
                    };
                }
                else
                {
                    // 未記録の園児
                    return new AttendanceDto
                    {
                        NurseryId = nurseryId,
                        ChildId = child.ChildId,
                        ChildName = child.Name,
                        AttendanceDate = date.Date,
                        Status = "blank",
                        IsActive = true
                    };
                }
            }).ToList();

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get attendance for nursery {NurseryId}, class {ClassId}, date {Date}",
                nurseryId, classId, date);
            throw;
        }
    }

    public async Task<(List<AttendanceDto> Attendances, AttendanceHistorySummaryDto Summary)> GetAttendanceHistoryAsync(
        int nurseryId, string classId, DateTime startDate, DateTime endDate, int? childId = null)
    {
        try
        {
            var query = _context.DailyAttendances
                .Where(a => a.NurseryId == nurseryId &&
                           a.AttendanceDate >= startDate.Date &&
                           a.AttendanceDate <= endDate.Date &&
                           a.IsActive);

            if (childId.HasValue)
            {
                query = query.Where(a => a.ChildId == childId.Value);
            }
            else
            {
                // クラスの園児IDを取得
                var childIds = await _context.Children
                    .Where(c => c.NurseryId == nurseryId && c.ClassId == classId && c.IsActive)
                    .Select(c => c.ChildId)
                    .ToListAsync();

                query = query.Where(a => childIds.Contains(a.ChildId));
            }

            var attendances = await query
                .OrderByDescending(a => a.AttendanceDate)
                .ThenBy(a => a.ChildId)
                .ToListAsync();

            // 園児名を取得
            var attendanceChildIds = attendances.Select(a => a.ChildId).Distinct().ToList();
            var childNames = await _context.Children
                .Where(c => c.NurseryId == nurseryId && attendanceChildIds.Contains(c.ChildId))
                .Select(c => new { c.ChildId, c.Name })
                .ToListAsync();

            var childNameDict = childNames.ToDictionary(c => c.ChildId, c => c.Name);

            // スタッフ名を取得
            var staffIds = attendances
                .Where(a => a.RecordedByStaffId.HasValue)
                .Select(a => new { NurseryId = a.RecordedByStaffNurseryId!.Value, StaffId = a.RecordedByStaffId!.Value })
                .Distinct()
                .ToList();

            var staffNames = await _context.Staff
                .Where(s => staffIds.Select(x => x.NurseryId).Contains(s.NurseryId) &&
                           staffIds.Select(x => x.StaffId).Contains(s.StaffId))
                .Select(s => new { s.NurseryId, s.StaffId, s.Name })
                .ToListAsync();

            var staffNameDict = staffNames.ToDictionary(s => (s.NurseryId, s.StaffId), s => s.Name);

            // DTOに変換
            var attendanceDtos = attendances.Select(a => new AttendanceDto
            {
                NurseryId = a.NurseryId,
                ChildId = a.ChildId,
                ChildName = childNameDict.GetValueOrDefault(a.ChildId),
                AttendanceDate = a.AttendanceDate,
                Status = a.Status,
                ArrivalTime = a.ArrivalTime,
                Notes = a.Notes,
                AbsenceNotificationId = a.AbsenceNotificationId,
                RecordedByStaffId = a.RecordedByStaffId,
                RecordedByStaffName = a.RecordedByStaffId.HasValue && a.RecordedByStaffNurseryId.HasValue
                    ? staffNameDict.GetValueOrDefault((a.RecordedByStaffNurseryId.Value, a.RecordedByStaffId.Value))
                    : null,
                RecordedAt = a.RecordedAt,
                IsActive = a.IsActive
            }).ToList();

            // サマリーを計算
            var totalDays = (endDate.Date - startDate.Date).Days + 1;
            var presentDays = attendances.Count(a => a.Status == "present");
            var absentDays = attendances.Count(a => a.Status == "absent");
            var lateDays = attendances.Count(a => a.Status == "late");
            var attendanceRate = totalDays > 0 ? (decimal)presentDays / totalDays * 100 : 0;

            var summary = new AttendanceHistorySummaryDto
            {
                TotalDays = totalDays,
                PresentDays = presentDays,
                AbsentDays = absentDays,
                LateDays = lateDays,
                AttendanceRate = Math.Round(attendanceRate, 1)
            };

            return (attendanceDtos, summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get attendance history for nursery {NurseryId}, class {ClassId}",
                nurseryId, classId);
            throw;
        }
    }

    public async Task<AttendanceDto> UpdateAttendanceAsync(int nurseryId, int childId, DateTime date, UpdateAttendanceRequest request)
    {
        try
        {
            // BR-AT-006: 過去30日以前のデータは編集不可
            if (date.Date < DateTime.Today.AddDays(-30))
            {
                throw new InvalidOperationException("過去30日以前のデータは編集できません。");
            }

            var attendance = await _context.DailyAttendances
                .FirstOrDefaultAsync(a => a.NurseryId == nurseryId &&
                                         a.ChildId == childId &&
                                         a.AttendanceDate == date.Date);

            if (attendance != null)
            {
                // BR-AT-005: 「欠席」→「出席」への変更は警告
                if (attendance.Status == "absent" && request.Status == "present")
                {
                    _logger.LogWarning("Changing status from absent to present for child {ChildId} on {Date}",
                        childId, date);
                    // この警告はフロントエンドで処理
                }

                // 既存レコードを更新
                attendance.Status = request.Status;
                attendance.ArrivalTime = request.ArrivalTime;
                attendance.Notes = request.Notes;
                attendance.UpdatedByStaffId = request.RecordedByStaffId;
                attendance.UpdatedByStaffNurseryId = request.RecordedByStaffNurseryId;
                attendance.UpdatedAt = DateTimeHelper.GetJstNow();
            }
            else
            {
                // 新規レコードを作成
                attendance = new DailyAttendance
                {
                    NurseryId = nurseryId,
                    ChildId = childId,
                    AttendanceDate = date.Date,
                    Status = request.Status,
                    ArrivalTime = request.ArrivalTime,
                    Notes = request.Notes,
                    RecordedByStaffId = request.RecordedByStaffId,
                    RecordedByStaffNurseryId = request.RecordedByStaffNurseryId,
                    RecordedAt = DateTimeHelper.GetJstNow(),
                    CreatedAt = DateTimeHelper.GetJstNow(),
                    IsActive = true
                };

                _context.DailyAttendances.Add(attendance);
            }

            await _context.SaveChangesAsync();

            // 園児名とスタッフ名を取得
            var child = await _context.Children
                .Where(c => c.NurseryId == nurseryId && c.ChildId == childId)
                .Select(c => c.Name)
                .FirstOrDefaultAsync();

            var staffName = await _context.Staff
                .Where(s => s.NurseryId == request.RecordedByStaffNurseryId && s.StaffId == request.RecordedByStaffId)
                .Select(s => s.Name)
                .FirstOrDefaultAsync();

            return new AttendanceDto
            {
                NurseryId = attendance.NurseryId,
                ChildId = attendance.ChildId,
                ChildName = child,
                AttendanceDate = attendance.AttendanceDate,
                Status = attendance.Status,
                ArrivalTime = attendance.ArrivalTime,
                Notes = attendance.Notes,
                AbsenceNotificationId = attendance.AbsenceNotificationId,
                RecordedByStaffId = attendance.RecordedByStaffId,
                RecordedByStaffName = staffName,
                RecordedAt = attendance.RecordedAt,
                UpdatedByStaffId = attendance.UpdatedByStaffId,
                UpdatedAt = attendance.UpdatedAt,
                IsActive = attendance.IsActive
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update attendance for child {ChildId} on {Date}", childId, date);
            throw;
        }
    }

    public async Task<AttendanceDto> UpdateAttendanceNotesAsync(int nurseryId, int childId, DateTime date, UpdateAttendanceNotesRequest request)
    {
        try
        {
            var attendance = await _context.DailyAttendances
                .FirstOrDefaultAsync(a => a.NurseryId == nurseryId &&
                                         a.ChildId == childId &&
                                         a.AttendanceDate == date.Date);

            if (attendance != null)
            {
                // 既存レコードの備考を更新
                attendance.Notes = request.Notes;
                attendance.UpdatedByStaffId = request.UpdatedByStaffId;
                attendance.UpdatedByStaffNurseryId = request.UpdatedByStaffNurseryId;
                attendance.UpdatedAt = DateTimeHelper.GetJstNow();
            }
            else
            {
                // 出欠記録がない場合は新規レコードを作成（ステータスはblank）
                attendance = new DailyAttendance
                {
                    NurseryId = nurseryId,
                    ChildId = childId,
                    AttendanceDate = date.Date,
                    Status = "blank",
                    Notes = request.Notes,
                    RecordedByStaffId = request.UpdatedByStaffId,
                    RecordedByStaffNurseryId = request.UpdatedByStaffNurseryId,
                    RecordedAt = DateTimeHelper.GetJstNow(),
                    CreatedAt = DateTimeHelper.GetJstNow(),
                    IsActive = true
                };

                _context.DailyAttendances.Add(attendance);
            }

            await _context.SaveChangesAsync();

            var child = await _context.Children
                .Where(c => c.NurseryId == nurseryId && c.ChildId == childId)
                .Select(c => c.Name)
                .FirstOrDefaultAsync();

            var staffName = await _context.Staff
                .Where(s => s.NurseryId == request.UpdatedByStaffNurseryId && s.StaffId == request.UpdatedByStaffId)
                .Select(s => s.Name)
                .FirstOrDefaultAsync();

            return new AttendanceDto
            {
                NurseryId = attendance.NurseryId,
                ChildId = attendance.ChildId,
                ChildName = child,
                AttendanceDate = attendance.AttendanceDate,
                Status = attendance.Status,
                Notes = attendance.Notes,
                UpdatedByStaffId = attendance.UpdatedByStaffId,
                UpdatedByStaffName = staffName,
                UpdatedAt = attendance.UpdatedAt,
                IsActive = attendance.IsActive
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update attendance notes for child {ChildId} on {Date}", childId, date);
            throw;
        }
    }

    public async Task<BulkPresentResponse> BulkPresentAsync(BulkPresentRequest request)
    {
        try
        {
            // クラスの全園児を取得
            var children = await _context.Children
                .Where(c => c.NurseryId == request.NurseryId && c.ClassId == request.ClassId && c.IsActive)
                .Select(c => new { c.ChildId, c.Name })
                .ToListAsync();

            if (!children.Any())
            {
                return new BulkPresentResponse
                {
                    TotalChildren = 0,
                    RegisteredCount = 0,
                    SkippedCount = 0
                };
            }

            var childIds = children.Select(c => c.ChildId).ToList();

            // 既存の出欠記録を取得
            var existingAttendances = await _context.DailyAttendances
                .Where(a => a.NurseryId == request.NurseryId &&
                           childIds.Contains(a.ChildId) &&
                           a.AttendanceDate == request.Date.Date &&
                           a.IsActive)
                .ToListAsync();

            var existingDict = existingAttendances.ToDictionary(a => a.ChildId);

            var registered = 0;
            var skipped = new List<SkippedChildInfo>();

            foreach (var child in children)
            {
                if (existingDict.ContainsKey(child.ChildId))
                {
                    // BR-AT-007: 一括出席は「未記録」の園児のみ対象
                    var existing = existingDict[child.ChildId];
                    if (existing.Status != "blank")
                    {
                        skipped.Add(new SkippedChildInfo
                        {
                            ChildId = child.ChildId,
                            ChildName = child.Name,
                            Reason = $"既に{GetStatusDisplayName(existing.Status)}として登録済み"
                        });
                        continue;
                    }

                    // blankの場合は出席に更新
                    existing.Status = "present";
                    existing.UpdatedByStaffId = request.RecordedByStaffId;
                    existing.UpdatedByStaffNurseryId = request.RecordedByStaffNurseryId;
                    existing.UpdatedAt = DateTimeHelper.GetJstNow();
                    registered++;
                }
                else
                {
                    // 新規レコードを作成
                    var attendance = new DailyAttendance
                    {
                        NurseryId = request.NurseryId,
                        ChildId = child.ChildId,
                        AttendanceDate = request.Date.Date,
                        Status = "present",
                        RecordedByStaffId = request.RecordedByStaffId,
                        RecordedByStaffNurseryId = request.RecordedByStaffNurseryId,
                        RecordedAt = DateTimeHelper.GetJstNow(),
                        CreatedAt = DateTimeHelper.GetJstNow(),
                        IsActive = true
                    };

                    _context.DailyAttendances.Add(attendance);
                    registered++;
                }
            }

            await _context.SaveChangesAsync();

            return new BulkPresentResponse
            {
                TotalChildren = children.Count,
                RegisteredCount = registered,
                SkippedCount = skipped.Count,
                SkippedChildren = skipped
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to bulk present for nursery {NurseryId}, class {ClassId}, date {Date}",
                request.NurseryId, request.ClassId, request.Date);
            throw;
        }
    }

    private string GetStatusDisplayName(string status)
    {
        return status switch
        {
            "present" => "出席",
            "absent" => "欠席",
            "late" => "遅刻",
            "blank" => "未記録",
            _ => status
        };
    }
}
