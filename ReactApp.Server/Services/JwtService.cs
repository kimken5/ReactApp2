using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ReactApp.Server.Data;
using ReactApp.Server.Models;
using ReactApp.Server.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// JWTトークン管理サービス実装クラス
    /// アクセストークンおよびリフレッシュトークンの生成、検証、無効化を提供
    /// </summary>
    public class JwtService : IJwtService
    {
        // 依存サービス
        private readonly IConfiguration _configuration;              // アプリケーション設定
        private readonly ILogger<JwtService> _logger;                // ログ出力サービス
        private readonly KindergartenDbContext _context;             // データベースコンテキスト

        // JWT設定パラメータ
        private readonly string _secretKey;                          // JWT署名用秘密鍵
        private readonly string _issuer;                             // JWT発行者
        private readonly string _audience;                           // JWT受信者
        private readonly int _accessTokenExpirationMinutes;          // アクセストークン有効期限（分）
        private readonly int _refreshTokenExpirationDays;            // リフレッシュトークン有効期限（日）

        /// <summary>
        /// JwtServiceコンストラクタ
        /// 設定ファイルからJWT関連パラメータを読み込み初期化
        /// </summary>
        /// <param name="configuration">アプリケーション設定</param>
        /// <param name="logger">ログ出力サービス</param>
        /// <param name="context">データベースコンテキスト</param>
        public JwtService(IConfiguration configuration, ILogger<JwtService> logger, KindergartenDbContext context)
        {
            _configuration = configuration;
            _logger = logger;
            _context = context;

            // JWT設定の読み込み（必須項目は例外スロー）
            _secretKey = _configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
            _issuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured");
            _audience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured");
            _accessTokenExpirationMinutes = _configuration.GetValue<int>("Jwt:AccessTokenExpirationMinutes", 1440); // デフォルト: 24時間
            _refreshTokenExpirationDays = _configuration.GetValue<int>("Jwt:RefreshTokenExpirationDays", 7);        // デフォルト: 7日
        }

        /// <summary>
        /// JWTアクセストークン生成（多役割対応）
        /// ユーザーエンティティと役割をベースに署名付きJWTトークンを生成
        /// </summary>
        /// <param name="userEntity">ユーザーエンティティ（ParentまたはStaff）</param>
        /// <param name="userType">ユーザー種別</param>
        /// <param name="classAssignments">スタッフの場合のクラス割り当て情報（オプション）</param>
        /// <returns>署名付きJWTアクセストークン</returns>
        public string GenerateAccessToken(object userEntity, UserType userType, List<ClassAssignmentDto>? classAssignments = null)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_secretKey);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
                new Claim("user_type", userType.ToString())
            };

            if (userType == UserType.Parent && userEntity is Parent parent)
            {
                claims.AddRange(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, parent.Id.ToString()),
                    new Claim(ClaimTypes.MobilePhone, parent.PhoneNumber),
                    new Claim(ClaimTypes.Role, "Parent"),
                    new Claim("ParentId", parent.Id.ToString())  // コントローラーが期待するParentIdクレーム
                });

                if (!string.IsNullOrEmpty(parent.Name))
                    claims.Add(new Claim(ClaimTypes.Name, parent.Name));
                if (!string.IsNullOrEmpty(parent.Email))
                    claims.Add(new Claim(ClaimTypes.Email, parent.Email));
            }
            else if (userType == UserType.Staff && userEntity is Staff staff)
            {
                claims.AddRange(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, staff.StaffId.ToString()),
                    new Claim(ClaimTypes.MobilePhone, staff.PhoneNumber),
                    new Claim(ClaimTypes.Role, "Staff"),
                    new Claim("nursery_id", staff.NurseryId.ToString()),
                    new Claim("staff_id", staff.StaffId.ToString()),
                    new Claim("StaffId", staff.StaffId.ToString()),  // コントローラーが期待する大文字のStaffIdクレーム
                    new Claim("NurseryId", staff.NurseryId.ToString()),  // コントローラーが期待する大文字のNurseryIdクレーム
                    new Claim("staff_role", staff.Role)
                });

                if (!string.IsNullOrEmpty(staff.Name))
                    claims.Add(new Claim(ClaimTypes.Name, staff.Name));
                if (!string.IsNullOrEmpty(staff.Email))
                    claims.Add(new Claim(ClaimTypes.Email, staff.Email));
                if (!string.IsNullOrEmpty(staff.Position))
                    claims.Add(new Claim("position", staff.Position));

                // クラス割り当て情報をJSON配列としてクレームに追加
                if (classAssignments != null && classAssignments.Any())
                {
                    var classAssignmentsJson = System.Text.Json.JsonSerializer.Serialize(classAssignments);
                    claims.Add(new Claim("class_assignments", classAssignmentsJson));
                }
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTimeHelper.GetJstNow().AddMinutes(_accessTokenExpirationMinutes),
                Issuer = _issuer,
                Audience = _audience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        /// <summary>
        /// JWTアクセストークン生成（従来の保護者専用メソッド - 後方互換性のため）
        /// 保護者情報をベースに署名付きJWTトークンを生成
        /// </summary>
        /// <param name="parent">保護者エンティティ</param>
        /// <returns>署名付きJWTアクセストークン</returns>
        public string GenerateAccessToken(Parent parent)
        {
            // JWTトークンハンドラーと署名用秘密鍵の準備
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_secretKey);

            // ユーザー情報を含むクレームの作成
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, parent.Id.ToString()),                                    // ユーザーID
                new Claim(ClaimTypes.MobilePhone, parent.PhoneNumber),                                         // 電話番号
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),                            // JWT ID（ユニーク識別子）
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64) // 発行時刻
            };

            // オプション情報がある場合はクレームに追加
            if (!string.IsNullOrEmpty(parent.Name))
                claims.Add(new Claim(ClaimTypes.Name, parent.Name));                                          // 保護者名

            if (!string.IsNullOrEmpty(parent.Email))
                claims.Add(new Claim(ClaimTypes.Email, parent.Email));                                        // メールアドレス

            // JWTトークンのメタデータと署名情報を設定
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),                                                          // クレーム情報
                Expires = DateTimeHelper.GetJstNow().AddMinutes(_accessTokenExpirationMinutes),                          // 有効期限
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature), // HMAC-SHA256署名
                Issuer = _issuer,                                                                              // 発行者
                Audience = _audience                                                                           // 受信者
            };

            // JWTトークンを生成して文字列化
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        /// <summary>
        /// リフレッシュトークン生成
        /// 暗号学的に安全な乱数を使用してランダムなリフレッシュトークンを生成
        /// </summary>
        /// <returns>Base64エンコードされたリフレッシュトークン</returns>
        public string GenerateRefreshToken()
        {
            // 暗号学的に安全な乱数生成器で 32 バイトのランダムデータを生成
            using var rng = RandomNumberGenerator.Create();
            var randomBytes = new byte[32];
            rng.GetBytes(randomBytes);

            // Base64文字列としてエンコードして返却
            return Convert.ToBase64String(randomBytes);
        }

        /// <summary>
        /// JWTトークンからクレームプリンシパルを取得
        /// リフレッシュ処理用に期限切れトークンも受け入れる
        /// </summary>
        /// <param name="token">検証対象のJWTトークン</param>
        /// <returns>クレームプリンシパル（無効時はnull）</returns>
        public ClaimsPrincipal? GetPrincipalFromToken(string token)
        {
            try
            {
                // JWTトークンハンドラーと署名検証用秘密鍵の準備
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_secretKey);

                // トークン検証パラメータの設定
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,                    // 署名鍵検証を有効化
                    IssuerSigningKey = new SymmetricSecurityKey(key),  // 署名検証用秘密鍵
                    ValidateIssuer = true,                             // 発行者検証を有効化
                    ValidIssuer = _issuer,                             // 有効な発行者
                    ValidateAudience = true,                           // 受信者検証を有効化
                    ValidAudience = _audience,                         // 有効な受信者
                    ValidateLifetime = false,                          // リフレッシュ用に期限切れトークンも受け入れる
                    ClockSkew = TimeSpan.Zero                          // 時刻の誤差を許容しない
                };

                // トークン検証実行
                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

                // トークンタイプとアルゴリズムの適切性をチェック
                if (validatedToken is not JwtSecurityToken jwtToken ||
                    !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                {
                    return null; // 無効なトークンタイプまたはアルゴリズム
                }

                return principal;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "トークン検証エラー");
                return null;
            }
        }

        /// <summary>
        /// JWTトークンリフレッシュ処理
        /// 期限切れのアクセストークンとリフレッシュトークンを新しいペアに更新
        /// </summary>
        /// <param name="accessToken">期限切れのアクセストークン</param>
        /// <param name="refreshToken">有効なリフレッシュトークン</param>
        /// <param name="ipAddress">リフレッシュ元IPアドレス</param>
        /// <param name="userAgent">リフレッシュ元ユーザーエージェント</param>
        /// <returns>新しいアクセストークンとリフレッシュトークンのペア</returns>
        public async Task<(string accessToken, string refreshToken)> RefreshTokenAsync(string accessToken, string refreshToken, string ipAddress, string userAgent)
        {
            try
            {
                // 期限切れアクセストークンからクレーム情報を取得
                var principal = GetPrincipalFromToken(accessToken);
                if (principal == null)
                {
                    throw new SecurityTokenException("無効なアクセストークン");
                }

                // ユーザーIDの抽出と検証
                var parentIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(parentIdClaim, out var parentId))
                {
                    throw new SecurityTokenException("無効なユーザーID");
                }

                // JWT IDの抽出と検証（トークンペアの関連付け用）
                var jwtId = principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                if (string.IsNullOrEmpty(jwtId))
                {
                    throw new SecurityTokenException("無効なJTI");
                }

                // データベースから対応するリフレッシュトークンを検索
                var storedRefreshToken = await _context.RefreshTokens
                    .Include(rt => rt.Parent)
                    .FirstOrDefaultAsync(rt => rt.Token == refreshToken && rt.ParentId == parentId);

                // リフレッシュトークンの有効性チェック
                if (storedRefreshToken == null || storedRefreshToken.IsRevoked || storedRefreshToken.ExpiresAt < DateTimeHelper.GetJstNow())
                {
                    // 不正なトークンが検出された場合は全トークンを無効化（セキュリティ対応）
                    await RevokeAllRefreshTokensAsync(parentId);
                    throw new SecurityTokenException("無効または期限切れのリフレッシュトークン");
                }

                // JWT IDのペアリング検証（アクセストークンとリフレッシュトークンの組み合わせ確認）
                if (storedRefreshToken.JwtId != jwtId)
                {
                    // トークンペアの不一致が検出された場合も全トークンを無効化
                    await RevokeAllRefreshTokensAsync(parentId);
                    throw new SecurityTokenException("トークンペアが一致しません");
                }

                // 新しいトークンペアの生成
                var newAccessToken = GenerateAccessToken(storedRefreshToken.Parent);
                var newRefreshToken = GenerateRefreshToken();
                var newJwtId = GetJwtIdFromToken(newAccessToken);

                // 旧リフレッシュトークンを無効化（ワンタイム使用の原則）
                storedRefreshToken.IsRevoked = true;
                storedRefreshToken.RevokedAt = DateTimeHelper.GetJstNow();

                // 新しいリフレッシュトークンエンティティを作成
                var newRefreshTokenEntity = new RefreshToken
                {
                    ParentId = parentId,
                    Token = newRefreshToken,
                    JwtId = newJwtId,                                              // 新しいアクセストークンとのペアリング
                    ExpiresAt = DateTimeHelper.GetJstNow().AddDays(_refreshTokenExpirationDays),
                    ClientIpAddress = ipAddress,
                    UserAgent = userAgent
                };

                // データベースに新しいリフレッシュトークンを保存
                _context.RefreshTokens.Add(newRefreshTokenEntity);
                await _context.SaveChangesAsync();

                _logger.LogInformation("トークンリフレッシュ成功: ParentId={ParentId}", parentId);

                return (newAccessToken, newRefreshToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "トークンリフレッシュエラー");
                throw;
            }
        }

        /// <summary>
        /// 特定のリフレッシュトークンを無効化
        /// ログアウト時に単一デバイスのトークンを無効化するために使用
        /// </summary>
        /// <param name="refreshToken">無効化対象のリフレッシュトークン</param>
        /// <returns>無効化成功可否</returns>
        public async Task<bool> RevokeRefreshTokenAsync(string refreshToken)
        {
            try
            {
                // 指定されたリフレッシュトークンを検索（未無効化のもののみ）
                var token = await _context.RefreshTokens
                    .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked);

                // トークンが見つからないまたは既に無効化済みの場合
                if (token == null)
                    return false;

                // トークンを無効化マーク
                token.IsRevoked = true;
                token.RevokedAt = DateTimeHelper.GetJstNow();

                await _context.SaveChangesAsync();

                _logger.LogInformation("リフレッシュトークン無効化: ParentId={ParentId}", token.ParentId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "リフレッシュトークン無効化エラー");
                return false;
            }
        }

        /// <summary>
        /// 特定ユーザーの全リフレッシュトークンを無効化
        /// セキュリティ侵害時やアカウント異常時に全デバイスから強制ログアウト
        /// </summary>
        /// <param name="parentId">対象ユーザーのID</param>
        /// <returns>無効化成功可否</returns>
        public async Task<bool> RevokeAllRefreshTokensAsync(int parentId)
        {
            try
            {
                // 指定ユーザーの有効なリフレッシュトークンを全て取得
                var tokens = await _context.RefreshTokens
                    .Where(rt => rt.ParentId == parentId && !rt.IsRevoked)
                    .ToListAsync();

                // 有効なトークンが存在しない場合は成功とみなす
                if (!tokens.Any())
                    return true;

                // 全トークンを無効化マーク
                foreach (var token in tokens)
                {
                    token.IsRevoked = true;
                    token.RevokedAt = DateTimeHelper.GetJstNow();
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("全リフレッシュトークン無効化: ParentId={ParentId}, Count={Count}", parentId, tokens.Count);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "全リフレッシュトークン無効化エラー: ParentId={ParentId}", parentId);
                return false;
            }
        }

        /// <summary>
        /// JWTトークンからJWT ID（JTI）を抽出
        /// リフレッシュトークンとアクセストークンのペアリング用
        /// </summary>
        /// <param name="token">JWTトークン</param>
        /// <returns>JWT ID（取得失敗時は空文字列）</returns>
        public string GetJwtIdFromToken(string token)
        {
            try
            {
                // JWTトークンをパースしてJTIクレームを抽出
                var tokenHandler = new JwtSecurityTokenHandler();
                var jwtToken = tokenHandler.ReadJwtToken(token);
                return jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value ?? string.Empty;
            }
            catch
            {
                // パースエラー時は空文字列を返却
                return string.Empty;
            }
        }

        /// <summary>
        /// 入退管理用JWTトークン生成
        /// 保育園の入退管理画面用に特化したJWTトークンを生成
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="nurseryName">保育園名</param>
        /// <param name="expiresAt">有効期限（JST）</param>
        /// <returns>署名付きJWTトークン</returns>
        public string GenerateEntryExitToken(int nurseryId, string nurseryName, DateTime expiresAt)
        {
            // JWTトークンハンドラーと署名用秘密鍵の準備
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_secretKey);

            // 入退管理用クレームの作成
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
                new Claim("nursery_id", nurseryId.ToString()),
                new Claim("nursery_name", nurseryName),
                new Claim(ClaimTypes.Role, "EntryExit"),  // 入退管理用の専用ロール
                new Claim("token_type", "entry_exit")      // トークン種別の明示
            };

            // JWTトークンのメタデータと署名情報を設定
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = expiresAt,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = _issuer,
                Audience = _audience
            };

            // JWTトークンを生成して文字列化
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
