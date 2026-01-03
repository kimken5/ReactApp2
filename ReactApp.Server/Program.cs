using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ReactApp.Server.Data;
using ReactApp.Server.Middleware;
using ReactApp.Server.Services;
using ReactApp.Server.Validators;
using ReactApp.Server.HealthChecks;
using FluentValidation;
using Serilog;
using System.Text;
using System.Threading.RateLimiting;
using System.IO.Compression;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel for large file uploads
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 52428800; // 50MB
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(2);
});

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/kindergarten-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// PERFORMANCE: Add Response Compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        "text/json",
        "text/plain",
        "text/html",
        "text/css",
        "application/javascript",
        "text/javascript",
        "image/svg+xml"
    });
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Optimal;
});

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Optimal;
});

// PERFORMANCE: Add Memory Caching
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 100_000_000; // 100MB limit
    options.CompactionPercentage = 0.2; // Compact when 80% full
});

// PERFORMANCE: Add Distributed Caching (Redis alternative using Memory)
builder.Services.AddDistributedMemoryCache(options =>
{
    options.SizeLimit = 50_000_000; // 50MB limit for distributed cache
});

// PERFORMANCE: Configure JSON options for better serialization
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});

// Add services to the container
builder.Services.AddDbContext<KindergartenDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), sqlOptions =>
    {
        // PERFORMANCE: Enable multiple active result sets and optimize connection
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);

        // Command timeout for long-running queries
        sqlOptions.CommandTimeout(30);
    });

    // PERFORMANCE: Disable change tracking for read-only operations when possible
    options.EnableDetailedErrors(builder.Environment.IsDevelopment());
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
});

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        RequireExpirationTime = true
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Log.Error("=== JWT認証失敗詳細 ===");
            Log.Error("Exception: {Exception}", context.Exception?.ToString());
            Log.Error("Token: {Token}", context.Request.Headers["Authorization"].FirstOrDefault());
            Log.Error("Path: {Path}", context.Request.Path);
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var claims = context.Principal?.Claims.Select(c => $"{c.Type}={c.Value}");
            Log.Information("=== JWT認証成功 ===");
            Log.Information("UserId: {UserId}", context.Principal?.Identity?.Name);
            Log.Information("Claims: {Claims}", string.Join(", ", claims ?? Array.Empty<string>()));
            return Task.CompletedTask;
        },
        OnMessageReceived = context =>
        {
            // SignalR接続時のトークン検証
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            // SignalRハブへのリクエストの場合、クエリパラメータからトークンを取得
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/notificationHub"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    var rateLimitConfig = builder.Configuration.GetSection("RateLimit");

    options.AddFixedWindowLimiter("AuthPolicy", config =>
    {
        config.PermitLimit = rateLimitConfig.GetValue<int>("AuthPolicy:PermitLimit", 10);
        config.Window = TimeSpan.FromMinutes(rateLimitConfig.GetValue<int>("AuthPolicy:WindowMinutes", 1));
        config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        config.QueueLimit = 5;
    });

    options.AddFixedWindowLimiter("SmsPolicy", config =>
    {
        config.PermitLimit = rateLimitConfig.GetValue<int>("SmsPolicy:PermitLimit", 3);
        config.Window = TimeSpan.FromMinutes(rateLimitConfig.GetValue<int>("SmsPolicy:WindowMinutes", 60));
        config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        config.QueueLimit = 2;
    });

    options.AddFixedWindowLimiter("VerifyPolicy", config =>
    {
        config.PermitLimit = rateLimitConfig.GetValue<int>("VerifyPolicy:PermitLimit", 5);
        config.Window = TimeSpan.FromMinutes(rateLimitConfig.GetValue<int>("VerifyPolicy:WindowMinutes", 5));
        config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        config.QueueLimit = 3;
    });

    // Desktop Authentication Rate Limiting
    options.AddFixedWindowLimiter("auth", config =>
    {
        config.PermitLimit = 10;
        config.Window = TimeSpan.FromMinutes(1);
        config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        config.QueueLimit = 5;
    });

    // Application Submit Rate Limiting (入園申込送信)
    options.AddFixedWindowLimiter("application-submit", config =>
    {
        config.PermitLimit = 10;
        config.Window = TimeSpan.FromHours(1);
        config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        config.QueueLimit = 2;
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsync("レート制限に達しました。しばらく時間をおいて再試行してください。", cancellationToken: token);
    };
});

