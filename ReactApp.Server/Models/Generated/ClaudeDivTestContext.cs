using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace ReactApp.Server.Models.Generated;

public partial class ClaudeDivTestContext : DbContext
{
    public ClaudeDivTestContext()
    {
    }

    public ClaudeDivTestContext(DbContextOptions<ClaudeDivTestContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AbsenceNotification> AbsenceNotifications { get; set; }

    public virtual DbSet<AbsenceNotificationResponse> AbsenceNotificationResponses { get; set; }

    public virtual DbSet<Announcement> Announcements { get; set; }

    public virtual DbSet<AzureNotificationLog> AzureNotificationLogs { get; set; }

    public virtual DbSet<Child> Children { get; set; }

    public virtual DbSet<Class> Classes { get; set; }

    public virtual DbSet<DailyReport> DailyReports { get; set; }

    public virtual DbSet<DailyReportResponse> DailyReportResponses { get; set; }

    public virtual DbSet<DeviceRegistration> DeviceRegistrations { get; set; }

    public virtual DbSet<Event> Events { get; set; }

    public virtual DbSet<FamilyMember> FamilyMembers { get; set; }

    public virtual DbSet<NotificationLog> NotificationLogs { get; set; }

    public virtual DbSet<NotificationSetting> NotificationSettings { get; set; }

    public virtual DbSet<NotificationTemplate> NotificationTemplates { get; set; }

    public virtual DbSet<Nurseries> Nurseries { get; set; }

    public virtual DbSet<Parent> Parents { get; set; }

    public virtual DbSet<ParentChildRelationship> ParentChildRelationships { get; set; }

    public virtual DbSet<Photo> Photos { get; set; }

    public virtual DbSet<PhotoAccess> PhotoAccesses { get; set; }

    public virtual DbSet<PhotoChild> PhotoChildren { get; set; }

    public virtual DbSet<PhotoConsent> PhotoConsents { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<SmsAuthentication> SmsAuthentications { get; set; }

    public virtual DbSet<Staff> Staff { get; set; }

    public virtual DbSet<StaffClassAssignment> StaffClassAssignments { get; set; }

    public virtual DbSet<UserRolePreference> UserRolePreferences { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseSqlServer("Name=ConnectionStrings:DefaultConnection");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AbsenceNotification>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("欠席連絡テーブル"));

            entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.StartDate, e.Status }, "IX_AbsenceNotifications_Child_Date_Status");

            entity.HasIndex(e => new { e.StartDate, e.EndDate }, "IX_AbsenceNotifications_DateRange");

            entity.HasIndex(e => new { e.ParentId, e.SubmittedAt }, "IX_AbsenceNotifications_Parent_Submitted");

            entity.HasIndex(e => new { e.Status, e.SubmittedAt }, "IX_AbsenceNotifications_Status_Submitted");

