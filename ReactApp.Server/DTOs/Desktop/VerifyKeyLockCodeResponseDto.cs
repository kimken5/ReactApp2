namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// キーロックコード検証レスポンスDTO
/// </summary>
public class VerifyKeyLockCodeResponseDto
{
    /// <summary>
    /// 検証結果（true: 一致、false: 不一致）
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// エラーメッセージ（検証失敗時）
    /// </summary>
    public string? ErrorMessage { get; set; }
}
