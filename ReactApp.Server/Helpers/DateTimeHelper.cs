namespace ReactApp.Server.Helpers;

/// <summary>
/// 日時関連のヘルパーメソッド
/// </summary>
public static class DateTimeHelper
{
    /// <summary>
    /// 日本標準時（JST）のタイムゾーン情報
    /// </summary>
    private static readonly TimeZoneInfo JstTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Tokyo Standard Time");

    /// <summary>
    /// 現在の日本時間を取得
    /// データベースのdbo.GetJstDateTime()関数と同じロジック（UTC+9時間）
    /// </summary>
    /// <returns>日本時間（JST）</returns>
    public static DateTime GetJstNow()
    {
        return DateTimeHelper.GetJstNow().AddHours(9);
    }

    /// <summary>
    /// UTC時刻を日本時間に変換
    /// </summary>
    /// <param name="utcDateTime">UTC時刻</param>
    /// <returns>日本時間（JST）</returns>
    public static DateTime ConvertUtcToJst(DateTime utcDateTime)
    {
        if (utcDateTime.Kind == DateTimeKind.Unspecified)
        {
            utcDateTime = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
        }

        return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, JstTimeZone);
    }

    /// <summary>
    /// 日本時間をUTCに変換
    /// </summary>
    /// <param name="jstDateTime">日本時間（JST）</param>
    /// <returns>UTC時刻</returns>
    public static DateTime ConvertJstToUtc(DateTime jstDateTime)
    {
        if (jstDateTime.Kind == DateTimeKind.Unspecified)
        {
            jstDateTime = DateTime.SpecifyKind(jstDateTime, DateTimeKind.Unspecified);
        }

        return TimeZoneInfo.ConvertTimeToUtc(jstDateTime, JstTimeZone);
    }
}
