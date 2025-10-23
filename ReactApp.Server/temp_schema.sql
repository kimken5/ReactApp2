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
GO


CREATE TABLE [AbsenceNotifications] (
    [Id] int NOT NULL IDENTITY,
    [ParentId] int NOT NULL,
    [NurseryId] int NOT NULL,
    [ChildId] int NOT NULL,
    [NotificationType] nvarchar(20) NOT NULL,
    [StartDate] datetime2 NOT NULL,
    [EndDate] datetime2 NULL,
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
GO


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
    CONSTRAINT [PK_Announcements] PRIMARY KEY ([Id])
);
GO


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
GO


CREATE TABLE [Classes] (
    [NurseryId] int NOT NULL,
    [ClassId] nvarchar(50) NOT NULL,
    [Name] nvarchar(50) NOT NULL,
    [AgeGroupMin] int NOT NULL,
    [AgeGroupMax] int NOT NULL,
    [MaxCapacity] int NOT NULL,
    [GradeLevel] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Classes] PRIMARY KEY ([NurseryId], [ClassId])
);
GO


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
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_DailyReports] PRIMARY KEY ([Id])
);
GO


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
GO


CREATE TABLE [FamilyInvitations] (
    [Id] int NOT NULL IDENTITY,
    [InviterParentId] int NOT NULL,
    [InvitedByParentId] int NOT NULL,
    [ChildId] int NOT NULL,
    [NurseryId] int NOT NULL,
    [InviteePhoneNumber] nvarchar(15) NOT NULL,
    [InviteeName] nvarchar(100) NOT NULL,
    [RelationshipType] nvarchar(20) NOT NULL,
    [InvitationCode] nvarchar(50) NOT NULL,
    [Status] nvarchar(20) NOT NULL DEFAULT N'pending',
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [ExpiresAt] datetime2 NOT NULL,
    [AcceptedAt] datetime2 NULL,
    [AcceptedByParentId] int NULL,
    [IsActive] bit NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_FamilyInvitations] PRIMARY KEY ([Id])
);
GO


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
GO


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
GO


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
GO


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
GO


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
    CONSTRAINT [PK_Nurseries] PRIMARY KEY ([Id])
);
GO


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
GO


CREATE TABLE [Parents] (
    [Id] int NOT NULL,
    [PhoneNumber] nvarchar(15) NOT NULL,
    [Name] nvarchar(100) NULL,
    [Email] nvarchar(200) NULL,
    [Address] nvarchar(200) NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UpdatedAt] datetime2 NULL,
    [LastLoginAt] datetime2 NULL,
    CONSTRAINT [PK_Parents] PRIMARY KEY ([Id])
);
GO


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
    CONSTRAINT [PK_Photos] PRIMARY KEY ([Id])
);
GO


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
GO


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
GO


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
    CONSTRAINT [PK_Staff] PRIMARY KEY ([NurseryId], [StaffId])
);
GO


CREATE TABLE [StaffClassAssignments] (
    [NurseryId] int NOT NULL,
    [StaffId] int NOT NULL,
    [ClassId] nvarchar(50) NOT NULL,
    [AssignmentRole] nvarchar(50) NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_StaffClassAssignments] PRIMARY KEY ([NurseryId], [StaffId], [ClassId]),
    CONSTRAINT [CK_StaffClassAssignment_Role] CHECK ([AssignmentRole] IN ('MainTeacher', 'AssistantTeacher'))
);
GO


CREATE TABLE [UserRolePreferences] (
    [Id] int NOT NULL IDENTITY,
    [PhoneNumber] nvarchar(15) NOT NULL,
    [PreferredRole] nvarchar(20) NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_UserRolePreferences] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_UserRolePreference_PreferredRole] CHECK ([PreferredRole] IN ('Parent', 'Staff'))
);
GO


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
    CONSTRAINT [PK_Children] PRIMARY KEY ([NurseryId], [ChildId]),
    CONSTRAINT [FK_Children_Classes_ClassNurseryId_ClassId1] FOREIGN KEY ([ClassNurseryId], [ClassId1]) REFERENCES [Classes] ([NurseryId], [ClassId])
);
GO


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
GO


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
GO


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
GO


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
GO


