using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReactApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class FixEventStaffRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AbsenceNotificationResponses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AbsenceNotificationId = table.Column<int>(type: "int", nullable: false),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    ResponseType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ResponseMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ResponseAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AbsenceNotificationResponses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AbsenceNotifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ParentId = table.Column<int>(type: "int", nullable: false),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    ChildId = table.Column<int>(type: "int", nullable: false),
                    NotificationType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Ymd = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpectedArrivalTime = table.Column<TimeSpan>(type: "time", nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    AdditionalNotes = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "submitted"),
                    StaffResponse = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    AcknowledgedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AcknowledgedBy = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AbsenceNotifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AcademicYears",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsCurrent = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsArchived = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    ArchivedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AcademicYears", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Announcements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", maxLength: 5000, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TargetScope = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TargetClassId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    TargetChildId = table.Column<int>(type: "int", nullable: true),
                    Attachments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "draft"),
                    AllowComments = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ScheduledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReadCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CommentCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedByAdminUser = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Announcements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AttendanceStatistics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    ChildId = table.Column<int>(type: "int", nullable: true),
                    ClassId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    AcademicYear = table.Column<int>(type: "int", nullable: false),
                    Month = table.Column<int>(type: "int", nullable: true),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    StatisticType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TotalDays = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    PresentDays = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    AbsentDays = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    TardyDays = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    AttendanceRate = table.Column<decimal>(type: "DECIMAL(5,2)", nullable: false, defaultValue: 0.00m),
                    LastCalculatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceStatistics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    UserName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Action = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EntityId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BeforeValue = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    AfterValue = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AzureNotificationLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeviceId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    NotificationType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Body = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    JsonPayload = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    Platform = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    NotificationState = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ScheduledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AzureNotificationLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Children",
                columns: table => new
                {
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    ChildId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Furigana = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Gender = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ClassId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    MedicalNotes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SpecialInstructions = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    GraduationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    GraduationStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    WithdrawalReason = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    BloodType = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    LastAttendanceDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Children", x => new { x.NurseryId, x.ChildId });
                });

            migrationBuilder.CreateTable(
                name: "Classes",
                columns: table => new
                {
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    ClassId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    AgeGroupMin = table.Column<int>(type: "int", nullable: false),
                    AgeGroupMax = table.Column<int>(type: "int", nullable: false),
                    MaxCapacity = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AcademicYear = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Classes", x => new { x.NurseryId, x.ClassId });
                });

            migrationBuilder.CreateTable(
                name: "DailyAttendances",
                columns: table => new
                {
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    ChildId = table.Column<int>(type: "int", nullable: false),
                    AttendanceDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "blank"),
                    ArrivalTime = table.Column<TimeSpan>(type: "TIME", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    AbsenceNotificationId = table.Column<int>(type: "int", nullable: true),
                    RecordedByStaffId = table.Column<int>(type: "int", nullable: true),
                    RecordedByStaffNurseryId = table.Column<int>(type: "int", nullable: true),
                    RecordedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedByStaffId = table.Column<int>(type: "int", nullable: true),
                    UpdatedByStaffNurseryId = table.Column<int>(type: "int", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyAttendances", x => new { x.NurseryId, x.ChildId, x.AttendanceDate });
                });

            migrationBuilder.CreateTable(
                name: "DailyReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    ChildId = table.Column<int>(type: "int", nullable: false),
                    StaffNurseryId = table.Column<int>(type: "int", nullable: false),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    ReportDate = table.Column<DateTime>(type: "date", nullable: false),
                    ReportKind = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Photos = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "draft"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ParentAcknowledged = table.Column<bool>(type: "bit", nullable: false),
                    AcknowledgedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedByAdminUser = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyReports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DeviceRegistrations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeviceId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    UserType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Platform = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsAndroid = table.Column<bool>(type: "bit", nullable: false),
                    PushToken = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    RegistrationId = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DeviceInfo = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    AppVersion = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceRegistrations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    TargetGradeLevel = table.Column<int>(type: "int", nullable: true),
                    TargetClassId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StartDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsAllDay = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    RecurrencePattern = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "none"),
                    TargetAudience = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "all"),
                    RequiresPreparation = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    PreparationInstructions = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    LastModified = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FamilyMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ParentId = table.Column<int>(type: "int", nullable: false),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    ChildId = table.Column<int>(type: "int", nullable: false),
                    RelationshipType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsPrimaryContact = table.Column<bool>(type: "bit", nullable: false),
                    CanReceiveNotifications = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CanViewReports = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CanViewPhotos = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    HasPickupPermission = table.Column<bool>(type: "bit", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvitedByParentId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FamilyMembers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ParentId = table.Column<int>(type: "int", nullable: false),
                    NotificationType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DeliveryMethod = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "pending"),
                    ErrorMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RelatedEntityId = table.Column<int>(type: "int", nullable: true),
                    RelatedEntityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReadAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RetryCount = table.Column<int>(type: "int", nullable: false),
                    NextRetryAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ParentId = table.Column<int>(type: "int", nullable: false),
                    PushNotificationsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    AbsenceConfirmationEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    DailyReportEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    EventNotificationEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    AnnouncementEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    SmsNotificationsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    EmailNotificationsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeviceToken = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DevicePlatform = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NotificationType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Platform = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TemplateJson = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Nurseries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PrincipalName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EstablishedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LogoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LoginId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Password = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LoginAttempts = table.Column<int>(type: "int", nullable: false),
                    IsLocked = table.Column<bool>(type: "bit", nullable: false),
                    LockedUntil = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CurrentAcademicYear = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Nurseries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ParentChildRelationships",
                columns: table => new
                {
                    ParentId = table.Column<int>(type: "int", nullable: false),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    ChildId = table.Column<int>(type: "int", nullable: false),
                    RelationshipType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsPrimaryContact = table.Column<bool>(type: "bit", nullable: false),
                    HasPickupPermission = table.Column<bool>(type: "bit", nullable: false),
                    CanReceiveEmergencyNotifications = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParentChildRelationships", x => new { x.ParentId, x.NurseryId, x.ChildId });
                });

            migrationBuilder.CreateTable(
                name: "Parents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PhoneNumber = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PushNotificationsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AbsenceConfirmationEnabled = table.Column<bool>(type: "bit", nullable: false),
                    DailyReportEnabled = table.Column<bool>(type: "bit", nullable: false),
                    EventNotificationEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AnnouncementEnabled = table.Column<bool>(type: "bit", nullable: false),
                    FontSize = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Language = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Parents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Photos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ThumbnailPath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    OriginalFileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    MimeType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Width = table.Column<int>(type: "int", nullable: false),
                    Height = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UploadedByStaffNurseryId = table.Column<int>(type: "int", nullable: false),
                    UploadedByStaffId = table.Column<int>(type: "int", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    VisibilityLevel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "class"),
                    TargetClassId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "draft"),
                    RequiresConsent = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    ViewCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    DownloadCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UploadedByAdminUser = table.Column<bool>(type: "bit", nullable: false),
                    IsReportCreate = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Photos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PromotionHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    ChildId = table.Column<int>(type: "int", nullable: false),
                    FromAcademicYear = table.Column<int>(type: "int", nullable: false),
                    ToAcademicYear = table.Column<int>(type: "int", nullable: false),
                    FromClassId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ToClassId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PromotedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    PromotedByUserId = table.Column<int>(type: "int", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromotionHistories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ParentId = table.Column<int>(type: "int", nullable: true),
                    Token = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    JwtId = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRevoked = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ClientIpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    StaffNurseryId = table.Column<int>(type: "int", nullable: true),
                    StaffId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SmsAuthentications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PhoneNumber = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(6)", maxLength: 6, nullable: false),
                    HashedCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsUsed = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    UsedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AttemptCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    ClientIpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ParentId = table.Column<int>(type: "int", nullable: true),
                    StaffNurseryId = table.Column<int>(type: "int", nullable: true),
                    StaffId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SmsAuthentications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Staff",
                columns: table => new
                {
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Role = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Position = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResignationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Remark = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Staff", x => new { x.NurseryId, x.StaffId });
                });

            migrationBuilder.CreateTable(
                name: "StaffClassAssignments",
                columns: table => new
                {
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    ClassId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    AssignmentRole = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AcademicYear = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffClassAssignments", x => new { x.NurseryId, x.StaffId, x.ClassId });
                    table.CheckConstraint("CK_StaffClassAssignment_Role", "[AssignmentRole] IN ('MainTeacher', 'AssistantTeacher')");
                });

            migrationBuilder.CreateTable(
                name: "UserRolePreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PhoneNumber = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    PreferredRole = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRolePreferences", x => x.Id);
                    table.CheckConstraint("CK_UserRolePreference_PreferredRole", "[PreferredRole] IN ('Parent', 'Staff')");
                });

            migrationBuilder.CreateTable(
                name: "DailyReportResponses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DailyReportId = table.Column<int>(type: "int", nullable: false),
                    ParentId = table.Column<int>(type: "int", nullable: false),
                    ResponseMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyReportResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DailyReportResponses_DailyReports_DailyReportId",
                        column: x => x.DailyReportId,
                        principalTable: "DailyReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PhotoAccesses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PhotoId = table.Column<int>(type: "int", nullable: false),
                    ParentId = table.Column<int>(type: "int", nullable: false),
                    AccessType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    AccessedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsSuccessful = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhotoAccesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhotoAccesses_Photos_PhotoId",
                        column: x => x.PhotoId,
                        principalTable: "Photos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PhotoChildren",
                columns: table => new
                {
                    PhotoId = table.Column<int>(type: "int", nullable: false),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    ChildId = table.Column<int>(type: "int", nullable: false),
                    IsPrimarySubject = table.Column<bool>(type: "bit", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    AddedByStaffId = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhotoChildren", x => new { x.PhotoId, x.NurseryId, x.ChildId });
                    table.ForeignKey(
                        name: "FK_PhotoChildren_Photos_PhotoId",
                        column: x => x.PhotoId,
                        principalTable: "Photos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PhotoConsents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PhotoId = table.Column<int>(type: "int", nullable: false),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    ChildId = table.Column<int>(type: "int", nullable: false),
                    ParentId = table.Column<int>(type: "int", nullable: false),
                    ConsentStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    RespondedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhotoConsents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhotoConsents_Photos_PhotoId",
                        column: x => x.PhotoId,
                        principalTable: "Photos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AbsenceNotificationResponses_AbsenceNotificationId",
                table: "AbsenceNotificationResponses",
                column: "AbsenceNotificationId");

            migrationBuilder.CreateIndex(
                name: "IX_AbsenceNotificationResponses_NurseryId_StaffId",
                table: "AbsenceNotificationResponses",
                columns: new[] { "NurseryId", "StaffId" });

            migrationBuilder.CreateIndex(
                name: "IX_AbsenceNotificationResponses_ResponseAt",
                table: "AbsenceNotificationResponses",
                column: "ResponseAt");

            migrationBuilder.CreateIndex(
                name: "IX_AbsenceNotifications_Child_Date_Status",
                table: "AbsenceNotifications",
                columns: new[] { "NurseryId", "ChildId", "Ymd" });

            migrationBuilder.CreateIndex(
                name: "IX_AbsenceNotifications_Parent_Submitted",
                table: "AbsenceNotifications",
                columns: new[] { "ParentId", "SubmittedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AbsenceNotifications_Status_Submitted",
                table: "AbsenceNotifications",
                columns: new[] { "Status", "SubmittedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AcademicYears_Nursery_Current",
                table: "AcademicYears",
                columns: new[] { "NurseryId", "IsCurrent" },
                filter: "[IsCurrent] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_AcademicYears_Nursery_Year",
                table: "AcademicYears",
                columns: new[] { "NurseryId", "Year" });

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_Category_Status_Published",
                table: "Announcements",
                columns: new[] { "Category", "Status", "PublishedAt" },
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_Staff_Status_Created",
                table: "Announcements",
                columns: new[] { "NurseryId", "StaffId", "Status", "CreatedAt" },
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_Status_Published",
                table: "Announcements",
                columns: new[] { "Status", "PublishedAt" },
                filter: "[Status] = 'published' AND [IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceStatistics_Child",
                table: "AttendanceStatistics",
                columns: new[] { "NurseryId", "ChildId", "AcademicYear" },
                filter: "[ChildId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceStatistics_Class",
                table: "AttendanceStatistics",
                columns: new[] { "NurseryId", "ClassId", "AcademicYear" },
                filter: "[ClassId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceStatistics_Type",
                table: "AttendanceStatistics",
                column: "StatisticType");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceStatistics_Year_Month",
                table: "AttendanceStatistics",
                columns: new[] { "NurseryId", "AcademicYear", "Month" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Action",
                table: "AuditLogs",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EntityType",
                table: "AuditLogs",
                column: "EntityType");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Nursery_Timestamp",
                table: "AuditLogs",
                columns: new[] { "NurseryId", "Timestamp" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId",
                table: "AuditLogs",
                column: "UserId",
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AzureNotificationLogs_DeviceId",
                table: "AzureNotificationLogs",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_AzureNotificationLogs_NotificationType",
                table: "AzureNotificationLogs",
                column: "NotificationType");

            migrationBuilder.CreateIndex(
                name: "IX_AzureNotificationLogs_SentAt",
                table: "AzureNotificationLogs",
                column: "SentAt");

            migrationBuilder.CreateIndex(
                name: "IX_Children_BirthDate",
                table: "Children",
                column: "DateOfBirth");

            migrationBuilder.CreateIndex(
                name: "IX_Children_Class_Active",
                table: "Children",
                columns: new[] { "ClassId", "IsActive" },
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Children_Nursery_Active_Name",
                table: "Children",
                columns: new[] { "NurseryId", "IsActive", "Name" },
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_AgeRange",
                table: "Classes",
                columns: new[] { "AgeGroupMin", "AgeGroupMax" });

            migrationBuilder.CreateIndex(
                name: "IX_Classes_Capacity",
                table: "Classes",
                column: "MaxCapacity");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_Nursery_Name",
                table: "Classes",
                columns: new[] { "NurseryId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_DailyAttendances_AbsenceNotification",
                table: "DailyAttendances",
                column: "AbsenceNotificationId",
                filter: "[AbsenceNotificationId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DailyAttendances_Child_Date",
                table: "DailyAttendances",
                columns: new[] { "NurseryId", "ChildId", "AttendanceDate" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "IX_DailyAttendances_Date_Status",
                table: "DailyAttendances",
                columns: new[] { "NurseryId", "AttendanceDate", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_DailyAttendances_IsActive",
                table: "DailyAttendances",
                columns: new[] { "NurseryId", "IsActive" },
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_DailyReportResponses_DailyReportId",
                table: "DailyReportResponses",
                column: "DailyReportId");

            migrationBuilder.CreateIndex(
                name: "IX_DailyReportResponses_IsRead",
                table: "DailyReportResponses",
                column: "IsRead");

            migrationBuilder.CreateIndex(
                name: "IX_DailyReportResponses_ParentId",
                table: "DailyReportResponses",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_DailyReports_Child_Date_Status",
                table: "DailyReports",
                columns: new[] { "NurseryId", "ChildId", "ReportDate", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_DailyReports_Date_Status",
                table: "DailyReports",
                columns: new[] { "ReportDate", "Status" },
                filter: "[Status] = 'published'");

            migrationBuilder.CreateIndex(
                name: "IX_DailyReports_ReportKind_Date",
                table: "DailyReports",
                columns: new[] { "ReportKind", "ReportDate" });

            migrationBuilder.CreateIndex(
                name: "IX_DailyReports_Staff_Created",
                table: "DailyReports",
                columns: new[] { "StaffNurseryId", "StaffId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DeviceRegistrations_DeviceId",
                table: "DeviceRegistrations",
                column: "DeviceId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeviceRegistrations_IsActive_LastLoginAt",
                table: "DeviceRegistrations",
                columns: new[] { "IsActive", "LastLoginAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DeviceRegistrations_Platform",
                table: "DeviceRegistrations",
                column: "Platform");

            migrationBuilder.CreateIndex(
                name: "IX_DeviceRegistrations_UserId",
                table: "DeviceRegistrations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_Category",
                table: "Events",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Events_IsActive",
                table: "Events",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Events_NurseryId_StartDateTime",
                table: "Events",
                columns: new[] { "NurseryId", "StartDateTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Events_TargetAudience",
                table: "Events",
                column: "TargetAudience");

            migrationBuilder.CreateIndex(
                name: "IX_FamilyMembers_IsActive",
                table: "FamilyMembers",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_FamilyMembers_NurseryId_ChildId",
                table: "FamilyMembers",
                columns: new[] { "NurseryId", "ChildId" });

            migrationBuilder.CreateIndex(
                name: "IX_FamilyMembers_NurseryId_ChildId_ParentId",
                table: "FamilyMembers",
                columns: new[] { "NurseryId", "ChildId", "ParentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FamilyMembers_ParentId",
                table: "FamilyMembers",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_CreatedAt_Cleanup",
                table: "NotificationLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_Entity_Created",
                table: "NotificationLogs",
                columns: new[] { "RelatedEntityType", "RelatedEntityId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_Parent_Created",
                table: "NotificationLogs",
                columns: new[] { "ParentId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_Type_Status_Created",
                table: "NotificationLogs",
                columns: new[] { "NotificationType", "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_NotificationSettings_DeviceToken",
                table: "NotificationSettings",
                column: "DeviceToken");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationSettings_ParentId",
                table: "NotificationSettings",
                column: "ParentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotificationTemplates_NotificationType",
                table: "NotificationTemplates",
                column: "NotificationType");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationTemplates_NotificationType_Platform",
                table: "NotificationTemplates",
                columns: new[] { "NotificationType", "Platform" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotificationTemplates_Platform",
                table: "NotificationTemplates",
                column: "Platform");

            migrationBuilder.CreateIndex(
                name: "IX_Nurseries_Name",
                table: "Nurseries",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "UK_Nurseries_Email",
                table: "Nurseries",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UK_Nurseries_PhoneNumber",
                table: "Nurseries",
                column: "PhoneNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ParentChild_Child_Active",
                table: "ParentChildRelationships",
                columns: new[] { "ChildId", "IsActive" },
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_ParentChild_Parent_Active",
                table: "ParentChildRelationships",
                columns: new[] { "ParentId", "IsActive" },
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_ParentChild_Primary_Active",
                table: "ParentChildRelationships",
                columns: new[] { "IsPrimaryContact", "IsActive" },
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Parents_Active_Created",
                table: "Parents",
                columns: new[] { "IsActive", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Parents_Email",
                table: "Parents",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Parents_PhoneNumber_Active_Children",
                table: "Parents",
                columns: new[] { "PhoneNumber", "IsActive", "Id", "Name", "Email", "LastLoginAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Parents_PhoneNumber_Unique",
                table: "Parents",
                column: "PhoneNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PhotoAccesses_AccessedAt",
                table: "PhotoAccesses",
                column: "AccessedAt");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoAccesses_AccessType",
                table: "PhotoAccesses",
                column: "AccessType");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoAccesses_ParentId",
                table: "PhotoAccesses",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoAccesses_PhotoId",
                table: "PhotoAccesses",
                column: "PhotoId");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoChildren_IsPrimarySubject",
                table: "PhotoChildren",
                column: "IsPrimarySubject");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoChildren_NurseryId_ChildId",
                table: "PhotoChildren",
                columns: new[] { "NurseryId", "ChildId" });

            migrationBuilder.CreateIndex(
                name: "IX_PhotoChildren_PhotoId",
                table: "PhotoChildren",
                column: "PhotoId");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoConsents_ConsentStatus",
                table: "PhotoConsents",
                column: "ConsentStatus");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoConsents_NurseryId_ChildId",
                table: "PhotoConsents",
                columns: new[] { "NurseryId", "ChildId" });

            migrationBuilder.CreateIndex(
                name: "IX_PhotoConsents_ParentId",
                table: "PhotoConsents",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoConsents_PhotoId",
                table: "PhotoConsents",
                column: "PhotoId");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoConsents_PhotoId_NurseryId_ChildId_ParentId",
                table: "PhotoConsents",
                columns: new[] { "PhotoId", "NurseryId", "ChildId", "ParentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Photos_Class_Status_Published",
                table: "Photos",
                columns: new[] { "TargetClassId", "Status", "PublishedAt" },
                filter: "[Status] = 'published' AND [TargetClassId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Photos_Staff_Uploaded",
                table: "Photos",
                columns: new[] { "UploadedByStaffNurseryId", "UploadedByStaffId", "UploadedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Photos_Visibility_Status_Published",
                table: "Photos",
                columns: new[] { "VisibilityLevel", "Status", "PublishedAt" },
                filter: "[Status] = 'published'");

            migrationBuilder.CreateIndex(
                name: "IX_PromotionHistory_AcademicYear",
                table: "PromotionHistories",
                columns: new[] { "NurseryId", "ToAcademicYear" });

            migrationBuilder.CreateIndex(
                name: "IX_PromotionHistory_Child",
                table: "PromotionHistories",
                columns: new[] { "NurseryId", "ChildId" });

            migrationBuilder.CreateIndex(
                name: "IX_PromotionHistory_PromotedAt",
                table: "PromotionHistories",
                columns: new[] { "NurseryId", "PromotedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_ExpiresAt_Cleanup",
                table: "RefreshTokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_JwtId_Unique",
                table: "RefreshTokens",
                column: "JwtId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_Parent_Expires_Revoked",
                table: "RefreshTokens",
                columns: new[] { "ParentId", "ExpiresAt", "IsRevoked" },
                filter: "[IsRevoked] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_ParentId",
                table: "RefreshTokens",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_Staff_Expires_Revoked",
                table: "RefreshTokens",
                columns: new[] { "StaffId", "ExpiresAt", "IsRevoked" },
                filter: "[IsRevoked] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_StaffNurseryId_StaffId",
                table: "RefreshTokens",
                columns: new[] { "StaffNurseryId", "StaffId" });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_Token_Unique",
                table: "RefreshTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SmsAuth_CreatedAt_Cleanup",
                table: "SmsAuthentications",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SmsAuth_Parent_Created",
                table: "SmsAuthentications",
                columns: new[] { "ParentId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SmsAuth_Phone_Created",
                table: "SmsAuthentications",
                columns: new[] { "PhoneNumber", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SmsAuth_Phone_Parent_Staff",
                table: "SmsAuthentications",
                columns: new[] { "PhoneNumber", "ParentId", "StaffId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SmsAuth_Staff_Created",
                table: "SmsAuthentications",
                columns: new[] { "StaffId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SmsAuthentications_ExpiresAt",
                table: "SmsAuthentications",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_SmsAuthentications_ParentId",
                table: "SmsAuthentications",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_SmsAuthentications_StaffNurseryId_StaffId",
                table: "SmsAuthentications",
                columns: new[] { "StaffNurseryId", "StaffId" });

            migrationBuilder.CreateIndex(
                name: "IX_Staff_Nursery_Active",
                table: "Staff",
                columns: new[] { "NurseryId", "IsActive" },
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Staff_PhoneNumber_Active",
                table: "Staff",
                columns: new[] { "PhoneNumber", "IsActive" },
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Staff_PhoneNumber_Unique",
                table: "Staff",
                column: "PhoneNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Staff_Role_Active",
                table: "Staff",
                columns: new[] { "Role", "IsActive" },
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_StaffClassAssignments_Class",
                table: "StaffClassAssignments",
                columns: new[] { "NurseryId", "ClassId" });

            migrationBuilder.CreateIndex(
                name: "IX_StaffClassAssignments_Class_Role",
                table: "StaffClassAssignments",
                columns: new[] { "NurseryId", "ClassId", "AssignmentRole" });

            migrationBuilder.CreateIndex(
                name: "IX_StaffClassAssignments_Staff",
                table: "StaffClassAssignments",
                columns: new[] { "NurseryId", "StaffId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserRolePreferences_PhoneNumber_Updated",
                table: "UserRolePreferences",
                columns: new[] { "PhoneNumber", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "UQ_UserRolePreferences_PhoneNumber",
                table: "UserRolePreferences",
                column: "PhoneNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AbsenceNotificationResponses");

            migrationBuilder.DropTable(
                name: "AbsenceNotifications");

            migrationBuilder.DropTable(
                name: "AcademicYears");

            migrationBuilder.DropTable(
                name: "Announcements");

            migrationBuilder.DropTable(
                name: "AttendanceStatistics");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "AzureNotificationLogs");

            migrationBuilder.DropTable(
                name: "Children");

            migrationBuilder.DropTable(
                name: "Classes");

            migrationBuilder.DropTable(
                name: "DailyAttendances");

            migrationBuilder.DropTable(
                name: "DailyReportResponses");

            migrationBuilder.DropTable(
                name: "DeviceRegistrations");

            migrationBuilder.DropTable(
                name: "Events");

            migrationBuilder.DropTable(
                name: "FamilyMembers");

            migrationBuilder.DropTable(
                name: "NotificationLogs");

            migrationBuilder.DropTable(
                name: "NotificationSettings");

            migrationBuilder.DropTable(
                name: "NotificationTemplates");

            migrationBuilder.DropTable(
                name: "Nurseries");

            migrationBuilder.DropTable(
                name: "ParentChildRelationships");

            migrationBuilder.DropTable(
                name: "Parents");

            migrationBuilder.DropTable(
                name: "PhotoAccesses");

            migrationBuilder.DropTable(
                name: "PhotoChildren");

            migrationBuilder.DropTable(
                name: "PhotoConsents");

            migrationBuilder.DropTable(
                name: "PromotionHistories");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "SmsAuthentications");

            migrationBuilder.DropTable(
                name: "Staff");

            migrationBuilder.DropTable(
                name: "StaffClassAssignments");

            migrationBuilder.DropTable(
                name: "UserRolePreferences");

            migrationBuilder.DropTable(
                name: "DailyReports");

            migrationBuilder.DropTable(
                name: "Photos");
        }
    }
}
