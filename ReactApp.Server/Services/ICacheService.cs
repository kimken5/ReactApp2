namespace ReactApp.Server.Services
{
    /// <summary>
    /// キャッシュサービスインターフェース
    /// メモリキャッシュと分散キャッシュの統一アクセス層を提供
    /// 高頻度アクセスデータの性能最適化を実現
    /// </summary>
    public interface ICacheService
    {
        /// <summary>
        /// キャッシュからデータを取得
        /// </summary>
        /// <typeparam name="T">取得するデータの型</typeparam>
        /// <param name="key">キャッシュキー</param>
        /// <returns>キャッシュデータまたはnull</returns>
        Task<T?> GetAsync<T>(string key) where T : class;

        /// <summary>
        /// データをキャッシュに保存
        /// </summary>
        /// <typeparam name="T">保存するデータの型</typeparam>
        /// <param name="key">キャッシュキー</param>
        /// <param name="value">保存するデータ</param>
        /// <param name="expiration">有効期限（省略時はデフォルト30分）</param>
        Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class;

        /// <summary>
        /// 指定キーのキャッシュを削除
        /// </summary>
        /// <param name="key">削除するキャッシュキー</param>
        Task RemoveAsync(string key);

        /// <summary>
        /// パターンマッチでキャッシュを削除
        /// </summary>
        /// <param name="pattern">削除対象のキーパターン</param>
        Task RemoveByPatternAsync(string pattern);

        /// <summary>
        /// キャッシュからデータを取得し、存在しない場合はファクトリで生成してキャッシュ
        /// </summary>
        /// <typeparam name="T">データの型</typeparam>
        /// <param name="key">キャッシュキー</param>
        /// <param name="factory">データ生成ファクトリ</param>
        /// <param name="expiration">有効期限</param>
        /// <returns>キャッシュまたは新規生成されたデータ</returns>
        Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null) where T : class;

        /// <summary>
        /// キャッシュの存在確認
        /// </summary>
        /// <param name="key">確認するキャッシュキー</param>
        /// <returns>存在する場合true</returns>
        Task<bool> ExistsAsync(string key);

        /// <summary>
        /// キャッシュの有効期限を延長
        /// </summary>
        /// <param name="key">対象キー</param>
        /// <param name="expiration">新しい有効期限</param>
        Task RefreshAsync(string key, TimeSpan expiration);
    }
}