CREATE TABLE [Events] (
    [Id] int NOT NULL IDENTITY,
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
    [CreatedBy] nvarchar(100) NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [LastModified] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [NurseryId] int NOT NULL,
    [TargetClassId] int NULL,
    [TargetGradeLevel] int NULL,
    [TargetChildId] int NULL,
    [StaffId] int NULL,
    [StaffNurseryId] int NULL,
    CONSTRAINT [PK_Events] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Events_Staff_StaffNurseryId_StaffId] FOREIGN KEY ([StaffNurseryId], [StaffId]) REFERENCES [Staff] ([NurseryId], [StaffId])
);
GO


CREATE INDEX [IX_AbsenceNotificationResponses_AbsenceNotificationId] ON [AbsenceNotificationResponses] ([AbsenceNotificationId]);
GO


CREATE INDEX [IX_AbsenceNotificationResponses_NurseryId_StaffId] ON [AbsenceNotificationResponses] ([NurseryId], [StaffId]);
GO


CREATE INDEX [IX_AbsenceNotificationResponses_ResponseAt] ON [AbsenceNotificationResponses] ([ResponseAt]);
GO


CREATE INDEX [IX_AbsenceNotifications_Child_Date_Status] ON [AbsenceNotifications] ([NurseryId], [ChildId], [StartDate], [Status]);
GO


CREATE INDEX [IX_AbsenceNotifications_DateRange] ON [AbsenceNotifications] ([StartDate], [EndDate]);
GO


CREATE INDEX [IX_AbsenceNotifications_Parent_Submitted] ON [AbsenceNotifications] ([ParentId], [SubmittedAt]);
GO


CREATE INDEX [IX_AbsenceNotifications_Status_Submitted] ON [AbsenceNotifications] ([Status], [SubmittedAt]);
GO


CREATE INDEX [IX_Announcements_Category_Status_Published] ON [Announcements] ([Category], [Status], [PublishedAt]) WHERE [IsActive] = 1;
GO


CREATE INDEX [IX_Announcements_Staff_Status_Created] ON [Announcements] ([NurseryId], [StaffId], [Status], [CreatedAt]) WHERE [IsActive] = 1;
GO


CREATE INDEX [IX_Announcements_Status_Published] ON [Announcements] ([Status], [PublishedAt]) WHERE [Status] = 'published' AND [IsActive] = 1;
GO


CREATE INDEX [IX_AzureNotificationLogs_DeviceId] ON [AzureNotificationLogs] ([DeviceId]);
GO


CREATE INDEX [IX_AzureNotificationLogs_NotificationType] ON [AzureNotificationLogs] ([NotificationType]);
GO


CREATE INDEX [IX_AzureNotificationLogs_SentAt] ON [AzureNotificationLogs] ([SentAt]);
GO


CREATE INDEX [IX_Children_BirthDate] ON [Children] ([DateOfBirth]);
GO


CREATE INDEX [IX_Children_Class_Active] ON [Children] ([ClassId], [IsActive]) WHERE [IsActive] = 1;
GO


CREATE INDEX [IX_Children_ClassNurseryId_ClassId1] ON [Children] ([ClassNurseryId], [ClassId1]);
GO


CREATE INDEX [IX_Children_Nursery_Active_Name] ON [Children] ([NurseryId], [IsActive], [Name]) WHERE [IsActive] = 1;
GO


CREATE INDEX [IX_Classes_AgeRange] ON [Classes] ([AgeGroupMin], [AgeGroupMax]);
GO


CREATE INDEX [IX_Classes_Capacity] ON [Classes] ([MaxCapacity]);
GO


CREATE INDEX [IX_Classes_Nursery_Name] ON [Classes] ([NurseryId], [Name]);
GO


CREATE INDEX [IX_DailyReportResponses_DailyReportId] ON [DailyReportResponses] ([DailyReportId]);
GO


CREATE INDEX [IX_DailyReportResponses_IsRead] ON [DailyReportResponses] ([IsRead]);
GO