// Services
builder.Services.AddScoped<IMedia4USmsService, Media4USmsService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<IDesktopAuthenticationService, DesktopAuthenticationService>();
builder.Services.AddScoped<IDesktopMasterService, DesktopMasterService>();
builder.Services.AddScoped<IUserLookupService, UserLookupService>();
builder.Services.AddScoped<IStaffClassAccessValidator, StaffClassAccessValidator>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IDailyReportService, DailyReportService>();
builder.Services.AddScoped<IDesktopDailyReportService, DesktopDailyReportService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IFamilyService, FamilyService>();
// Photo Storage Services
builder.Services.AddSingleton<IPhotoStorageService, AzureBlobPhotoService>();
builder.Services.AddScoped<IPhotoService, PhotoService>();
builder.Services.AddScoped<IDesktopPhotoService, DesktopPhotoService>();
// Attachment Storage Services
builder.Services.AddSingleton<IAttachmentService, AzureBlobAttachmentService>();
// Calendar Services
builder.Services.AddScoped<IDesktopCalendarService, DesktopCalendarService>();

// Desktop Announcement Service
builder.Services.AddScoped<IDesktopAnnouncementService, DesktopAnnouncementService>();

// Desktop Contact Notification Service
builder.Services.AddScoped<IDesktopContactNotificationService, DesktopContactNotificationService>();

// Desktop Dashboard Service
builder.Services.AddScoped<IDesktopDashboardService, DesktopDashboardService>();

// Desktop Attendance Service
builder.Services.AddScoped<IDesktopAttendanceService, DesktopAttendanceService>();

// SignalR Services
builder.Services.AddScoped<ISignalRService, SignalRService>();

// Offline Services
builder.Services.AddScoped<IOfflineService, OfflineService>();

// PERFORMANCE: Add Performance Services
builder.Services.AddScoped<ICacheService, CacheService>();
builder.Services.AddHostedService<BackgroundTaskService>();

// Translation Services
builder.Services.AddHttpClient<ITranslationService, TranslationService>();
builder.Services.AddScoped<ITranslationService, TranslationService>();
builder.Services.AddScoped<ReactApp.Server.Helpers.TranslationHelper>();

// Academic Year Management Services
builder.Services.AddScoped<IAcademicYearService, AcademicYearService>();
builder.Services.AddScoped<IChildClassAssignmentService, ChildClassAssignmentService>();
builder.Services.AddScoped<IStaffClassAssignmentService, StaffClassAssignmentService>();

// Attendance Statistics Service
builder.Services.AddScoped<IAttendanceStatisticsService, AttendanceStatisticsService>();

// Application Service (入園申込サービス)
builder.Services.AddScoped<IApplicationService, ApplicationService>();

// Menu Management Service (献立管理サービス)
builder.Services.AddScoped<IDesktopMenuService, DesktopMenuService>();

// Infant Record Service (乳児生活記録サービス)
builder.Services.AddScoped<IInfantRecordService, InfantRecordService>();

// Database Seeding Service (Development only)
builder.Services.AddScoped<DatabaseSeeder>();

// AutoMapper
builder.Services.AddAutoMapper(typeof(ReactApp.Server.Mapping.MappingProfile));

// Validators
builder.Services.AddScoped<IValidator<ReactApp.Server.DTOs.SendSmsRequest>, SendSmsRequestValidator>();
builder.Services.AddScoped<IValidator<ReactApp.Server.DTOs.VerifySmsRequest>, VerifySmsRequestValidator>();
builder.Services.AddScoped<IValidator<ReactApp.Server.DTOs.RefreshTokenRequest>, RefreshTokenRequestValidator>();

// FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<SendSmsRequestValidator>();

builder.Services.AddControllers()
.AddJsonOptions(options =>
{
    // PERFORMANCE: Configure JSON serialization for optimal performance
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    options.JsonSerializerOptions.MaxDepth = 32;
});

// SignalR with JWT Authentication
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromSeconds(30);
    options.ClientTimeoutInterval = TimeSpan.FromMinutes(1);
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
    // PERFORMANCE: Configure SignalR for better performance
    options.MaximumReceiveMessageSize = 32_768; // 32KB
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                  "https://localhost:5173", "https://localhost:5174", "https://localhost:5175",
                  "https://localhost:5176", "https://localhost:5177", "https://localhost:5178",
                  "https://localhost:5179", "https://localhost:5180", "https://localhost:5181",
                  "https://localhost:5182", "https://localhost:5183", "https://localhost:5184",
                  "https://localhost:5185", "https://localhost:5186", "https://localhost:5187",
                  "https://localhost:5188", "https://localhost:5189", "https://localhost:5190",
                  "https://localhost:3000"
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// INFRASTRUCTURE: Health Checks
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database")
    .AddCheck<ExternalServiceHealthCheck>("external-services")
    .AddDbContextCheck<KindergartenDbContext>("ef-database");

