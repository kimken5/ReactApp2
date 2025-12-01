using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services;

/// <summary>
/// 年度管理サービス実装
/// </summary>
public class AcademicYearService : IAcademicYearService
{
    private readonly KindergartenDbContext _context;
    private readonly ILogger<AcademicYearService> _logger;

    public AcademicYearService(
        KindergartenDbContext context,
        ILogger<AcademicYearService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<AcademicYearDto>> GetAcademicYearsAsync(int nurseryId)
    {
        var years = await _context.AcademicYears
            .Where(y => y.NurseryId == nurseryId)
            .OrderByDescending(y => y.Year)
            .ToListAsync();

        return years.Select(MapToDto).ToList();
    }

    public async Task<AcademicYearDto?> GetCurrentYearAsync(int nurseryId)
    {
        var currentYear = await _context.AcademicYears
            .FirstOrDefaultAsync(y => y.NurseryId == nurseryId && y.IsCurrent);

        return currentYear != null ? MapToDto(currentYear) : null;
    }

    public async Task<AcademicYearDto?> GetAcademicYearAsync(int nurseryId, int year)
    {
        var academicYear = await _context.AcademicYears
            .FirstOrDefaultAsync(y => y.NurseryId == nurseryId && y.Year == year);

        return academicYear != null ? MapToDto(academicYear) : null;
    }

    public async Task<AcademicYearDto> CreateAcademicYearAsync(CreateAcademicYearDto dto)
    {
        // 既存チェック
        var exists = await ExistsAsync(dto.NurseryId, dto.Year);
        if (exists)
        {
            throw new InvalidOperationException($"年度 {dto.Year} は既に存在します。");
        }

        // 開始日・終了日の自動設定
        var startDate = dto.StartDate ?? new DateOnly(dto.Year, 4, 1);
        var endDate = dto.EndDate ?? new DateOnly(dto.Year + 1, 3, 31);

        // 日付の妥当性チェック
        if (endDate <= startDate)
        {
            throw new ArgumentException("終了日は開始日より後である必要があります。");
        }

        var academicYear = new AcademicYear
        {
            NurseryId = dto.NurseryId,
            Year = dto.Year,
            StartDate = startDate,
            EndDate = endDate,
            IsCurrent = false, // 作成時は必ず非現在年度
            IsFuture = dto.IsFuture,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.AcademicYears.Add(academicYear);
        await _context.SaveChangesAsync();

        _logger.LogInformation("年度 {Year} を保育園 {NurseryId} に作成しました。", dto.Year, dto.NurseryId);

        return MapToDto(academicYear);
    }

    public async Task<YearSlidePreviewDto> GetYearSlidePreviewAsync(int nurseryId, int targetYear)
    {
        // 現在年度を取得
        var currentYear = await _context.AcademicYears
            .FirstOrDefaultAsync(y => y.NurseryId == nurseryId && y.IsCurrent);

        if (currentYear == null)
        {
            throw new InvalidOperationException("現在年度が設定されていません。");
        }

        // 対象年度が存在するか確認
        var targetYearExists = await ExistsAsync(nurseryId, targetYear);
        if (!targetYearExists)
        {
            throw new InvalidOperationException($"スライド先の年度 {targetYear} が存在しません。");
        }

        var preview = new YearSlidePreviewDto
        {
            CurrentYear = currentYear.Year,
            TargetYear = targetYear
        };

        // 影響を受ける園児数を取得
        var childAssignments = await _context.ChildClassAssignments
            .Where(c => c.NurseryId == nurseryId && c.AcademicYear == currentYear.Year && c.IsCurrent)
            .ToListAsync();

        preview.AffectedChildrenCount = childAssignments.Count;

        // クラス別園児数サマリーを作成
        var childrenByClass = childAssignments
            .GroupBy(c => c.ClassId)
            .Select(g => new ClassChildrenSummary
            {
                ClassId = g.Key,
                ClassName = g.Key, // TODO: クラス名マスタから取得
                ChildrenCount = g.Count()
            })
            .OrderBy(s => s.ClassId)
            .ToList();

        preview.ClassSummaries = childrenByClass;

        // 影響を受ける職員数を取得
        var staffAssignments = await _context.StaffClassAssignments
            .Where(s => s.NurseryId == nurseryId && s.AcademicYear == currentYear.Year && s.IsCurrent)
            .ToListAsync();

        preview.AffectedStaffCount = staffAssignments
            .Select(s => s.StaffId)
            .Distinct()
            .Count();

        // クラス別職員数サマリーを作成
        var staffByClass = staffAssignments
            .GroupBy(s => s.ClassId)
            .Select(g => new ClassStaffSummary
            {
                ClassId = g.Key,
                ClassName = g.Key, // TODO: クラス名マスタから取得
                StaffCount = g.Select(s => s.StaffId).Distinct().Count()
            })
            .OrderBy(s => s.ClassId)
            .ToList();

        preview.StaffSummaries = staffByClass;

        // 警告メッセージ
        if (preview.AffectedChildrenCount == 0)
        {
            preview.Warnings.Add("現在年度にクラス割り当てされている園児がいません。");
        }

        if (preview.AffectedStaffCount == 0)
        {
            preview.Warnings.Add("現在年度にクラス割り当てされている職員がいません。");
        }

        return preview;
    }

    public async Task<YearSlideResultDto> ExecuteYearSlideAsync(YearSlideRequestDto request)
    {
        var result = new YearSlideResultDto
        {
            ExecutedAt = DateTime.UtcNow,
            ExecutedByUserId = request.ExecutedByUserId
        };

        try
        {
            // 確認フラグチェック
            if (!request.Confirmed)
            {
                throw new InvalidOperationException("年度スライドは確認フラグが必須です。");
            }

            // 現在年度を取得
            var currentYear = await _context.AcademicYears
                .FirstOrDefaultAsync(y => y.NurseryId == request.NurseryId && y.IsCurrent);

            if (currentYear == null)
            {
                throw new InvalidOperationException("現在年度が設定されていません。");
            }

            // 対象年度を取得
            var targetYear = await _context.AcademicYears
                .FirstOrDefaultAsync(y => y.NurseryId == request.NurseryId && y.Year == request.TargetYear);

            if (targetYear == null)
            {
                throw new InvalidOperationException($"スライド先の年度 {request.TargetYear} が存在しません。");
            }

            result.PreviousYear = currentYear.Year;
            result.NewYear = targetYear.Year;

            // トランザクション開始
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 1. 園児のクラス割り当てをスライド
                var childrenSlideResult = await SlideChildClassAssignmentsAsync(
                    request.NurseryId,
                    currentYear.Year,
                    request.TargetYear,
                    request.ExecutedByUserId);

                result.SlidedChildrenCount = childrenSlideResult.count;
                result.Messages.AddRange(childrenSlideResult.messages);

                // 2. 職員のクラス割り当てをスライド
                var staffSlideResult = await SlideStaffClassAssignmentsAsync(
                    request.NurseryId,
                    currentYear.Year,
                    request.TargetYear,
                    request.ExecutedByUserId);

                result.SlidedStaffCount = staffSlideResult.count;
                result.Messages.AddRange(staffSlideResult.messages);

                // 3. 年度フラグを更新
                // 旧年度: IsCurrent = false
                currentYear.IsCurrent = false;
                currentYear.UpdatedAt = DateTime.UtcNow;

                // 新年度: IsCurrent = true, IsFuture = false
                targetYear.IsCurrent = true;
                targetYear.IsFuture = false;
                targetYear.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // トランザクションコミット
                await transaction.CommitAsync();

                result.Success = true;
                result.Messages.Add($"年度スライドが正常に完了しました。({currentYear.Year} → {targetYear.Year})");

                _logger.LogInformation(
                    "年度スライド完了: 保育園 {NurseryId}, {PreviousYear} → {NewYear}, 園児 {ChildrenCount}名, 職員 {StaffCount}名",
                    request.NurseryId, currentYear.Year, targetYear.Year,
                    result.SlidedChildrenCount, result.SlidedStaffCount);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.ErrorMessage = ex.Message;
            result.Messages.Add($"エラー: {ex.Message}");

            _logger.LogError(ex, "年度スライド失敗: 保育園 {NurseryId}, {TargetYear}",
                request.NurseryId, request.TargetYear);
        }

        return result;
    }

    public async Task<bool> ExistsAsync(int nurseryId, int year)
    {
        return await _context.AcademicYears
            .AnyAsync(y => y.NurseryId == nurseryId && y.Year == year);
    }

    #region Private Methods

    /// <summary>
    /// 園児のクラス割り当てをスライド
    /// </summary>
    private async Task<(int count, List<string> messages)> SlideChildClassAssignmentsAsync(
        int nurseryId, int currentYear, int targetYear, int executedByUserId)
    {
        var messages = new List<string>();
        var count = 0;

        // 現在年度のIsCurrent=trueの割り当てを取得
        var currentAssignments = await _context.ChildClassAssignments
            .Where(c => c.NurseryId == nurseryId && c.AcademicYear == currentYear && c.IsCurrent)
            .ToListAsync();

        if (!currentAssignments.Any())
        {
            messages.Add("スライド対象の園児クラス割り当てがありません。");
            return (0, messages);
        }

        // 現在の割り当てをIsCurrent=false, IsFuture=trueに更新
        foreach (var assignment in currentAssignments)
        {
            assignment.IsCurrent = false;
            assignment.IsFuture = true;
            assignment.UpdatedAt = DateTime.UtcNow;
        }

        // 新年度の割り当てを作成（同じクラスに割り当て）
        var newAssignments = currentAssignments.Select(a => new ChildClassAssignment
        {
            AcademicYear = targetYear,
            NurseryId = nurseryId,
            ChildId = a.ChildId,
            ClassId = a.ClassId, // 同じクラスIDを使用（進級処理は別途実装）
            IsCurrent = true,
            IsFuture = false,
            AssignedAt = DateTime.UtcNow,
            AssignedByUserId = executedByUserId,
            Notes = $"年度スライドにより {currentYear} から移行",
            CreatedAt = DateTime.UtcNow
        }).ToList();

        _context.ChildClassAssignments.AddRange(newAssignments);
        count = newAssignments.Count;

        messages.Add($"園児クラス割り当て {count}件 をスライドしました。");
        return (count, messages);
    }

    /// <summary>
    /// 職員のクラス割り当てをスライド
    /// </summary>
    private async Task<(int count, List<string> messages)> SlideStaffClassAssignmentsAsync(
        int nurseryId, int currentYear, int targetYear, int executedByUserId)
    {
        var messages = new List<string>();
        var count = 0;

        // 現在年度のIsCurrent=trueの割り当てを取得
        var currentAssignments = await _context.StaffClassAssignments
            .Where(s => s.NurseryId == nurseryId && s.AcademicYear == currentYear && s.IsCurrent)
            .ToListAsync();

        if (!currentAssignments.Any())
        {
            messages.Add("スライド対象の職員クラス割り当てがありません。");
            return (0, messages);
        }

        // 現在の割り当てをIsCurrent=false, IsFuture=trueに更新
        foreach (var assignment in currentAssignments)
        {
            assignment.IsCurrent = false;
            assignment.IsFuture = true;
            assignment.UpdatedAt = DateTime.UtcNow;
        }

        // 新年度の割り当てを作成（同じクラス・役割で割り当て）
        var newAssignments = currentAssignments.Select(a => new StaffClassAssignment
        {
            AcademicYear = targetYear,
            NurseryId = nurseryId,
            StaffId = a.StaffId,
            ClassId = a.ClassId,
            AssignmentRole = a.AssignmentRole,
            IsCurrent = true,
            IsFuture = false,
            IsActive = true,
            AssignedAt = DateTime.UtcNow,
            AssignedByUserId = executedByUserId,
            Notes = $"年度スライドにより {currentYear} から移行",
            CreatedAt = DateTime.UtcNow
        }).ToList();

        _context.StaffClassAssignments.AddRange(newAssignments);
        count = newAssignments.Count;

        messages.Add($"職員クラス割り当て {count}件 をスライドしました。");
        return (count, messages);
    }

    /// <summary>
    /// AcademicYearエンティティをDTOに変換
    /// </summary>
    private static AcademicYearDto MapToDto(AcademicYear entity)
    {
        return new AcademicYearDto
        {
            NurseryId = entity.NurseryId,
            Year = entity.Year,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            IsCurrent = entity.IsCurrent,
            IsFuture = entity.IsFuture,
            Notes = entity.Notes,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    #endregion
}