CREATE INDEX [IX_DailyReportResponses_ParentId] ON [DailyReportResponses] ([ParentId]);
GO


CREATE INDEX [IX_DailyReports_Category_Date] ON [DailyReports] ([Category], [ReportDate]);
GO


CREATE INDEX [IX_DailyReports_Child_Date_Status] ON [DailyReports] ([NurseryId], [ChildId], [ReportDate], [Status]);
GO


CREATE INDEX [IX_DailyReports_Date_Status] ON [DailyReports] ([ReportDate], [Status]) WHERE [Status] = 'published';
GO


CREATE INDEX [IX_DailyReports_Staff_Created] ON [DailyReports] ([StaffNurseryId], [StaffId], [CreatedAt]);
GO


CREATE UNIQUE INDEX [IX_DeviceRegistrations_DeviceId] ON [DeviceRegistrations] ([DeviceId]);
GO


CREATE INDEX [IX_DeviceRegistrations_IsActive_LastLoginAt] ON [DeviceRegistrations] ([IsActive], [LastLoginAt]);
GO


CREATE INDEX [IX_DeviceRegistrations_Platform] ON [DeviceRegistrations] ([Platform]);
GO


CREATE INDEX [IX_DeviceRegistrations_UserId] ON [DeviceRegistrations] ([UserId]);
GO


CREATE INDEX [IX_Events_Category] ON [Events] ([Category]);
GO


CREATE INDEX [IX_Events_IsActive] ON [Events] ([IsActive]);
GO


CREATE INDEX [IX_Events_NurseryId_StartDateTime] ON [Events] ([NurseryId], [StartDateTime]);
GO


CREATE INDEX [IX_Events_StaffNurseryId_StaffId] ON [Events] ([StaffNurseryId], [StaffId]);
GO


CREATE INDEX [IX_Events_TargetAudience] ON [Events] ([TargetAudience]);
GO


CREATE INDEX [IX_FamilyInvitations_ExpiresAt] ON [FamilyInvitations] ([ExpiresAt]);
GO


CREATE UNIQUE INDEX [IX_FamilyInvitations_InvitationCode] ON [FamilyInvitations] ([InvitationCode]);
GO


CREATE INDEX [IX_FamilyInvitations_InvitedByParentId] ON [FamilyInvitations] ([InvitedByParentId]);
GO


CREATE INDEX [IX_FamilyInvitations_NurseryId_ChildId] ON [FamilyInvitations] ([NurseryId], [ChildId]);
GO


CREATE INDEX [IX_FamilyInvitations_Status] ON [FamilyInvitations] ([Status]);
GO


CREATE INDEX [IX_FamilyMembers_IsActive] ON [FamilyMembers] ([IsActive]);
GO


CREATE INDEX [IX_FamilyMembers_NurseryId_ChildId] ON [FamilyMembers] ([NurseryId], [ChildId]);
GO


CREATE UNIQUE INDEX [IX_FamilyMembers_NurseryId_ChildId_ParentId] ON [FamilyMembers] ([NurseryId], [ChildId], [ParentId]);
GO


CREATE INDEX [IX_FamilyMembers_ParentId] ON [FamilyMembers] ([ParentId]);
GO


CREATE INDEX [IX_NotificationLogs_CreatedAt_Cleanup] ON [NotificationLogs] ([CreatedAt]);
GO


CREATE INDEX [IX_NotificationLogs_Entity_Created] ON [NotificationLogs] ([RelatedEntityType], [RelatedEntityId], [CreatedAt]);
GO


CREATE INDEX [IX_NotificationLogs_Parent_Created] ON [NotificationLogs] ([ParentId], [CreatedAt]);
GO


CREATE INDEX [IX_NotificationLogs_Type_Status_Created] ON [NotificationLogs] ([NotificationType], [Status], [CreatedAt]);
GO


CREATE INDEX [IX_NotificationSettings_DeviceToken] ON [NotificationSettings] ([DeviceToken]);
GO


CREATE UNIQUE INDEX [IX_NotificationSettings_ParentId] ON [NotificationSettings] ([ParentId]);
GO


