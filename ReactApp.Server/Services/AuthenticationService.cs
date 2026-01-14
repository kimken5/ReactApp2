using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// SMS認証サービス実装クラス
    /// 電話番号によるワンタイム認証、JWT生成、リフレッシュトークン管理を提供
    /// </summary>
    public class AuthenticationService : IAuthenticationService
    {
        // 依存サービス
        private readonly KindergartenDbContext _context;              // データベースコンテキスト
        private readonly IMedia4USmsService _smsService;              // メディア4U SMS送信サービス
        private readonly IJwtService _jwtService;                     // JWT生成・検証サービス
        private readonly IUserLookupService _userLookupService;       // ユーザー検索サービス
        private readonly ILogger<AuthenticationService> _logger;      // ログ出力サービス
        private readonly IWebHostEnvironment _environment;            // 環境情報
        private readonly IConfiguration _configuration;               // 設定情報

        /// <summary>
        /// AuthenticationServiceコンストラクタ
        /// 必要な依存サービスを注入して初期化
        /// </summary>
        /// <param name="context">データベースコンテキスト</param>
        /// <param name="smsService">SMS送信サービス</param>
        /// <param name="jwtService">JWT関連サービス</param>
        /// <param name="userLookupService">ユーザー検索サービス</param>
        /// <param name="logger">ログ出力サービス</param>
        public AuthenticationService(
            KindergartenDbContext context,
            IMedia4USmsService smsService,
            IJwtService jwtService,
            IUserLookupService userLookupService,
            ILogger<AuthenticationService> logger,
            IWebHostEnvironment environment,
            IConfiguration configuration)
        {
            _context = context;
            _smsService = smsService;
            _jwtService = jwtService;
            _userLookupService = userLookupService;
            _logger = logger;
            _environment = environment;
            _configuration = configuration;
        }

        /// <summary>
        /// SMS認証コード送信メイン処理
        /// ユーザー存在確認、レート制限チェック、認証コード生成、SMS送信を実行
        /// </summary>
        /// <param name="request">SMS送信リクエスト（電話番号含む）</param>
        /// <param name="ipAddress">送信元IPアドレス</param>
        /// <param name="userAgent">送信元ユーザーエージェント</param>
        /// <returns>SMS送信結果レスポンス</returns>
        public async Task<ApiResponse<object>> SendSmsCodeAsync(SendSmsRequest request, string ipAddress, string userAgent)
        {
            try
            {
                // 電話番号の正規化（ハイフン・空白除去）
                var normalizedPhoneNumber = NormalizePhoneNumber(request.PhoneNumber);

                // ユーザー存在確認 - 登録された保護者またはスタッフかチェック
                var userLookup = await _userLookupService.CheckUserByPhoneNumberAsync(normalizedPhoneNumber);
                if (!userLookup.IsValidUser)
                {
                    _logger.LogWarning("未登録電話番号: {PhoneNumber}, IP: {IpAddress}", normalizedPhoneNumber, ipAddress);
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = "この電話番号は登録されていません。園にお問い合わせください。",
                        Errors = { "USER_NOT_FOUND" }
                    };
                }

                // レート制限チェック - 1日あたりのSMS送信制限（3回まで）
                var today = DateTimeHelper.GetJstNow().Date;
                var todaySmsCount = await _context.SmsAuthentications
                    .CountAsync(s => s.PhoneNumber == normalizedPhoneNumber && s.CreatedAt >= today);

                // 開発環境以外で1日3回の制限をチェック
                if (!_environment.IsDevelopment() && todaySmsCount >= 3)
                {
                    _logger.LogWarning("SMS送信制限に達しました: {PhoneNumber}, IP: {IpAddress}", normalizedPhoneNumber, ipAddress);
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = "本日のSMS送信回数の上限に達しました。明日再試行してください。",
                        Errors = { "RATE_LIMIT_EXCEEDED" }
                    };
                }

                // 連続送信防止 - 最後のSMS送信から1分以内かチェック
                var lastSms = await _context.SmsAuthentications
                    .Where(s => s.PhoneNumber == normalizedPhoneNumber)
                    .OrderByDescending(s => s.CreatedAt)
                    .FirstOrDefaultAsync();

                // 開発環境以外で1分間のクールダウン制限をチェック
                if (!_environment.IsDevelopment() && lastSms != null && lastSms.CreatedAt > DateTimeHelper.GetJstNow().AddMinutes(-1))
                {
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = "SMS送信から1分経過してから再試行してください。",
                        Errors = { "SMS_COOLDOWN" }
                    };
                }

                // 6桁認証コード生成とハッシュ化
                var code = _smsService.GenerateVerificationCode();
                var hashedCode = _smsService.HashCode(code);

                // SMS認証レコードをデータベースに保存
                var smsAuth = new SmsAuthentication
                {
                    PhoneNumber = normalizedPhoneNumber,
                    Code = code,                    // デバッグ用平文保存（本番環境では削除推奨）
                    HashedCode = hashedCode,        // セキュア検証用ハッシュ値
                    ClientIpAddress = ipAddress,    // 送信元IP記録
                    UserAgent = userAgent,          // ユーザーエージェント記録
                    ExpiresAt = DateTimeHelper.GetJstNow().AddMinutes(5)  // 5分後に失効
                };

                // データベースにSMS認証レコード保存
                _context.SmsAuthentications.Add(smsAuth);
                await _context.SaveChangesAsync();

                // メディア4U SMS API を使用してSMS送信
                var smsSent = await _smsService.SendSmsAsync(normalizedPhoneNumber, code, smsAuth.Id);

                // SMS送信失敗時のエラーハンドリング
                if (!smsSent)
                {
                    _logger.LogError("SMS送信失敗: {PhoneNumber}", normalizedPhoneNumber);
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = "SMS送信に失敗しました。しばらく時間をおいて再試行してください。",
                        Errors = { "SMS_SEND_FAILED" }
                    };
                }

                // 送信成功時のログ出力と成功レスポンス返却
                _logger.LogInformation("SMS認証コード送信成功: {PhoneNumber}", normalizedPhoneNumber);

                return new ApiResponse<object>
                {
                    Success = true,
                    Message = "認証コードをSMSで送信しました。"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SMS送信処理エラー: {PhoneNumber}", request.PhoneNumber);
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "SMS送信処理中にエラーが発生しました。",
                    Errors = { "INTERNAL_ERROR" }
                };
            }
        }

        /// <summary>
        /// SMS認証コード検証とログイン処理
        /// 認証コード照合、ユーザー作成/取得、JWTトークン生成を実行
        /// </summary>
        /// <param name="request">認証コード検証リクエスト</param>
        /// <param name="ipAddress">送信元IPアドレス</param>
        /// <param name="userAgent">送信元ユーザーエージェント</param>
        /// <returns>認証結果とJWTトークン</returns>
        public async Task<ApiResponse<AuthResponse>> VerifyAndLoginAsync(VerifySmsRequest request, string ipAddress, string userAgent)
        {
            try
            {
                // 電話番号の正規化
                var normalizedPhoneNumber = NormalizePhoneNumber(request.PhoneNumber);

                // 認証試行回数制限チェック（5分間に3回まで）
                var fiveMinutesAgo = DateTimeHelper.GetJstNow().AddMinutes(-5);
                var recentAttempts = await _context.SmsAuthentications
                    .Where(s => s.PhoneNumber == normalizedPhoneNumber &&
                               s.CreatedAt >= fiveMinutesAgo &&
                               s.AttemptCount > 0)
                    .SumAsync(s => s.AttemptCount);

                // 開発環境以外で認証試行制限をチェック
                if (!_environment.IsDevelopment() && recentAttempts >= 3)
                {
                    _logger.LogWarning("認証試行制限に達しました: {PhoneNumber}, IP: {IpAddress}", normalizedPhoneNumber, ipAddress);
                    return new ApiResponse<AuthResponse>
                    {
                        Success = false,
                        Message = "認証試行回数が上限に達しました。5分後に再試行してください。",
                        Errors = { "VERIFICATION_RATE_LIMIT_EXCEEDED" }
                    };
                }

                // 有効なSMS認証レコードを検索（未使用・未失効のもの）
                var smsAuth = await _context.SmsAuthentications
                    .Where(s => s.PhoneNumber == normalizedPhoneNumber &&
                               !s.IsUsed &&                         // 未使用
                               s.ExpiresAt > DateTimeHelper.GetJstNow())       // 未失効
                    .OrderByDescending(s => s.CreatedAt)            // 最新のものを取得
                    .FirstOrDefaultAsync();

                // 有効な認証レコードが存在しない場合
                if (smsAuth == null)
                {
                    return new ApiResponse<AuthResponse>
                    {
                        Success = false,
                        Message = "有効な認証コードが見つからないか、有効期限が切れています。",
                        Errors = { "INVALID_OR_EXPIRED_CODE" }
                    };
                }

                // 認証試行回数をインクリメント
                smsAuth.AttemptCount++;
                await _context.SaveChangesAsync();

                // 認証コードの照合（BCryptによるハッシュ検証）
                if (!_smsService.VerifyCode(request.Code, smsAuth.HashedCode))
                {
                    _logger.LogWarning("認証コード不正: {PhoneNumber}, IP: {IpAddress}", normalizedPhoneNumber, ipAddress);
                    return new ApiResponse<AuthResponse>
                    {
                        Success = false,
                        Message = "認証コードが正しくありません。",
                        Errors = { "INVALID_CODE" }
                    };
                }

                // SMS認証レコードを使用済みにマーク
                smsAuth.IsUsed = true;
                smsAuth.UsedAt = DateTimeHelper.GetJstNow();

                // ユーザーの役割を確認
                var userLookup = await _userLookupService.CheckUserByPhoneNumberAsync(normalizedPhoneNumber);

                if (userLookup.RequiresRoleSelection)
                {
                    // 保護者兼スタッフの場合は役割選択が必要
                    // 保存された役割選択履歴を確認
                    var savedRole = await _userLookupService.GetSavedRolePreferenceAsync(normalizedPhoneNumber);
                    if (savedRole.HasValue)
                    {
                        // 保存された役割で自動ログイン
                        return await LoginWithRoleAsync(normalizedPhoneNumber, savedRole.Value, ipAddress, userAgent);
                    }

                    // 役割選択が必要
                    return new ApiResponse<AuthResponse>
                    {
                        Success = true,
                        Message = "認証に成功しました。役割を選択してください。",
                        Data = new AuthResponse
                        {
                            Success = true,
                            RequiresRoleSelection = true,
                            AvailableUserTypes = userLookup.UserTypes,
                            ParentInfo = userLookup.ParentInfo != null ? new ParentInfo
                            {
                                Id = userLookup.ParentInfo.Id,
                                Name = userLookup.ParentInfo.Name,
                                Email = userLookup.ParentInfo.Email,
                                ChildCount = userLookup.ParentInfo.ChildCount,
                                LastLoginAt = userLookup.ParentInfo.LastLoginAt
                            } : null,
                            StaffInfo = userLookup.StaffInfo != null ? new StaffInfo
                            {
                                Id = userLookup.StaffInfo.Id,
                                Name = userLookup.StaffInfo.Name,
                                Email = userLookup.StaffInfo.Email,
                                Role = userLookup.StaffInfo.Role,
                                Position = userLookup.StaffInfo.Position,
                                LastLoginAt = userLookup.StaffInfo.LastLoginAt
                            } : null
                        }
                    };
                }

                // 単一役割の場合は直接ログイン
                var singleRole = userLookup.UserTypes.HasFlag(UserTypeFlags.Parent) ? UserType.Parent : UserType.Staff;
                return await LoginWithDirectRoleAsync(normalizedPhoneNumber, singleRole, smsAuth, ipAddress, userAgent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "認証処理エラー: {PhoneNumber}", request.PhoneNumber);
                return new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "認証処理中にエラーが発生しました。",
                    Errors = { "INTERNAL_ERROR" }
                };
            }
        }

        /// <summary>
        /// JWTトークンのリフレッシュ処理
        /// 期限切れ前のアクセストークンを新しいトークンに更新
        /// </summary>
        /// <param name="request">トークンリフレッシュリクエスト</param>
        /// <param name="ipAddress">送信元IPアドレス</param>
        /// <param name="userAgent">送信元ユーザーエージェント</param>
        /// <returns>新しいJWTトークンペア</returns>
        public async Task<ApiResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request, string ipAddress, string userAgent)
        {
            try
            {
                // JWTサービスでトークンリフレッシュ実行
                var (accessToken, refreshToken) = await _jwtService.RefreshTokenAsync(
                    request.AccessToken, request.RefreshToken, ipAddress, userAgent);

                var authResponse = new AuthResponse
                {
                    Success = true,
                    Message = "トークンを更新しました。",
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresAt = DateTimeHelper.GetJstNow().AddHours(24)
                };

                return new ApiResponse<AuthResponse>
                {
                    Success = true,
                    Message = "トークンを更新しました。",
                    Data = authResponse
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "トークンリフレッシュエラー");
                return new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "トークンの更新に失敗しました。再ログインしてください。",
                    Errors = { "REFRESH_TOKEN_FAILED" }
                };
            }
        }

        /// <summary>
        /// ログアウト処理
        /// リフレッシュトークンを無効化してセッションを終了
        /// </summary>
        /// <param name="refreshToken">無効化対象のリフレッシュトークン</param>
        /// <returns>ログアウト結果</returns>
        public async Task<ApiResponse<object>> LogoutAsync(string refreshToken)
        {
            try
            {
                // JWTサービスでリフレッシュトークンを無効化
                var revoked = await _jwtService.RevokeRefreshTokenAsync(refreshToken);

                return new ApiResponse<object>
                {
                    Success = revoked,
                    Message = revoked ? "ログアウトしました。" : "既にログアウトしています。"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ログアウト処理エラー");
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "ログアウト処理中にエラーが発生しました。",
                    Errors = { "INTERNAL_ERROR" }
                };
            }
        }

        /// <summary>
        /// 保護者アカウントの取得または新規作成
        /// 電話番号を基に既存アカウントを検索し、存在しない場合は新規作成
        /// </summary>
        /// <param name="phoneNumber">正規化済み電話番号</param>
        /// <returns>保護者エンティティ（失敗時はnull）</returns>
        public async Task<Parent?> GetOrCreateParentAsync(string phoneNumber)
        {
            try
            {
                // 電話番号で既存保護者アカウントを検索
                var parent = await _context.Parents
                    .FirstOrDefaultAsync(p => p.PhoneNumber == phoneNumber);

                // 既存アカウントが存在しない場合は新規作成
                if (parent == null)
                {
                    parent = new Parent
                    {
                        PhoneNumber = phoneNumber,
                        IsActive = true
                    };

                    _context.Parents.Add(parent);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("新規保護者作成: {PhoneNumber}, ParentId: {ParentId}", phoneNumber, parent.Id);
                }
                // 既存アカウントが無効化されている場合は再有効化
                else if (!parent.IsActive)
                {
                    parent.IsActive = true;
                    parent.UpdatedAt = DateTimeHelper.GetJstNow();
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("保護者アカウント再有効化: {PhoneNumber}, ParentId: {ParentId}", phoneNumber, parent.Id);
                }

                return parent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保護者取得/作成エラー: {PhoneNumber}", phoneNumber);
                return null;
            }
        }

        /// <summary>
        /// 役割選択後のログイン処理
        /// 保護者兼スタッフが役割を選択してログインする際に使用
        /// </summary>
        /// <param name="phoneNumber">電話番号</param>
        /// <param name="selectedRole">選択された役割</param>
        /// <param name="ipAddress">クライアントIPアドレス</param>
        /// <param name="userAgent">クライアントユーザーエージェント</param>
        /// <returns>認証結果とJWTトークン</returns>
        public async Task<ApiResponse<AuthResponse>> LoginWithRoleAsync(string phoneNumber, UserType selectedRole, string ipAddress, string userAgent)
        {
            try
            {
                var normalizedPhoneNumber = NormalizePhoneNumber(phoneNumber);

                // ユーザーの役割を再度確認
                var userLookup = await _userLookupService.CheckUserByPhoneNumberAsync(normalizedPhoneNumber);
                var hasSelectedRole = selectedRole switch
                {
                    UserType.Parent => userLookup.UserTypes.HasFlag(UserTypeFlags.Parent),
                    UserType.Staff => userLookup.UserTypes.HasFlag(UserTypeFlags.Staff),
                    _ => false
                };

                if (!hasSelectedRole)
                {
                    return new ApiResponse<AuthResponse>
                    {
                        Success = false,
                        Message = "選択された役割は利用できません。",
                        Errors = { "INVALID_ROLE_SELECTION" }
                    };
                }

                return await LoginWithDirectRoleAsync(normalizedPhoneNumber, selectedRole, null, ipAddress, userAgent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "役割選択ログインエラー: {PhoneNumber}", phoneNumber);
                return new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "ログイン処理中にエラーが発生しました。",
                    Errors = { "INTERNAL_ERROR" }
                };
            }
        }

        /// <summary>
        /// 役割指定での直接ログイン処理
        /// 単一役割または役割選択後のログインで使用
        /// </summary>
        private async Task<ApiResponse<AuthResponse>> LoginWithDirectRoleAsync(string normalizedPhoneNumber, UserType userType, SmsAuthentication? smsAuth, string ipAddress, string userAgent)
        {
            try
            {
                object userEntity;
                int userId;
                string userName;
                string? userEmail;

                if (userType == UserType.Parent)
                {
                    // 保護者としてログイン
                    var parent = await GetOrCreateParentAsync(normalizedPhoneNumber);
                    if (parent == null)
                    {
                        return new ApiResponse<AuthResponse>
                        {
                            Success = false,
                            Message = "保護者アカウントの取得に失敗しました。",
                            Errors = { "PARENT_ACCOUNT_ERROR" }
                        };
                    }

                    parent.LastLoginAt = DateTimeHelper.GetJstNow();
                    userEntity = parent;
                    userId = parent.Id;
                    userName = parent.Name ?? "保護者";
                    userEmail = parent.Email;

                    if (smsAuth != null)
                    {
                        smsAuth.ParentId = parent.Id;
                    }
                }
                else
                {
                    // スタッフとしてログイン
                    var staffUser = await _context.Staff
                        .FirstOrDefaultAsync(s => s.PhoneNumber == normalizedPhoneNumber && s.IsActive);

                    if (staffUser == null)
                    {
                        return new ApiResponse<AuthResponse>
                        {
                            Success = false,
                            Message = "スタッフアカウントが見つかりません。",
                            Errors = { "STAFF_ACCOUNT_NOT_FOUND" }
                        };
                    }

                    staffUser.LastLoginAt = DateTimeHelper.GetJstNow();
                    userEntity = staffUser;
                    userId = staffUser.StaffId;
                    userName = staffUser.Name;
                    userEmail = staffUser.Email;

                    if (smsAuth != null)
                    {
                        smsAuth.StaffId = staffUser.StaffId;
                    }
                }

                // スタッフの場合はクラス割り当て情報を取得
                List<ClassAssignmentDto>? classAssignments = null;
                if (userType == UserType.Staff && userEntity is Staff staff)
                {
                    classAssignments = await GetStaffClassAssignmentsAsync(staff.NurseryId, staff.StaffId);
                }

                // JWTアクセストークンとリフレッシュトークンを生成
                var accessToken = _jwtService.GenerateAccessToken(userEntity, userType, classAssignments);
                var refreshToken = _jwtService.GenerateRefreshToken();
                var jwtId = _jwtService.GetJwtIdFromToken(accessToken);

                // リフレッシュトークンをデータベースに保存
                var refreshTokenEntity = new RefreshToken
                {
                    ParentId = userType == UserType.Parent ? userId : null,
                    StaffId = userType == UserType.Staff ? userId : null,
                    Token = refreshToken,
                    JwtId = jwtId,
                    ClientIpAddress = ipAddress,
                    UserAgent = userAgent,
                    ExpiresAt = DateTimeHelper.GetJstNow().AddDays(7)
                };

                _context.RefreshTokens.Add(refreshTokenEntity);
                await _context.SaveChangesAsync();

                _logger.LogInformation("認証成功: {PhoneNumber}, Role: {UserType}, UserId: {UserId}",
                    normalizedPhoneNumber, userType, userId);

                var authResponse = new AuthResponse
                {
                    Success = true,
                    Message = "認証に成功しました。",
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresAt = DateTimeHelper.GetJstNow().AddHours(24),
                    UserType = userType,
                    RedirectUrl = userType == UserType.Parent ? "/dashboard/parent" : "/dashboard/staff"
                };

                // ユーザー情報を追加
                if (userType == UserType.Parent)
                {
                    authResponse.ParentInfo = new ParentInfo
                    {
                        Id = userId,
                        PhoneNumber = normalizedPhoneNumber,
                        Name = userName,
                        Email = userEmail,
                        IsActive = true,
                        LastLoginAt = DateTimeHelper.GetJstNow()
                    };
                }
                else
                {
                    var staffEntity = (Staff)userEntity;

                    authResponse.StaffInfo = new StaffInfo
                    {
                        Id = userId,
                        NurseryId = staffEntity.NurseryId,
                        StaffId = staffEntity.StaffId,
                        PhoneNumber = normalizedPhoneNumber,
                        Name = userName,
                        Email = userEmail,
                        IsActive = true,
                        LastLoginAt = DateTimeHelper.GetJstNow(),
                        Role = staffEntity.Role,
                        Position = staffEntity.Position,
                        ClassAssignments = classAssignments ?? new List<ClassAssignmentDto>()
                    };
                }

                // フロントエンド用ユーザー情報を追加
                authResponse.User = new
                {
                    Id = userId.ToString(),
                    PhoneNumber = normalizedPhoneNumber,
                    Name = userName,
                    Role = userType.ToString(),
                    IsVerified = true,
                    CreatedAt = DateTimeHelper.GetJstNow().ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    Parent = userType == UserType.Parent ? new { Id = userId.ToString(), Name = userName } : null,
                    Staff = userType == UserType.Staff ? new
                    {
                        Id = userId.ToString(),
                        NurseryId = authResponse.StaffInfo!.NurseryId,
                        StaffId = authResponse.StaffInfo.StaffId,
                        Name = userName,
                        Role = authResponse.StaffInfo.Role,
                        ClassAssignments = authResponse.StaffInfo.ClassAssignments
                    } : null
                };

                return new ApiResponse<AuthResponse>
                {
                    Success = true,
                    Message = "ログインに成功しました。",
                    Data = authResponse
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "直接ログインエラー: {PhoneNumber}, Role: {UserType}", normalizedPhoneNumber, userType);
                return new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "ログイン処理中にエラーが発生しました。",
                    Errors = { "INTERNAL_ERROR" }
                };
            }
        }

        /// <summary>
        /// スタッフのクラス割り当て情報を取得
        /// StaffClassAssignmentsテーブルからスタッフが担当する全クラスを取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="staffId">スタッフID</param>
        /// <returns>クラス割り当て情報のリスト</returns>
        public async Task<List<ClassAssignmentDto>> GetStaffClassAssignmentsAsync(int nurseryId, int staffId)
        {
            try
            {
                var classAssignments = await _context.StaffClassAssignments
                    .Where(sca => sca.NurseryId == nurseryId && sca.StaffId == staffId)
                    .Join(_context.Classes,
                        sca => new { sca.NurseryId, sca.ClassId },
                        c => new { c.NurseryId, c.ClassId },
                        (sca, c) => new ClassAssignmentDto
                        {
                            ClassId = sca.ClassId,
                            ClassName = c.Name,
                            AssignmentRole = sca.AssignmentRole
                        })
                    .OrderByDescending(c => c.AssignmentRole) // MainTeacherを先に
                    .ThenBy(c => c.ClassName)
                    .ToListAsync();

                return classAssignments;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラス割り当て情報取得エラー: NurseryId={NurseryId}, StaffId={StaffId}", nurseryId, staffId);
                return new List<ClassAssignmentDto>();
            }
        }

        /// <summary>
        /// 電話番号正規化処理
        /// ハイフン、空白を除去して統一フォーマットに変換
        /// </summary>
        /// <param name="phoneNumber">入力された電話番号</param>
        /// <returns>正規化された電話番号</returns>
        private static string NormalizePhoneNumber(string phoneNumber)
        {
            // ハイフン・空白・先頭末尾の空白を除去して正規化
            return phoneNumber.Replace("-", "").Replace(" ", "").Trim();
        }

        /// <summary>
        /// 入退登録画面用ログイン
        /// 保育園ログインID + 入退管理用パスワードで認証し、JWTトークンを発行
        /// </summary>
        public async Task<EntryExitLoginResponse> EntryExitLoginAsync(EntryExitLoginRequest request)
        {
            try
            {
                // 保育園を検索（LoginIdで検索）
                var nursery = await _context.Nurseries
                    .Where(n => n.LoginId == request.LoginId)
                    .FirstOrDefaultAsync();

                if (nursery == null)
                {
                    _logger.LogWarning("入退登録ログイン失敗: 保育園が見つかりません。LoginId={LoginId}", request.LoginId);
                    throw new UnauthorizedAccessException("ログインIDまたはパスワードが正しくありません。");
                }

                // 入退管理用パスワードが設定されているかチェック
                if (string.IsNullOrEmpty(nursery.EntryExitPassword))
                {
                    _logger.LogWarning("入退登録ログイン失敗: 入退管理用パスワードが設定されていません。NurseryId={NurseryId}", nursery.Id);
                    throw new UnauthorizedAccessException("入退管理機能が有効化されていません。管理者にお問い合わせください。");
                }

                // パスワード検証（BCrypt）
                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, nursery.EntryExitPassword);
                if (!isPasswordValid)
                {
                    _logger.LogWarning("入退登録ログイン失敗: パスワードが正しくありません。NurseryId={NurseryId}", nursery.Id);
                    throw new UnauthorizedAccessException("ログインIDまたはパスワードが正しくありません。");
                }

                // JWTトークンを生成（有効期限: 1時間）
                var expiresAt = DateTimeHelper.GetJstNow().AddHours(1);
                var token = _jwtService.GenerateEntryExitToken(nursery.Id, nursery.Name, expiresAt);

                _logger.LogInformation("入退登録ログイン成功: NurseryId={NurseryId}, NurseryName={NurseryName}", nursery.Id, nursery.Name);

                return new EntryExitLoginResponse
                {
                    Token = token,
                    NurseryId = nursery.Id,
                    NurseryName = nursery.Name,
                    ExpiresAt = expiresAt
                };
            }
            catch (UnauthorizedAccessException)
            {
                throw; // そのまま再スロー
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "入退登録ログインエラー: LoginId={LoginId}", request.LoginId);
                throw new InvalidOperationException("ログイン処理中にエラーが発生しました。");
            }
        }

        /// <summary>
        /// ハートビート処理（トークンリフレッシュ）
        /// 現在のトークンを検証し、新しいトークンを発行して有効期限を延長
        /// </summary>
        public async Task<HeartbeatResponse> HeartbeatAsync(string currentToken)
        {
            try
            {
                // トークンを検証してクレームを取得
                var principal = _jwtService.GetPrincipalFromToken(currentToken);
                if (principal == null)
                {
                    _logger.LogWarning("ハートビート失敗: トークンが無効です");
                    throw new UnauthorizedAccessException("トークンが無効です。再ログインしてください。");
                }

                // NurseryIdとNurseryNameをクレームから取得
                var nurseryIdClaim = principal.FindFirst("nursery_id")?.Value;
                var nurseryNameClaim = principal.FindFirst("nursery_name")?.Value;

                if (string.IsNullOrEmpty(nurseryIdClaim) || string.IsNullOrEmpty(nurseryNameClaim))
                {
                    _logger.LogWarning("ハートビート失敗: トークンに必要な情報が含まれていません");
                    throw new UnauthorizedAccessException("トークンが不正です。再ログインしてください。");
                }

                int nurseryId = int.Parse(nurseryIdClaim);

                // 新しいトークンを生成（有効期限: 1時間）
                var expiresAt = DateTimeHelper.GetJstNow().AddHours(1);
                var newToken = _jwtService.GenerateEntryExitToken(nurseryId, nurseryNameClaim, expiresAt);

                _logger.LogInformation("ハートビート成功: NurseryId={NurseryId}, 新有効期限={ExpiresAt}", nurseryId, expiresAt);

                return new HeartbeatResponse
                {
                    Token = newToken,
                    ExpiresAt = expiresAt
                };
            }
            catch (UnauthorizedAccessException)
            {
                throw; // そのまま再スロー
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ハートビート処理エラー");
                throw new InvalidOperationException("ハートビート処理中にエラーが発生しました。");
            }
        }
    }
}
