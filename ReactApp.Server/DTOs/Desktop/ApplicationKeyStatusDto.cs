namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// 入園申込キーステータス
/// </summary>
public class ApplicationKeyStatusDto
{
    /// <summary>
    /// 現在の入園申込キー（null = 未設定）
    /// </summary>
    public string? ApplicationKey { get; set; }

    /// <summary>
    /// 入園申込URL（キーが存在する場合）
    /// </summary>
    public string? ApplicationUrl { get; set; }

    /// <summary>
    /// キーが設定されているか
    /// </summary>
    public bool HasKey { get; set; }
}