CREATE INDEX [IX_NotificationTemplates_NotificationType] ON [NotificationTemplates] ([NotificationType]);
GO


CREATE UNIQUE INDEX [IX_NotificationTemplates_NotificationType_Platform] ON [NotificationTemplates] ([NotificationType], [Platform]);
GO


CREATE INDEX [IX_NotificationTemplates_Platform] ON [NotificationTemplates] ([Platform]);
GO


CREATE INDEX [IX_Nurseries_Name] ON [Nurseries] ([Name]);
GO


CREATE UNIQUE INDEX [UK_Nurseries_Email] ON [Nurseries] ([Email]);
GO


CREATE UNIQUE INDEX [UK_Nurseries_PhoneNumber] ON [Nurseries] ([PhoneNumber]);
GO


CREATE INDEX [IX_ParentChild_Child_Active] ON [ParentChildRelationships] ([ChildId], [IsActive]) WHERE [IsActive] = 1;
GO


CREATE INDEX [IX_ParentChild_Parent_Active] ON [ParentChildRelationships] ([ParentId], [IsActive]) WHERE [IsActive] = 1;
GO


CREATE INDEX [IX_ParentChild_Primary_Active] ON [ParentChildRelationships] ([IsPrimaryContact], [IsActive]) WHERE [IsActive] = 1;
GO


CREATE INDEX [IX_Parents_Active_Created] ON [Parents] ([IsActive], [CreatedAt]) WHERE [IsActive] = 1;
GO


CREATE INDEX [IX_Parents_Email] ON [Parents] ([Email]) WHERE [Email] IS NOT NULL;
GO


CREATE INDEX [IX_Parents_PhoneNumber_Active_Children] ON [Parents] ([PhoneNumber], [IsActive]) INCLUDE ([Id], [Name], [Email], [LastLoginAt]) WHERE [IsActive] = 1;
GO


CREATE UNIQUE INDEX [IX_Parents_PhoneNumber_Unique] ON [Parents] ([PhoneNumber]);
GO


CREATE INDEX [IX_PhotoAccesses_AccessedAt] ON [PhotoAccesses] ([AccessedAt]);
GO


CREATE INDEX [IX_PhotoAccesses_AccessType] ON [PhotoAccesses] ([AccessType]);
GO


CREATE INDEX [IX_PhotoAccesses_ParentId] ON [PhotoAccesses] ([ParentId]);
GO


CREATE INDEX [IX_PhotoAccesses_PhotoId] ON [PhotoAccesses] ([PhotoId]);
GO


CREATE INDEX [IX_PhotoChildren_IsPrimarySubject] ON [PhotoChildren] ([IsPrimarySubject]);
GO


CREATE INDEX [IX_PhotoChildren_NurseryId_ChildId] ON [PhotoChildren] ([NurseryId], [ChildId]);
GO


CREATE INDEX [IX_PhotoChildren_PhotoId] ON [PhotoChildren] ([PhotoId]);
GO


CREATE INDEX [IX_PhotoConsents_ConsentStatus] ON [PhotoConsents] ([ConsentStatus]);
GO


CREATE INDEX [IX_PhotoConsents_NurseryId_ChildId] ON [PhotoConsents] ([NurseryId], [ChildId]);
GO


CREATE INDEX [IX_PhotoConsents_ParentId] ON [PhotoConsents] ([ParentId]);
GO


CREATE INDEX [IX_PhotoConsents_PhotoId] ON [PhotoConsents] ([PhotoId]);
GO


CREATE UNIQUE INDEX [IX_PhotoConsents_PhotoId_NurseryId_ChildId_ParentId] ON [PhotoConsents] ([PhotoId], [NurseryId], [ChildId], [ParentId]);
GO


CREATE INDEX [IX_Photos_Class_Status_Published] ON [Photos] ([TargetClassId], [Status], [PublishedAt]) WHERE [Status] = 'published' AND [TargetClassId] IS NOT NULL;
GO


CREATE INDEX [IX_Photos_Staff_Uploaded] ON [Photos] ([UploadedByStaffNurseryId], [UploadedByStaffId], [UploadedAt]);
GO


