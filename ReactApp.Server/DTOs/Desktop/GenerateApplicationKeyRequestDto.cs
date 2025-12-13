namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// 入園申込キー生成リクエスト
/// </summary>
public class GenerateApplicationKeyRequestDto
{
    /// <summary>
    /// フロントエンドのベースURL（例: https://localhost:5173）
    /// </summary>
    public string? BaseUrl { get; set; }
}
