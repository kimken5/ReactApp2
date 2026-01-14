using ReactApp.Server.Models;
using ReactApp.Server.DTOs;
using System.Security.Claims;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// JWTトークン管理サービスインターフェース
    /// アクセストークンとリフレッシュトークンの生成・検証・無効化を管理
    /// 認証システムの中核となるトークン操作機能を提供
    /// </summary>
    public interface IJwtService
    {
        /// <summary>
        /// アクセストークン生成（多役割対応）
        /// ユーザーエンティティと役割からクレームを構築してJWTアクセストークンを生成
        /// </summary>
        /// <param name="userEntity">トークンに含めるユーザー情報（ParentまたはStaff）</param>
        /// <param name="userType">ユーザー種別</param>
        /// <param name="classAssignments">スタッフの場合のクラス割り当て情報（オプション）</param>
        /// <returns>JWT形式のアクセストークン文字列</returns>
        string GenerateAccessToken(object userEntity, UserType userType, List<ClassAssignmentDto>? classAssignments = null);

        /// <summary>
        /// アクセストークン生成（従来の保護者専用メソッド - 後方互換性のため）
        /// 保護者情報からクレームを構築してJWTアクセストークンを生成
        /// </summary>
        /// <param name="parent">トークンに含める保護者情報</param>
        /// <returns>JWT形式のアクセストークン文字列</returns>
        string GenerateAccessToken(Parent parent);

        /// <summary>
        /// リフレッシュトークン生成
        /// セキュアなランダム文字列によるリフレッシュトークンを生成
        /// </summary>
        /// <returns>リフレッシュトークン文字列</returns>
        string GenerateRefreshToken();

        /// <summary>
        /// トークンからクレームプリンシパル取得
        /// JWTトークンを解析してクレーム情報を抽出
        /// </summary>
        /// <param name="token">解析対象のJWTトークン</param>
        /// <returns>クレームプリンシパル（無効な場合はnull）</returns>
        ClaimsPrincipal? GetPrincipalFromToken(string token);

        /// <summary>
        /// トークンペアのリフレッシュ処理
        /// 既存のトークンペアから新しいアクセス・リフレッシュトークンを生成
        /// </summary>
        /// <param name="accessToken">現在のアクセストークン</param>
        /// <param name="refreshToken">現在のリフレッシュトークン</param>
        /// <param name="ipAddress">リクエスト元IPアドレス</param>
        /// <param name="userAgent">リクエスト元ユーザーエージェント</param>
        /// <returns>新しいアクセストークンとリフレッシュトークンのペア</returns>
        Task<(string accessToken, string refreshToken)> RefreshTokenAsync(string accessToken, string refreshToken, string ipAddress, string userAgent);

        /// <summary>
        /// 特定リフレッシュトークンの無効化
        /// 指定されたリフレッシュトークンをブラックリストに追加して無効化
        /// </summary>
        /// <param name="refreshToken">無効化対象のリフレッシュトークン</param>
        /// <returns>無効化処理の成功可否</returns>
        Task<bool> RevokeRefreshTokenAsync(string refreshToken);

        /// <summary>
        /// 保護者の全リフレッシュトークン無効化
        /// 指定保護者の全デバイス・セッションのリフレッシュトークンを無効化
        /// </summary>
        /// <param name="parentId">対象保護者のID</param>
        /// <returns>無効化処理の成功可否</returns>
        Task<bool> RevokeAllRefreshTokensAsync(int parentId);

        /// <summary>
        /// トークンからJWT IDを取得
        /// JWTトークンのJTI（JWT ID）クレームを抽出
        /// </summary>
        /// <param name="token">対象のJWTトークン</param>
        /// <returns>JWT ID文字列</returns>
        string GetJwtIdFromToken(string token);

        /// <summary>
        /// 入退管理用トークン生成
        /// 保育園の入退管理画面用のJWTトークンを生成
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="nurseryName">保育園名</param>
        /// <param name="expiresAt">有効期限</param>
        /// <returns>JWT形式のトークン文字列</returns>
        string GenerateEntryExitToken(int nurseryId, string nurseryName, DateTime expiresAt);
    }
}