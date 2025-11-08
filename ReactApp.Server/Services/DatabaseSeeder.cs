using ReactApp.Server.Data;
using ReactApp.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// データベースシーディングサービス
    /// モックデータの代わりにデータベースに実際のテストデータを投入する
    /// </summary>
    public class DatabaseSeeder
    {
        private readonly KindergartenDbContext _context;

        public DatabaseSeeder(KindergartenDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// テストデータをデータベースに投入
        /// </summary>
        public async Task SeedAsync()
        {
            try
            {
                // DailyReportsテーブルにカラムが存在しない場合は追加
                await EnsureDailyReportsColumnsExistAsync();

                // 既存のテストデータをクリア
                await ClearExistingDataAsync();

                // スタッフデータを投入
                await SeedStaffAsync();

                // 保護者データを投入
                await SeedParentsAsync();

                // 園児データを投入
                await SeedChildrenAsync();

                // 保護者-園児関係を投入
                await SeedParentChildRelationshipsAsync();

                // 欠席連絡データを投入
                await SeedAbsenceNotificationsAsync();

                // 日報データを投入
                await SeedDailyReportsAsync();

                // イベントデータを投入
                await SeedEventsAsync();

                // 家族メンバーデータを投入
                await SeedFamilyMembersAsync();

                // 写真データを投入（後で実装）
                // await SeedPhotosAsync();

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"データシーディング中にエラーが発生しました: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// DailyReportsテーブルに ParentAcknowledged と AcknowledgedAt カラムが存在することを確認
        /// 存在しない場合は追加する
        /// </summary>
        private async Task EnsureDailyReportsColumnsExistAsync()
        {
            try
            {
                // ParentAcknowledged カラムを追加
                await _context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
                                   WHERE TABLE_NAME = 'DailyReports' AND COLUMN_NAME = 'ParentAcknowledged')
                    BEGIN
                        ALTER TABLE [DailyReports] ADD [ParentAcknowledged] BIT NOT NULL DEFAULT 0;
                    END
                ");

                // AcknowledgedAt カラムを追加
                await _context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
                                   WHERE TABLE_NAME = 'DailyReports' AND COLUMN_NAME = 'AcknowledgedAt')
                    BEGIN
                        ALTER TABLE [DailyReports] ADD [AcknowledgedAt] DATETIME2 NULL;
                    END
                ");
            }
            catch (Exception ex)
            {
                // カラムが既に存在する場合はエラーを無視
                Console.WriteLine($"DailyReportsカラム追加処理: {ex.Message}");
            }
        }

        private async Task ClearExistingDataAsync()
        {
            // 関連データを順序に従って削除
            _context.Photos.RemoveRange(_context.Photos);
            _context.DailyReports.RemoveRange(_context.DailyReports);
            _context.Events.RemoveRange(_context.Events);
            _context.FamilyMembers.RemoveRange(_context.FamilyMembers);
            _context.AbsenceNotifications.RemoveRange(_context.AbsenceNotifications);
            _context.ParentChildRelationships.RemoveRange(_context.ParentChildRelationships);
            _context.Children.RemoveRange(_context.Children);
            _context.Parents.RemoveRange(_context.Parents);
            _context.Staff.RemoveRange(_context.Staff);

            await _context.SaveChangesAsync();
        }

        private async Task SeedStaffAsync()
        {
            var staff = new List<Staff>
            {
                new Staff
                {
                    Name = "佐藤美咲",
                    PhoneNumber = "090-1234-5678",
                    Email = "misaki.sato@kindergarten.jp",
                    Role = "teacher",
                    Position = "主任保育士",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Staff
                {
                    Name = "田中健太",
                    PhoneNumber = "090-2345-6789",
                    Email = "kenta.tanaka@kindergarten.jp",
                    Role = "teacher",
                    Position = "保育士",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Staff
                {
                    Name = "山田花子",
                    PhoneNumber = "090-3456-7890",
                    Email = "hanako.yamada@kindergarten.jp",
                    Role = "teacher",
                    Position = "保育士",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Staff
                {
                    Name = "鈴木太郎",
                    PhoneNumber = "090-4567-8901",
                    Email = "taro.suzuki@kindergarten.jp",
                    Role = "admin",
                    Position = "園長",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Staff
                {
                    Name = "高橋由美",
                    PhoneNumber = "090-5678-9012",
                    Email = "yumi.takahashi@kindergarten.jp",
                    Role = "admin",
                    Position = "副園長",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Staff
                {
                    Name = "渡辺直子",
                    PhoneNumber = "090-6789-0123",
                    Email = "naoko.watanabe@kindergarten.jp",
                    Role = "teacher",
                    Position = "保育士",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            _context.Staff.AddRange(staff);
            await _context.SaveChangesAsync();
        }

        private async Task SeedParentsAsync()
        {
            var parents = new List<Parent>
            {
                new Parent { PhoneNumber = "090-1111-1111", Name = "田中花子", Email = "hanako.tanaka@example.com", CreatedAt = DateTime.UtcNow },
                new Parent { PhoneNumber = "090-2222-2222", Name = "田中一郎", Email = "ichiro.tanaka@example.com", CreatedAt = DateTime.UtcNow },
                new Parent { PhoneNumber = "090-3333-3333", Name = "佐藤美咲", Email = "misaki.sato@example.com", CreatedAt = DateTime.UtcNow },
                new Parent { PhoneNumber = "090-4444-4444", Name = "山田太郎", Email = "taro.yamada@example.com", CreatedAt = DateTime.UtcNow },
                new Parent { PhoneNumber = "090-5555-5555", Name = "鈴木由美", Email = "yumi.suzuki@example.com", CreatedAt = DateTime.UtcNow },
                new Parent { PhoneNumber = "090-6666-6666", Name = "高橋結愛", Email = "yua.takahashi@example.com", CreatedAt = DateTime.UtcNow },
                new Parent { PhoneNumber = "090-7777-7777", Name = "伊藤和子", Email = "kazuko.ito@example.com", CreatedAt = DateTime.UtcNow },
                new Parent { PhoneNumber = "090-8888-8888", Name = "中村健一", Email = "kenichi.nakamura@example.com", CreatedAt = DateTime.UtcNow }
            };

            _context.Parents.AddRange(parents);
            await _context.SaveChangesAsync();
        }

        private async Task SeedChildrenAsync()
        {
            var children = new List<Child>
            {
                new Child { Name = "田中太郎", DateOfBirth = new DateTime(2019, 4, 15), Gender = "Male", CreatedAt = DateTime.UtcNow },
                new Child { Name = "田中花音", DateOfBirth = new DateTime(2019, 6, 22), Gender = "Female", CreatedAt = DateTime.UtcNow },
                new Child { Name = "佐藤次郎", DateOfBirth = new DateTime(2020, 3, 10), Gender = "Male", CreatedAt = DateTime.UtcNow },
                new Child { Name = "山田美琴", DateOfBirth = new DateTime(2020, 7, 18), Gender = "Female", CreatedAt = DateTime.UtcNow },
                new Child { Name = "鈴木和也", DateOfBirth = new DateTime(2019, 11, 5), Gender = "Male", CreatedAt = DateTime.UtcNow },
                new Child { Name = "高橋結愛", DateOfBirth = new DateTime(2020, 1, 20), Gender = "Female", CreatedAt = DateTime.UtcNow },
                new Child { Name = "伊藤大輝", DateOfBirth = new DateTime(2019, 9, 12), Gender = "Male", CreatedAt = DateTime.UtcNow },
                new Child { Name = "中村咲良", DateOfBirth = new DateTime(2020, 5, 30), Gender = "Female", CreatedAt = DateTime.UtcNow }
            };

            _context.Children.AddRange(children);
            await _context.SaveChangesAsync();
        }

        private async Task SeedParentChildRelationshipsAsync()
        {
            // Get the actual parent and child IDs from the database
            var parents = await _context.Parents.OrderBy(p => p.Id).ToListAsync();
            var children = await _context.Children.OrderBy(c => c.ChildId).ToListAsync();

            if (parents.Count < 8 || children.Count < 8)
            {
                throw new InvalidOperationException("Not enough parents or children found for creating relationships");
            }

            var relationships = new List<ParentChildRelationship>
            {
                new ParentChildRelationship { ParentId = parents[0].Id, NurseryId = children[0].NurseryId, ChildId = children[0].ChildId, RelationshipType = "mother", IsPrimaryContact = true, HasPickupPermission = true, CanReceiveEmergencyNotifications = true, CreatedAt = DateTime.UtcNow },
                new ParentChildRelationship { ParentId = parents[1].Id, NurseryId = children[0].NurseryId, ChildId = children[0].ChildId, RelationshipType = "father", IsPrimaryContact = false, HasPickupPermission = true, CanReceiveEmergencyNotifications = true, CreatedAt = DateTime.UtcNow },
                new ParentChildRelationship { ParentId = parents[0].Id, NurseryId = children[1].NurseryId, ChildId = children[1].ChildId, RelationshipType = "mother", IsPrimaryContact = true, HasPickupPermission = true, CanReceiveEmergencyNotifications = true, CreatedAt = DateTime.UtcNow },
                new ParentChildRelationship { ParentId = parents[1].Id, NurseryId = children[1].NurseryId, ChildId = children[1].ChildId, RelationshipType = "father", IsPrimaryContact = false, HasPickupPermission = true, CanReceiveEmergencyNotifications = true, CreatedAt = DateTime.UtcNow },
                new ParentChildRelationship { ParentId = parents[2].Id, NurseryId = children[2].NurseryId, ChildId = children[2].ChildId, RelationshipType = "mother", IsPrimaryContact = true, HasPickupPermission = true, CanReceiveEmergencyNotifications = true, CreatedAt = DateTime.UtcNow },
                new ParentChildRelationship { ParentId = parents[3].Id, NurseryId = children[3].NurseryId, ChildId = children[3].ChildId, RelationshipType = "father", IsPrimaryContact = true, HasPickupPermission = true, CanReceiveEmergencyNotifications = true, CreatedAt = DateTime.UtcNow },
                new ParentChildRelationship { ParentId = parents[4].Id, NurseryId = children[4].NurseryId, ChildId = children[4].ChildId, RelationshipType = "mother", IsPrimaryContact = true, HasPickupPermission = true, CanReceiveEmergencyNotifications = true, CreatedAt = DateTime.UtcNow },
                new ParentChildRelationship { ParentId = parents[5].Id, NurseryId = children[5].NurseryId, ChildId = children[5].ChildId, RelationshipType = "mother", IsPrimaryContact = true, HasPickupPermission = true, CanReceiveEmergencyNotifications = true, CreatedAt = DateTime.UtcNow },
                new ParentChildRelationship { ParentId = parents[6].Id, NurseryId = children[6].NurseryId, ChildId = children[6].ChildId, RelationshipType = "mother", IsPrimaryContact = true, HasPickupPermission = true, CanReceiveEmergencyNotifications = true, CreatedAt = DateTime.UtcNow },
                new ParentChildRelationship { ParentId = parents[7].Id, NurseryId = children[7].NurseryId, ChildId = children[7].ChildId, RelationshipType = "father", IsPrimaryContact = true, HasPickupPermission = true, CanReceiveEmergencyNotifications = true, CreatedAt = DateTime.UtcNow }
            };

            _context.ParentChildRelationships.AddRange(relationships);
            await _context.SaveChangesAsync();
        }

        private async Task SeedAbsenceNotificationsAsync()
        {
            // Get the actual parent and child IDs from the database
            var parents = await _context.Parents.OrderBy(p => p.Id).ToListAsync();
            var children = await _context.Children.OrderBy(c => c.ChildId).ToListAsync();

            if (parents.Count < 6 || children.Count < 6)
            {
                throw new InvalidOperationException("Not enough parents or children found for creating absence notifications");
            }

            var notifications = new List<AbsenceNotification>
            {
                new AbsenceNotification
                {
                    ParentId = parents[5].Id, NurseryId = children[5].NurseryId, ChildId = children[5].ChildId, NotificationType = "absence", Reason = "illness",
                    Ymd = new DateTime(2024, 1, 15),
                    AdditionalNotes = "体調不良のため本日欠席いたします。熱が38.5度あり、病院を受診予定です。",
                    SubmittedAt = new DateTime(2024, 1, 15, 7, 30, 0),
                    Status = "submitted"
                },
                new AbsenceNotification
                {
                    ParentId = parents[2].Id, NurseryId = children[2].NurseryId, ChildId = children[2].ChildId, NotificationType = "lateness", Reason = "other",
                    Ymd = new DateTime(2024, 1, 16),
                    ExpectedArrivalTime = new TimeSpan(9, 0, 0),
                    AdditionalNotes = "電車の遅延により、30分程度遅れる予定です。申し訳ございません。",
                    SubmittedAt = new DateTime(2024, 1, 16, 8, 15, 0),
                    Status = "acknowledged",
                    AcknowledgedAt = new DateTime(2024, 1, 16, 8, 20, 0)
                },
                new AbsenceNotification
                {
                    ParentId = parents[0].Id, NurseryId = children[0].NurseryId, ChildId = children[0].ChildId, NotificationType = "absence", Reason = "familyEvent",
                    Ymd = new DateTime(2024, 1, 17),
                    AdditionalNotes = "家族の用事により本日お休みさせていただきます。",
                    SubmittedAt = new DateTime(2024, 1, 17, 7, 45, 0),
                    Status = "submitted"
                },
                // childId=8 用のテストデータ（保護者ID 15: 坂本和也）
                new AbsenceNotification
                {
                    ParentId = 15,
                    NurseryId = 1,
                    ChildId = 8,
                    NotificationType = "absence",
                    Reason = "illness",
                    Ymd = DateTime.Today.AddDays(-2),
                    AdditionalNotes = "風邪のため、本日はお休みさせていただきます。",
                    SubmittedAt = DateTime.Today.AddDays(-2).AddHours(7),
                    Status = "replied",
                    AcknowledgedAt = DateTime.Today.AddDays(-2).AddHours(8),
                    StaffResponse = "お大事にしてください。体調が回復したらまたお待ちしております。"
                },
                new AbsenceNotification
                {
                    ParentId = 15,
                    NurseryId = 1,
                    ChildId = 8,
                    NotificationType = "lateness",
                    Reason = "other",
                    Ymd = DateTime.Today.AddDays(-1),
                    ExpectedArrivalTime = new TimeSpan(9, 30, 0),
                    AdditionalNotes = "病院の予約があるため、9時30分頃に登園します。",
                    SubmittedAt = DateTime.Today.AddDays(-1).AddHours(7).AddMinutes(15),
                    Status = "acknowledged",
                    AcknowledgedAt = DateTime.Today.AddDays(-1).AddHours(7).AddMinutes(20)
                },
                new AbsenceNotification
                {
                    ParentId = 15,
                    NurseryId = 1,
                    ChildId = 8,
                    NotificationType = "pickup",
                    Reason = "other",
                    Ymd = DateTime.Today,
                    ExpectedArrivalTime = new TimeSpan(15, 0, 0),
                    AdditionalNotes = "本日は15時にお迎えに参ります。",
                    SubmittedAt = DateTime.Today.AddHours(7),
                    Status = "replied",
                    AcknowledgedAt = DateTime.Today.AddHours(7).AddMinutes(5),
                    StaffResponse = "承知いたしました。15時にお待ちしております。"
                }
            };

            _context.AbsenceNotifications.AddRange(notifications);
            await _context.SaveChangesAsync();
        }

        private async Task SeedDailyReportsAsync()
        {
            // Get the actual staff and child IDs from the database
            var staff = await _context.Staff.OrderBy(s => s.StaffId).ToListAsync();
            var children = await _context.Children.OrderBy(c => c.ChildId).ToListAsync();

            if (staff.Count < 2 || children.Count < 4)
            {
                throw new InvalidOperationException("Not enough staff or children found for creating daily reports");
            }

            var reports = new List<DailyReport>
            {
                new DailyReport
                {
                    NurseryId = children[0].NurseryId, ChildId = children[0].ChildId, StaffId = staff[0].StaffId, ReportDate = new DateTime(2024, 1, 15),
                    ReportKind = "activity", Title = "積み木遊び", Content = "今日は積み木遊びを楽しんでいました。お友達と協力して大きなお城を作っていました。",
                    Status = "published", PublishedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow
                },
                new DailyReport
                {
                    NurseryId = children[1].NurseryId, ChildId = children[1].ChildId, StaffId = staff[1].StaffId, ReportDate = new DateTime(2024, 1, 15),
                    ReportKind = "meal", Title = "給食の様子", Content = "給食は完食でした。苦手な野菜も頑張って食べていました。",
                    Status = "published", PublishedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow
                },
                new DailyReport
                {
                    NurseryId = children[2].NurseryId, ChildId = children[2].ChildId, StaffId = staff[0].StaffId, ReportDate = new DateTime(2024, 1, 16),
                    ReportKind = "health", Title = "健康状態", Content = "元気に過ごしています。鼻水が少し出ていますが、熱はありません。",
                    Status = "published", PublishedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow
                },
                new DailyReport
                {
                    NurseryId = children[3].NurseryId, ChildId = children[3].ChildId, StaffId = staff[1].StaffId, ReportDate = new DateTime(2024, 1, 16),
                    ReportKind = "activity", Title = "お絵描き活動", Content = "お絵描きに夢中になって取り組んでいました。色使いがとても上手です。",
                    Status = "published", PublishedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow
                }
            };

            _context.DailyReports.AddRange(reports);
            await _context.SaveChangesAsync();
        }

        private async Task SeedEventsAsync()
        {
            var events = new List<Event>
            {
                new Event
                {
                    Title = "新年お楽しみ会", Description = "新年の始まりをお祝いする楽しい会です。",
                    StartDateTime = new DateTime(2024, 1, 25, 10, 0, 0), EndDateTime = new DateTime(2024, 1, 25, 11, 30, 0),
                    Category = "school_event", IsAllDay = false, CreatedBy = "システム管理者",
                    NurseryId = 1, CreatedAt = DateTime.UtcNow, LastModified = DateTime.UtcNow
                },
                new Event
                {
                    Title = "節分豆まき", Description = "鬼退治をして福を呼び込みましょう。",
                    StartDateTime = new DateTime(2024, 2, 3, 10, 30, 0), EndDateTime = new DateTime(2024, 2, 3, 11, 0, 0),
                    Category = "school_event", IsAllDay = false, CreatedBy = "システム管理者",
                    NurseryId = 1, CreatedAt = DateTime.UtcNow, LastModified = DateTime.UtcNow
                },
                new Event
                {
                    Title = "身体測定", Description = "1月の身長・体重測定を行います。",
                    StartDateTime = new DateTime(2024, 1, 30, 9, 0, 0), EndDateTime = new DateTime(2024, 1, 30, 11, 0, 0),
                    Category = "daily_schedule", IsAllDay = false, CreatedBy = "システム管理者",
                    NurseryId = 1, CreatedAt = DateTime.UtcNow, LastModified = DateTime.UtcNow
                }
            };

            _context.Events.AddRange(events);
            await _context.SaveChangesAsync();
        }

        private async Task SeedFamilyMembersAsync()
        {
            // Get the actual parent and child IDs from the database
            var parents = await _context.Parents.OrderBy(p => p.Id).ToListAsync();
            var children = await _context.Children.OrderBy(c => c.ChildId).ToListAsync();

            if (parents.Count < 3 || children.Count < 3)
            {
                throw new InvalidOperationException("Not enough parents or children found for creating family members");
            }

            var familyMembers = new List<FamilyMember>
            {
                new FamilyMember { ParentId = parents[0].Id, NurseryId = children[0].NurseryId, ChildId = children[0].ChildId, RelationshipType = "mother", DisplayName = "田中花子", IsPrimaryContact = true, CreatedAt = DateTime.UtcNow },
                new FamilyMember { ParentId = parents[1].Id, NurseryId = children[0].NurseryId, ChildId = children[0].ChildId, RelationshipType = "father", DisplayName = "田中一郎", IsPrimaryContact = false, CreatedAt = DateTime.UtcNow },
                new FamilyMember { ParentId = parents[0].Id, NurseryId = children[1].NurseryId, ChildId = children[1].ChildId, RelationshipType = "mother", DisplayName = "田中花子", IsPrimaryContact = true, CreatedAt = DateTime.UtcNow },
                new FamilyMember { ParentId = parents[1].Id, NurseryId = children[1].NurseryId, ChildId = children[1].ChildId, RelationshipType = "father", DisplayName = "田中一郎", IsPrimaryContact = false, CreatedAt = DateTime.UtcNow },
                new FamilyMember { ParentId = parents[2].Id, NurseryId = children[2].NurseryId, ChildId = children[2].ChildId, RelationshipType = "mother", DisplayName = "佐藤美咲", IsPrimaryContact = true, CreatedAt = DateTime.UtcNow }
            };

            _context.FamilyMembers.AddRange(familyMembers);
            await _context.SaveChangesAsync();
        }

        // TODO: 写真データの投入は後で実装
        // PhotoChildrenテーブル作成後に正しく実装する
    }
}