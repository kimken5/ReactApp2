IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [AbsenceNotificationResponses] (
        [Id] int NOT NULL IDENTITY,
        [AbsenceNotificationId] int NOT NULL,
        [NurseryId] int NOT NULL,
        [StaffId] int NOT NULL,
        [ResponseType] nvarchar(20) NOT NULL,
        [ResponseMessage] nvarchar(500) NULL,
        [ResponseAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_AbsenceNotificationResponses] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [AbsenceNotifications] (
        [Id] int NOT NULL IDENTITY,
        [ParentId] int NOT NULL,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [NotificationType] nvarchar(20) NOT NULL,
        [Ymd] datetime2 NOT NULL,
        [ExpectedArrivalTime] time NULL,
        [Reason] nvarchar(50) NOT NULL,
        [AdditionalNotes] nvarchar(200) NULL,
        [SubmittedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [Status] nvarchar(20) NOT NULL DEFAULT N'submitted',
        [StaffResponse] nvarchar(500) NULL,
        [AcknowledgedAt] datetime2 NULL,
        [AcknowledgedBy] int NULL,
        [AcknowledgedByAdminUser] bit NOT NULL,
        [RespondedByStaffId] int NULL,
        [AcknowledgedByAdminAt] datetime2 NULL,
        CONSTRAINT [PK_AbsenceNotifications] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [AcademicYears] (
        [Id] int NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [Year] int NOT NULL,
        [StartDate] datetime2 NOT NULL,
        [EndDate] datetime2 NOT NULL,
        [IsCurrent] bit NOT NULL DEFAULT CAST(0 AS bit),
        [IsArchived] bit NOT NULL DEFAULT CAST(0 AS bit),
        [ArchivedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_AcademicYears] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [Announcements] (
        [Id] int NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [StaffId] int NOT NULL,
        [Title] nvarchar(100) NOT NULL,
        [Content] nvarchar(max) NOT NULL,
        [Category] nvarchar(50) NOT NULL,
        [TargetScope] nvarchar(20) NOT NULL,
        [TargetClassIds] nvarchar(max) NULL,
        [TargetChildIds] nvarchar(max) NULL,
        [Attachments] nvarchar(max) NULL,
        [Status] nvarchar(20) NOT NULL DEFAULT N'draft',
        [Priority] nvarchar(20) NOT NULL DEFAULT N'normal',
        [AllowComments] bit NOT NULL DEFAULT CAST(1 AS bit),
        [PublishedAt] datetime2 NULL,
        [ScheduledAt] datetime2 NULL,
        [ReadCount] int NOT NULL DEFAULT 0,
        [CommentCount] int NOT NULL DEFAULT 0,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedByAdminUser] bit NOT NULL,
        CONSTRAINT [PK_Announcements] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [AttendanceStatistics] (
        [Id] int NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [ChildId] int NULL,
        [ClassId] nvarchar(50) NULL,
        [AcademicYear] int NOT NULL,
        [Month] int NULL,
        [Date] datetime2 NULL,
        [StatisticType] nvarchar(20) NOT NULL,
        [TotalDays] int NOT NULL DEFAULT 0,
        [PresentDays] int NOT NULL DEFAULT 0,
        [AbsentDays] int NOT NULL DEFAULT 0,
        [TardyDays] int NOT NULL DEFAULT 0,
        [AttendanceRate] DECIMAL(5,2) NOT NULL DEFAULT 0.0,
        [LastCalculatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_AttendanceStatistics] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] bigint NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [UserId] int NULL,
        [UserName] nvarchar(100) NULL,
        [Action] nvarchar(50) NOT NULL,
        [EntityType] nvarchar(50) NOT NULL,
        [EntityId] nvarchar(50) NULL,
        [BeforeValue] NVARCHAR(MAX) NULL,
        [AfterValue] NVARCHAR(MAX) NULL,
        [IpAddress] nvarchar(45) NULL,
        [UserAgent] nvarchar(500) NULL,
        [Timestamp] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [AzureNotificationLogs] (
        [Id] int NOT NULL IDENTITY,
        [DeviceId] nvarchar(255) NOT NULL,
        [NotificationType] nvarchar(50) NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [Body] nvarchar(1000) NOT NULL,
        [JsonPayload] NVARCHAR(MAX) NULL,
        [Platform] nvarchar(20) NOT NULL,
        [NotificationState] nvarchar(50) NULL,
        [SentAt] datetime2 NULL,
        [ScheduledAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_AzureNotificationLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [Classes] (
        [NurseryId] int NOT NULL,
        [ClassId] nvarchar(50) NOT NULL,
        [Name] nvarchar(50) NOT NULL,
        [AgeGroupMin] int NOT NULL,
        [AgeGroupMax] int NOT NULL,
        [MaxCapacity] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [AcademicYear] int NOT NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_Classes] PRIMARY KEY ([NurseryId], [ClassId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [DailyReports] (
        [Id] int NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [StaffNurseryId] int NOT NULL,
        [StaffId] int NOT NULL,
        [ReportDate] date NOT NULL,
        [Category] nvarchar(50) NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [Content] nvarchar(1000) NOT NULL,
        [Tags] nvarchar(500) NULL,
        [Photos] nvarchar(1000) NULL,
        [Status] nvarchar(20) NOT NULL DEFAULT N'draft',
        [PublishedAt] datetime2 NULL,
        [ParentAcknowledged] bit NOT NULL,
        [AcknowledgedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [CreatedByAdminUser] bit NOT NULL,
        CONSTRAINT [PK_DailyReports] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [DeviceRegistrations] (
        [Id] int NOT NULL IDENTITY,
        [DeviceId] nvarchar(255) NOT NULL,
        [UserId] int NOT NULL,
        [UserType] nvarchar(20) NOT NULL,
        [Platform] nvarchar(20) NOT NULL,
        [IsAndroid] bit NOT NULL,
        [PushToken] nvarchar(1000) NULL,
        [RegistrationId] nvarchar(500) NULL,
        [DeviceInfo] nvarchar(1000) NULL,
        [AppVersion] nvarchar(50) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [LastLoginAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_DeviceRegistrations] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [FamilyMembers] (
        [Id] int NOT NULL IDENTITY,
        [ParentId] int NOT NULL,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [RelationshipType] nvarchar(20) NOT NULL,
        [DisplayName] nvarchar(100) NULL,
        [IsPrimaryContact] bit NOT NULL,
        [CanReceiveNotifications] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CanViewReports] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CanViewPhotos] bit NOT NULL DEFAULT CAST(1 AS bit),
        [HasPickupPermission] bit NOT NULL,
        [JoinedAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [UpdatedAt] datetime2 NULL,
        [InvitedByParentId] int NULL,
        CONSTRAINT [PK_FamilyMembers] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [NotificationLogs] (
        [Id] int NOT NULL IDENTITY,
        [ParentId] int NOT NULL,
        [NotificationType] nvarchar(50) NOT NULL,
        [DeliveryMethod] nvarchar(50) NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [Content] nvarchar(1000) NOT NULL,
        [Status] nvarchar(50) NOT NULL DEFAULT N'pending',
        [ErrorMessage] nvarchar(500) NULL,
        [RelatedEntityId] int NULL,
        [RelatedEntityType] nvarchar(50) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [SentAt] datetime2 NULL,
        [DeliveredAt] datetime2 NULL,
        [ReadAt] datetime2 NULL,
        [RetryCount] int NOT NULL,
        [NextRetryAt] datetime2 NULL,
        CONSTRAINT [PK_NotificationLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [NotificationSettings] (
        [Id] int NOT NULL IDENTITY,
        [ParentId] int NOT NULL,
        [PushNotificationsEnabled] bit NOT NULL DEFAULT CAST(1 AS bit),
        [AbsenceConfirmationEnabled] bit NOT NULL DEFAULT CAST(1 AS bit),
        [DailyReportEnabled] bit NOT NULL DEFAULT CAST(1 AS bit),
        [EventNotificationEnabled] bit NOT NULL DEFAULT CAST(1 AS bit),
        [AnnouncementEnabled] bit NOT NULL DEFAULT CAST(1 AS bit),
        [SmsNotificationsEnabled] bit NOT NULL DEFAULT CAST(0 AS bit),
        [EmailNotificationsEnabled] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeviceToken] nvarchar(500) NULL,
        [DevicePlatform] nvarchar(50) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_NotificationSettings] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [NotificationTemplates] (
        [Id] int NOT NULL IDENTITY,
        [NotificationType] nvarchar(50) NOT NULL,
        [Platform] nvarchar(20) NOT NULL,
        [TemplateJson] NVARCHAR(MAX) NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_NotificationTemplates] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [Nurseries] (
        [Id] int NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Address] nvarchar(500) NOT NULL,
        [PhoneNumber] nvarchar(20) NOT NULL,
        [Email] nvarchar(255) NOT NULL,
        [PrincipalName] nvarchar(100) NOT NULL,
        [EstablishedDate] datetime2 NOT NULL,
        [LogoUrl] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [LoginId] nvarchar(50) NULL,
        [Password] nvarchar(255) NULL,
        [LastLoginAt] datetime2 NULL,
        [LoginAttempts] int NOT NULL,
        [IsLocked] bit NOT NULL,
        [LockedUntil] datetime2 NULL,
        [CurrentAcademicYear] int NOT NULL,
        CONSTRAINT [PK_Nurseries] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [ParentChildRelationships] (
        [ParentId] int NOT NULL,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [RelationshipType] nvarchar(20) NOT NULL,
        [IsPrimaryContact] bit NOT NULL,
        [HasPickupPermission] bit NOT NULL,
        [CanReceiveEmergencyNotifications] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_ParentChildRelationships] PRIMARY KEY ([ParentId], [NurseryId], [ChildId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [Parents] (
        [Id] int NOT NULL IDENTITY,
        [PhoneNumber] nvarchar(15) NOT NULL,
        [Name] nvarchar(100) NULL,
        [Email] nvarchar(200) NULL,
        [Address] nvarchar(200) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [LastLoginAt] datetime2 NULL,
        [PushNotificationsEnabled] bit NOT NULL,
        [AbsenceConfirmationEnabled] bit NOT NULL,
        [DailyReportEnabled] bit NOT NULL,
        [EventNotificationEnabled] bit NOT NULL,
        [AnnouncementEnabled] bit NOT NULL,
        [FontSize] nvarchar(10) NOT NULL,
        [Language] nvarchar(10) NOT NULL,
        [IsPrimary] bit NOT NULL,
        CONSTRAINT [PK_Parents] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [Photos] (
        [Id] int NOT NULL IDENTITY,
        [FileName] nvarchar(255) NOT NULL,
        [FilePath] nvarchar(500) NOT NULL,
        [ThumbnailPath] nvarchar(500) NOT NULL,
        [OriginalFileName] nvarchar(255) NULL,
        [FileSize] bigint NOT NULL,
        [MimeType] nvarchar(100) NOT NULL,
        [Width] int NOT NULL,
        [Height] int NOT NULL,
        [Description] nvarchar(500) NULL,
        [UploadedByStaffNurseryId] int NOT NULL,
        [UploadedByStaffId] int NOT NULL,
        [UploadedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [PublishedAt] datetime2 NOT NULL,
        [VisibilityLevel] nvarchar(20) NOT NULL DEFAULT N'class',
        [TargetClassId] nvarchar(50) NULL,
        [Status] nvarchar(20) NOT NULL DEFAULT N'draft',
        [RequiresConsent] bit NOT NULL DEFAULT CAST(1 AS bit),
        [ViewCount] int NOT NULL DEFAULT 0,
        [DownloadCount] int NOT NULL DEFAULT 0,
        [IsActive] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        [UpdatedAt] datetime2 NULL,
        [UploadedByAdminUser] bit NOT NULL,
        CONSTRAINT [PK_Photos] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [PromotionHistories] (
        [Id] int NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [FromAcademicYear] int NOT NULL,
        [ToAcademicYear] int NOT NULL,
        [FromClassId] nvarchar(50) NOT NULL,
        [ToClassId] nvarchar(50) NOT NULL,
        [PromotedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [PromotedByUserId] int NULL,
        [Notes] nvarchar(200) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_PromotionHistories] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id] int NOT NULL IDENTITY,
        [ParentId] int NULL,
        [Token] nvarchar(500) NOT NULL,
        [JwtId] nvarchar(500) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [ExpiresAt] datetime2 NOT NULL,
        [IsRevoked] bit NOT NULL DEFAULT CAST(0 AS bit),
        [RevokedAt] datetime2 NULL,
        [ClientIpAddress] nvarchar(45) NULL,
        [UserAgent] nvarchar(500) NULL,
        [StaffNurseryId] int NULL,
        [StaffId] int NULL,
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [SmsAuthentications] (
        [Id] int NOT NULL IDENTITY,
        [PhoneNumber] nvarchar(15) NOT NULL,
        [Code] nvarchar(6) NOT NULL,
        [HashedCode] nvarchar(100) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [ExpiresAt] datetime2 NOT NULL,
        [IsUsed] bit NOT NULL DEFAULT CAST(0 AS bit),
        [UsedAt] datetime2 NULL,
        [AttemptCount] int NOT NULL DEFAULT 0,
        [ClientIpAddress] nvarchar(45) NULL,
        [UserAgent] nvarchar(500) NULL,
        [ParentId] int NULL,
        [StaffNurseryId] int NULL,
        [StaffId] int NULL,
        CONSTRAINT [PK_SmsAuthentications] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [Staff] (
        [NurseryId] int NOT NULL,
        [StaffId] int NOT NULL,
        [Name] nvarchar(50) NOT NULL,
        [PhoneNumber] nvarchar(15) NOT NULL,
        [Email] nvarchar(200) NULL,
        [Role] nvarchar(50) NOT NULL,
        [Position] nvarchar(100) NULL,
        [LastLoginAt] datetime2 NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [HireDate] datetime2 NULL,
        [TerminationDate] datetime2 NULL,
        [DateOfBirth] datetime2 NULL,
        [Address] nvarchar(200) NULL,
        [EmergencyContactName] nvarchar(100) NULL,
        [EmergencyContactPhone] nvarchar(15) NULL,
        [Notes] nvarchar(500) NULL,
        CONSTRAINT [PK_Staff] PRIMARY KEY ([NurseryId], [StaffId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [StaffClassAssignments] (
        [NurseryId] int NOT NULL,
        [StaffId] int NOT NULL,
        [ClassId] nvarchar(50) NOT NULL,
        [AssignmentRole] nvarchar(50) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [AcademicYear] int NOT NULL,
        [IsActive] bit NOT NULL,
        [AssignedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_StaffClassAssignments] PRIMARY KEY ([NurseryId], [StaffId], [ClassId]),
        CONSTRAINT [CK_StaffClassAssignment_Role] CHECK ([AssignmentRole] IN ('MainTeacher', 'AssistantTeacher'))
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [UserRolePreferences] (
        [Id] int NOT NULL IDENTITY,
        [PhoneNumber] nvarchar(15) NOT NULL,
        [PreferredRole] nvarchar(20) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_UserRolePreferences] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_UserRolePreference_PreferredRole] CHECK ([PreferredRole] IN ('Parent', 'Staff'))
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [Children] (
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [DateOfBirth] datetime2 NOT NULL,
        [Gender] nvarchar(10) NOT NULL,
        [ClassId] nvarchar(50) NULL,
        [ClassNurseryId] int NULL,
        [ClassId1] nvarchar(50) NULL,
        [MedicalNotes] nvarchar(500) NULL,
        [SpecialInstructions] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [GraduationDate] datetime2 NULL,
        [GraduationStatus] nvarchar(20) NULL,
        [WithdrawalReason] nvarchar(200) NULL,
        [BloodType] nvarchar(5) NULL,
        [LastAttendanceDate] datetime2 NULL,
        CONSTRAINT [PK_Children] PRIMARY KEY ([NurseryId], [ChildId]),
        CONSTRAINT [FK_Children_Classes_ClassNurseryId_ClassId1] FOREIGN KEY ([ClassNurseryId], [ClassId1]) REFERENCES [Classes] ([NurseryId], [ClassId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [DailyReportResponses] (
        [Id] int NOT NULL IDENTITY,
        [DailyReportId] int NOT NULL,
        [ParentId] int NOT NULL,
        [ResponseMessage] nvarchar(500) NULL,
        [IsRead] bit NOT NULL,
        [ReadAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_DailyReportResponses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DailyReportResponses_DailyReports_DailyReportId] FOREIGN KEY ([DailyReportId]) REFERENCES [DailyReports] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [PhotoAccesses] (
        [Id] int NOT NULL IDENTITY,
        [PhotoId] int NOT NULL,
        [ParentId] int NOT NULL,
        [AccessType] nvarchar(20) NOT NULL,
        [AccessedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [IpAddress] nvarchar(45) NULL,
        [UserAgent] nvarchar(500) NULL,
        [IsSuccessful] bit NOT NULL DEFAULT CAST(1 AS bit),
        [ErrorMessage] nvarchar(500) NULL,
        CONSTRAINT [PK_PhotoAccesses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PhotoAccesses_Photos_PhotoId] FOREIGN KEY ([PhotoId]) REFERENCES [Photos] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [PhotoChildren] (
        [PhotoId] int NOT NULL,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [IsPrimarySubject] bit NOT NULL,
        [AddedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [AddedByStaffId] int NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_PhotoChildren] PRIMARY KEY ([PhotoId], [NurseryId], [ChildId]),
        CONSTRAINT [FK_PhotoChildren_Photos_PhotoId] FOREIGN KEY ([PhotoId]) REFERENCES [Photos] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [PhotoConsents] (
        [Id] int NOT NULL IDENTITY,
        [PhotoId] int NOT NULL,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [ParentId] int NOT NULL,
        [ConsentStatus] nvarchar(20) NOT NULL DEFAULT N'pending',
        [Notes] nvarchar(500) NULL,
        [RequestedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [RespondedAt] datetime2 NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_PhotoConsents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PhotoConsents_Photos_PhotoId] FOREIGN KEY ([PhotoId]) REFERENCES [Photos] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE TABLE [Events] (
        [Id] int NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [TargetGradeLevel] int NULL,
        [TargetClassId] nvarchar(50) NULL,
        [Title] nvarchar(200) NOT NULL,
        [Description] nvarchar(1000) NULL,
        [Category] nvarchar(50) NOT NULL,
        [StartDateTime] datetime2 NOT NULL,
        [EndDateTime] datetime2 NOT NULL,
        [IsAllDay] bit NOT NULL,
        [RecurrencePattern] nvarchar(20) NOT NULL DEFAULT N'none',
        [TargetAudience] nvarchar(20) NOT NULL DEFAULT N'all',
        [RequiresPreparation] bit NOT NULL,
        [PreparationInstructions] nvarchar(500) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedBy] nvarchar(100) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [LastModified] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [StaffId] int NULL,
        [StaffNurseryId] int NULL,
        CONSTRAINT [PK_Events] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Events_Staff_StaffNurseryId_StaffId] FOREIGN KEY ([StaffNurseryId], [StaffId]) REFERENCES [Staff] ([NurseryId], [StaffId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AbsenceNotificationResponses_AbsenceNotificationId] ON [AbsenceNotificationResponses] ([AbsenceNotificationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AbsenceNotificationResponses_NurseryId_StaffId] ON [AbsenceNotificationResponses] ([NurseryId], [StaffId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AbsenceNotificationResponses_ResponseAt] ON [AbsenceNotificationResponses] ([ResponseAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AbsenceNotifications_Child_Date_Status] ON [AbsenceNotifications] ([NurseryId], [ChildId], [Ymd]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AbsenceNotifications_Parent_Submitted] ON [AbsenceNotifications] ([ParentId], [SubmittedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AbsenceNotifications_Status_Submitted] ON [AbsenceNotifications] ([Status], [SubmittedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_AcademicYears_Nursery_Current] ON [AcademicYears] ([NurseryId], [IsCurrent]) WHERE [IsCurrent] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AcademicYears_Nursery_Year] ON [AcademicYears] ([NurseryId], [Year]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Announcements_Category_Status_Published] ON [Announcements] ([Category], [Status], [PublishedAt]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Announcements_Staff_Status_Created] ON [Announcements] ([NurseryId], [StaffId], [Status], [CreatedAt]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Announcements_Status_Published] ON [Announcements] ([Status], [PublishedAt]) WHERE [Status] = ''published'' AND [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_AttendanceStatistics_Child] ON [AttendanceStatistics] ([NurseryId], [ChildId], [AcademicYear]) WHERE [ChildId] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_AttendanceStatistics_Class] ON [AttendanceStatistics] ([NurseryId], [ClassId], [AcademicYear]) WHERE [ClassId] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AttendanceStatistics_Type] ON [AttendanceStatistics] ([StatisticType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AttendanceStatistics_Year_Month] ON [AttendanceStatistics] ([NurseryId], [AcademicYear], [Month]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_Action] ON [AuditLogs] ([Action]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_EntityType] ON [AuditLogs] ([EntityType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_Nursery_Timestamp] ON [AuditLogs] ([NurseryId], [Timestamp] DESC);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_AuditLogs_UserId] ON [AuditLogs] ([UserId]) WHERE [UserId] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AzureNotificationLogs_DeviceId] ON [AzureNotificationLogs] ([DeviceId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AzureNotificationLogs_NotificationType] ON [AzureNotificationLogs] ([NotificationType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_AzureNotificationLogs_SentAt] ON [AzureNotificationLogs] ([SentAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Children_BirthDate] ON [Children] ([DateOfBirth]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Children_Class_Active] ON [Children] ([ClassId], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Children_ClassNurseryId_ClassId1] ON [Children] ([ClassNurseryId], [ClassId1]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Children_Nursery_Active_Name] ON [Children] ([NurseryId], [IsActive], [Name]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Classes_AgeRange] ON [Classes] ([AgeGroupMin], [AgeGroupMax]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Classes_Capacity] ON [Classes] ([MaxCapacity]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Classes_Nursery_Name] ON [Classes] ([NurseryId], [Name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_DailyReportResponses_DailyReportId] ON [DailyReportResponses] ([DailyReportId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_DailyReportResponses_IsRead] ON [DailyReportResponses] ([IsRead]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_DailyReportResponses_ParentId] ON [DailyReportResponses] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_DailyReports_Category_Date] ON [DailyReports] ([Category], [ReportDate]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_DailyReports_Child_Date_Status] ON [DailyReports] ([NurseryId], [ChildId], [ReportDate], [Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_DailyReports_Date_Status] ON [DailyReports] ([ReportDate], [Status]) WHERE [Status] = ''published''');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_DailyReports_Staff_Created] ON [DailyReports] ([StaffNurseryId], [StaffId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE UNIQUE INDEX [IX_DeviceRegistrations_DeviceId] ON [DeviceRegistrations] ([DeviceId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_DeviceRegistrations_IsActive_LastLoginAt] ON [DeviceRegistrations] ([IsActive], [LastLoginAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_DeviceRegistrations_Platform] ON [DeviceRegistrations] ([Platform]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_DeviceRegistrations_UserId] ON [DeviceRegistrations] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Events_Category] ON [Events] ([Category]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Events_IsActive] ON [Events] ([IsActive]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Events_NurseryId_StartDateTime] ON [Events] ([NurseryId], [StartDateTime]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Events_StaffNurseryId_StaffId] ON [Events] ([StaffNurseryId], [StaffId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Events_TargetAudience] ON [Events] ([TargetAudience]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_FamilyMembers_IsActive] ON [FamilyMembers] ([IsActive]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_FamilyMembers_NurseryId_ChildId] ON [FamilyMembers] ([NurseryId], [ChildId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE UNIQUE INDEX [IX_FamilyMembers_NurseryId_ChildId_ParentId] ON [FamilyMembers] ([NurseryId], [ChildId], [ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_FamilyMembers_ParentId] ON [FamilyMembers] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_NotificationLogs_CreatedAt_Cleanup] ON [NotificationLogs] ([CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_NotificationLogs_Entity_Created] ON [NotificationLogs] ([RelatedEntityType], [RelatedEntityId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_NotificationLogs_Parent_Created] ON [NotificationLogs] ([ParentId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_NotificationLogs_Type_Status_Created] ON [NotificationLogs] ([NotificationType], [Status], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_NotificationSettings_DeviceToken] ON [NotificationSettings] ([DeviceToken]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE UNIQUE INDEX [IX_NotificationSettings_ParentId] ON [NotificationSettings] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_NotificationTemplates_NotificationType] ON [NotificationTemplates] ([NotificationType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE UNIQUE INDEX [IX_NotificationTemplates_NotificationType_Platform] ON [NotificationTemplates] ([NotificationType], [Platform]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_NotificationTemplates_Platform] ON [NotificationTemplates] ([Platform]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Nurseries_Name] ON [Nurseries] ([Name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE UNIQUE INDEX [UK_Nurseries_Email] ON [Nurseries] ([Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE UNIQUE INDEX [UK_Nurseries_PhoneNumber] ON [Nurseries] ([PhoneNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_ParentChild_Child_Active] ON [ParentChildRelationships] ([ChildId], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_ParentChild_Parent_Active] ON [ParentChildRelationships] ([ParentId], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_ParentChild_Primary_Active] ON [ParentChildRelationships] ([IsPrimaryContact], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Parents_Active_Created] ON [Parents] ([IsActive], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Parents_Email] ON [Parents] ([Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Parents_PhoneNumber_Active_Children] ON [Parents] ([PhoneNumber], [IsActive], [Id], [Name], [Email], [LastLoginAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Parents_PhoneNumber_Unique] ON [Parents] ([PhoneNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PhotoAccesses_AccessedAt] ON [PhotoAccesses] ([AccessedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PhotoAccesses_AccessType] ON [PhotoAccesses] ([AccessType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PhotoAccesses_ParentId] ON [PhotoAccesses] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PhotoAccesses_PhotoId] ON [PhotoAccesses] ([PhotoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PhotoChildren_IsPrimarySubject] ON [PhotoChildren] ([IsPrimarySubject]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PhotoChildren_NurseryId_ChildId] ON [PhotoChildren] ([NurseryId], [ChildId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PhotoChildren_PhotoId] ON [PhotoChildren] ([PhotoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PhotoConsents_ConsentStatus] ON [PhotoConsents] ([ConsentStatus]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PhotoConsents_NurseryId_ChildId] ON [PhotoConsents] ([NurseryId], [ChildId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PhotoConsents_ParentId] ON [PhotoConsents] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PhotoConsents_PhotoId] ON [PhotoConsents] ([PhotoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PhotoConsents_PhotoId_NurseryId_ChildId_ParentId] ON [PhotoConsents] ([PhotoId], [NurseryId], [ChildId], [ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Photos_Class_Status_Published] ON [Photos] ([TargetClassId], [Status], [PublishedAt]) WHERE [Status] = ''published'' AND [TargetClassId] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_Photos_Staff_Uploaded] ON [Photos] ([UploadedByStaffNurseryId], [UploadedByStaffId], [UploadedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Photos_Visibility_Status_Published] ON [Photos] ([VisibilityLevel], [Status], [PublishedAt]) WHERE [Status] = ''published''');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PromotionHistory_AcademicYear] ON [PromotionHistories] ([NurseryId], [ToAcademicYear]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PromotionHistory_Child] ON [PromotionHistories] ([NurseryId], [ChildId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_PromotionHistory_PromotedAt] ON [PromotionHistories] ([NurseryId], [PromotedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_ExpiresAt_Cleanup] ON [RefreshTokens] ([ExpiresAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RefreshTokens_JwtId_Unique] ON [RefreshTokens] ([JwtId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_RefreshTokens_Parent_Expires_Revoked] ON [RefreshTokens] ([ParentId], [ExpiresAt], [IsRevoked]) WHERE [IsRevoked] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_ParentId] ON [RefreshTokens] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_RefreshTokens_Staff_Expires_Revoked] ON [RefreshTokens] ([StaffId], [ExpiresAt], [IsRevoked]) WHERE [IsRevoked] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_StaffNurseryId_StaffId] ON [RefreshTokens] ([StaffNurseryId], [StaffId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RefreshTokens_Token_Unique] ON [RefreshTokens] ([Token]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_SmsAuth_CreatedAt_Cleanup] ON [SmsAuthentications] ([CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_SmsAuth_Parent_Created] ON [SmsAuthentications] ([ParentId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_SmsAuth_Phone_Created] ON [SmsAuthentications] ([PhoneNumber], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_SmsAuth_Phone_Parent_Staff] ON [SmsAuthentications] ([PhoneNumber], [ParentId], [StaffId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_SmsAuth_Staff_Created] ON [SmsAuthentications] ([StaffId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_SmsAuthentications_ExpiresAt] ON [SmsAuthentications] ([ExpiresAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_SmsAuthentications_ParentId] ON [SmsAuthentications] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_SmsAuthentications_StaffNurseryId_StaffId] ON [SmsAuthentications] ([StaffNurseryId], [StaffId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Staff_Nursery_Active] ON [Staff] ([NurseryId], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Staff_PhoneNumber_Active] ON [Staff] ([PhoneNumber], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Staff_PhoneNumber_Unique] ON [Staff] ([PhoneNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Staff_Role_Active] ON [Staff] ([Role], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_StaffClassAssignments_Class] ON [StaffClassAssignments] ([NurseryId], [ClassId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_StaffClassAssignments_Class_Role] ON [StaffClassAssignments] ([NurseryId], [ClassId], [AssignmentRole]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_StaffClassAssignments_Staff] ON [StaffClassAssignments] ([NurseryId], [StaffId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE INDEX [IX_UserRolePreferences_PhoneNumber_Updated] ON [UserRolePreferences] ([PhoneNumber], [UpdatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    CREATE UNIQUE INDEX [UQ_UserRolePreferences_PhoneNumber] ON [UserRolePreferences] ([PhoneNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251029111821_AddIsPrimaryToParents'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251029111821_AddIsPrimaryToParents', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251103065635_ExtendNurseryPasswordColumn'
)
BEGIN
    ALTER TABLE [Children] ADD [Furigana] nvarchar(100) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251103065635_ExtendNurseryPasswordColumn'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251103065635_ExtendNurseryPasswordColumn', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [AbsenceNotificationResponses] (
        [Id] int NOT NULL IDENTITY,
        [AbsenceNotificationId] int NOT NULL,
        [NurseryId] int NOT NULL,
        [StaffId] int NOT NULL,
        [ResponseType] nvarchar(20) NOT NULL,
        [ResponseMessage] nvarchar(500) NULL,
        [ResponseAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_AbsenceNotificationResponses] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [AbsenceNotifications] (
        [Id] int NOT NULL IDENTITY,
        [ParentId] int NOT NULL,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [NotificationType] nvarchar(20) NOT NULL,
        [Ymd] datetime2 NOT NULL,
        [ExpectedArrivalTime] time NULL,
        [Reason] nvarchar(50) NOT NULL,
        [AdditionalNotes] nvarchar(200) NULL,
        [SubmittedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [Status] nvarchar(20) NOT NULL DEFAULT N'submitted',
        [StaffResponse] nvarchar(500) NULL,
        [AcknowledgedAt] datetime2 NULL,
        [AcknowledgedBy] int NULL,
        CONSTRAINT [PK_AbsenceNotifications] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [AcademicYears] (
        [Id] int NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [Year] int NOT NULL,
        [StartDate] datetime2 NOT NULL,
        [EndDate] datetime2 NOT NULL,
        [IsCurrent] bit NOT NULL DEFAULT CAST(0 AS bit),
        [IsArchived] bit NOT NULL DEFAULT CAST(0 AS bit),
        [ArchivedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_AcademicYears] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [Announcements] (
        [Id] int NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [StaffId] int NOT NULL,
        [Title] nvarchar(100) NOT NULL,
        [Content] nvarchar(max) NOT NULL,
        [Category] nvarchar(50) NOT NULL,
        [TargetScope] nvarchar(20) NOT NULL,
        [TargetClassId] nvarchar(50) NULL,
        [TargetChildId] int NULL,
        [Attachments] nvarchar(max) NULL,
        [Status] nvarchar(20) NOT NULL DEFAULT N'draft',
        [AllowComments] bit NOT NULL DEFAULT CAST(1 AS bit),
        [PublishedAt] datetime2 NULL,
        [ScheduledAt] datetime2 NULL,
        [ReadCount] int NOT NULL DEFAULT 0,
        [CommentCount] int NOT NULL DEFAULT 0,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedByAdminUser] bit NOT NULL DEFAULT CAST(0 AS bit),
        CONSTRAINT [PK_Announcements] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [AttendanceStatistics] (
        [Id] int NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [ChildId] int NULL,
        [ClassId] nvarchar(50) NULL,
        [AcademicYear] int NOT NULL,
        [Month] int NULL,
        [Date] datetime2 NULL,
        [StatisticType] nvarchar(20) NOT NULL,
        [TotalDays] int NOT NULL DEFAULT 0,
        [PresentDays] int NOT NULL DEFAULT 0,
        [AbsentDays] int NOT NULL DEFAULT 0,
        [TardyDays] int NOT NULL DEFAULT 0,
        [AttendanceRate] DECIMAL(5,2) NOT NULL DEFAULT 0.0,
        [LastCalculatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_AttendanceStatistics] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] bigint NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [UserId] int NULL,
        [UserName] nvarchar(100) NULL,
        [Action] nvarchar(50) NOT NULL,
        [EntityType] nvarchar(50) NOT NULL,
        [EntityId] nvarchar(50) NULL,
        [BeforeValue] NVARCHAR(MAX) NULL,
        [AfterValue] NVARCHAR(MAX) NULL,
        [IpAddress] nvarchar(45) NULL,
        [UserAgent] nvarchar(500) NULL,
        [Timestamp] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [AzureNotificationLogs] (
        [Id] int NOT NULL IDENTITY,
        [DeviceId] nvarchar(255) NOT NULL,
        [NotificationType] nvarchar(50) NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [Body] nvarchar(1000) NOT NULL,
        [JsonPayload] NVARCHAR(MAX) NULL,
        [Platform] nvarchar(20) NOT NULL,
        [NotificationState] nvarchar(50) NULL,
        [SentAt] datetime2 NULL,
        [ScheduledAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_AzureNotificationLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [Children] (
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Furigana] nvarchar(100) NULL,
        [DateOfBirth] datetime2 NOT NULL,
        [Gender] nvarchar(10) NOT NULL,
        [ClassId] nvarchar(50) NULL,
        [MedicalNotes] nvarchar(500) NULL,
        [SpecialInstructions] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [GraduationDate] datetime2 NULL,
        [GraduationStatus] nvarchar(20) NULL,
        [WithdrawalReason] nvarchar(200) NULL,
        [BloodType] nvarchar(5) NULL,
        [LastAttendanceDate] datetime2 NULL,
        CONSTRAINT [PK_Children] PRIMARY KEY ([NurseryId], [ChildId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [Classes] (
        [NurseryId] int NOT NULL,
        [ClassId] nvarchar(50) NOT NULL,
        [Name] nvarchar(50) NOT NULL,
        [AgeGroupMin] int NOT NULL,
        [AgeGroupMax] int NOT NULL,
        [MaxCapacity] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [AcademicYear] int NOT NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_Classes] PRIMARY KEY ([NurseryId], [ClassId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [DailyAttendances] (
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [AttendanceDate] datetime2 NOT NULL,
        [Status] nvarchar(20) NOT NULL DEFAULT N'blank',
        [ArrivalTime] TIME NULL,
        [Notes] nvarchar(500) NULL,
        [AbsenceNotificationId] int NULL,
        [RecordedByStaffId] int NULL,
        [RecordedByStaffNurseryId] int NULL,
        [RecordedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedByStaffId] int NULL,
        [UpdatedByStaffNurseryId] int NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_DailyAttendances] PRIMARY KEY ([NurseryId], [ChildId], [AttendanceDate])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [DailyReports] (
        [Id] int NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [StaffNurseryId] int NOT NULL,
        [StaffId] int NOT NULL,
        [ReportDate] date NOT NULL,
        [ReportKind] nvarchar(50) NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [Content] nvarchar(1000) NOT NULL,
        [Photos] nvarchar(1000) NULL,
        [Status] nvarchar(20) NOT NULL DEFAULT N'draft',
        [PublishedAt] datetime2 NULL,
        [ParentAcknowledged] bit NOT NULL,
        [AcknowledgedAt] datetime2 NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [CreatedByAdminUser] bit NOT NULL,
        CONSTRAINT [PK_DailyReports] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [DeviceRegistrations] (
        [Id] int NOT NULL IDENTITY,
        [DeviceId] nvarchar(255) NOT NULL,
        [UserId] int NOT NULL,
        [UserType] nvarchar(20) NOT NULL,
        [Platform] nvarchar(20) NOT NULL,
        [IsAndroid] bit NOT NULL,
        [PushToken] nvarchar(1000) NULL,
        [RegistrationId] nvarchar(500) NULL,
        [DeviceInfo] nvarchar(1000) NULL,
        [AppVersion] nvarchar(50) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [LastLoginAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_DeviceRegistrations] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [Events] (
        [Id] int NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [TargetGradeLevel] int NULL,
        [TargetClassId] nvarchar(50) NULL,
        [Title] nvarchar(200) NOT NULL,
        [Description] nvarchar(1000) NULL,
        [Category] nvarchar(50) NOT NULL,
        [StartDateTime] datetime2 NOT NULL,
        [EndDateTime] datetime2 NOT NULL,
        [IsAllDay] bit NOT NULL DEFAULT CAST(0 AS bit),
        [RecurrencePattern] nvarchar(20) NOT NULL DEFAULT N'none',
        [TargetAudience] nvarchar(20) NOT NULL DEFAULT N'all',
        [RequiresPreparation] bit NOT NULL DEFAULT CAST(0 AS bit),
        [PreparationInstructions] nvarchar(500) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedBy] nvarchar(100) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [LastModified] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_Events] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [FamilyMembers] (
        [Id] int NOT NULL IDENTITY,
        [ParentId] int NOT NULL,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [RelationshipType] nvarchar(20) NOT NULL,
        [DisplayName] nvarchar(100) NULL,
        [IsPrimaryContact] bit NOT NULL,
        [CanReceiveNotifications] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CanViewReports] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CanViewPhotos] bit NOT NULL DEFAULT CAST(1 AS bit),
        [HasPickupPermission] bit NOT NULL,
        [JoinedAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [UpdatedAt] datetime2 NULL,
        [InvitedByParentId] int NULL,
        CONSTRAINT [PK_FamilyMembers] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [NotificationLogs] (
        [Id] int NOT NULL IDENTITY,
        [ParentId] int NOT NULL,
        [NotificationType] nvarchar(50) NOT NULL,
        [DeliveryMethod] nvarchar(50) NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [Content] nvarchar(1000) NOT NULL,
        [Status] nvarchar(50) NOT NULL DEFAULT N'pending',
        [ErrorMessage] nvarchar(500) NULL,
        [RelatedEntityId] int NULL,
        [RelatedEntityType] nvarchar(50) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [SentAt] datetime2 NULL,
        [DeliveredAt] datetime2 NULL,
        [ReadAt] datetime2 NULL,
        [RetryCount] int NOT NULL,
        [NextRetryAt] datetime2 NULL,
        CONSTRAINT [PK_NotificationLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [NotificationSettings] (
        [Id] int NOT NULL IDENTITY,
        [ParentId] int NOT NULL,
        [PushNotificationsEnabled] bit NOT NULL DEFAULT CAST(1 AS bit),
        [AbsenceConfirmationEnabled] bit NOT NULL DEFAULT CAST(1 AS bit),
        [DailyReportEnabled] bit NOT NULL DEFAULT CAST(1 AS bit),
        [EventNotificationEnabled] bit NOT NULL DEFAULT CAST(1 AS bit),
        [AnnouncementEnabled] bit NOT NULL DEFAULT CAST(1 AS bit),
        [SmsNotificationsEnabled] bit NOT NULL DEFAULT CAST(0 AS bit),
        [EmailNotificationsEnabled] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeviceToken] nvarchar(500) NULL,
        [DevicePlatform] nvarchar(50) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_NotificationSettings] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [NotificationTemplates] (
        [Id] int NOT NULL IDENTITY,
        [NotificationType] nvarchar(50) NOT NULL,
        [Platform] nvarchar(20) NOT NULL,
        [TemplateJson] NVARCHAR(MAX) NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_NotificationTemplates] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [Nurseries] (
        [Id] int NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Address] nvarchar(500) NOT NULL,
        [PhoneNumber] nvarchar(20) NOT NULL,
        [Email] nvarchar(255) NOT NULL,
        [PrincipalName] nvarchar(100) NOT NULL,
        [EstablishedDate] datetime2 NOT NULL,
        [LogoUrl] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [LoginId] nvarchar(50) NULL,
        [Password] nvarchar(255) NULL,
        [LastLoginAt] datetime2 NULL,
        [LoginAttempts] int NOT NULL,
        [IsLocked] bit NOT NULL,
        [LockedUntil] datetime2 NULL,
        [CurrentAcademicYear] int NOT NULL,
        CONSTRAINT [PK_Nurseries] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [ParentChildRelationships] (
        [ParentId] int NOT NULL,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [RelationshipType] nvarchar(20) NOT NULL,
        [IsPrimaryContact] bit NOT NULL,
        [HasPickupPermission] bit NOT NULL,
        [CanReceiveEmergencyNotifications] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_ParentChildRelationships] PRIMARY KEY ([ParentId], [NurseryId], [ChildId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [Parents] (
        [Id] int NOT NULL IDENTITY,
        [PhoneNumber] nvarchar(15) NOT NULL,
        [Name] nvarchar(100) NULL,
        [Email] nvarchar(200) NULL,
        [Address] nvarchar(200) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [LastLoginAt] datetime2 NULL,
        [PushNotificationsEnabled] bit NOT NULL,
        [AbsenceConfirmationEnabled] bit NOT NULL,
        [DailyReportEnabled] bit NOT NULL,
        [EventNotificationEnabled] bit NOT NULL,
        [AnnouncementEnabled] bit NOT NULL,
        [FontSize] nvarchar(10) NOT NULL,
        [Language] nvarchar(10) NOT NULL,
        [IsPrimary] bit NOT NULL,
        CONSTRAINT [PK_Parents] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [Photos] (
        [Id] int NOT NULL IDENTITY,
        [FileName] nvarchar(255) NOT NULL,
        [FilePath] nvarchar(500) NOT NULL,
        [ThumbnailPath] nvarchar(500) NOT NULL,
        [OriginalFileName] nvarchar(255) NULL,
        [FileSize] bigint NOT NULL,
        [MimeType] nvarchar(100) NOT NULL,
        [Width] int NOT NULL,
        [Height] int NOT NULL,
        [Description] nvarchar(500) NULL,
        [UploadedByStaffNurseryId] int NOT NULL,
        [UploadedByStaffId] int NOT NULL,
        [UploadedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [PublishedAt] datetime2 NOT NULL,
        [VisibilityLevel] nvarchar(20) NOT NULL DEFAULT N'class',
        [TargetClassId] nvarchar(50) NULL,
        [Status] nvarchar(20) NOT NULL DEFAULT N'draft',
        [RequiresConsent] bit NOT NULL DEFAULT CAST(1 AS bit),
        [ViewCount] int NOT NULL DEFAULT 0,
        [DownloadCount] int NOT NULL DEFAULT 0,
        [IsActive] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        [UpdatedAt] datetime2 NULL,
        [UploadedByAdminUser] bit NOT NULL,
        [IsReportCreate] bit NOT NULL,
        CONSTRAINT [PK_Photos] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [PromotionHistories] (
        [Id] int NOT NULL IDENTITY,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [FromAcademicYear] int NOT NULL,
        [ToAcademicYear] int NOT NULL,
        [FromClassId] nvarchar(50) NOT NULL,
        [ToClassId] nvarchar(50) NOT NULL,
        [PromotedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [PromotedByUserId] int NULL,
        [Notes] nvarchar(200) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_PromotionHistories] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id] int NOT NULL IDENTITY,
        [ParentId] int NULL,
        [Token] nvarchar(500) NOT NULL,
        [JwtId] nvarchar(500) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [ExpiresAt] datetime2 NOT NULL,
        [IsRevoked] bit NOT NULL DEFAULT CAST(0 AS bit),
        [RevokedAt] datetime2 NULL,
        [ClientIpAddress] nvarchar(45) NULL,
        [UserAgent] nvarchar(500) NULL,
        [StaffNurseryId] int NULL,
        [StaffId] int NULL,
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [SmsAuthentications] (
        [Id] int NOT NULL IDENTITY,
        [PhoneNumber] nvarchar(15) NOT NULL,
        [Code] nvarchar(6) NOT NULL,
        [HashedCode] nvarchar(100) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [ExpiresAt] datetime2 NOT NULL,
        [IsUsed] bit NOT NULL DEFAULT CAST(0 AS bit),
        [UsedAt] datetime2 NULL,
        [AttemptCount] int NOT NULL DEFAULT 0,
        [ClientIpAddress] nvarchar(45) NULL,
        [UserAgent] nvarchar(500) NULL,
        [ParentId] int NULL,
        [StaffNurseryId] int NULL,
        [StaffId] int NULL,
        CONSTRAINT [PK_SmsAuthentications] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [Staff] (
        [NurseryId] int NOT NULL,
        [StaffId] int NOT NULL,
        [Name] nvarchar(50) NOT NULL,
        [PhoneNumber] nvarchar(15) NOT NULL,
        [Email] nvarchar(200) NULL,
        [Role] nvarchar(50) NOT NULL,
        [Position] nvarchar(100) NULL,
        [LastLoginAt] datetime2 NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [ResignationDate] datetime2 NULL,
        [Remark] nvarchar(500) NULL,
        CONSTRAINT [PK_Staff] PRIMARY KEY ([NurseryId], [StaffId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [StaffClassAssignments] (
        [NurseryId] int NOT NULL,
        [StaffId] int NOT NULL,
        [ClassId] nvarchar(50) NOT NULL,
        [AssignmentRole] nvarchar(50) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        [AcademicYear] int NOT NULL,
        [IsActive] bit NOT NULL,
        [AssignedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_StaffClassAssignments] PRIMARY KEY ([NurseryId], [StaffId], [ClassId]),
        CONSTRAINT [CK_StaffClassAssignment_Role] CHECK ([AssignmentRole] IN ('MainTeacher', 'AssistantTeacher'))
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [UserRolePreferences] (
        [Id] int NOT NULL IDENTITY,
        [PhoneNumber] nvarchar(15) NOT NULL,
        [PreferredRole] nvarchar(20) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_UserRolePreferences] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_UserRolePreference_PreferredRole] CHECK ([PreferredRole] IN ('Parent', 'Staff'))
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [DailyReportResponses] (
        [Id] int NOT NULL IDENTITY,
        [DailyReportId] int NOT NULL,
        [ParentId] int NOT NULL,
        [ResponseMessage] nvarchar(500) NULL,
        [IsRead] bit NOT NULL,
        [ReadAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_DailyReportResponses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DailyReportResponses_DailyReports_DailyReportId] FOREIGN KEY ([DailyReportId]) REFERENCES [DailyReports] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [PhotoAccesses] (
        [Id] int NOT NULL IDENTITY,
        [PhotoId] int NOT NULL,
        [ParentId] int NOT NULL,
        [AccessType] nvarchar(20) NOT NULL,
        [AccessedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [IpAddress] nvarchar(45) NULL,
        [UserAgent] nvarchar(500) NULL,
        [IsSuccessful] bit NOT NULL DEFAULT CAST(1 AS bit),
        [ErrorMessage] nvarchar(500) NULL,
        CONSTRAINT [PK_PhotoAccesses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PhotoAccesses_Photos_PhotoId] FOREIGN KEY ([PhotoId]) REFERENCES [Photos] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [PhotoChildren] (
        [PhotoId] int NOT NULL,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [IsPrimarySubject] bit NOT NULL,
        [AddedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [AddedByStaffId] int NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_PhotoChildren] PRIMARY KEY ([PhotoId], [NurseryId], [ChildId]),
        CONSTRAINT [FK_PhotoChildren_Photos_PhotoId] FOREIGN KEY ([PhotoId]) REFERENCES [Photos] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE TABLE [PhotoConsents] (
        [Id] int NOT NULL IDENTITY,
        [PhotoId] int NOT NULL,
        [NurseryId] int NOT NULL,
        [ChildId] int NOT NULL,
        [ParentId] int NOT NULL,
        [ConsentStatus] nvarchar(20) NOT NULL DEFAULT N'pending',
        [Notes] nvarchar(500) NULL,
        [RequestedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [RespondedAt] datetime2 NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_PhotoConsents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PhotoConsents_Photos_PhotoId] FOREIGN KEY ([PhotoId]) REFERENCES [Photos] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AbsenceNotificationResponses_AbsenceNotificationId] ON [AbsenceNotificationResponses] ([AbsenceNotificationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AbsenceNotificationResponses_NurseryId_StaffId] ON [AbsenceNotificationResponses] ([NurseryId], [StaffId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AbsenceNotificationResponses_ResponseAt] ON [AbsenceNotificationResponses] ([ResponseAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AbsenceNotifications_Child_Date_Status] ON [AbsenceNotifications] ([NurseryId], [ChildId], [Ymd]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AbsenceNotifications_Parent_Submitted] ON [AbsenceNotifications] ([ParentId], [SubmittedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AbsenceNotifications_Status_Submitted] ON [AbsenceNotifications] ([Status], [SubmittedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_AcademicYears_Nursery_Current] ON [AcademicYears] ([NurseryId], [IsCurrent]) WHERE [IsCurrent] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AcademicYears_Nursery_Year] ON [AcademicYears] ([NurseryId], [Year]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Announcements_Category_Status_Published] ON [Announcements] ([Category], [Status], [PublishedAt]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Announcements_Staff_Status_Created] ON [Announcements] ([NurseryId], [StaffId], [Status], [CreatedAt]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Announcements_Status_Published] ON [Announcements] ([Status], [PublishedAt]) WHERE [Status] = ''published'' AND [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_AttendanceStatistics_Child] ON [AttendanceStatistics] ([NurseryId], [ChildId], [AcademicYear]) WHERE [ChildId] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_AttendanceStatistics_Class] ON [AttendanceStatistics] ([NurseryId], [ClassId], [AcademicYear]) WHERE [ClassId] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AttendanceStatistics_Type] ON [AttendanceStatistics] ([StatisticType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AttendanceStatistics_Year_Month] ON [AttendanceStatistics] ([NurseryId], [AcademicYear], [Month]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_Action] ON [AuditLogs] ([Action]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_EntityType] ON [AuditLogs] ([EntityType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_Nursery_Timestamp] ON [AuditLogs] ([NurseryId], [Timestamp] DESC);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_AuditLogs_UserId] ON [AuditLogs] ([UserId]) WHERE [UserId] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AzureNotificationLogs_DeviceId] ON [AzureNotificationLogs] ([DeviceId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AzureNotificationLogs_NotificationType] ON [AzureNotificationLogs] ([NotificationType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_AzureNotificationLogs_SentAt] ON [AzureNotificationLogs] ([SentAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_Children_BirthDate] ON [Children] ([DateOfBirth]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Children_Class_Active] ON [Children] ([ClassId], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Children_Nursery_Active_Name] ON [Children] ([NurseryId], [IsActive], [Name]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_Classes_AgeRange] ON [Classes] ([AgeGroupMin], [AgeGroupMax]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_Classes_Capacity] ON [Classes] ([MaxCapacity]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_Classes_Nursery_Name] ON [Classes] ([NurseryId], [Name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_DailyAttendances_AbsenceNotification] ON [DailyAttendances] ([AbsenceNotificationId]) WHERE [AbsenceNotificationId] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_DailyAttendances_Child_Date] ON [DailyAttendances] ([NurseryId], [ChildId], [AttendanceDate] DESC);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_DailyAttendances_Date_Status] ON [DailyAttendances] ([NurseryId], [AttendanceDate], [Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_DailyAttendances_IsActive] ON [DailyAttendances] ([NurseryId], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_DailyReportResponses_DailyReportId] ON [DailyReportResponses] ([DailyReportId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_DailyReportResponses_IsRead] ON [DailyReportResponses] ([IsRead]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_DailyReportResponses_ParentId] ON [DailyReportResponses] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_DailyReports_Child_Date_Status] ON [DailyReports] ([NurseryId], [ChildId], [ReportDate], [Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_DailyReports_Date_Status] ON [DailyReports] ([ReportDate], [Status]) WHERE [Status] = ''published''');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_DailyReports_ReportKind_Date] ON [DailyReports] ([ReportKind], [ReportDate]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_DailyReports_Staff_Created] ON [DailyReports] ([StaffNurseryId], [StaffId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE UNIQUE INDEX [IX_DeviceRegistrations_DeviceId] ON [DeviceRegistrations] ([DeviceId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_DeviceRegistrations_IsActive_LastLoginAt] ON [DeviceRegistrations] ([IsActive], [LastLoginAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_DeviceRegistrations_Platform] ON [DeviceRegistrations] ([Platform]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_DeviceRegistrations_UserId] ON [DeviceRegistrations] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_Events_Category] ON [Events] ([Category]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_Events_IsActive] ON [Events] ([IsActive]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_Events_NurseryId_StartDateTime] ON [Events] ([NurseryId], [StartDateTime]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_Events_TargetAudience] ON [Events] ([TargetAudience]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_FamilyMembers_IsActive] ON [FamilyMembers] ([IsActive]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_FamilyMembers_NurseryId_ChildId] ON [FamilyMembers] ([NurseryId], [ChildId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE UNIQUE INDEX [IX_FamilyMembers_NurseryId_ChildId_ParentId] ON [FamilyMembers] ([NurseryId], [ChildId], [ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_FamilyMembers_ParentId] ON [FamilyMembers] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_NotificationLogs_CreatedAt_Cleanup] ON [NotificationLogs] ([CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_NotificationLogs_Entity_Created] ON [NotificationLogs] ([RelatedEntityType], [RelatedEntityId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_NotificationLogs_Parent_Created] ON [NotificationLogs] ([ParentId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_NotificationLogs_Type_Status_Created] ON [NotificationLogs] ([NotificationType], [Status], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_NotificationSettings_DeviceToken] ON [NotificationSettings] ([DeviceToken]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE UNIQUE INDEX [IX_NotificationSettings_ParentId] ON [NotificationSettings] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_NotificationTemplates_NotificationType] ON [NotificationTemplates] ([NotificationType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE UNIQUE INDEX [IX_NotificationTemplates_NotificationType_Platform] ON [NotificationTemplates] ([NotificationType], [Platform]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_NotificationTemplates_Platform] ON [NotificationTemplates] ([Platform]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_Nurseries_Name] ON [Nurseries] ([Name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE UNIQUE INDEX [UK_Nurseries_Email] ON [Nurseries] ([Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE UNIQUE INDEX [UK_Nurseries_PhoneNumber] ON [Nurseries] ([PhoneNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_ParentChild_Child_Active] ON [ParentChildRelationships] ([ChildId], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_ParentChild_Parent_Active] ON [ParentChildRelationships] ([ParentId], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_ParentChild_Primary_Active] ON [ParentChildRelationships] ([IsPrimaryContact], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_Parents_Active_Created] ON [Parents] ([IsActive], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_Parents_Email] ON [Parents] ([Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_Parents_PhoneNumber_Active_Children] ON [Parents] ([PhoneNumber], [IsActive], [Id], [Name], [Email], [LastLoginAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Parents_PhoneNumber_Unique] ON [Parents] ([PhoneNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PhotoAccesses_AccessedAt] ON [PhotoAccesses] ([AccessedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PhotoAccesses_AccessType] ON [PhotoAccesses] ([AccessType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PhotoAccesses_ParentId] ON [PhotoAccesses] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PhotoAccesses_PhotoId] ON [PhotoAccesses] ([PhotoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PhotoChildren_IsPrimarySubject] ON [PhotoChildren] ([IsPrimarySubject]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PhotoChildren_NurseryId_ChildId] ON [PhotoChildren] ([NurseryId], [ChildId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PhotoChildren_PhotoId] ON [PhotoChildren] ([PhotoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PhotoConsents_ConsentStatus] ON [PhotoConsents] ([ConsentStatus]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PhotoConsents_NurseryId_ChildId] ON [PhotoConsents] ([NurseryId], [ChildId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PhotoConsents_ParentId] ON [PhotoConsents] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PhotoConsents_PhotoId] ON [PhotoConsents] ([PhotoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PhotoConsents_PhotoId_NurseryId_ChildId_ParentId] ON [PhotoConsents] ([PhotoId], [NurseryId], [ChildId], [ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Photos_Class_Status_Published] ON [Photos] ([TargetClassId], [Status], [PublishedAt]) WHERE [Status] = ''published'' AND [TargetClassId] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_Photos_Staff_Uploaded] ON [Photos] ([UploadedByStaffNurseryId], [UploadedByStaffId], [UploadedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Photos_Visibility_Status_Published] ON [Photos] ([VisibilityLevel], [Status], [PublishedAt]) WHERE [Status] = ''published''');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PromotionHistory_AcademicYear] ON [PromotionHistories] ([NurseryId], [ToAcademicYear]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PromotionHistory_Child] ON [PromotionHistories] ([NurseryId], [ChildId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_PromotionHistory_PromotedAt] ON [PromotionHistories] ([NurseryId], [PromotedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_ExpiresAt_Cleanup] ON [RefreshTokens] ([ExpiresAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RefreshTokens_JwtId_Unique] ON [RefreshTokens] ([JwtId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_RefreshTokens_Parent_Expires_Revoked] ON [RefreshTokens] ([ParentId], [ExpiresAt], [IsRevoked]) WHERE [IsRevoked] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_ParentId] ON [RefreshTokens] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_RefreshTokens_Staff_Expires_Revoked] ON [RefreshTokens] ([StaffId], [ExpiresAt], [IsRevoked]) WHERE [IsRevoked] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_StaffNurseryId_StaffId] ON [RefreshTokens] ([StaffNurseryId], [StaffId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RefreshTokens_Token_Unique] ON [RefreshTokens] ([Token]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_SmsAuth_CreatedAt_Cleanup] ON [SmsAuthentications] ([CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_SmsAuth_Parent_Created] ON [SmsAuthentications] ([ParentId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_SmsAuth_Phone_Created] ON [SmsAuthentications] ([PhoneNumber], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_SmsAuth_Phone_Parent_Staff] ON [SmsAuthentications] ([PhoneNumber], [ParentId], [StaffId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_SmsAuth_Staff_Created] ON [SmsAuthentications] ([StaffId], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_SmsAuthentications_ExpiresAt] ON [SmsAuthentications] ([ExpiresAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_SmsAuthentications_ParentId] ON [SmsAuthentications] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_SmsAuthentications_StaffNurseryId_StaffId] ON [SmsAuthentications] ([StaffNurseryId], [StaffId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Staff_Nursery_Active] ON [Staff] ([NurseryId], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Staff_PhoneNumber_Active] ON [Staff] ([PhoneNumber], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Staff_PhoneNumber_Unique] ON [Staff] ([PhoneNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Staff_Role_Active] ON [Staff] ([Role], [IsActive]) WHERE [IsActive] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_StaffClassAssignments_Class] ON [StaffClassAssignments] ([NurseryId], [ClassId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_StaffClassAssignments_Class_Role] ON [StaffClassAssignments] ([NurseryId], [ClassId], [AssignmentRole]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_StaffClassAssignments_Staff] ON [StaffClassAssignments] ([NurseryId], [StaffId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE INDEX [IX_UserRolePreferences_PhoneNumber_Updated] ON [UserRolePreferences] ([PhoneNumber], [UpdatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    CREATE UNIQUE INDEX [UQ_UserRolePreferences_PhoneNumber] ON [UserRolePreferences] ([PhoneNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051513_FixEventStaffRelationship'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251120051513_FixEventStaffRelationship', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051831_AddEventDefaultConstraints'
)
BEGIN

                    -- IsAllDayカラムのデフォルト値制約を追加
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.default_constraints
                        WHERE parent_object_id = OBJECT_ID('Events')
                        AND COL_NAME(parent_object_id, parent_column_id) = 'IsAllDay'
                    )
                    BEGIN
                        ALTER TABLE Events ADD CONSTRAINT DF_Events_IsAllDay DEFAULT 0 FOR IsAllDay;
                    END

                    -- RecurrencePatternカラムのデフォルト値制約を追加
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.default_constraints
                        WHERE parent_object_id = OBJECT_ID('Events')
                        AND COL_NAME(parent_object_id, parent_column_id) = 'RecurrencePattern'
                    )
                    BEGIN
                        ALTER TABLE Events ADD CONSTRAINT DF_Events_RecurrencePattern DEFAULT 'none' FOR RecurrencePattern;
                    END

                    -- TargetAudienceカラムのデフォルト値制約を追加
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.default_constraints
                        WHERE parent_object_id = OBJECT_ID('Events')
                        AND COL_NAME(parent_object_id, parent_column_id) = 'TargetAudience'
                    )
                    BEGIN
                        ALTER TABLE Events ADD CONSTRAINT DF_Events_TargetAudience DEFAULT 'all' FOR TargetAudience;
                    END

                    -- RequiresPreparationカラムのデフォルト値制約を追加
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.default_constraints
                        WHERE parent_object_id = OBJECT_ID('Events')
                        AND COL_NAME(parent_object_id, parent_column_id) = 'RequiresPreparation'
                    )
                    BEGIN
                        ALTER TABLE Events ADD CONSTRAINT DF_Events_RequiresPreparation DEFAULT 0 FOR RequiresPreparation;
                    END

                    -- IsActiveカラムのデフォルト値制約を追加
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.default_constraints
                        WHERE parent_object_id = OBJECT_ID('Events')
                        AND COL_NAME(parent_object_id, parent_column_id) = 'IsActive'
                    )
                    BEGIN
                        ALTER TABLE Events ADD CONSTRAINT DF_Events_IsActive DEFAULT 1 FOR IsActive;
                    END

                    -- CreatedAtカラムのデフォルト値制約を追加
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.default_constraints
                        WHERE parent_object_id = OBJECT_ID('Events')
                        AND COL_NAME(parent_object_id, parent_column_id) = 'CreatedAt'
                    )
                    BEGIN
                        ALTER TABLE Events ADD CONSTRAINT DF_Events_CreatedAt DEFAULT GETUTCDATE() FOR CreatedAt;
                    END

                    -- LastModifiedカラムのデフォルト値制約を追加
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.default_constraints
                        WHERE parent_object_id = OBJECT_ID('Events')
                        AND COL_NAME(parent_object_id, parent_column_id) = 'LastModified'
                    )
                    BEGIN
                        ALTER TABLE Events ADD CONSTRAINT DF_Events_LastModified DEFAULT GETUTCDATE() FOR LastModified;
                    END
                
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120051831_AddEventDefaultConstraints'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251120051831_AddEventDefaultConstraints', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120060526_RemoveClassAcademicYear'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Classes]') AND [c].[name] = N'AcademicYear');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Classes] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [Classes] DROP COLUMN [AcademicYear];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120060526_RemoveClassAcademicYear'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251120060526_RemoveClassAcademicYear', N'8.0.10');
END;
GO

COMMIT;
GO

