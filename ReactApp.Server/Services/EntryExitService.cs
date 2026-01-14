using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Helpers;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 入退管理サービス実装
    /// </summary>
    public class EntryExitService : IEntryExitService
    {
        private readonly KindergartenDbContext _context;

        public EntryExitService(KindergartenDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// 入退ログを作成
        /// </summary>
        public async Task<EntryExitLogDto> CreateLogAsync(CreateEntryExitLogRequest request)
        {
            // 保護者の存在チェック
            var parent = await _context.Parents
                .Where(p => p.Id == request.ParentId && p.NurseryId == request.NurseryId && p.IsActive)
                .FirstOrDefaultAsync();

            if (parent == null)
            {
                throw new InvalidOperationException($"保護者ID {request.ParentId} が見つかりません。");
            }

            // 入退ログを作成
            var log = new EntryExitLog
            {
                ParentId = request.ParentId,
                NurseryId = request.NurseryId,
                EntryType = request.EntryType,
                Timestamp = DateTimeHelper.GetJstNow(),
                CreatedAt = DateTimeHelper.GetJstNow()
            };

            _context.EntryExitLogs.Add(log);
            await _context.SaveChangesAsync();

            // 関連園児名を取得
            var childNames = await GetChildNamesByParentIdAsync(request.ParentId);

            // DTOに変換して返す
            return new EntryExitLogDto
            {
                Id = log.Id,
                ParentId = log.ParentId,
                ParentName = parent.Name ?? "名前未設定",
                NurseryId = log.NurseryId,
                EntryType = log.EntryType,
                Timestamp = log.Timestamp,
                ChildNames = childNames,
                CreatedAt = log.CreatedAt
            };
        }

        /// <summary>
        /// 入退ログ一覧を取得（ページネーション、フィルター付き）
        /// </summary>
        public async Task<(List<EntryExitLogDto> Logs, int TotalCount)> GetLogsAsync(
            int nurseryId,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            string? parentName = null,
            string? entryType = null,
            int page = 1,
            int pageSize = 50)
        {
            var query = _context.EntryExitLogs
                .Where(l => l.NurseryId == nurseryId);

            // 日付フィルター
            if (fromDate.HasValue)
            {
                query = query.Where(l => l.Timestamp >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                // 終了日の23:59:59まで含める
                var toDateTime = toDate.Value.Date.AddDays(1).AddSeconds(-1);
                query = query.Where(l => l.Timestamp <= toDateTime);
            }

            // 入退種別フィルター
            if (!string.IsNullOrEmpty(entryType))
            {
                query = query.Where(l => l.EntryType == entryType);
            }

            // 総件数を取得（保護者名フィルター前）
            var logsWithoutNameFilter = await query.ToListAsync();

            // 保護者情報を取得
            var parentIds = logsWithoutNameFilter.Select(l => l.ParentId).Distinct().ToList();
            var parents = await _context.Parents
                .Where(p => parentIds.Contains(p.Id))
                .Select(p => new { p.Id, p.Name })
                .ToListAsync();

            var parentDict = parents.ToDictionary(p => p.Id, p => p.Name ?? "名前未設定");

            // 保護者名フィルター（メモリ上でフィルタリング）
            var logsFiltered = logsWithoutNameFilter;
            if (!string.IsNullOrEmpty(parentName))
            {
                logsFiltered = logsWithoutNameFilter
                    .Where(l => parentDict.ContainsKey(l.ParentId) &&
                               parentDict[l.ParentId].Contains(parentName, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            var totalCount = logsFiltered.Count;

            // ページネーション
            var logs = logsFiltered
                .OrderByDescending(l => l.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            // DTOに変換
            var logDtos = new List<EntryExitLogDto>();
            foreach (var log in logs)
            {
                var childNames = await GetChildNamesByParentIdAsync(log.ParentId);
                logDtos.Add(new EntryExitLogDto
                {
                    Id = log.Id,
                    ParentId = log.ParentId,
                    ParentName = parentDict.ContainsKey(log.ParentId) ? parentDict[log.ParentId] : "名前未設定",
                    NurseryId = log.NurseryId,
                    EntryType = log.EntryType,
                    Timestamp = log.Timestamp,
                    ChildNames = childNames,
                    CreatedAt = log.CreatedAt
                });
            }

            return (logDtos, totalCount);
        }

        /// <summary>
        /// 特定日付の入退ログを取得（出欠管理画面用）
        /// </summary>
        public async Task<List<EntryExitLogDto>> GetLogsByDateAsync(int nurseryId, DateTime date)
        {
            var startOfDay = date.Date;
            var endOfDay = date.Date.AddDays(1).AddSeconds(-1);

            var logs = await _context.EntryExitLogs
                .Where(l => l.NurseryId == nurseryId && l.Timestamp >= startOfDay && l.Timestamp <= endOfDay)
                .OrderBy(l => l.Timestamp)
                .ToListAsync();

            // 保護者情報を取得
            var parentIds = logs.Select(l => l.ParentId).Distinct().ToList();
            var parents = await _context.Parents
                .Where(p => parentIds.Contains(p.Id))
                .Select(p => new { p.Id, p.Name })
                .ToListAsync();

            var parentDict = parents.ToDictionary(p => p.Id, p => p.Name ?? "名前未設定");

            // DTOに変換
            var logDtos = new List<EntryExitLogDto>();
            foreach (var log in logs)
            {
                var childNames = await GetChildNamesByParentIdAsync(log.ParentId);
                logDtos.Add(new EntryExitLogDto
                {
                    Id = log.Id,
                    ParentId = log.ParentId,
                    ParentName = parentDict.ContainsKey(log.ParentId) ? parentDict[log.ParentId] : "名前未設定",
                    NurseryId = log.NurseryId,
                    EntryType = log.EntryType,
                    Timestamp = log.Timestamp,
                    ChildNames = childNames,
                    CreatedAt = log.CreatedAt
                });
            }

            return logDtos;
        }

        /// <summary>
        /// 入退ログを削除
        /// </summary>
        public async Task DeleteLogAsync(int logId, int nurseryId)
        {
            var log = await _context.EntryExitLogs
                .Where(l => l.Id == logId && l.NurseryId == nurseryId)
                .FirstOrDefaultAsync();

            if (log == null)
            {
                throw new InvalidOperationException($"入退ログID {logId} が見つかりません。");
            }

            _context.EntryExitLogs.Remove(log);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// 保護者IDから関連園児名を取得
        /// </summary>
        public async Task<List<string>> GetChildNamesByParentIdAsync(int parentId)
        {
            var childNames = await _context.ParentChildRelationships
                .Where(pcr => pcr.ParentId == parentId && pcr.IsActive)
                .Join(_context.Children,
                    pcr => new { pcr.NurseryId, pcr.ChildId },
                    c => new { c.NurseryId, c.ChildId },
                    (pcr, c) => $"{c.FamilyName} {c.FirstName}")
                .ToListAsync();

            return childNames;
        }
    }
}