CREATE INDEX [IX_Photos_Visibility_Status_Published] ON [Photos] ([VisibilityLevel], [Status], [PublishedAt]) WHERE [Status] = 'published';
GO


CREATE INDEX [IX_RefreshTokens_ExpiresAt_Cleanup] ON [RefreshTokens] ([ExpiresAt]);
GO


CREATE UNIQUE INDEX [IX_RefreshTokens_JwtId_Unique] ON [RefreshTokens] ([JwtId]);
GO


CREATE INDEX [IX_RefreshTokens_Parent_Expires_Revoked] ON [RefreshTokens] ([ParentId], [ExpiresAt], [IsRevoked]) WHERE [IsRevoked] = 0;
GO


CREATE INDEX [IX_RefreshTokens_ParentId] ON [RefreshTokens] ([ParentId]);
GO


CREATE INDEX [IX_RefreshTokens_Staff_Expires_Revoked] ON [RefreshTokens] ([StaffId], [ExpiresAt], [IsRevoked]) WHERE [IsRevoked] = 0;
GO


CREATE INDEX [IX_RefreshTokens_StaffNurseryId_StaffId] ON [RefreshTokens] ([StaffNurseryId], [StaffId]);
GO


CREATE UNIQUE INDEX [IX_RefreshTokens_Token_Unique] ON [RefreshTokens] ([Token]);
GO


CREATE INDEX [IX_SmsAuth_CreatedAt_Cleanup] ON [SmsAuthentications] ([CreatedAt]);
GO


CREATE INDEX [IX_SmsAuth_Parent_Created] ON [SmsAuthentications] ([ParentId], [CreatedAt]);
GO


CREATE INDEX [IX_SmsAuth_Phone_Created] ON [SmsAuthentications] ([PhoneNumber], [CreatedAt]);
GO


CREATE INDEX [IX_SmsAuth_Phone_Parent_Staff] ON [SmsAuthentications] ([PhoneNumber], [ParentId], [StaffId], [CreatedAt]);
GO


CREATE INDEX [IX_SmsAuth_Staff_Created] ON [SmsAuthentications] ([StaffId], [CreatedAt]);
GO


CREATE INDEX [IX_SmsAuthentications_ExpiresAt] ON [SmsAuthentications] ([ExpiresAt]);
GO


CREATE INDEX [IX_SmsAuthentications_ParentId] ON [SmsAuthentications] ([ParentId]);
GO


CREATE INDEX [IX_SmsAuthentications_StaffNurseryId_StaffId] ON [SmsAuthentications] ([StaffNurseryId], [StaffId]);
GO


CREATE INDEX [IX_Staff_Nursery_Active] ON [Staff] ([NurseryId], [IsActive]) WHERE [IsActive] = 1;
GO


CREATE INDEX [IX_Staff_PhoneNumber_Active] ON [Staff] ([PhoneNumber], [IsActive]) WHERE [IsActive] = 1;
GO


CREATE UNIQUE INDEX [IX_Staff_PhoneNumber_Unique] ON [Staff] ([PhoneNumber]);
GO


CREATE INDEX [IX_Staff_Role_Active] ON [Staff] ([Role], [IsActive]) WHERE [IsActive] = 1;
GO


CREATE INDEX [IX_StaffClassAssignments_Class] ON [StaffClassAssignments] ([NurseryId], [ClassId]);
GO


CREATE INDEX [IX_StaffClassAssignments_Class_Role] ON [StaffClassAssignments] ([NurseryId], [ClassId], [AssignmentRole]);
GO


CREATE INDEX [IX_StaffClassAssignments_Staff] ON [StaffClassAssignments] ([NurseryId], [StaffId]);
GO


CREATE INDEX [IX_UserRolePreferences_PhoneNumber_Updated] ON [UserRolePreferences] ([PhoneNumber], [UpdatedAt]);
GO


CREATE UNIQUE INDEX [UQ_UserRolePreferences_PhoneNumber] ON [UserRolePreferences] ([PhoneNumber]);
GO


