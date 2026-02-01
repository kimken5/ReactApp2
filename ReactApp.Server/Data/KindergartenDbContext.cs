using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Models;

namespace ReactApp.Server.Data
{
    /// <summary>
    /// 最適化された保育園管理システムデータベースコンテキスト
    /// 高性能インデックス、クエリ最適化、パフォーマンス監視機能を実装
    /// 全エンティティのDbSetとリレーションシップ設定を定義
    /// </summary>
    public class KindergartenDbContext : DbContext
    {
        /// <summary>
        /// KindergartenDbContextコンストラクタ
        /// Entity Framework Core設定オプションを受け取り基底クラスを初期化
        /// </summary>
        /// <param name="options">データベース接続とEntity Framework設定オプション</param>
        public KindergartenDbContext(DbContextOptions<KindergartenDbContext> options)
            : base(options)
        {
        }

        public DbSet<Nursery> Nurseries { get; set; }
        public DbSet<Parent> Parents { get; set; }
        public DbSet<Child> Children { get; set; }
        public DbSet<Class> Classes { get; set; }
        public DbSet<ParentChildRelationship> ParentChildRelationships { get; set; }
        public DbSet<Staff> Staff { get; set; }
        public DbSet<StaffClassAssignment> StaffClassAssignments { get; set; }
        public DbSet<SmsAuthentication> SmsAuthentications { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<UserRolePreference> UserRolePreferences { get; set; }
        public DbSet<AbsenceNotification> AbsenceNotifications { get; set; }
        public DbSet<AbsenceNotificationResponse> AbsenceNotificationResponses { get; set; }
        public DbSet<DailyReport> DailyReports { get; set; }
        public DbSet<DailyReportResponse> DailyReportResponses { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<NotificationSettings> NotificationSettings { get; set; }
        public DbSet<NotificationLog> NotificationLogs { get; set; }
        public DbSet<FamilyMember> FamilyMembers { get; set; }
        public DbSet<Photo> Photos { get; set; }
        public DbSet<PhotoChild> PhotoChildren { get; set; }
        public DbSet<PhotoAccess> PhotoAccesses { get; set; }
        public DbSet<PhotoConsent> PhotoConsents { get; set; }
        public DbSet<Announcement> Announcements { get; set; }

        // Azure Notification Hub関連エンティティ
        public DbSet<DeviceRegistration> DeviceRegistrations { get; set; }
        public DbSet<NotificationTemplate> NotificationTemplates { get; set; }
        public DbSet<AzureNotificationLog> AzureNotificationLogs { get; set; }

        // デスクトップアプリ用エンティティ
        public DbSet<AcademicYear> AcademicYears { get; set; }
        public DbSet<ChildClassAssignment> ChildClassAssignments { get; set; }
        public DbSet<PromotionHistory> PromotionHistories { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<DailyAttendance> DailyAttendances { get; set; }
        public DbSet<ApplicationWork> ApplicationWorks { get; set; }
        public DbSet<NurseryDayType> NurseryDayTypes { get; set; }

        // 献立管理用エンティティ
        public DbSet<AllergenMaster> AllergenMasters { get; set; }
        public DbSet<MenuMaster> MenuMasters { get; set; }
        // public DbSet<MenuMasterIngredient> MenuMasterIngredients { get; set; } // テーブル削除済み（モデルファイルも .bak にリネーム）
        public DbSet<DailyMenu> DailyMenus { get; set; }
        // public DbSet<DailyMenuIngredient> DailyMenuIngredients { get; set; } // テーブル削除済み（2026-01-01）

        // 乳児生活記録用エンティティ
        public DbSet<InfantTemperature> InfantTemperatures { get; set; }
        public DbSet<ParentMorningNote> ParentMorningNotes { get; set; }
        public DbSet<InfantMeal> InfantMeals { get; set; }
        public DbSet<InfantMood> InfantMoods { get; set; }
        public DbSet<InfantSleep> InfantSleeps { get; set; }
        public DbSet<InfantToileting> InfantToiletings { get; set; }
        public DbSet<InfantMilk> InfantMilks { get; set; }
        public DbSet<InfantSleepCheck> InfantSleepChecks { get; set; }
        public DbSet<RoomEnvironmentRecord> RoomEnvironmentRecords { get; set; }

        // 入退管理用エンティティ
        public DbSet<EntryExitLog> EntryExitLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 全てのナビゲーションプロパティを無視して外部キーを作成しない
            modelBuilder.Entity<Parent>().Ignore(p => p.SmsAuthentications);
            modelBuilder.Entity<Parent>().Ignore(p => p.RefreshTokens);
            modelBuilder.Entity<Parent>().Ignore(p => p.ParentRelationships);
            modelBuilder.Entity<Child>().Ignore(c => c.ParentRelationships);
            modelBuilder.Entity<Child>().Ignore(c => c.AbsenceNotifications);
            modelBuilder.Entity<Child>().Ignore(c => c.Class);
            modelBuilder.Entity<Class>().Ignore(c => c.Children);
            modelBuilder.Entity<Staff>().Ignore(s => s.ClassAssignments);
            modelBuilder.Entity<Staff>().Ignore(s => s.CreatedReports);
            modelBuilder.Entity<Staff>().Ignore(s => s.AbsenceResponses);
            modelBuilder.Entity<Staff>().Ignore(s => s.CreatedEvents);
            modelBuilder.Entity<Announcement>().Ignore(a => a.Staff);
            modelBuilder.Entity<AbsenceNotification>().Ignore(a => a.Parent);
            modelBuilder.Entity<AbsenceNotification>().Ignore(a => a.Child);
            modelBuilder.Entity<AbsenceNotification>().Ignore(a => a.AcknowledgedByAdminUser);
            modelBuilder.Entity<AbsenceNotification>().Ignore(a => a.RespondedByStaffId);
            modelBuilder.Entity<AbsenceNotification>().Ignore(a => a.AcknowledgedByAdminAt);
            modelBuilder.Entity<AbsenceNotificationResponse>().Ignore(a => a.AbsenceNotification);
            modelBuilder.Entity<AbsenceNotificationResponse>().Ignore(a => a.Staff);
            modelBuilder.Entity<DailyReport>().Ignore(d => d.Child);
            modelBuilder.Entity<DailyReport>().Ignore(d => d.Staff);
            modelBuilder.Entity<DailyReportResponse>().Ignore(d => d.DailyReport);
            modelBuilder.Entity<DailyReportResponse>().Ignore(d => d.Parent);
            modelBuilder.Entity<NotificationLog>().Ignore(n => n.Parent);
            modelBuilder.Entity<NotificationSettings>().Ignore(n => n.Parent);
            modelBuilder.Entity<FamilyMember>().Ignore(f => f.Parent);
            modelBuilder.Entity<FamilyMember>().Ignore(f => f.Child);
            modelBuilder.Entity<FamilyMember>().Ignore(f => f.InvitedByParent);
            modelBuilder.Entity<ParentChildRelationship>().Ignore(p => p.Parent);
            modelBuilder.Entity<ParentChildRelationship>().Ignore(p => p.Child);
            modelBuilder.Entity<SmsAuthentication>().Ignore(s => s.Parent);
            modelBuilder.Entity<SmsAuthentication>().Ignore(s => s.Staff);
            modelBuilder.Entity<RefreshToken>().Ignore(r => r.Parent);
            modelBuilder.Entity<RefreshToken>().Ignore(r => r.Staff);
            modelBuilder.Entity<Photo>().Ignore(p => p.UploadedByStaff);
            modelBuilder.Entity<PhotoChild>().Ignore(p => p.Photo);
            modelBuilder.Entity<PhotoChild>().Ignore(p => p.Child);
            modelBuilder.Entity<PhotoChild>().Ignore(p => p.AddedByStaff);
            modelBuilder.Entity<PhotoAccess>().Ignore(p => p.Photo);
            modelBuilder.Entity<PhotoAccess>().Ignore(p => p.Parent);
            modelBuilder.Entity<PhotoConsent>().Ignore(p => p.Photo);
            modelBuilder.Entity<PhotoConsent>().Ignore(p => p.Child);
            modelBuilder.Entity<PhotoConsent>().Ignore(p => p.Parent);

            // Event設定は ConfigureEvent メソッドで実施（重複を避けるため）

            // PERFORMANCE: Parent configuration with optimized indexes
            modelBuilder.Entity<Parent>(entity =>
            {
                entity.HasKey(e => e.Id);

                // IDを自動生成に設定
                entity.Property(e => e.Id).ValueGeneratedOnAdd();

                // 高性能インデックス設定
                // PhoneNumber + NurseryIdの複合ユニーク制約（同じ電話番号でも異なる保育園では許可）
                entity.HasIndex(e => new { e.PhoneNumber, e.NurseryId })
                    .IsUnique()
                    .HasDatabaseName("IX_Parents_PhoneNumber_Unique");

                entity.HasIndex(e => e.Email)
                    .HasDatabaseName("IX_Parents_Email");

                entity.HasIndex(e => new { e.IsActive, e.CreatedAt })
                    .HasDatabaseName("IX_Parents_Active_Created");

                // Multi-role phone number search optimization
                entity.HasIndex(e => new { e.PhoneNumber, e.IsActive, e.Id, e.Name, e.Email, e.LastLoginAt })
                    .HasDatabaseName("IX_Parents_PhoneNumber_Active_Children");

                // カラム制約とデフォルト値
                entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(15);
                entity.Property(e => e.Name).HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(200);
                entity.Property(e => e.NurseryId).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");

                // リレーションシップ設定

            });

            // PERFORMANCE: SmsAuthentication configuration with cleanup optimization
            modelBuilder.Entity<SmsAuthentication>(entity =>
            {
                entity.HasKey(e => e.Id);

                // クリーンアップ最適化インデックス
                entity.HasIndex(e => e.CreatedAt)
                    .HasDatabaseName("IX_SmsAuth_CreatedAt_Cleanup");

                entity.HasIndex(e => new { e.PhoneNumber, e.CreatedAt })
                    .HasDatabaseName("IX_SmsAuth_Phone_Created");

                entity.HasIndex(e => new { e.ParentId, e.CreatedAt })
                    .HasDatabaseName("IX_SmsAuth_Parent_Created");

                entity.HasIndex(e => new { e.StaffId, e.CreatedAt })
                    .HasDatabaseName("IX_SmsAuth_Staff_Created");

                // Multi-role phone number search optimization
                entity.HasIndex(e => new { e.PhoneNumber, e.ParentId, e.StaffId, e.CreatedAt })
                    .HasDatabaseName("IX_SmsAuth_Phone_Parent_Staff");

                entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(15);
                entity.Property(e => e.Code).IsRequired().HasMaxLength(6);
                entity.Property(e => e.HashedCode).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ClientIpAddress).HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });

            // PERFORMANCE: RefreshToken configuration with expiration optimization
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasIndex(e => e.Token)
                    .IsUnique()
                    .HasDatabaseName("IX_RefreshTokens_Token_Unique");

                entity.HasIndex(e => e.JwtId)
                    .IsUnique()
                    .HasDatabaseName("IX_RefreshTokens_JwtId_Unique");

                // 期限切れトークンクリーンアップ用
                entity.HasIndex(e => e.ExpiresAt)
                    .HasDatabaseName("IX_RefreshTokens_ExpiresAt_Cleanup");

                // アクティブユーザー検索用（Parent）
                entity.HasIndex(e => new { e.ParentId, e.ExpiresAt, e.IsRevoked })
                    .HasDatabaseName("IX_RefreshTokens_Parent_Expires_Revoked")
                    .HasFilter("[IsRevoked] = 0");

                // アクティブユーザー検索用（Staff）
                entity.HasIndex(e => new { e.StaffId, e.ExpiresAt, e.IsRevoked })
                    .HasDatabaseName("IX_RefreshTokens_Staff_Expires_Revoked")
                    .HasFilter("[IsRevoked] = 0");

                entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
                entity.Property(e => e.JwtId).IsRequired().HasMaxLength(500);
                entity.Property(e => e.ClientIpAddress).HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });

            // PERFORMANCE: AbsenceNotification configuration with compound indexes
            modelBuilder.Entity<AbsenceNotification>(entity =>
            {
                entity.HasKey(e => e.Id);

                // 園児別検索最適化（Ymdに変更）
                entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.Ymd })
                    .HasDatabaseName("IX_AbsenceNotifications_Child_Date_Status");

                // 保護者別検索最適化
                entity.HasIndex(e => new { e.ParentId, e.SubmittedAt })
                    .HasDatabaseName("IX_AbsenceNotifications_Parent_Submitted");

                // ステータス別検索
                entity.HasIndex(e => new { e.Status, e.SubmittedAt })
                    .HasDatabaseName("IX_AbsenceNotifications_Status_Submitted");

                entity.Property(e => e.NotificationType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Reason).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("submitted");
                entity.Property(e => e.AdditionalNotes).HasMaxLength(200);
                entity.Property(e => e.StaffResponse).HasMaxLength(500);
                entity.Property(e => e.SubmittedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });

            // PERFORMANCE: Child configuration with search optimization
            modelBuilder.Entity<Child>(entity =>
            {
                // 複合主キー設定: (NurseryId, ChildId)
                entity.HasKey(e => new { e.NurseryId, e.ChildId });

                // 園児検索最適化（苗字・名前別々に検索）
                entity.HasIndex(e => new { e.NurseryId, e.IsActive, e.FamilyName, e.FirstName })
                    .HasDatabaseName("IX_Children_Nursery_Active_Name")
                    .HasFilter("[IsActive] = 1");

                entity.HasIndex(e => new { e.ClassId, e.IsActive })
                    .HasDatabaseName("IX_Children_Class_Active")
                    .HasFilter("[IsActive] = 1");

                entity.HasIndex(e => e.DateOfBirth)
                    .HasDatabaseName("IX_Children_BirthDate");

                entity.Property(e => e.FamilyName).IsRequired().HasMaxLength(20);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(20);
                entity.Property(e => e.FamilyFurigana).HasMaxLength(20);
                entity.Property(e => e.FirstFurigana).HasMaxLength(20);
                entity.Property(e => e.Gender).IsRequired().HasMaxLength(10);
                entity.Property(e => e.ClassId).HasMaxLength(50);
                entity.Property(e => e.Allergy).HasMaxLength(200);
                entity.Property(e => e.MedicalNotes).HasMaxLength(500);
                entity.Property(e => e.SpecialInstructions).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.IsActive).HasDefaultValue(true);
            });

            // PERFORMANCE: Class configuration with composite primary key
            modelBuilder.Entity<Class>(entity =>
            {
                // 複合主キー設定: (NurseryId, ClassId)
                entity.HasKey(e => new { e.NurseryId, e.ClassId });

                // クラス検索最適化
                entity.HasIndex(e => new { e.NurseryId, e.Name })
                    .HasDatabaseName("IX_Classes_Nursery_Name");

                entity.HasIndex(e => new { e.AgeGroupMin, e.AgeGroupMax })
                    .HasDatabaseName("IX_Classes_AgeRange");

                entity.HasIndex(e => e.MaxCapacity)
                    .HasDatabaseName("IX_Classes_Capacity");

                entity.Property(e => e.ClassId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });

            // PERFORMANCE: ParentChildRelationship configuration
            modelBuilder.Entity<ParentChildRelationship>(entity =>
            {
                // 複合主キー設定: (ParentId, NurseryId, ChildId)
                entity.HasKey(e => new { e.ParentId, e.NurseryId, e.ChildId });

                // 高速検索用複合インデックス
                entity.HasIndex(e => new { e.ParentId, e.IsActive })
                    .HasDatabaseName("IX_ParentChild_Parent_Active")
                    .HasFilter("[IsActive] = 1");

                entity.HasIndex(e => new { e.ChildId, e.IsActive })
                    .HasDatabaseName("IX_ParentChild_Child_Active")
                    .HasFilter("[IsActive] = 1");

                entity.HasIndex(e => new { e.IsPrimaryContact, e.IsActive })
                    .HasDatabaseName("IX_ParentChild_Primary_Active")
                    .HasFilter("[IsActive] = 1");

                entity.Property(e => e.RelationshipType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.IsActive).HasDefaultValue(true);


            });

            // PERFORMANCE: Staff configuration with compound primary key
            modelBuilder.Entity<Staff>(entity =>
            {
                // 複合主キー設定: (NurseryId, StaffId)
                entity.HasKey(e => new { e.NurseryId, e.StaffId });

                entity.HasIndex(e => e.PhoneNumber)
                    .IsUnique()
                    .HasDatabaseName("IX_Staff_PhoneNumber_Unique");

                entity.HasIndex(e => new { e.Role, e.IsActive })
                    .HasDatabaseName("IX_Staff_Role_Active")
                    .HasFilter("[IsActive] = 1");

                // Multi-role authentication search optimization
                entity.HasIndex(e => new { e.PhoneNumber, e.IsActive })
                    .HasDatabaseName("IX_Staff_PhoneNumber_Active")
                    .HasFilter("[IsActive] = 1");

                entity.HasIndex(e => new { e.NurseryId, e.IsActive })
                    .HasDatabaseName("IX_Staff_Nursery_Active")
                    .HasFilter("[IsActive] = 1");

                entity.Property(e => e.NurseryId).IsRequired();
                entity.Property(e => e.StaffId).IsRequired();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(15);
                entity.Property(e => e.Email).HasMaxLength(200);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Position).HasMaxLength(100);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");

                // Navigation properties for multi-role authentication


            });

            // PERFORMANCE: StaffClassAssignment configuration (年度スライド対応)
            modelBuilder.Entity<StaffClassAssignment>(entity =>
            {
                // 複合主キー設定: (AcademicYear, NurseryId, StaffId, ClassId)
                entity.HasKey(e => new { e.AcademicYear, e.NurseryId, e.StaffId, e.ClassId });

                // 年度別現在担任検索
                entity.HasIndex(e => new { e.NurseryId, e.AcademicYear, e.IsCurrent })
                    .HasDatabaseName("IX_StaffClassAssignments_Year_Current")
                    .HasFilter("[IsCurrent] = 1");

                // 年度別未来担任検索
                entity.HasIndex(e => new { e.NurseryId, e.AcademicYear, e.IsFuture })
                    .HasDatabaseName("IX_StaffClassAssignments_Year_Future")
                    .HasFilter("[IsFuture] = 1");

                // スタッフ別クラス一覧取得用インデックス
                entity.HasIndex(e => new { e.NurseryId, e.StaffId, e.AcademicYear })
                    .HasDatabaseName("IX_StaffClassAssignments_Staff_Year");

                // クラス別スタッフ一覧取得用インデックス
                entity.HasIndex(e => new { e.NurseryId, e.ClassId, e.AcademicYear })
                    .HasDatabaseName("IX_StaffClassAssignments_Class_Year");

                entity.Property(e => e.AcademicYear).IsRequired();
                entity.Property(e => e.NurseryId).IsRequired();
                entity.Property(e => e.StaffId).IsRequired();
                entity.Property(e => e.ClassId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.AssignmentRole).HasMaxLength(50);
                entity.Property(e => e.IsCurrent).HasDefaultValue(false);
                entity.Property(e => e.IsFuture).HasDefaultValue(false);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.Notes).HasMaxLength(200);
                entity.Property(e => e.AssignedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });

            // Configure UserRolePreference entity
            modelBuilder.Entity<UserRolePreference>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Phone number unique constraint
                entity.HasIndex(e => e.PhoneNumber)
                    .IsUnique()
                    .HasDatabaseName("UQ_UserRolePreferences_PhoneNumber");

                // Search optimization index
                entity.HasIndex(e => new { e.PhoneNumber, e.UpdatedAt })
                    .HasDatabaseName("IX_UserRolePreferences_PhoneNumber_Updated");

                entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(15);
                entity.Property(e => e.PreferredRole).IsRequired().HasMaxLength(20);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");

                // Role constraint
                entity.ToTable(t => t.HasCheckConstraint("CK_UserRolePreference_PreferredRole",
                    "[PreferredRole] IN ('Parent', 'Staff')"));
            });

            // Configure other entities with performance optimizations
            ConfigureNursery(modelBuilder);
            ConfigureAbsenceNotificationResponse(modelBuilder);
            ConfigureDailyReport(modelBuilder);
            ConfigureDailyReportResponse(modelBuilder);
            ConfigureEvent(modelBuilder);
            ConfigureNotificationSettings(modelBuilder);
            ConfigureNotificationLog(modelBuilder);
            ConfigureFamilyMember(modelBuilder);
            ConfigurePhoto(modelBuilder);
            ConfigurePhotoChild(modelBuilder);
            ConfigurePhotoAccess(modelBuilder);
            ConfigurePhotoConsent(modelBuilder);
            ConfigureAnnouncement(modelBuilder);
            ConfigureDeviceRegistration(modelBuilder);
            ConfigureNotificationTemplate(modelBuilder);
            ConfigureAzureNotificationLog(modelBuilder);
            ConfigureRefreshToken(modelBuilder);
            ConfigureSmsAuthentication(modelBuilder);

            // デスクトップアプリ用エンティティ設定
            ConfigureAcademicYear(modelBuilder);
            ConfigureChildClassAssignment(modelBuilder);
            ConfigurePromotionHistory(modelBuilder);
            ConfigureAuditLog(modelBuilder);
            ConfigureDailyAttendance(modelBuilder);
            ConfigureApplicationWork(modelBuilder);

            // 乳児生活記録用エンティティ設定
            ConfigureInfantTemperature(modelBuilder);
            ConfigureParentMorningNote(modelBuilder);
            ConfigureInfantMeal(modelBuilder);
            ConfigureInfantMood(modelBuilder);
            ConfigureInfantSleep(modelBuilder);
            ConfigureInfantToileting(modelBuilder);

            // 追加の乳児記録用エンティティ設定
            ConfigureInfantMilk(modelBuilder);
            ConfigureInfantSleepCheck(modelBuilder);
            ConfigureRoomEnvironmentRecord(modelBuilder);
        }

        private void ConfigureNursery(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Nursery>(entity =>
            {
                entity.HasKey(e => e.Id);

                // IDをIDENTITYなしに設定
                entity.Property(e => e.Id).ValueGeneratedNever();

                // Unique constraints
                entity.HasIndex(e => e.PhoneNumber)
                    .IsUnique()
                    .HasDatabaseName("UK_Nurseries_PhoneNumber");

                entity.HasIndex(e => e.Email)
                    .IsUnique()
                    .HasDatabaseName("UK_Nurseries_Email");

                // Search optimization index
                entity.HasIndex(e => e.Name)
                    .HasDatabaseName("IX_Nurseries_Name");

                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Address).IsRequired().HasMaxLength(500);
                entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureAbsenceNotificationResponse(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AbsenceNotificationResponse>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.AbsenceNotificationId);
                entity.HasIndex(e => new { e.NurseryId, e.StaffId });
                entity.HasIndex(e => e.ResponseAt);

                entity.Property(e => e.ResponseType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.ResponseMessage).HasMaxLength(500);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.ResponseAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");


            });
        }

        private void ConfigureDailyReport(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<DailyReport>(entity =>
            {
                entity.HasKey(e => e.Id);

                // PERFORMANCE: Advanced indexes for daily reports
                entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.ReportDate, e.Status })
                    .HasDatabaseName("IX_DailyReports_Child_Date_Status");

                entity.HasIndex(e => new { e.ReportDate, e.Status })
                    .HasDatabaseName("IX_DailyReports_Date_Status")
                    .HasFilter("[Status] = 'published'");

                entity.HasIndex(e => new { e.StaffNurseryId, e.StaffId, e.CreatedAt })
                    .HasDatabaseName("IX_DailyReports_Staff_Created");

                entity.HasIndex(e => new { e.ReportKind, e.ReportDate })
                    .HasDatabaseName("IX_DailyReports_ReportKind_Date");

                entity.Property(e => e.ReportKind).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Content).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.Photos).HasMaxLength(1000);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("draft");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");


            });
        }

        private void ConfigureDailyReportResponse(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<DailyReportResponse>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.DailyReportId);
                entity.HasIndex(e => e.ParentId);
                entity.HasIndex(e => e.IsRead);

                entity.Property(e => e.ResponseMessage).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");


            });
        }

        private void ConfigureEvent(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Event>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Events");

                // インデックス設定
                entity.HasIndex(e => new { e.NurseryId, e.StartDateTime });
                entity.HasIndex(e => e.Category);
                entity.HasIndex(e => e.TargetAudience);
                entity.HasIndex(e => e.IsActive);

                // プロパティ設定
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.NurseryId).IsRequired();
                entity.Property(e => e.TargetGradeLevel);
                entity.Property(e => e.TargetClassId).HasMaxLength(50);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
                entity.Property(e => e.StartDateTime).IsRequired();
                entity.Property(e => e.EndDateTime).IsRequired();
                entity.Property(e => e.IsAllDay).IsRequired().HasDefaultValue(false);
                entity.Property(e => e.RecurrencePattern).IsRequired().HasMaxLength(20).HasDefaultValue("none");
                entity.Property(e => e.TargetAudience).IsRequired().HasMaxLength(20).HasDefaultValue("all");
                entity.Property(e => e.RequiresPreparation).IsRequired().HasDefaultValue(false);
                entity.Property(e => e.PreparationInstructions).HasMaxLength(500);
                entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
                entity.Property(e => e.CreatedBy).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired().HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.LastModified).IsRequired().HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureNotificationSettings(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<NotificationSettings>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.ParentId).IsUnique();
                entity.HasIndex(e => e.DeviceToken);

                entity.Property(e => e.PushNotificationsEnabled).HasDefaultValue(true);
                entity.Property(e => e.AbsenceConfirmationEnabled).HasDefaultValue(true);
                entity.Property(e => e.DailyReportEnabled).HasDefaultValue(true);
                entity.Property(e => e.EventNotificationEnabled).HasDefaultValue(true);
                entity.Property(e => e.AnnouncementEnabled).HasDefaultValue(true);
                entity.Property(e => e.SmsNotificationsEnabled).HasDefaultValue(false);
                entity.Property(e => e.EmailNotificationsEnabled).HasDefaultValue(false);
                entity.Property(e => e.DeviceToken).HasMaxLength(500);
                entity.Property(e => e.DevicePlatform).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");

            });
        }

        private void ConfigureNotificationLog(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<NotificationLog>(entity =>
            {
                entity.HasKey(e => e.Id);

                // PERFORMANCE: Notification log optimization
                entity.HasIndex(e => new { e.ParentId, e.CreatedAt })
                    .HasDatabaseName("IX_NotificationLogs_Parent_Created");

                entity.HasIndex(e => new { e.NotificationType, e.Status, e.CreatedAt })
                    .HasDatabaseName("IX_NotificationLogs_Type_Status_Created");

                entity.HasIndex(e => new { e.RelatedEntityType, e.RelatedEntityId, e.CreatedAt })
                    .HasDatabaseName("IX_NotificationLogs_Entity_Created");

                entity.HasIndex(e => e.CreatedAt)
                    .HasDatabaseName("IX_NotificationLogs_CreatedAt_Cleanup");

                entity.Property(e => e.NotificationType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.DeliveryMethod).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Content).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("pending");
                entity.Property(e => e.ErrorMessage).HasMaxLength(500);
                entity.Property(e => e.RelatedEntityType).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");

            });
        }

        private void ConfigureFamilyMember(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<FamilyMember>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.NurseryId, e.ChildId });
                entity.HasIndex(e => e.ParentId);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.ParentId }).IsUnique();

                entity.Property(e => e.RelationshipType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.CanReceiveNotifications).HasDefaultValue(true);
                entity.Property(e => e.CanViewReports).HasDefaultValue(true);
                entity.Property(e => e.CanViewPhotos).HasDefaultValue(true);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");


            });
        }

        private void ConfigurePhoto(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Photo>(entity =>
            {
                entity.HasKey(e => e.Id);

                // PERFORMANCE: Photo access optimization
                entity.HasIndex(e => new { e.VisibilityLevel, e.Status, e.PublishedAt })
                    .HasDatabaseName("IX_Photos_Visibility_Status_Published")
                    .HasFilter("[Status] = 'published'");

                entity.HasIndex(e => new { e.TargetClassId, e.Status, e.PublishedAt })
                    .HasDatabaseName("IX_Photos_Class_Status_Published")
                    .HasFilter("[Status] = 'published' AND [TargetClassId] IS NOT NULL");

                entity.HasIndex(e => new { e.UploadedByStaffNurseryId, e.UploadedByStaffId, e.UploadedAt })
                    .HasDatabaseName("IX_Photos_Staff_Uploaded");

                entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
                entity.Property(e => e.ThumbnailPath).HasMaxLength(500);
                entity.Property(e => e.OriginalFileName).HasMaxLength(255);
                entity.Property(e => e.MimeType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.VisibilityLevel).IsRequired().HasMaxLength(20).HasDefaultValue("class");
                entity.Property(e => e.TargetClassId).HasMaxLength(50);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("draft");
                entity.Property(e => e.ViewCount).HasDefaultValue(0);
                entity.Property(e => e.DownloadCount).HasDefaultValue(0);
                entity.Property(e => e.UploadedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");

            });
        }

        private void ConfigurePhotoChild(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PhotoChild>(entity =>
            {
                entity.HasKey(e => new { e.PhotoId, e.NurseryId, e.ChildId });
                entity.HasIndex(e => e.PhotoId);
                entity.HasIndex(e => new { e.NurseryId, e.ChildId });
                entity.HasIndex(e => e.IsPrimarySubject);

                entity.Property(e => e.AddedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");


            });
        }

        private void ConfigurePhotoAccess(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PhotoAccess>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.PhotoId);
                entity.HasIndex(e => e.ParentId);
                entity.HasIndex(e => e.AccessType);
                entity.HasIndex(e => e.AccessedAt);

                entity.Property(e => e.AccessType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.IpAddress).HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.AccessedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.IsSuccessful).HasDefaultValue(true);
                entity.Property(e => e.ErrorMessage).HasMaxLength(500);


            });
        }

        private void ConfigurePhotoConsent(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PhotoConsent>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.PhotoId);
                entity.HasIndex(e => new { e.NurseryId, e.ChildId });
                entity.HasIndex(e => e.ParentId);
                entity.HasIndex(e => e.ConsentStatus);
                entity.HasIndex(e => new { e.PhotoId, e.NurseryId, e.ChildId, e.ParentId }).IsUnique();

                entity.Property(e => e.ConsentStatus).IsRequired().HasMaxLength(20).HasDefaultValue("pending");
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.RequestedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.IsActive).HasDefaultValue(true);



            });
        }

        private void ConfigureDeviceRegistration(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<DeviceRegistration>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.DeviceId).IsUnique();
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Platform);
                entity.HasIndex(e => new { e.IsActive, e.LastLoginAt });

                entity.Property(e => e.DeviceId).IsRequired().HasMaxLength(255);
                entity.Property(e => e.UserType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Platform).IsRequired().HasMaxLength(20);
                entity.Property(e => e.PushToken).HasMaxLength(1000);
                entity.Property(e => e.RegistrationId).HasMaxLength(500);
                entity.Property(e => e.DeviceInfo).HasMaxLength(1000);
                entity.Property(e => e.AppVersion).HasMaxLength(50);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureNotificationTemplate(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<NotificationTemplate>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.NotificationType, e.Platform }).IsUnique();
                entity.HasIndex(e => e.NotificationType);
                entity.HasIndex(e => e.Platform);

                entity.Property(e => e.NotificationType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Platform).IsRequired().HasMaxLength(20);
                entity.Property(e => e.TemplateJson).IsRequired().HasColumnType("NVARCHAR(MAX)");
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureAzureNotificationLog(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AzureNotificationLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.DeviceId);
                entity.HasIndex(e => e.NotificationType);
                entity.HasIndex(e => e.SentAt);

                entity.Property(e => e.DeviceId).IsRequired().HasMaxLength(255);
                entity.Property(e => e.NotificationType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Body).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.JsonPayload).HasColumnType("NVARCHAR(MAX)");
                entity.Property(e => e.Platform).IsRequired().HasMaxLength(20);
                entity.Property(e => e.NotificationState).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureRefreshToken(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Token).IsUnique();
                entity.HasIndex(e => e.JwtId);
                entity.HasIndex(e => e.ParentId);
                entity.HasIndex(e => new { e.StaffNurseryId, e.StaffId });
                entity.HasIndex(e => e.ExpiresAt);

                entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
                entity.Property(e => e.JwtId).IsRequired().HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.IsRevoked).HasDefaultValue(false);
                entity.Property(e => e.ClientIpAddress).HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasMaxLength(500);


            });
        }

        private void ConfigureSmsAuthentication(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SmsAuthentication>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.PhoneNumber, e.CreatedAt });
                entity.HasIndex(e => e.ParentId);
                entity.HasIndex(e => new { e.StaffNurseryId, e.StaffId });
                entity.HasIndex(e => e.ExpiresAt);

                entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(15);
                entity.Property(e => e.Code).IsRequired().HasMaxLength(6);
                entity.Property(e => e.HashedCode).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.IsUsed).HasDefaultValue(false);
                entity.Property(e => e.AttemptCount).HasDefaultValue(0);
                entity.Property(e => e.ClientIpAddress).HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasMaxLength(500);


            });
        }

        private void ConfigureAnnouncement(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Announcement>(entity =>
            {
                entity.HasKey(e => e.Id);

                // PERFORMANCE: Announcement indexes
                entity.HasIndex(e => new { e.NurseryId, e.StaffId, e.Status, e.CreatedAt })
                    .HasDatabaseName("IX_Announcements_Staff_Status_Created")
                    .HasFilter("[IsActive] = 1");

                entity.HasIndex(e => new { e.Status, e.PublishedAt })
                    .HasDatabaseName("IX_Announcements_Status_Published")
                    .HasFilter("[Status] = 'published' AND [IsActive] = 1");

                entity.HasIndex(e => new { e.Category, e.Status, e.PublishedAt })
                    .HasDatabaseName("IX_Announcements_Category_Status_Published")
                    .HasFilter("[IsActive] = 1");

                entity.Property(e => e.Title).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Content).IsRequired().HasMaxLength(5000);
                entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
                entity.Property(e => e.TargetScope).IsRequired().HasMaxLength(20);
                entity.Property(e => e.TargetClassId).HasMaxLength(50);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("draft");
                entity.Property(e => e.AllowComments).HasDefaultValue(true);
                entity.Property(e => e.ReadCount).HasDefaultValue(0);
                entity.Property(e => e.CommentCount).HasDefaultValue(0);
                entity.Property(e => e.CreatedByAdminUser).HasDefaultValue(false);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        // ===== デスクトップアプリ用エンティティ設定 =====

        private void ConfigureAcademicYear(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AcademicYear>(entity =>
            {
                // 複合主キー: (NurseryId, Year)
                entity.HasKey(e => new { e.NurseryId, e.Year });

                // 年度検索最適化
                entity.HasIndex(e => new { e.NurseryId, e.IsCurrent })
                    .HasDatabaseName("IX_AcademicYears_Nursery_Current")
                    .HasFilter("[IsCurrent] = 1");

                // 未来年度検索最適化
                entity.HasIndex(e => new { e.NurseryId, e.IsFuture })
                    .HasDatabaseName("IX_AcademicYears_Nursery_Future")
                    .HasFilter("[IsFuture] = 1");

                entity.Property(e => e.IsCurrent).HasDefaultValue(false);
                entity.Property(e => e.IsFuture).HasDefaultValue(false);
                entity.Property(e => e.IsArchived).HasDefaultValue(false);
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureChildClassAssignment(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ChildClassAssignment>(entity =>
            {
                // 複合主キー: (AcademicYear, NurseryId, ChildId)
                entity.HasKey(e => new { e.AcademicYear, e.NurseryId, e.ChildId });

                // クラス別年度別園児一覧検索
                entity.HasIndex(e => new { e.NurseryId, e.ClassId, e.AcademicYear })
                    .HasDatabaseName("IX_ChildClassAssignments_Class_Year");

                // 年度別現在クラス検索
                entity.HasIndex(e => new { e.NurseryId, e.AcademicYear, e.IsCurrent })
                    .HasDatabaseName("IX_ChildClassAssignments_Year_Current")
                    .HasFilter("[IsCurrent] = 1");

                // 年度別未来クラス検索
                entity.HasIndex(e => new { e.NurseryId, e.AcademicYear, e.IsFuture })
                    .HasDatabaseName("IX_ChildClassAssignments_Year_Future")
                    .HasFilter("[IsFuture] = 1");

                entity.Property(e => e.AcademicYear).IsRequired();
                entity.Property(e => e.NurseryId).IsRequired();
                entity.Property(e => e.ChildId).IsRequired();
                entity.Property(e => e.ClassId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.IsCurrent).HasDefaultValue(false);
                entity.Property(e => e.IsFuture).HasDefaultValue(false);
                entity.Property(e => e.AssignedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigurePromotionHistory(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PromotionHistory>(entity =>
            {
                entity.HasKey(e => e.Id);

                // 園児別進級履歴検索
                entity.HasIndex(e => new { e.NurseryId, e.ChildId })
                    .HasDatabaseName("IX_PromotionHistory_Child");

                // 年度別進級履歴
                entity.HasIndex(e => new { e.NurseryId, e.ToAcademicYear })
                    .HasDatabaseName("IX_PromotionHistory_AcademicYear");

                // 進級実行日時検索
                entity.HasIndex(e => new { e.NurseryId, e.PromotedAt })
                    .HasDatabaseName("IX_PromotionHistory_PromotedAt");

                entity.Property(e => e.FromClassId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ToClassId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Notes).HasMaxLength(200);
                entity.Property(e => e.PromotedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureAuditLog(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(e => e.Id);

                // 監査ログ検索最適化
                entity.HasIndex(e => new { e.NurseryId, e.Timestamp })
                    .HasDatabaseName("IX_AuditLogs_Nursery_Timestamp")
                    .IsDescending(false, true);

                entity.HasIndex(e => e.UserId)
                    .HasDatabaseName("IX_AuditLogs_UserId")
                    .HasFilter("[UserId] IS NOT NULL");

                entity.HasIndex(e => e.Action)
                    .HasDatabaseName("IX_AuditLogs_Action");

                entity.HasIndex(e => e.EntityType)
                    .HasDatabaseName("IX_AuditLogs_EntityType");

                entity.Property(e => e.UserName).HasMaxLength(100);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(50);
                entity.Property(e => e.EntityType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.EntityId).HasMaxLength(50);
                entity.Property(e => e.BeforeValue).HasColumnType("NVARCHAR(MAX)");
                entity.Property(e => e.AfterValue).HasColumnType("NVARCHAR(MAX)");
                entity.Property(e => e.IpAddress).HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.Timestamp).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureDailyAttendance(ModelBuilder modelBuilder)
        {
            // DailyAttendances configuration
            modelBuilder.Entity<DailyAttendance>(entity =>
            {
                // 複合主キー (NurseryId, ChildId, AttendanceDate)
                entity.HasKey(e => new { e.NurseryId, e.ChildId, e.AttendanceDate });

                // パフォーマンス最適化インデックス
                entity.HasIndex(e => new { e.NurseryId, e.AttendanceDate, e.Status })
                    .HasDatabaseName("IX_DailyAttendances_Date_Status");

                entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.AttendanceDate })
                    .HasDatabaseName("IX_DailyAttendances_Child_Date")
                    .IsDescending(false, false, true); // 日付降順

                entity.HasIndex(e => e.AbsenceNotificationId)
                    .HasDatabaseName("IX_DailyAttendances_AbsenceNotification")
                    .HasFilter("[AbsenceNotificationId] IS NOT NULL");

                entity.HasIndex(e => new { e.NurseryId, e.IsActive })
                    .HasDatabaseName("IX_DailyAttendances_IsActive")
                    .HasFilter("[IsActive] = 1");

                // カラム設定
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("blank");
                entity.Property(e => e.ArrivalTime).HasColumnType("TIME");
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.RecordedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.IsActive).HasDefaultValue(true);
            });
        }

        private void ConfigureApplicationWork(ModelBuilder modelBuilder)
        {
            // ApplicationWork configuration
            modelBuilder.Entity<ApplicationWork>(entity =>
            {
                entity.HasKey(e => e.Id);

                // パフォーマンス最適化インデックス
                entity.HasIndex(e => e.NurseryId)
                    .HasDatabaseName("IX_ApplicationWork_NurseryId");

                entity.HasIndex(e => e.MobilePhone)
                    .HasDatabaseName("IX_ApplicationWork_MobilePhone");

                entity.HasIndex(e => e.ApplicationStatus)
                    .HasDatabaseName("IX_ApplicationWork_ApplicationStatus");

                entity.HasIndex(e => e.IsImported)
                    .HasDatabaseName("IX_ApplicationWork_IsImported");

                entity.HasIndex(e => e.CreatedAt)
                    .HasDatabaseName("IX_ApplicationWork_CreatedAt")
                    .IsDescending(true);

                // カラム設定
                entity.Property(e => e.ApplicantName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ApplicantNameKana).IsRequired().HasMaxLength(100);
                entity.Property(e => e.DateOfBirth).IsRequired();
                entity.Property(e => e.PostalCode).HasMaxLength(8);
                entity.Property(e => e.Prefecture).HasMaxLength(10);
                entity.Property(e => e.City).HasMaxLength(50);
                entity.Property(e => e.AddressLine).HasMaxLength(200);
                entity.Property(e => e.MobilePhone).IsRequired().HasMaxLength(20);
                entity.Property(e => e.HomePhone).HasMaxLength(20);
                entity.Property(e => e.Email).HasMaxLength(255);
                entity.Property(e => e.RelationshipToChild).IsRequired().HasMaxLength(20);

                entity.Property(e => e.ChildFamilyName).IsRequired().HasMaxLength(20);
                entity.Property(e => e.ChildFirstName).IsRequired().HasMaxLength(20);
                entity.Property(e => e.ChildFamilyNameKana).IsRequired().HasMaxLength(20);
                entity.Property(e => e.ChildFirstNameKana).IsRequired().HasMaxLength(20);
                entity.Property(e => e.ChildDateOfBirth).IsRequired();
                entity.Property(e => e.ChildGender).IsRequired().HasMaxLength(2);
                entity.Property(e => e.ChildBloodType).HasMaxLength(10);
                entity.Property(e => e.ChildAllergy).HasMaxLength(200);
                entity.Property(e => e.ChildMedicalNotes).HasMaxLength(500);
                entity.Property(e => e.ChildSpecialInstructions).HasMaxLength(500);

                entity.Property(e => e.ApplicationStatus).IsRequired().HasMaxLength(20).HasDefaultValue("Pending");
                entity.Property(e => e.IsImported).IsRequired().HasDefaultValue(false);
                entity.Property(e => e.RejectionReason).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });

            // 献立管理エンティティの設定
            // MenuMaster, DailyMenu にはナビゲーションプロパティがないため、
            // Ignoreの設定は不要（外部キー制約を作成しない方針を維持）
        }

        // ===== 乳児生活記録用エンティティ設定 =====

        private void ConfigureInfantTemperature(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<InfantTemperature>(entity =>
            {
                // 複合主キー: (NurseryId, ChildId, RecordDate, MeasurementType)
                entity.HasKey(e => new { e.NurseryId, e.ChildId, e.RecordDate, e.MeasurementType });

                // CreatedByTypeによる検索最適化
                entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.RecordDate, e.CreatedByType })
                    .HasDatabaseName("IX_InfantTemperatures_CreatedByType");

                entity.Property(e => e.MeasurementType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Temperature).HasColumnType("decimal(3,1)").IsRequired();
                entity.Property(e => e.CreatedByType).IsRequired().HasMaxLength(20).HasDefaultValue("Staff");
                entity.Property(e => e.IsAbnormal).HasDefaultValue(false);
                entity.Property(e => e.IsDraft).HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureParentMorningNote(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ParentMorningNote>(entity =>
            {
                // 複合主キー: (NurseryId, ChildId, RecordDate)
                entity.HasKey(e => new { e.NurseryId, e.ChildId, e.RecordDate });

                // 子供と日付による検索最適化
                entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.RecordDate })
                    .HasDatabaseName("IX_ParentMorningNote_Child_Date");

                entity.Property(e => e.Note).IsRequired().HasMaxLength(500);
                entity.Property(e => e.IsDraft).HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureInfantMeal(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<InfantMeal>(entity =>
            {
                // 複合主キー: (NurseryId, ChildId, RecordDate, MealTime)
                entity.HasKey(e => new { e.NurseryId, e.ChildId, e.RecordDate, e.MealTime });

                entity.Property(e => e.MealType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.MealTime).IsRequired();
                entity.Property(e => e.OverallAmount).HasMaxLength(20);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureInfantMood(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<InfantMood>(entity =>
            {
                // 複合主キー: (NurseryId, ChildId, RecordDate, RecordTime)
                entity.HasKey(e => new { e.NurseryId, e.ChildId, e.RecordDate, e.RecordTime });

                entity.Property(e => e.RecordTime).IsRequired();
                entity.Property(e => e.MoodState).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureInfantSleep(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<InfantSleep>(entity =>
            {
                // 複合主キー: (NurseryId, ChildId, RecordDate, SleepSequence)
                entity.HasKey(e => new { e.NurseryId, e.ChildId, e.RecordDate, e.SleepSequence });

                entity.Property(e => e.SleepSequence).IsRequired().HasDefaultValue(1);
                entity.Property(e => e.SleepQuality).HasMaxLength(20);
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureInfantToileting(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<InfantToileting>(entity =>
            {
                // 複合主キー: (NurseryId, ChildId, RecordDate, ToiletingTime)
                entity.HasKey(e => new { e.NurseryId, e.ChildId, e.RecordDate, e.ToiletingTime });

                // 時刻による検索最適化
                entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.RecordDate, e.ToiletingTime })
                    .HasDatabaseName("IX_InfantToileting_Record");

                entity.HasIndex(e => e.ToiletingTime)
                    .HasDatabaseName("IX_InfantToileting_Time");

                entity.Property(e => e.HasUrine).IsRequired();
                entity.Property(e => e.UrineAmount).HasMaxLength(20);
                entity.Property(e => e.HasStool).IsRequired();
                entity.Property(e => e.BowelAmount).HasMaxLength(20);
                entity.Property(e => e.BowelCondition).HasMaxLength(20);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureInfantMilk(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<InfantMilk>(entity =>
            {
                // 複合主キー: (NurseryId, ChildId, RecordDate, MilkTime)
                entity.HasKey(e => new { e.NurseryId, e.ChildId, e.RecordDate, e.MilkTime });

                // 検索最適化インデックス
                entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.RecordDate })
                    .HasDatabaseName("IX_InfantMilk_Record");

                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureInfantSleepCheck(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<InfantSleepCheck>(entity =>
            {
                // 主キー: ID (IDENTITY)
                entity.HasKey(e => e.Id);

                // 複合インデックス: 園児と日付による検索最適化
                entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.RecordDate, e.SleepSequence })
                    .HasDatabaseName("IX_InfantSleepCheck_Record");

                // チェック時刻による検索最適化
                entity.HasIndex(e => new { e.RecordDate, e.CheckTime })
                    .HasDatabaseName("IX_InfantSleepCheck_Time");

                entity.Property(e => e.BreathingStatus).IsRequired().HasMaxLength(20);
                entity.Property(e => e.HeadDirection).IsRequired().HasMaxLength(20);
                entity.Property(e => e.BodyTemperature).IsRequired().HasMaxLength(20);
                entity.Property(e => e.FaceColor).IsRequired().HasMaxLength(20);
                entity.Property(e => e.BodyPosition).IsRequired().HasMaxLength(20);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }

        private void ConfigureRoomEnvironmentRecord(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<RoomEnvironmentRecord>(entity =>
            {
                // 複合主キー: (NurseryId, ClassId, RecordDate)
                entity.HasKey(e => new { e.NurseryId, e.ClassId, e.RecordDate });

                // 日付と記録時刻による検索最適化
                entity.HasIndex(e => new { e.RecordDate, e.RecordedAt })
                    .HasDatabaseName("IX_RoomEnvironment_DateTime");

                // クラスと日付による検索最適化
                entity.HasIndex(e => new { e.NurseryId, e.ClassId, e.RecordDate })
                    .HasDatabaseName("IX_RoomEnvironment_ClassDate");

                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("[dbo].[GetJstDateTime]()");
            });
        }
    }
}