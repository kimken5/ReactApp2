using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services;

/// <summary>
/// 年度管理サービスインターフェース
/// </summary>
public interface IAcademicYearService
{
    /// <summary>
    /// 指定保育園の年度一覧を取得
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <returns>年度一覧</returns>
    Task<List<AcademicYearDto>> GetAcademicYearsAsync(int nurseryId);

    /// <summary>
    /// 現在年度を取得
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <returns>現在年度（存在しない場合はnull）</returns>
    Task<AcademicYearDto?> GetCurrentYearAsync(int nurseryId);

    /// <summary>
    /// 指定年度を取得
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <param name="year">年度</param>
    /// <returns>年度情報（存在しない場合はnull）</returns>
    Task<AcademicYearDto?> GetAcademicYearAsync(int nurseryId, int year);

    /// <summary>
    /// 新規年度を作成
    /// </summary>
    /// <param name="dto">作成リクエスト</param>
    /// <returns>作成された年度情報</returns>
    Task<AcademicYearDto> CreateAcademicYearAsync(CreateAcademicYearDto dto);

    /// <summary>
    /// 年度スライドのプレビューを取得
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <param name="targetYear">スライド先年度</param>
    /// <returns>プレビュー情報</returns>
    Task<YearSlidePreviewDto> GetYearSlidePreviewAsync(int nurseryId, int targetYear);

    /// <summary>
    /// 年度スライドを実行
    /// </summary>
    /// <param name="request">スライド実行リクエスト</param>
    /// <returns>実行結果</returns>
    Task<YearSlideResultDto> ExecuteYearSlideAsync(YearSlideRequestDto request);

    /// <summary>
    /// 年度が存在するか確認
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <param name="year">年度</param>
    /// <returns>存在する場合true</returns>
    Task<bool> ExistsAsync(int nurseryId, int year);
}
