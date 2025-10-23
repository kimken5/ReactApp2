namespace ReactApp.Server
{
    /// <summary>
    /// 天気予報データモデル
    /// サンプルAPIのデモ用天気予報データを表現するクラス
    /// </summary>
    public class WeatherForecast
    {
        /// <summary>
        /// 日付
        /// 天気予報の対象日
        /// </summary>
        public DateOnly Date { get; set; }

        /// <summary>
        /// 摂氏温度
        /// 摂氏で表現された気温
        /// </summary>
        public int TemperatureC { get; set; }

        /// <summary>
        /// 華氏温度
        /// 摂氏温度から自動計算された華氏気温
        /// </summary>
        public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);

        /// <summary>
        /// 天気概要（任意）
        /// 天気の簡単な説明文
        /// </summary>
        public string? Summary { get; set; }
    }
}
