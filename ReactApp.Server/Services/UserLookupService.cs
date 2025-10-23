using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// ユーザー検索サービス実装クラス
    /// 電話番号による保護者・スタッフの存在確認と役割判定を提供
    /// メモリキャッシュによる高速化対応
    /// </summary>
    public class UserLookupService : IUserLookupService
    {
        private readonly KindergartenDbContext _context;
        private readonly IMemoryCache _cache;
        private readonly ILogger<UserLookupService> _logger;

        /// <summary>キャッシュの有効期限（5分）</summary>
        private static readonly TimeSpan CacheExpiration = TimeSpan.FromMinutes(5);

        public UserLookupService(
            KindergartenDbContext context,
            IMemoryCache cache,
            ILogger<UserLookupService> logger)
        {
            _context = context;
            _cache = cache;
            _logger = logger;
        }

        /// <summary>
        /// 電話番号によるユーザー存在確認と役割判定
        /// </summary>
        public async Task<UserLookupResult> CheckUserByPhoneNumberAsync(string phoneNumber)
        {
            var normalizedPhone = NormalizePhoneNumber(phoneNumber);
            var cacheKey = $"user_lookup_{normalizedPhone}";

            // キャッシュから取得試行
            if (_cache.TryGetValue(cacheKey, out UserLookupResult? cachedResult) && cachedResult != null)
            {
                _logger.LogDebug("ユーザー検索結果をキャッシュから取得: {PhoneNumber}", normalizedPhone);
                return cachedResult;
            }

            try
            {
                _logger.LogInformation("ユーザー検索開始: {PhoneNumber}", normalizedPhone);

                var result = new UserLookupResult();

                // 保護者情報とスタッフ情報を順次取得（DbContext並行アクセス問題回避）
                result.ParentInfo = await GetParentInfoAsync(normalizedPhone);
                result.StaffInfo = await GetStaffInfoAsync(normalizedPhone);

                // ユーザー種別フラグを設定
                var userTypes = UserTypeFlags.None;
                if (result.ParentInfo != null)
                    userTypes |= UserTypeFlags.Parent;
                if (result.StaffInfo != null)
                    userTypes |= UserTypeFlags.Staff;

                result.UserTypes = userTypes;
                result.IsParent = result.ParentInfo != null;
                result.IsStaff = result.StaffInfo != null;
                result.IsValidUser = result.IsParent || result.IsStaff;
                result.HasChildren = result.ParentInfo?.ChildCount > 0;
                result.RequiresRoleSelection = result.IsParent && result.IsStaff;

                // SMS認証が必要かどうかの判定
                // すべてのユーザー（保護者・スタッフ）はSMS認証が必要
                result.RequiresSmsAuthentication = result.IsValidUser;

                // 結果をキャッシュに保存
                var cacheOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = CacheExpiration,
                    Size = 1
                };
                _cache.Set(cacheKey, result, cacheOptions);

                _logger.LogInformation("ユーザー検索完了: {PhoneNumber}, Types: {UserTypes}, SmsRequired: {SmsRequired}",
                    normalizedPhone, userTypes, result.RequiresSmsAuthentication);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ユーザー検索エラー: {PhoneNumber}", normalizedPhone);
                throw;
            }
        }

        /// <summary>
        /// 保護者として登録されているかチェック
        /// </summary>
        public async Task<bool> IsParentAsync(string phoneNumber)
        {
            var normalizedPhone = NormalizePhoneNumber(phoneNumber);
            var cacheKey = $"is_parent_{normalizedPhone}";

            if (_cache.TryGetValue(cacheKey, out bool cachedResult))
            {
                return cachedResult;
            }

            try
            {
                // まず保護者として登録されているかをチェック
                _logger.LogInformation("保護者検索: {PhoneNumber}", normalizedPhone);

                var parentCount = await _context.Parents.CountAsync(p => p.PhoneNumber == normalizedPhone);
                var activeParentCount = await _context.Parents.CountAsync(p => p.PhoneNumber == normalizedPhone && p.IsActive);

                _logger.LogInformation("保護者検索結果: 全体={ParentCount}, アクティブ={ActiveCount}", parentCount, activeParentCount);

                var exists = activeParentCount > 0;

                var cacheOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = CacheExpiration,
                    Size = 1
                };
                _cache.Set(cacheKey, exists, cacheOptions);
                return exists;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保護者確認エラー: {PhoneNumber}", normalizedPhone);
                throw;
            }
        }

        /// <summary>
        /// スタッフとして登録されているかチェック
        /// </summary>
        public async Task<bool> IsStaffAsync(string phoneNumber)
        {
            var normalizedPhone = NormalizePhoneNumber(phoneNumber);
            var cacheKey = $"is_staff_{normalizedPhone}";

            if (_cache.TryGetValue(cacheKey, out bool cachedResult))
            {
                return cachedResult;
            }

            try
            {
                var exists = await _context.Staff
                    .AnyAsync(s => s.PhoneNumber == normalizedPhone && s.IsActive);

                var cacheOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = CacheExpiration,
                    Size = 1
                };
                _cache.Set(cacheKey, exists, cacheOptions);
                return exists;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "スタッフ確認エラー: {PhoneNumber}", normalizedPhone);
                throw;
            }
        }

        /// <summary>
        /// ユーザー種別フラグを取得
        /// </summary>
        public async Task<UserTypeFlags> GetUserTypesAsync(string phoneNumber)
        {
            // 並行アクセス問題回避のため順次実行
            var isParent = await IsParentAsync(phoneNumber);
            var isStaff = await IsStaffAsync(phoneNumber);

            var userTypes = UserTypeFlags.None;
            if (isParent)
                userTypes |= UserTypeFlags.Parent;
            if (isStaff)
                userTypes |= UserTypeFlags.Staff;

            return userTypes;
        }

        /// <summary>
        /// 保護者情報の詳細取得
        /// </summary>
        public async Task<ParentLookupInfo?> GetParentInfoAsync(string phoneNumber)
        {
            var normalizedPhone = NormalizePhoneNumber(phoneNumber);

            try
            {
                var parentInfo = await _context.Parents
                    .Where(p => p.PhoneNumber == normalizedPhone && p.IsActive)
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Email,
                        p.LastLoginAt,
                        ChildCount = _context.ParentChildRelationships
                            .Count(pr => pr.ParentId == p.Id)
                    })
                    .FirstOrDefaultAsync();

                if (parentInfo == null)
                    return null;

                // 園児が関連付けられていない場合の警告（ログイン許可）
                if (parentInfo.ChildCount == 0)
                {
                    _logger.LogWarning("保護者に園児が関連付けられていません: {PhoneNumber}, ParentId: {ParentId}",
                        normalizedPhone, parentInfo.Id);
                    // 一時的にログインを許可（テスト用）
                }

                return new ParentLookupInfo
                {
                    Id = parentInfo.Id,
                    Name = parentInfo.Name ?? string.Empty,
                    Email = parentInfo.Email,
                    ChildCount = parentInfo.ChildCount,
                    LastLoginAt = parentInfo.LastLoginAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保護者情報取得エラー: {PhoneNumber}", normalizedPhone);
                throw;
            }
        }

        /// <summary>
        /// スタッフ情報の詳細取得
        /// </summary>
        public async Task<StaffLookupInfo?> GetStaffInfoAsync(string phoneNumber)
        {
            var normalizedPhone = NormalizePhoneNumber(phoneNumber);

            try
            {
                var staffInfo = await _context.Staff
                    .Where(s => s.PhoneNumber == normalizedPhone && s.IsActive)
                    .Select(s => new StaffLookupInfo
                    {
                        Id = s.StaffId,
                        NurseryId = s.NurseryId,
                        StaffId = s.StaffId,
                        Name = s.Name,
                        Role = s.Role,
                        Position = s.Position,
                        Email = s.Email,
                        LastLoginAt = s.LastLoginAt,
                        ClassCount = s.ClassAssignments.Count
                    })
                    .FirstOrDefaultAsync();

                return staffInfo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "スタッフ情報取得エラー: {PhoneNumber}", normalizedPhone);
                throw;
            }
        }

        /// <summary>
        /// ユーザーの役割選択履歴を保存
        /// </summary>
        public async Task<bool> SaveRolePreferenceAsync(string phoneNumber, UserType preferredRole)
        {
            var normalizedPhone = NormalizePhoneNumber(phoneNumber);

            try
            {
                // 既存の設定を検索
                var existingPreference = await _context.UserRolePreferences
                    .FirstOrDefaultAsync(urp => urp.PhoneNumber == normalizedPhone);

                if (existingPreference != null)
                {
                    // 既存設定を更新
                    existingPreference.PreferredRole = preferredRole.ToString();
                    existingPreference.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // 新規設定を作成
                    var newPreference = new UserRolePreference
                    {
                        PhoneNumber = normalizedPhone,
                        PreferredRole = preferredRole.ToString(),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.UserRolePreferences.Add(newPreference);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("役割選択履歴保存: {PhoneNumber}, Role: {Role}",
                    normalizedPhone, preferredRole);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "役割選択履歴保存エラー: {PhoneNumber}, Role: {Role}",
                    normalizedPhone, preferredRole);
                return false;
            }
        }

        /// <summary>
        /// 保存された役割選択履歴を取得
        /// </summary>
        public async Task<UserType?> GetSavedRolePreferenceAsync(string phoneNumber)
        {
            var normalizedPhone = NormalizePhoneNumber(phoneNumber);

            try
            {
                var preference = await _context.UserRolePreferences
                    .Where(urp => urp.PhoneNumber == normalizedPhone)
                    .OrderByDescending(urp => urp.UpdatedAt)
                    .FirstOrDefaultAsync();

                if (preference == null)
                    return null;

                if (Enum.TryParse<UserType>(preference.PreferredRole, out var role))
                {
                    return role;
                }

                _logger.LogWarning("無効な役割選択履歴: {PhoneNumber}, Role: {Role}",
                    normalizedPhone, preference.PreferredRole);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "役割選択履歴取得エラー: {PhoneNumber}", normalizedPhone);
                return null;
            }
        }

        /// <summary>
        /// 電話番号の正規化
        /// </summary>
        public string NormalizePhoneNumber(string phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber))
                return string.Empty;

            // ハイフンと空白を除去
            return phoneNumber.Replace("-", "").Replace(" ", "").Trim();
        }
    }
}