            entity.Property(e => e.Id).HasComment("欠席連絡ID");
            entity.Property(e => e.AcknowledgedAt).HasComment("確認日時");
            entity.Property(e => e.AcknowledgedBy).HasComment("確認職員ID");
            entity.Property(e => e.AdditionalNotes)
                .HasMaxLength(200)
                .HasComment("追加メモ");
            entity.Property(e => e.ChildId).HasComment("園児ID");
            entity.Property(e => e.EndDate).HasComment("終了日");
            entity.Property(e => e.ExpectedArrivalTime).HasComment("到着予定時刻");
            entity.Property(e => e.NotificationType)
                .HasMaxLength(20)
                .HasComment("連絡種別");
            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.ParentId).HasComment("保護者ID");
            entity.Property(e => e.Reason)
                .HasMaxLength(50)
                .HasComment("理由");
            entity.Property(e => e.StaffResponse)
                .HasMaxLength(500)
                .HasComment("職員返信");
            entity.Property(e => e.StartDate).HasComment("開始日");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("submitted")
                .HasComment("ステータス");
            entity.Property(e => e.SubmittedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("提出日時");
        });

        modelBuilder.Entity<AbsenceNotificationResponse>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("欠席連絡返信テーブル"));

            entity.HasIndex(e => e.AbsenceNotificationId, "IX_AbsenceNotificationResponses_AbsenceNotificationId");

            entity.HasIndex(e => new { e.NurseryId, e.StaffId }, "IX_AbsenceNotificationResponses_NurseryId_StaffId");

            entity.HasIndex(e => e.ResponseAt, "IX_AbsenceNotificationResponses_ResponseAt");

            entity.Property(e => e.Id).HasComment("返信ID");
            entity.Property(e => e.AbsenceNotificationId).HasComment("欠席連絡ID");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasComment("アクティブフラグ");
            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.ResponseAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("返信日時");
            entity.Property(e => e.ResponseMessage)
                .HasMaxLength(500)
                .HasComment("返信メッセージ");
            entity.Property(e => e.ResponseType)
                .HasMaxLength(20)
                .HasComment("返信種別");
            entity.Property(e => e.StaffId).HasComment("職員ID");
        });

        modelBuilder.Entity<Announcement>(entity =>
        {
            entity.HasIndex(e => new { e.Category, e.Status, e.PublishedAt }, "IX_Announcements_Category_Status_Published").HasFilter("([IsActive]=(1))");

            entity.HasIndex(e => new { e.NurseryId, e.StaffId, e.Status, e.CreatedAt }, "IX_Announcements_Staff_Status_Created").HasFilter("([IsActive]=(1))");

            entity.HasIndex(e => new { e.Status, e.PublishedAt }, "IX_Announcements_Status_Published").HasFilter("([Status]='published' AND [IsActive]=(1))");

            entity.Property(e => e.AllowComments).HasDefaultValue(true);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Priority)
                .HasMaxLength(20)
                .HasDefaultValue("normal");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("draft");
            entity.Property(e => e.TargetScope).HasMaxLength(20);
            entity.Property(e => e.Title).HasMaxLength(100);
        });

        modelBuilder.Entity<AzureNotificationLog>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("Azure通知ログテーブル"));

            entity.HasIndex(e => e.DeviceId, "IX_AzureNotificationLogs_DeviceId");

            entity.HasIndex(e => e.NotificationType, "IX_AzureNotificationLogs_NotificationType");

            entity.HasIndex(e => e.SentAt, "IX_AzureNotificationLogs_SentAt");

            entity.Property(e => e.Id).HasComment("ログID");
            entity.Property(e => e.Body)
                .HasMaxLength(1000)
                .HasComment("本文");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.DeviceId)
                .HasMaxLength(255)
                .HasComment("デバイスID");
            entity.Property(e => e.JsonPayload).HasComment("JSONペイロード");
            entity.Property(e => e.NotificationState)
                .HasMaxLength(50)
                .HasComment("通知状態");
            entity.Property(e => e.NotificationType)
                .HasMaxLength(50)
                .HasComment("通知種別");
            entity.Property(e => e.Platform)
                .HasMaxLength(20)
                .HasComment("プラットフォーム");
            entity.Property(e => e.ScheduledAt).HasComment("予定日時");
            entity.Property(e => e.SentAt).HasComment("送信日時");
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .HasComment("タイトル");
        });

        modelBuilder.Entity<Child>(entity =>
        {
            entity.HasKey(e => new { e.NurseryId, e.ChildId });

            entity.ToTable(tb => tb.HasComment("園児マスタ"));

            entity.HasIndex(e => e.DateOfBirth, "IX_Children_BirthDate");

            entity.HasIndex(e => new { e.ClassNurseryId, e.ClassId1 }, "IX_Children_ClassNurseryId_ClassId1");

            entity.HasIndex(e => new { e.ClassId, e.IsActive }, "IX_Children_Class_Active").HasFilter("([IsActive]=(1))");

            entity.HasIndex(e => new { e.NurseryId, e.IsActive, e.Name }, "IX_Children_Nursery_Active_Name").HasFilter("([IsActive]=(1))");

            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.ChildId).HasComment("園児ID");
            entity.Property(e => e.ClassId)
                .HasMaxLength(50)
                .HasComment("クラスID");
            entity.Property(e => e.ClassId1).HasMaxLength(50);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.DateOfBirth).HasComment("生年月日");
            entity.Property(e => e.Gender)
                .HasMaxLength(10)
                .HasComment("性別");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasComment("アクティブフラグ");
            entity.Property(e => e.MedicalNotes)
                .HasMaxLength(500)
                .HasComment("医療メモ");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasComment("氏名");
            entity.Property(e => e.SpecialInstructions)
                .HasMaxLength(500)
                .HasComment("特別指示");
            entity.Property(e => e.UpdatedAt).HasComment("更新日時");
        });

        modelBuilder.Entity<Class>(entity =>
        {
            entity.HasKey(e => new { e.NurseryId, e.ClassId });

            entity.ToTable(tb => tb.HasComment("クラスマスタ"));

            entity.HasIndex(e => new { e.AgeGroupMin, e.AgeGroupMax }, "IX_Classes_AgeRange");

            entity.HasIndex(e => e.MaxCapacity, "IX_Classes_Capacity");

            entity.HasIndex(e => new { e.NurseryId, e.Name }, "IX_Classes_Nursery_Name");

            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.ClassId)
                .HasMaxLength(50)
                .HasComment("クラスID");
            entity.Property(e => e.AgeGroupMax).HasComment("年齢グループ最大値");
            entity.Property(e => e.AgeGroupMin).HasComment("年齢グループ最小値");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.MaxCapacity).HasComment("最大定員数");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasComment("クラス名");
            entity.Property(e => e.UpdatedAt).HasComment("更新日時");
        });

        modelBuilder.Entity<DailyReport>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("連絡帳テーブル"));

            entity.HasIndex(e => new { e.Category, e.ReportDate }, "IX_DailyReports_Category_Date");

            entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.ReportDate, e.Status }, "IX_DailyReports_Child_Date_Status");

            entity.HasIndex(e => new { e.ReportDate, e.Status }, "IX_DailyReports_Date_Status");

            entity.HasIndex(e => new { e.StaffNurseryId, e.StaffId, e.CreatedAt }, "IX_DailyReports_Staff_Created");

            entity.Property(e => e.Id).HasComment("連絡帳ID");
            entity.Property(e => e.Category)
                .HasMaxLength(50)
                .HasComment("カテゴリー");
            entity.Property(e => e.ChildId).HasComment("園児ID");
            entity.Property(e => e.Content)
                .HasMaxLength(1000)
                .HasComment("内容");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.Photos)
                .HasMaxLength(1000)
                .HasComment("写真");
            entity.Property(e => e.PublishedAt).HasComment("公開日時");
            entity.Property(e => e.ReportDate).HasComment("対象日");
            entity.Property(e => e.StaffId).HasComment("職員ID");
            entity.Property(e => e.StaffNurseryId).HasComment("職員保育園ID");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("draft")
                .HasComment("ステータス");
            entity.Property(e => e.Tags)
                .HasMaxLength(500)
                .HasComment("タグ");
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .HasComment("タイトル");
            entity.Property(e => e.UpdatedAt).HasComment("更新日時");
        });

        modelBuilder.Entity<DailyReportResponse>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("連絡帳返信テーブル"));

            entity.HasIndex(e => e.DailyReportId, "IX_DailyReportResponses_DailyReportId");

            entity.HasIndex(e => e.IsRead, "IX_DailyReportResponses_IsRead");

            entity.HasIndex(e => e.ParentId, "IX_DailyReportResponses_ParentId");

            entity.Property(e => e.Id).HasComment("返信ID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.DailyReportId).HasComment("連絡帳ID");
            entity.Property(e => e.IsRead).HasComment("既読フラグ");
            entity.Property(e => e.ParentId).HasComment("保護者ID");
            entity.Property(e => e.ReadAt).HasComment("既読日時");
            entity.Property(e => e.ResponseMessage)
                .HasMaxLength(500)
                .HasComment("返信メッセージ");
        });

        modelBuilder.Entity<DeviceRegistration>(entity =>
        {
            entity.HasKey(e => e.DeviceId);

            entity.ToTable(tb => tb.HasComment(""));

            entity.HasIndex(e => e.DeviceId, "IX_DeviceRegistrations_DeviceId").IsUnique();

            entity.Property(e => e.DeviceId)
                .HasMaxLength(255)
                .HasComment("デバイスID");
            entity.Property(e => e.AppVersion)
                .HasMaxLength(50)
                .HasComment("アプリバージョン");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.DeviceInfo)
                .HasMaxLength(1000)
                .HasComment("デバイス情報");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasComment("アクティブフラグ");
            entity.Property(e => e.IsAndroid).HasComment("Androidフラグ");
            entity.Property(e => e.LastLoginAt).HasComment("最終ログイン日時");
            entity.Property(e => e.PushToken)
                .HasMaxLength(1000)
                .HasComment("プッシュトークン");
            entity.Property(e => e.RegistrationId)
                .HasMaxLength(500)
                .HasComment("登録ID");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("更新日時");
        });

        modelBuilder.Entity<Event>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("イベントマスタ"));

            entity.HasIndex(e => e.Category, "IX_Events_Category");

            entity.HasIndex(e => e.IsActive, "IX_Events_IsActive");

            entity.HasIndex(e => new { e.NurseryId, e.StartDateTime }, "IX_Events_NurseryId_StartDateTime");

            entity.HasIndex(e => new { e.StaffNurseryId, e.StaffId }, "IX_Events_StaffNurseryId_StaffId");

            entity.HasIndex(e => e.TargetAudience, "IX_Events_TargetAudience");

            entity.Property(e => e.Id).HasComment("イベントID");
            entity.Property(e => e.Category)
                .HasMaxLength(50)
                .HasComment("カテゴリー");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100)
                .HasComment("作成者");
            entity.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasComment("説明");
            entity.Property(e => e.EndDateTime).HasComment("終了日時");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasComment("アクティブフラグ");
            entity.Property(e => e.IsAllDay).HasComment("終日フラグ");
            entity.Property(e => e.LastModified)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("最終更新日時");
            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.PreparationInstructions)
                .HasMaxLength(500)
                .HasComment("準備指示");
            entity.Property(e => e.RecurrencePattern)
                .HasMaxLength(20)
                .HasDefaultValue("none")
                .HasComment("繰り返しパターン");
            entity.Property(e => e.RequiresPreparation).HasComment("準備必要フラグ");
            entity.Property(e => e.StaffId).HasComment("職員ID");
            entity.Property(e => e.StaffNurseryId).HasComment("職員保育園ID");
            entity.Property(e => e.StartDateTime).HasComment("開始日時");
            entity.Property(e => e.TargetAudience)
                .HasMaxLength(20)
                .HasDefaultValue("all")
                .HasComment("対象者");
            entity.Property(e => e.TargetChildId).HasComment("対象園児ID");
            entity.Property(e => e.TargetClassId)
                .HasMaxLength(50)
                .HasComment("対象クラスID");
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .HasComment("タイトル");
        });

        modelBuilder.Entity<FamilyMember>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("家族メンバーテーブル"));

            entity.HasIndex(e => e.IsActive, "IX_FamilyMembers_IsActive");

            entity.HasIndex(e => new { e.NurseryId, e.ChildId }, "IX_FamilyMembers_NurseryId_ChildId");

            entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.ParentId }, "IX_FamilyMembers_NurseryId_ChildId_ParentId").IsUnique();

            entity.HasIndex(e => e.ParentId, "IX_FamilyMembers_ParentId");

            entity.Property(e => e.Id).HasComment("メンバーID");
            entity.Property(e => e.CanReceiveNotifications)
                .HasDefaultValue(true)
                .HasComment("通知受信可能フラグ");
            entity.Property(e => e.CanViewPhotos)
                .HasDefaultValue(true)
                .HasComment("写真閲覧可能フラグ");
            entity.Property(e => e.CanViewReports)
                .HasDefaultValue(true)
                .HasComment("連絡帳閲覧可能フラグ");
            entity.Property(e => e.ChildId).HasComment("園児ID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.DisplayName)
                .HasMaxLength(100)
                .HasComment("表示名");
            entity.Property(e => e.HasPickupPermission).HasComment("お迎え許可フラグ");
            entity.Property(e => e.InvitedByParentId).HasComment("招待元保護者ID");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasComment("アクティブフラグ");
            entity.Property(e => e.IsPrimaryContact).HasComment("主連絡先フラグ");
            entity.Property(e => e.JoinedAt).HasComment("参加日時");
            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.ParentId).HasComment("保護者ID");
            entity.Property(e => e.RelationshipType)
                .HasMaxLength(20)
                .HasComment("続柄");
            entity.Property(e => e.UpdatedAt).HasComment("更新日時");
        });

        modelBuilder.Entity<NotificationLog>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("通知ログテーブル"));

            entity.HasIndex(e => e.CreatedAt, "IX_NotificationLogs_CreatedAt_Cleanup");

            entity.HasIndex(e => new { e.RelatedEntityType, e.RelatedEntityId, e.CreatedAt }, "IX_NotificationLogs_Entity_Created");

            entity.HasIndex(e => new { e.ParentId, e.CreatedAt }, "IX_NotificationLogs_Parent_Created");

            entity.HasIndex(e => new { e.NotificationType, e.Status, e.CreatedAt }, "IX_NotificationLogs_Type_Status_Created");

            entity.Property(e => e.Id).HasComment("ログID");
            entity.Property(e => e.Content)
                .HasMaxLength(1000)
                .HasComment("内容");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.DeliveredAt).HasComment("配信日時");
            entity.Property(e => e.DeliveryMethod)
                .HasMaxLength(50)
                .HasComment("配信方法");
            entity.Property(e => e.ErrorMessage)
                .HasMaxLength(500)
                .HasComment("エラーメッセージ");
            entity.Property(e => e.NextRetryAt).HasComment("次回再試行日時");
            entity.Property(e => e.NotificationType)
                .HasMaxLength(50)
                .HasComment("通知種別");
            entity.Property(e => e.ParentId).HasComment("保護者ID");
            entity.Property(e => e.ReadAt).HasComment("既読日時");
            entity.Property(e => e.RelatedEntityId).HasComment("関連エンティティID");
            entity.Property(e => e.RelatedEntityType)
                .HasMaxLength(50)
                .HasComment("関連エンティティ種別");
            entity.Property(e => e.RetryCount).HasComment("再試行回数");
            entity.Property(e => e.SentAt).HasComment("送信日時");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("pending")
                .HasComment("ステータス");
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .HasComment("タイトル");
        });

        modelBuilder.Entity<NotificationSetting>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("通知設定テーブル"));

            entity.HasIndex(e => e.DeviceToken, "IX_NotificationSettings_DeviceToken");

            entity.HasIndex(e => e.ParentId, "IX_NotificationSettings_ParentId").IsUnique();

            entity.Property(e => e.Id).HasComment("設定ID");
            entity.Property(e => e.AbsenceConfirmationEnabled)
                .HasDefaultValue(true)
                .HasComment("欠席確認通知有効フラグ");
            entity.Property(e => e.AnnouncementEnabled)
                .HasDefaultValue(true)
                .HasComment("お知らせ通知有効フラグ");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.DailyReportEnabled)
                .HasDefaultValue(true)
                .HasComment("連絡帳通知有効フラグ");
            entity.Property(e => e.DevicePlatform)
                .HasMaxLength(50)
                .HasComment("デバイスプラットフォーム");
            entity.Property(e => e.DeviceToken)
                .HasMaxLength(500)
                .HasComment("デバイストークン");
            entity.Property(e => e.EmailNotificationsEnabled).HasComment("メール通知有効フラグ");
            entity.Property(e => e.EventNotificationEnabled)
                .HasDefaultValue(true)
                .HasComment("イベント通知有効フラグ");
            entity.Property(e => e.ParentId).HasComment("保護者ID");
            entity.Property(e => e.PushNotificationsEnabled)
                .HasDefaultValue(true)
                .HasComment("プッシュ通知有効フラグ");
            entity.Property(e => e.SmsNotificationsEnabled).HasComment("SMS通知有効フラグ");
            entity.Property(e => e.UpdatedAt).HasComment("更新日時");
        });

        modelBuilder.Entity<NotificationTemplate>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("通知テンプレートテーブル"));

            entity.HasIndex(e => e.NotificationType, "IX_NotificationTemplates_NotificationType");

            entity.HasIndex(e => new { e.NotificationType, e.Platform }, "IX_NotificationTemplates_NotificationType_Platform").IsUnique();

            entity.HasIndex(e => e.Platform, "IX_NotificationTemplates_Platform");

            entity.Property(e => e.Id).HasComment("テンプレートID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasComment("アクティブフラグ");
            entity.Property(e => e.NotificationType)
                .HasMaxLength(50)
                .HasComment("通知種別");
            entity.Property(e => e.Platform)
                .HasMaxLength(20)
                .HasComment("プラットフォーム");
            entity.Property(e => e.TemplateJson).HasComment("テンプレートJSON");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("更新日時");
        });

        modelBuilder.Entity<Nurseries>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("保育園マスタ"));

            entity.HasIndex(e => e.Name, "IX_Nurseries_Name");

            entity.HasIndex(e => e.Email, "UK_Nurseries_Email").IsUnique();

            entity.HasIndex(e => e.PhoneNumber, "UK_Nurseries_PhoneNumber").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasComment("保育園ID");
            entity.Property(e => e.Address)
                .HasMaxLength(500)
                .HasComment("住所");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasComment("メールアドレス");
            entity.Property(e => e.EstablishedDate).HasComment("設立日");
            entity.Property(e => e.LogoUrl)
                .HasMaxLength(500)
                .HasComment("ロゴURL");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasComment("保育園名");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(20)
                .HasComment("電話番号");
            entity.Property(e => e.PrincipalName)
                .HasMaxLength(100)
                .HasComment("園長名");
            entity.Property(e => e.UpdatedAt).HasComment("更新日時");
        });

        modelBuilder.Entity<Parent>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("保護者マスタ"));

            entity.HasIndex(e => new { e.IsActive, e.CreatedAt }, "IX_Parents_Active_Created").HasFilter("([IsActive]=(1))");

            entity.HasIndex(e => e.Email, "IX_Parents_Email").HasFilter("([Email] IS NOT NULL)");

            entity.HasIndex(e => new { e.PhoneNumber, e.IsActive }, "IX_Parents_PhoneNumber_Active_Children").HasFilter("([IsActive]=(1))");

            entity.HasIndex(e => e.PhoneNumber, "IX_Parents_PhoneNumber_Unique").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasComment("保護者ID");
            entity.Property(e => e.Address)
                .HasMaxLength(200)
                .HasComment("住所");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.Email)
                .HasMaxLength(200)
                .HasComment("メールアドレス");
            entity.Property(e => e.IsActive).HasComment("アクティブフラグ");
            entity.Property(e => e.LastLoginAt).HasComment("最終ログイン日時");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasComment("氏名");
            entity.Property(e => e.PhoneNumber).HasMaxLength(15);
            entity.Property(e => e.UpdatedAt).HasComment("更新日時");
        });

        modelBuilder.Entity<ParentChildRelationship>(entity =>
        {
            entity.HasKey(e => new { e.ParentId, e.NurseryId, e.ChildId });

            entity.ToTable(tb => tb.HasComment("保護者園児関係テーブル"));

            entity.HasIndex(e => new { e.ChildId, e.IsActive }, "IX_ParentChild_Child_Active").HasFilter("([IsActive]=(1))");

            entity.HasIndex(e => new { e.ParentId, e.IsActive }, "IX_ParentChild_Parent_Active").HasFilter("([IsActive]=(1))");

            entity.HasIndex(e => new { e.IsPrimaryContact, e.IsActive }, "IX_ParentChild_Primary_Active").HasFilter("([IsActive]=(1))");

            entity.Property(e => e.ParentId).HasComment("保護者ID");
            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.ChildId).HasComment("園児ID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsPrimaryContact).HasComment("主連絡先フラグ");
            entity.Property(e => e.RelationshipType)
                .HasMaxLength(20)
                .HasComment("続柄");
            entity.Property(e => e.UpdatedAt).HasComment("更新日時");
        });

        modelBuilder.Entity<Photo>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("写真マスタ"));

            entity.HasIndex(e => new { e.TargetClassId, e.Status, e.PublishedAt }, "IX_Photos_Class_Status_Published").HasFilter("([Status]='published' AND [TargetClassId] IS NOT NULL)");

            entity.HasIndex(e => new { e.UploadedByStaffNurseryId, e.UploadedByStaffId, e.UploadedAt }, "IX_Photos_Staff_Uploaded");

            entity.HasIndex(e => new { e.VisibilityLevel, e.Status, e.PublishedAt }, "IX_Photos_Visibility_Status_Published").HasFilter("([Status]='published')");

            entity.Property(e => e.Id).HasComment("写真ID");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .HasComment("説明");
            entity.Property(e => e.FileName)
                .HasMaxLength(255)
                .HasComment("ファイル名");
            entity.Property(e => e.FilePath)
                .HasMaxLength(500)
                .HasComment("ファイルパス");
            entity.Property(e => e.FileSize).HasComment("ファイルサイズ");
            entity.Property(e => e.Height).HasComment("高さ");
            entity.Property(e => e.MimeType)
                .HasMaxLength(100)
                .HasComment("MIMEタイプ");
            entity.Property(e => e.OriginalFileName)
                .HasMaxLength(255)
                .HasComment("元ファイル名");
            entity.Property(e => e.PublishedAt).HasComment("公開日時");
            entity.Property(e => e.RequiresConsent).HasDefaultValue(true);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("draft");
            entity.Property(e => e.TargetClassId).HasMaxLength(50);
            entity.Property(e => e.ThumbnailPath)
                .HasMaxLength(500)
                .HasComment("サムネイルパス");
            entity.Property(e => e.UploadedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("アップロード日時");
            entity.Property(e => e.UploadedByStaffId).HasComment("アップロード職員ID");
            entity.Property(e => e.UploadedByStaffNurseryId).HasComment("アップロード職員保育園ID");
            entity.Property(e => e.VisibilityLevel)
                .HasMaxLength(20)
                .HasDefaultValue("class");
            entity.Property(e => e.Width).HasComment("幅");
        });

        modelBuilder.Entity<PhotoAccess>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("写真アクセス履歴テーブル"));

            entity.HasIndex(e => e.AccessType, "IX_PhotoAccesses_AccessType");

            entity.HasIndex(e => e.AccessedAt, "IX_PhotoAccesses_AccessedAt");

            entity.HasIndex(e => e.ParentId, "IX_PhotoAccesses_ParentId");

            entity.HasIndex(e => e.PhotoId, "IX_PhotoAccesses_PhotoId");

            entity.Property(e => e.Id).HasComment("アクセスID");
            entity.Property(e => e.AccessType)
                .HasMaxLength(20)
                .HasComment("アクセス種別");
            entity.Property(e => e.AccessedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("アクセス日時");
            entity.Property(e => e.ErrorMessage)
                .HasMaxLength(500)
                .HasComment("エラーメッセージ");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(45)
                .HasComment("IPアドレス");
            entity.Property(e => e.IsSuccessful)
                .HasDefaultValue(true)
                .HasComment("成功フラグ");
            entity.Property(e => e.ParentId).HasComment("保護者ID");
            entity.Property(e => e.PhotoId).HasComment("写真ID");
            entity.Property(e => e.UserAgent)
                .HasMaxLength(500)
                .HasComment("ユーザーエージェント");
        });

        modelBuilder.Entity<PhotoChild>(entity =>
        {
            entity.HasKey(e => new { e.PhotoId, e.NurseryId, e.ChildId });

            entity.ToTable(tb => tb.HasComment("写真園児関係テーブル"));

            entity.HasIndex(e => e.ChildId, "IX_PhotoChildren_ChildId");

            entity.HasIndex(e => e.IsPrimarySubject, "IX_PhotoChildren_IsPrimarySubject");

            entity.HasIndex(e => new { e.NurseryId, e.ChildId }, "IX_PhotoChildren_NurseryId_ChildId");

            entity.HasIndex(e => e.PhotoId, "IX_PhotoChildren_PhotoId");

            entity.HasIndex(e => new { e.PhotoId, e.IsPrimarySubject }, "IX_PhotoChildren_PhotoId_IsPrimarySubject");

            entity.Property(e => e.PhotoId).HasComment("写真ID");
            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.ChildId).HasComment("園児ID");
            entity.Property(e => e.AddedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("追加日時");
            entity.Property(e => e.AddedByStaffId).HasComment("追加職員ID");
            entity.Property(e => e.IsActive).HasComment("アクティブフラグ");
            entity.Property(e => e.IsPrimarySubject).HasComment("主対象フラグ");
        });

        modelBuilder.Entity<PhotoConsent>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("写真公開同意テーブル"));

            entity.HasIndex(e => e.ConsentStatus, "IX_PhotoConsents_ConsentStatus");

            entity.HasIndex(e => new { e.NurseryId, e.ChildId }, "IX_PhotoConsents_NurseryId_ChildId");

            entity.HasIndex(e => e.ParentId, "IX_PhotoConsents_ParentId");

            entity.HasIndex(e => e.PhotoId, "IX_PhotoConsents_PhotoId");

            entity.HasIndex(e => new { e.PhotoId, e.NurseryId, e.ChildId, e.ParentId }, "IX_PhotoConsents_PhotoId_NurseryId_ChildId_ParentId").IsUnique();

            entity.Property(e => e.Id).HasComment("同意ID");
            entity.Property(e => e.ChildId).HasComment("園児ID");
            entity.Property(e => e.ConsentStatus)
                .HasMaxLength(20)
                .HasDefaultValue("pending")
                .HasComment("同意状態");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasComment("アクティブフラグ");
            entity.Property(e => e.Notes)
                .HasMaxLength(500)
                .HasComment("メモ");
            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.ParentId).HasComment("保護者ID");
            entity.Property(e => e.PhotoId).HasComment("写真ID");
            entity.Property(e => e.RequestedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("リクエスト日時");
            entity.Property(e => e.RespondedAt).HasComment("回答日時");
            entity.Property(e => e.UpdatedAt).HasComment("更新日時");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("リフレッシュトークンテーブル"));

            entity.HasIndex(e => e.ExpiresAt, "IX_RefreshTokens_ExpiresAt_Cleanup");

            entity.HasIndex(e => e.JwtId, "IX_RefreshTokens_JwtId_Unique").IsUnique();

            entity.HasIndex(e => e.ParentId, "IX_RefreshTokens_ParentId");

            entity.HasIndex(e => new { e.ParentId, e.ExpiresAt, e.IsRevoked }, "IX_RefreshTokens_Parent_Expires_Revoked").HasFilter("([IsRevoked]=(0))");

            entity.HasIndex(e => new { e.StaffNurseryId, e.StaffId }, "IX_RefreshTokens_StaffNurseryId_StaffId");

            entity.HasIndex(e => new { e.StaffId, e.ExpiresAt, e.IsRevoked }, "IX_RefreshTokens_Staff_Expires_Revoked").HasFilter("([IsRevoked]=(0))");

            entity.HasIndex(e => e.Token, "IX_RefreshTokens_Token_Unique").IsUnique();

            entity.Property(e => e.Id).HasComment("トークンID");
            entity.Property(e => e.ClientIpAddress)
                .HasMaxLength(45)
                .HasComment("クライアントIPアドレス");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.ExpiresAt).HasComment("有効期限");
            entity.Property(e => e.IsRevoked).HasComment("失効フラグ");
            entity.Property(e => e.JwtId)
                .HasMaxLength(500)
                .HasComment("JWT ID");
            entity.Property(e => e.ParentId).HasComment("保護者ID");
            entity.Property(e => e.RevokedAt).HasComment("失効日時");
            entity.Property(e => e.StaffId).HasComment("職員ID");
            entity.Property(e => e.StaffNurseryId).HasComment("職員保育園ID");
            entity.Property(e => e.Token)
                .HasMaxLength(500)
                .HasComment("トークン");
            entity.Property(e => e.UserAgent)
                .HasMaxLength(500)
                .HasComment("ユーザーエージェント");
        });

        modelBuilder.Entity<SmsAuthentication>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("SMS認証テーブル"));

            entity.HasIndex(e => e.CreatedAt, "IX_SmsAuth_CreatedAt_Cleanup");

            entity.HasIndex(e => new { e.ParentId, e.CreatedAt }, "IX_SmsAuth_Parent_Created");

            entity.HasIndex(e => new { e.PhoneNumber, e.CreatedAt }, "IX_SmsAuth_Phone_Created");

            entity.HasIndex(e => new { e.PhoneNumber, e.ParentId, e.StaffId, e.CreatedAt }, "IX_SmsAuth_Phone_Parent_Staff");

            entity.HasIndex(e => new { e.StaffId, e.CreatedAt }, "IX_SmsAuth_Staff_Created");

            entity.HasIndex(e => e.ExpiresAt, "IX_SmsAuthentications_ExpiresAt");

            entity.HasIndex(e => e.ParentId, "IX_SmsAuthentications_ParentId");

            entity.HasIndex(e => new { e.StaffNurseryId, e.StaffId }, "IX_SmsAuthentications_StaffNurseryId_StaffId");

            entity.Property(e => e.Id).HasComment("認証ID");
            entity.Property(e => e.AttemptCount).HasComment("試行回数");
            entity.Property(e => e.ClientIpAddress)
                .HasMaxLength(45)
                .HasComment("クライアントIPアドレス");
            entity.Property(e => e.Code)
                .HasMaxLength(6)
                .HasComment("確認コード");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.ExpiresAt).HasComment("有効期限");
            entity.Property(e => e.HashedCode)
                .HasMaxLength(100)
                .HasComment("ハッシュ化コード");
            entity.Property(e => e.IsUsed).HasComment("使用済みフラグ");
            entity.Property(e => e.ParentId).HasComment("保護者ID");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(15)
                .HasComment("電話番号");
            entity.Property(e => e.StaffId).HasComment("職員ID");
            entity.Property(e => e.StaffNurseryId).HasComment("職員保育園ID");
            entity.Property(e => e.UsedAt).HasComment("使用日時");
            entity.Property(e => e.UserAgent)
                .HasMaxLength(500)
                .HasComment("ユーザーエージェント");
        });

        modelBuilder.Entity<Staff>(entity =>
        {
            entity.HasKey(e => new { e.NurseryId, e.StaffId });

            entity.ToTable(tb => tb.HasComment("職員マスタ"));

            entity.HasIndex(e => new { e.NurseryId, e.IsActive }, "IX_Staff_Nursery_Active");

            entity.HasIndex(e => new { e.PhoneNumber, e.IsActive }, "IX_Staff_PhoneNumber_Active");

            entity.HasIndex(e => e.PhoneNumber, "IX_Staff_PhoneNumber_Unique").IsUnique();

            entity.HasIndex(e => new { e.Role, e.IsActive }, "IX_Staff_Role_Active");

            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.StaffId).HasComment("職員ID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.Email)
                .HasMaxLength(200)
                .HasComment("メールアドレス");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasComment("アクティブフラグ");
            entity.Property(e => e.LastLoginAt).HasComment("最終ログイン日時");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasComment("氏名");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(15)
                .HasComment("電話番号");
            entity.Property(e => e.Position)
                .HasMaxLength(100)
                .HasComment("職位");
            entity.Property(e => e.Role)
                .HasMaxLength(50)
                .HasComment("役職");
            entity.Property(e => e.UpdatedAt).HasComment("更新日時");
        });

        modelBuilder.Entity<StaffClassAssignment>(entity =>
        {
            entity.HasKey(e => new { e.NurseryId, e.StaffId, e.ClassId });

            entity.ToTable(tb => tb.HasComment("職員クラス割当テーブル"));

            entity.HasIndex(e => new { e.NurseryId, e.ClassId }, "IX_StaffClassAssignments_Class");

            entity.HasIndex(e => new { e.NurseryId, e.ClassId, e.AssignmentRole }, "IX_StaffClassAssignments_Class_Role");

            entity.HasIndex(e => new { e.NurseryId, e.StaffId }, "IX_StaffClassAssignments_Staff");

            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.StaffId).HasComment("職員ID");
            entity.Property(e => e.ClassId)
                .HasMaxLength(50)
                .HasComment("クラスID");
            entity.Property(e => e.AssignmentRole)
                .HasMaxLength(50)
                .HasComment("割当役割");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.UpdatedAt).HasComment("更新日時");
        });

        modelBuilder.Entity<UserRolePreference>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("ユーザー役割設定テーブル"));

            entity.HasIndex(e => new { e.PhoneNumber, e.UpdatedAt }, "IX_UserRolePreferences_PhoneNumber_Updated");

            entity.HasIndex(e => e.PhoneNumber, "UQ_UserRolePreferences_PhoneNumber").IsUnique();

            entity.Property(e => e.Id).HasComment("設定ID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(15)
                .HasComment("電話番号");
            entity.Property(e => e.PreferredRole)
                .HasMaxLength(20)
                .HasComment("優先役割");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("更新日時");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
