using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using System.Collections.Concurrent;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 高性能キャッシュサービス実装
    /// メモリキャッシュ（高速・小容量）と分散キャッシュ（大容量・永続）の階層キャッシュ
    /// 頻度に基づく自動データ配置とキー管理機能を提供
    /// </summary>
    public class CacheService : ICacheService
    {
        private readonly IMemoryCache _memoryCache;
        private readonly IDistributedCache _distributedCache;
        private readonly ILogger<CacheService> _logger;
        private readonly ConcurrentDictionary<string, DateTime> _keyTracker = new();

        // パフォーマンス設定
        private readonly TimeSpan _defaultExpiration = TimeSpan.FromMinutes(30);
        private readonly TimeSpan _memoryExpiration = TimeSpan.FromMinutes(5);    // メモリキャッシュは短期間
        private readonly TimeSpan _distributedExpiration = TimeSpan.FromHours(2); // 分散キャッシュは長期間

        public CacheService(
            IMemoryCache memoryCache,
            IDistributedCache distributedCache,
            ILogger<CacheService> logger)
        {
            _memoryCache = memoryCache;
            _distributedCache = distributedCache;
            _logger = logger;
        }

        /// <summary>
        /// 階層キャッシュからデータを取得
        /// 1. メモリキャッシュから検索（最高速）
        /// 2. 分散キャッシュから検索→メモリキャッシュに昇格
        /// </summary>
        public async Task<T?> GetAsync<T>(string key) where T : class
        {
            try
            {
                // Step 1: メモリキャッシュから高速取得
                if (_memoryCache.TryGetValue(key, out T? memoryValue))
                {
                    _logger.LogDebug("メモリキャッシュヒット: {Key}", key);
                    return memoryValue;
                }

                // Step 2: 分散キャッシュから取得
                var distributedData = await _distributedCache.GetStringAsync(key);
                if (!string.IsNullOrEmpty(distributedData))
                {
                    var value = JsonSerializer.Deserialize<T>(distributedData);
                    if (value != null)
                    {
                        // メモリキャッシュに昇格（頻繁アクセスデータの最適化）
                        var promoteOptions = new MemoryCacheEntryOptions
                        {
                            AbsoluteExpirationRelativeToNow = _memoryExpiration,
                            Size = distributedData.Length
                        };
                        _memoryCache.Set(key, value, promoteOptions);
                        _logger.LogDebug("分散キャッシュヒット→メモリ昇格: {Key}", key);
                        return value;
                    }
                }

                _logger.LogDebug("キャッシュミス: {Key}", key);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "キャッシュ取得エラー: {Key}", key);
                return null;
            }
        }

        /// <summary>
        /// 階層キャッシュにデータを保存
        /// 小さなデータ: メモリキャッシュ + 分散キャッシュ
        /// 大きなデータ: 分散キャッシュのみ
        /// </summary>
        public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class
        {
            try
            {
                var exp = expiration ?? _defaultExpiration;
                var serializedValue = JsonSerializer.Serialize(value);

                // 分散キャッシュに保存（永続性確保）
                var distributedOptions = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = exp
                };
                await _distributedCache.SetStringAsync(key, serializedValue, distributedOptions);

                // データサイズチェック（大きすぎる場合はメモリキャッシュを避ける）
                if (serializedValue.Length < 1_000_000) // 1MB未満
                {
                    var memoryOptions = new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(Math.Min(exp.TotalMinutes, _memoryExpiration.TotalMinutes)),
                        Size = serializedValue.Length
                    };
                    _memoryCache.Set(key, value, memoryOptions);
                }

                // キー追跡（パターンマッチ削除用）
                _keyTracker.TryAdd(key, DateTimeHelper.GetJstNow());

                _logger.LogDebug("キャッシュ保存完了: {Key}, サイズ: {Size}bytes", key, serializedValue.Length);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "キャッシュ保存エラー: {Key}", key);
            }
        }

        /// <summary>
        /// 階層キャッシュからデータを削除
        /// </summary>
        public async Task RemoveAsync(string key)
        {
            try
            {
                _memoryCache.Remove(key);
                await _distributedCache.RemoveAsync(key);
                _keyTracker.TryRemove(key, out _);

                _logger.LogDebug("キャッシュ削除完了: {Key}", key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "キャッシュ削除エラー: {Key}", key);
            }
        }

        /// <summary>
        /// パターンマッチによる一括削除
        /// 例: "user:*", "report:2024:*"
        /// </summary>
        public async Task RemoveByPatternAsync(string pattern)
        {
            try
            {
                var regex = new System.Text.RegularExpressions.Regex(
                    "^" + pattern.Replace("*", ".*") + "$");

                var matchingKeys = _keyTracker.Keys
                    .Where(key => regex.IsMatch(key))
                    .ToList();

                var removeTasks = matchingKeys.Select(async key =>
                {
                    _memoryCache.Remove(key);
                    await _distributedCache.RemoveAsync(key);
                    _keyTracker.TryRemove(key, out _);
                });

                await Task.WhenAll(removeTasks);

                _logger.LogInformation("パターンマッチ削除完了: {Pattern}, 削除数: {Count}", pattern, matchingKeys.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "パターンマッチ削除エラー: {Pattern}", pattern);
            }
        }

        /// <summary>
        /// キャッシュ取得または生成（Cache-Aside Pattern）
        /// 高頻度で使用される最重要メソッド
        /// </summary>
        public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null) where T : class
        {
            try
            {
                // キャッシュから取得試行
                var cachedValue = await GetAsync<T>(key);
                if (cachedValue != null)
                {
                    return cachedValue;
                }

                // キャッシュミス→ファクトリで生成
                _logger.LogDebug("キャッシュミス→データ生成開始: {Key}", key);
                var startTime = DateTimeHelper.GetJstNow();

                var newValue = await factory();

                var duration = DateTimeHelper.GetJstNow() - startTime;
                _logger.LogDebug("データ生成完了: {Key}, 所要時間: {Duration}ms", key, duration.TotalMilliseconds);

                // 生成データをキャッシュに保存
                if (newValue != null)
                {
                    await SetAsync(key, newValue, expiration);
                }

                return newValue;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetOrSet処理エラー: {Key}", key);

                // エラー時はファクトリから直接取得
                try
                {
                    return await factory();
                }
                catch (Exception factoryEx)
                {
                    _logger.LogError(factoryEx, "ファクトリ実行エラー: {Key}", key);
                    throw;
                }
            }
        }

        /// <summary>
        /// キャッシュ存在確認
        /// </summary>
        public async Task<bool> ExistsAsync(string key)
        {
            try
            {
                if (_memoryCache.TryGetValue(key, out _))
                {
                    return true;
                }

                var distributedData = await _distributedCache.GetStringAsync(key);
                return !string.IsNullOrEmpty(distributedData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "キャッシュ存在確認エラー: {Key}", key);
                return false;
            }
        }

        /// <summary>
        /// キャッシュ有効期限を延長
        /// </summary>
        public async Task RefreshAsync(string key, TimeSpan expiration)
        {
            try
            {
                // 分散キャッシュの有効期限延長
                await _distributedCache.RefreshAsync(key);

                // メモリキャッシュは再設定が必要
                if (_memoryCache.TryGetValue(key, out var value))
                {
                    _memoryCache.Remove(key);
                    var refreshOptions = new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(Math.Min(expiration.TotalMinutes, _memoryExpiration.TotalMinutes)),
                        Size = JsonSerializer.Serialize(value).Length
                    };
                    _memoryCache.Set(key, value, refreshOptions);
                }

                _logger.LogDebug("キャッシュ更新完了: {Key}", key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "キャッシュ更新エラー: {Key}", key);
            }
        }
    }
}