// INFRASTRUCTURE: Application Insights (Production only)
if (builder.Environment.IsProduction())
{
    builder.Services.AddApplicationInsightsTelemetry(options =>
    {
        options.ConnectionString = builder.Configuration["Azure:ApplicationInsights:ConnectionString"];
    });
}

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "保育園アプリ API",
        Version = "v1",
        Description = "保育園保護者向けモバイルアプリのバックエンドAPI"
    });

    // JWT Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

// Ensure database is created and apply multi-role auth migration
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<KindergartenDbContext>();
    try
    {
        context.Database.EnsureCreated();

        // Execute multi-role authentication migration scripts (step by step)
        var scriptStep1Path = Path.Combine(Directory.GetCurrentDirectory(), "..", "scripts", "azure_migration_step1.sql");
        if (File.Exists(scriptStep1Path))
        {
            var migrationScript1 = await File.ReadAllTextAsync(scriptStep1Path);
            if (!string.IsNullOrEmpty(migrationScript1))
            {
                await context.Database.ExecuteSqlRawAsync(migrationScript1);
                Log.Information("多役割認証システム移行スクリプト ステップ1実行完了");
            }
        }

        var scriptStep2Path = Path.Combine(Directory.GetCurrentDirectory(), "..", "scripts", "azure_migration_step2.sql");
        if (File.Exists(scriptStep2Path))
        {
            var migrationScript2 = await File.ReadAllTextAsync(scriptStep2Path);
            if (!string.IsNullOrEmpty(migrationScript2))
            {
                await context.Database.ExecuteSqlRawAsync(migrationScript2);
                Log.Information("多役割認証システム移行スクリプト ステップ2実行完了");
            }
        }

        // Execute NotificationLogs columns fix script
        var notificationFixPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "scripts", "fix_notification_logs_columns.sql");
        if (File.Exists(notificationFixPath))
        {
            var notificationScript = await File.ReadAllTextAsync(notificationFixPath);
            if (!string.IsNullOrEmpty(notificationScript))
            {
                await context.Database.ExecuteSqlRawAsync(notificationScript);
                Log.Information("NotificationLogsテーブル カラム追加スクリプト実行完了");
            }
        }

        // Execute Japanese comments script
        var commentsPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "scripts", "add_new_table_comments_utf8.sql");
        if (File.Exists(commentsPath))
        {
            var commentsScript = await File.ReadAllTextAsync(commentsPath);
            if (!string.IsNullOrEmpty(commentsScript))
            {
                await context.Database.ExecuteSqlRawAsync(commentsScript);
                Log.Information("新規テーブル・カラム日本語コメント追加スクリプト実行完了");
            }
        }

        // Execute phone number normalization script
        var phoneFixPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "scripts", "fix_phone_numbers.sql");
        if (File.Exists(phoneFixPath))
        {
            var phoneScript = await File.ReadAllTextAsync(phoneFixPath);
            if (!string.IsNullOrEmpty(phoneScript))
            {
                await context.Database.ExecuteSqlRawAsync(phoneScript);
                Log.Information("電話番号正規化スクリプト実行完了");
            }
        }

        // Execute PhotoChildren table creation script
        var photoChildrenPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "scripts", "create_photo_children_table.sql");
        if (File.Exists(photoChildrenPath))
        {
            var photoChildrenScript = await File.ReadAllTextAsync(photoChildrenPath);
            if (!string.IsNullOrEmpty(photoChildrenScript))
            {
                await context.Database.ExecuteSqlRawAsync(photoChildrenScript);
                Log.Information("PhotoChildrenテーブル作成スクリプト実行完了");
            }
        }

        // Execute Family tables creation script
        var familyTablesPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "scripts", "add_family_tables.sql");
        if (File.Exists(familyTablesPath))
        {
            var familyTablesScript = await File.ReadAllTextAsync(familyTablesPath);
            if (!string.IsNullOrEmpty(familyTablesScript))
            {
                await context.Database.ExecuteSqlRawAsync(familyTablesScript);
                Log.Information("家族管理テーブル作成スクリプト実行完了");
            }
        }

        // Add DailyReports acknowledgement columns
        var dailyReportAckPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "scripts", "add_daily_reports_acknowledgement_columns.sql");
        if (File.Exists(dailyReportAckPath))
        {
            var dailyReportAckScript = await File.ReadAllTextAsync(dailyReportAckPath);
            if (!string.IsNullOrEmpty(dailyReportAckScript))
            {
                await context.Database.ExecuteSqlRawAsync(dailyReportAckScript);
                Log.Information("DailyReports確認フィールド追加スクリプト実行完了");
            }
        }

        // Add Events default constraints
        var eventDefaultsPath = Path.Combine(Directory.GetCurrentDirectory(), "scripts", "add_event_default_constraints.sql");
        if (File.Exists(eventDefaultsPath))
        {
            var eventDefaultsScript = await File.ReadAllTextAsync(eventDefaultsPath);
            if (!string.IsNullOrEmpty(eventDefaultsScript))
            {
                await context.Database.ExecuteSqlRawAsync(eventDefaultsScript);
                Log.Information("Eventsテーブルデフォルト制約追加スクリプト実行完了");
            }
        }

        // Fix Parent Id IDENTITY column
        var fixParentIdPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "fix_parent_id_identity.sql");
        Log.Information($"ParentsテーブルIDENTITY変換: スクリプトパス = {fixParentIdPath}");
        Log.Information($"ParentsテーブルIDENTITY変換: ファイル存在チェック = {File.Exists(fixParentIdPath)}");

        if (File.Exists(fixParentIdPath))
        {
            var fixParentIdScript = await File.ReadAllTextAsync(fixParentIdPath);
            Log.Information($"ParentsテーブルIDENTITY変換: スクリプト長 = {fixParentIdScript.Length}文字");

            if (!string.IsNullOrEmpty(fixParentIdScript))
            {
                try
                {
                    await context.Database.ExecuteSqlRawAsync(fixParentIdScript);
                    Log.Information("ParentsテーブルID列IDENTITY変換完了");
                }
                catch (Exception ex)
                {
                    Log.Error(ex, "ParentsテーブルID列IDENTITY変換エラー");
                }
            }
            else
            {
                Log.Warning("ParentsテーブルIDENTITY変換: スクリプトが空です");
            }
        }
        else
        {
            Log.Warning($"ParentsテーブルIDENTITY変換: スクリプトファイルが見つかりません: {fixParentIdPath}");
        }

        // Fix existing photo records' UploadedByStaffNurseryId
        // Note: This migration is commented out as Photos.UploadedByStaffNurseryId is already correctly set
        // var fixPhotoScript = @"
        // UPDATE Photos
        // SET UploadedByStaffNurseryId = (
        //     SELECT TOP 1 s.NurseryId
        //     FROM Staff s
        //     WHERE s.Id = Photos.UploadedByStaffId
        // )
        // WHERE (UploadedByStaffNurseryId = 0 OR UploadedByStaffNurseryId IS NULL)
        // AND EXISTS (SELECT 1 FROM Staff s WHERE s.Id = Photos.UploadedByStaffId);";
        //
        // await context.Database.ExecuteSqlRawAsync(fixPhotoScript);
        Log.Information("既存写真レコードのNurseryId確認スキップ（既に正しい値が設定済み）");

        // MenuMaster.MenuType カラム削除（新スキーマ移行）
        var dropMenuTypePath = Path.Combine(Directory.GetCurrentDirectory(), "scripts", "drop_menumaster_menutype.sql");
        if (File.Exists(dropMenuTypePath))
        {
            var dropMenuTypeScript = await File.ReadAllTextAsync(dropMenuTypePath);
            if (!string.IsNullOrEmpty(dropMenuTypeScript))
            {
                try
                {
                    await context.Database.ExecuteSqlRawAsync(dropMenuTypeScript);
                    Log.Information("MenuMaster.MenuType カラム削除スクリプト実行完了");
                }
                catch (Exception ex)
                {
                    Log.Error(ex, "MenuMaster.MenuType カラム削除エラー（既に削除済みの可能性）");
                }
            }
        }

        Log.Information("データベース初期化完了");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "データベース初期化エラー");
    }
}

