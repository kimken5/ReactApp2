using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Services;

/// <summary>
/// 園児クラス割り当てサービス実装
/// </summary>
public class ChildClassAssignmentService : IChildClassAssignmentService
{
    private readonly KindergartenDbContext _context;
    private readonly ILogger<ChildClassAssignmentService> _logger;

    public ChildClassAssignmentService(
        KindergartenDbContext context,
        ILogger<ChildClassAssignmentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 指定年度の全クラスと割り当て済み園児を取得
    /// </summary>
    public async Task<List<ClassWithChildrenDto>> GetClassesWithChildren(int nurseryId, int academicYear)
    {
        _logger.LogInformation("Getting classes with children for nursery {NurseryId}, year {Year}", nurseryId, academicYear);

        // 有効なクラス一覧を取得
        var classes = await _context.Classes
            .Where(c => c.NurseryId == nurseryId && c.IsActive)
            .OrderBy(c => c.AgeGroupMin)
            .ThenBy(c => c.ClassId)
            .ToListAsync();

        var result = new List<ClassWithChildrenDto>();

        foreach (var classItem in classes)
        {
            // このクラスに割り当てられている園児を取得
            var assignments = await _context.ChildClassAssignments
                .Where(a => a.NurseryId == nurseryId
                    && a.AcademicYear == academicYear
                    && a.ClassId == classItem.ClassId
                    && a.IsFuture)
                .ToListAsync();

            var childrenInfo = new List<ChildAssignmentInfo>();

            foreach (var assignment in assignments)
            {
                var child = await _context.Children
                    .Where(c => c.NurseryId == nurseryId && c.ChildId == assignment.ChildId)
                    .FirstOrDefaultAsync();

                if (child != null)
                {
                    // 現在のクラス情報を取得
                    var currentAssignment = await _context.ChildClassAssignments
                        .Where(a => a.NurseryId == nurseryId
                            && a.ChildId == child.ChildId
                            && a.IsCurrent)
                        .FirstOrDefaultAsync();

                    var currentClass = currentAssignment != null
                        ? await _context.Classes
                            .Where(c => c.NurseryId == nurseryId && c.ClassId == currentAssignment.ClassId)
                            .FirstOrDefaultAsync()
                        : null;

                    childrenInfo.Add(new ChildAssignmentInfo
                    {
                        ChildId = child.ChildId,
                        ChildName = $"{child.FamilyName} {child.FirstName}",
                        Age = DateTime.Now.Year - child.DateOfBirth.Year,
                        CurrentClassId = currentAssignment?.ClassId ?? "",
                        CurrentClassName = currentClass?.Name ?? "",
                        IsAssigned = true
                    });
                }
            }

            result.Add(new ClassWithChildrenDto
            {
                ClassId = classItem.ClassId,
                ClassName = classItem.Name,
                Grade = classItem.AgeGroupMin,
                AssignedCount = childrenInfo.Count,
                Children = childrenInfo
            });
        }

        return result;
    }

    /// <summary>
    /// 指定年度の割り当て可能な園児一覧を取得
    /// </summary>
    public async Task<List<AvailableChildDto>> GetAvailableChildren(int nurseryId, int academicYear)
    {
        _logger.LogInformation("Getting available children for nursery {NurseryId}, year {Year}", nurseryId, academicYear);

        // アクティブな園児を取得
        var children = await _context.Children
            .Where(c => c.NurseryId == nurseryId && c.IsActive)
            .OrderBy(c => c.FamilyName)
            .ThenBy(c => c.FirstName)
            .ToListAsync();

        var result = new List<AvailableChildDto>();

        foreach (var child in children)
        {
            // 現在のクラス割り当てを取得
            var currentAssignment = await _context.ChildClassAssignments
                .Where(a => a.NurseryId == nurseryId
                    && a.ChildId == child.ChildId
                    && a.IsCurrent)
                .FirstOrDefaultAsync();

            // ChildClassAssignmentが存在すればそれを使用、なければChild.ClassIdをフォールバック
            var currentClassId = currentAssignment?.ClassId ?? child.ClassId;

            var currentClass = !string.IsNullOrEmpty(currentClassId)
                ? await _context.Classes
                    .Where(c => c.NurseryId == nurseryId && c.ClassId == currentClassId)
                    .FirstOrDefaultAsync()
                : null;

            // 未来年度のクラス割り当てを取得
            var futureAssignment = await _context.ChildClassAssignments
                .Where(a => a.NurseryId == nurseryId
                    && a.ChildId == child.ChildId
                    && a.AcademicYear == academicYear
                    && a.IsFuture)
                .FirstOrDefaultAsync();

            var futureClass = futureAssignment != null
                ? await _context.Classes
                    .Where(c => c.NurseryId == nurseryId && c.ClassId == futureAssignment.ClassId)
                    .FirstOrDefaultAsync()
                : null;

            result.Add(new AvailableChildDto
            {
                ChildId = child.ChildId,
                ChildName = $"{child.FamilyName} {child.FirstName}",
                Age = DateTime.Now.Year - child.DateOfBirth.Year,
                CurrentClassId = currentClassId ?? "",
                CurrentClassName = currentClass?.Name ?? "未割り当て",
                FutureClassId = futureAssignment?.ClassId,
                FutureClassName = futureClass?.Name,
                IsAssignedToFuture = futureAssignment != null
            });
        }

        return result;
    }

    /// <summary>
    /// 園児をクラスに割り当て
    /// </summary>
    public async Task<ChildClassAssignmentDto> AssignChildToClass(AssignChildToClassRequest request, int userId)
    {
        _logger.LogInformation("Assigning child {ChildId} to class {ClassId} for year {Year}",
            request.ChildId, request.ClassId, request.AcademicYear);

        // 既存の割り当てを確認
        var existing = await _context.ChildClassAssignments
            .Where(a => a.NurseryId == request.NurseryId
                && a.AcademicYear == request.AcademicYear
                && a.ChildId == request.ChildId)
            .FirstOrDefaultAsync();

        if (existing != null)
        {
            // 更新
            existing.ClassId = request.ClassId;
            existing.UpdatedAt = DateTimeHelper.GetJstNow();
            _context.ChildClassAssignments.Update(existing);
        }
        else
        {
            // 新規作成
            var assignment = new ChildClassAssignment
            {
                AcademicYear = request.AcademicYear,
                NurseryId = request.NurseryId,
                ChildId = request.ChildId,
                ClassId = request.ClassId,
                IsCurrent = false,
                IsFuture = true,
                AssignedAt = DateTimeHelper.GetJstNow(),
                AssignedByUserId = userId,
                CreatedAt = DateTimeHelper.GetJstNow()
            };

            _context.ChildClassAssignments.Add(assignment);
            existing = assignment;
        }

        await _context.SaveChangesAsync();

        // 園児情報とクラス情報を取得
        var child = await _context.Children
            .Where(c => c.NurseryId == request.NurseryId && c.ChildId == request.ChildId)
            .FirstOrDefaultAsync();
        var classInfo = await _context.Classes
            .Where(c => c.NurseryId == request.NurseryId && c.ClassId == request.ClassId)
            .FirstOrDefaultAsync();

        return new ChildClassAssignmentDto
        {
            AcademicYear = existing.AcademicYear,
            NurseryId = existing.NurseryId,
            ChildId = existing.ChildId,
            ChildName = child != null ? $"{child.FamilyName} {child.FirstName}" : "",
            ClassId = existing.ClassId,
            ClassName = classInfo?.Name ?? "",
            IsCurrent = existing.IsCurrent,
            IsFuture = existing.IsFuture,
            AssignedAt = existing.AssignedAt
        };
    }

    /// <summary>
    /// 園児のクラス割り当てを解除
    /// </summary>
    public async Task<bool> UnassignChildFromClass(int nurseryId, int academicYear, int childId)
    {
        _logger.LogInformation("Unassigning child {ChildId} from year {Year}", childId, academicYear);

        var assignment = await _context.ChildClassAssignments
            .Where(a => a.NurseryId == nurseryId
                && a.AcademicYear == academicYear
                && a.ChildId == childId
                && a.IsFuture)
            .FirstOrDefaultAsync();

        if (assignment == null)
        {
            return false;
        }

        _context.ChildClassAssignments.Remove(assignment);
        await _context.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// 一括で園児をクラスに割り当て
    /// </summary>
    public async Task<List<ChildClassAssignmentDto>> BulkAssignChildren(BulkAssignChildrenRequest request, int userId)
    {
        _logger.LogInformation("Bulk assigning {Count} children for year {Year}",
            request.Assignments.Count, request.AcademicYear);

        var results = new List<ChildClassAssignmentDto>();

        foreach (var pair in request.Assignments)
        {
            var assignRequest = new AssignChildToClassRequest
            {
                AcademicYear = request.AcademicYear,
                NurseryId = request.NurseryId,
                ChildId = pair.ChildId,
                ClassId = pair.ClassId
            };

            var result = await AssignChildToClass(assignRequest, userId);
            results.Add(result);
        }

        return results;
    }
}
