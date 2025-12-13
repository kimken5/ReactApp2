namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// 入園申込キー生成レスポンス
/// </summary>
public class GenerateApplicationKeyResponseDto
{
    /// <summary>
    /// 生成された入園申込キー（32文字の英数字）
    /// </summary>
    public string ApplicationKey { get; set; } = string.Empty;

    /// <summary>
    /// 入園申込URL
    /// </summary>
    public string ApplicationUrl { get; set; } = string.Empty;
}