// Configure middleware pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<IpAddressLoggingMiddleware>();
// Commented out until middleware exists
// app.UseMiddleware<PerformanceMonitoringMiddleware>();

// PERFORMANCE: Add Response Compression early in pipeline
app.UseResponseCompression();

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    // PERFORMANCE: Configure static file caching
    OnPrepareResponse = ctx =>
    {
        const int durationInSeconds = 60 * 60 * 24 * 30; // 30 days
        ctx.Context.Response.Headers.CacheControl = $"public,max-age={durationInSeconds}";
    }
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "保育園アプリ API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// INFRASTRUCTURE: Health Check Endpoints
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var response = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(x => new
            {
                name = x.Key,
                status = x.Value.Status.ToString(),
                description = x.Value.Description,
                duration = x.Value.Duration.TotalMilliseconds,
                data = x.Value.Data
            }),
            totalDuration = report.TotalDuration.TotalMilliseconds
        };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
});

// Performance metrics endpoint - commented out until middleware exists
// app.MapGet("/metrics", () => PerformanceMonitoringMiddleware.GetStats())
//     .RequireAuthorization()
//     .WithTags("Monitoring");

// SignalR Hub mapping
app.MapHub<ReactApp.Server.Hubs.NotificationHub>("/notificationHub");

app.MapFallbackToFile("/index.html");

try
{
    Log.Information("保育園アプリAPI開始");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "アプリケーション開始エラー");
}
finally
{
    Log.CloseAndFlush();
}