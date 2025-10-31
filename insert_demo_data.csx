// C# Script to insert demo calendar events
// Run with: dotnet script insert_demo_data.csx

#r "nuget: Microsoft.Data.SqlClient, 5.1.0"

using Microsoft.Data.SqlClient;
using System;

var connectionString = "Data Source=.\\SQLEXPRESS;Initial Catalog=KindergartenDB;Integrated Security=True;TrustServerCertificate=True";

Console.WriteLine("カレンダーイベントのデモデータを挿入します...");

try
{
    using var connection = new SqlConnection(connectionString);
    connection.Open();

    var today = DateTime.Today;
    var thisMonthStart = new DateTime(today.Year, today.Month, 1);
    var nextMonthStart = thisMonthStart.AddMonths(1);

    var sql = @"
-- 全日イベント（全体お知らせ）
INSERT INTO Events (NurseryId, TargetGradeLevel, TargetClassId, Title, Description, Category, StartDateTime, EndDateTime, IsAllDay, RecurrencePattern, TargetAudience, RequiresPreparation, PreparationInstructions, IsActive, CreatedBy, CreatedAt, LastModified)
VALUES
(1, NULL, NULL, '保護者会総会', '年度初めの保護者会総会を開催します', 'general_announcement', @event1Start, @event1End, 1, 'none', 'all', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),
(1, NULL, NULL, '避難訓練', '火災を想定した避難訓練を実施します', 'general_event', @event2Start, @event2End, 1, 'none', 'all', 1, '防災頭巾を準備してください', 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),
(1, NULL, NULL, '園休日（創立記念日）', '創立記念日のため休園です', 'nursery_holiday', @event3Start, @event3End, 1, 'none', 'all', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE());

-- 時間指定イベント（クラス活動）
INSERT INTO Events (NurseryId, TargetGradeLevel, TargetClassId, Title, Description, Category, StartDateTime, EndDateTime, IsAllDay, RecurrencePattern, TargetAudience, RequiresPreparation, PreparationInstructions, IsActive, CreatedBy, CreatedAt, LastModified)
VALUES
(1, NULL, '1-A', '体操教室', '専門講師による体操教室', 'class_activity', @event4Start, @event4End, 0, 'none', 'specific_class', 1, '運動しやすい服装でお願いします', 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),
(1, NULL, '2-B', '英語教室', 'ネイティブ講師による英語レッスン', 'class_activity', @event5Start, @event5End, 0, 'none', 'specific_class', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),
(1, NULL, '1-A', '音楽教室', 'リトミックと楽器遊び', 'class_activity', @event6Start, @event6End, 0, 'none', 'specific_class', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE());

-- 学年活動
INSERT INTO Events (NurseryId, TargetGradeLevel, TargetClassId, Title, Description, Category, StartDateTime, EndDateTime, IsAllDay, RecurrencePattern, TargetAudience, RequiresPreparation, PreparationInstructions, IsActive, CreatedBy, CreatedAt, LastModified)
VALUES
(1, 3, NULL, '年長組遠足', '動物園への遠足', 'grade_activity', @event7Start, @event7End, 1, 'none', 'all', 1, 'お弁当、水筒、帽子をご用意ください', 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),
(1, 2, NULL, '年中組プール開始', 'プール活動開始日', 'grade_activity', @event8Start, @event8End, 1, 'none', 'all', 1, '水着・タオル・ゴーグルをご用意ください', 1, 'デモデータ', GETUTCDATE(), GETUTCDATE());

-- 全体行事
INSERT INTO Events (NurseryId, TargetGradeLevel, TargetClassId, Title, Description, Category, StartDateTime, EndDateTime, IsAllDay, RecurrencePattern, TargetAudience, RequiresPreparation, PreparationInstructions, IsActive, CreatedBy, CreatedAt, LastModified)
VALUES
(1, NULL, NULL, '誕生日会', '今月のお誕生日会', 'general_event', @event9Start, @event9End, 0, 'none', 'all', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),
(1, NULL, NULL, '身体測定', '身長・体重測定', 'general_event', @event10Start, @event10End, 0, 'none', 'all', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE());

-- 来月のイベント
INSERT INTO Events (NurseryId, TargetGradeLevel, TargetClassId, Title, Description, Category, StartDateTime, EndDateTime, IsAllDay, RecurrencePattern, TargetAudience, RequiresPreparation, PreparationInstructions, IsActive, CreatedBy, CreatedAt, LastModified)
VALUES
(1, NULL, NULL, '運動会', '秋の大運動会', 'general_event', @event11Start, @event11End, 1, 'none', 'all', 1, '運動しやすい服装、水筒、お弁当をご持参ください', 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),
(1, NULL, NULL, '個人面談期間', '個人面談を実施します（予約制）', 'general_announcement', @event12Start, @event12End, 1, 'none', 'all', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE());
";

    using var command = new SqlCommand(sql, connection);

    // パラメータ設定
    command.Parameters.AddWithValue("@event1Start", thisMonthStart.AddDays(5));
    command.Parameters.AddWithValue("@event1End", thisMonthStart.AddDays(5));

    command.Parameters.AddWithValue("@event2Start", thisMonthStart.AddDays(10));
    command.Parameters.AddWithValue("@event2End", thisMonthStart.AddDays(10));

    command.Parameters.AddWithValue("@event3Start", thisMonthStart.AddDays(15));
    command.Parameters.AddWithValue("@event3End", thisMonthStart.AddDays(15));

    command.Parameters.AddWithValue("@event4Start", thisMonthStart.AddDays(3).AddHours(10));
    command.Parameters.AddWithValue("@event4End", thisMonthStart.AddDays(3).AddHours(11));

    command.Parameters.AddWithValue("@event5Start", thisMonthStart.AddDays(4).AddHours(14));
    command.Parameters.AddWithValue("@event5End", thisMonthStart.AddDays(4).AddHours(15));

    command.Parameters.AddWithValue("@event6Start", thisMonthStart.AddDays(7).AddHours(13));
    command.Parameters.AddWithValue("@event6End", thisMonthStart.AddDays(7).AddHours(14));

    command.Parameters.AddWithValue("@event7Start", thisMonthStart.AddDays(12));
    command.Parameters.AddWithValue("@event7End", thisMonthStart.AddDays(12));

    command.Parameters.AddWithValue("@event8Start", thisMonthStart.AddDays(8));
    command.Parameters.AddWithValue("@event8End", thisMonthStart.AddDays(8));

    command.Parameters.AddWithValue("@event9Start", thisMonthStart.AddDays(20).AddHours(10));
    command.Parameters.AddWithValue("@event9End", thisMonthStart.AddDays(20).AddHours(11));

    command.Parameters.AddWithValue("@event10Start", thisMonthStart.AddDays(18).AddHours(9));
    command.Parameters.AddWithValue("@event10End", thisMonthStart.AddDays(18).AddHours(12));

    command.Parameters.AddWithValue("@event11Start", nextMonthStart.AddDays(10));
    command.Parameters.AddWithValue("@event11End", nextMonthStart.AddDays(10));

    command.Parameters.AddWithValue("@event12Start", nextMonthStart.AddDays(15));
    command.Parameters.AddWithValue("@event12End", nextMonthStart.AddDays(19));

    var rowsAffected = command.ExecuteNonQuery();

    Console.WriteLine($"✓ {rowsAffected}件のカレンダーイベントを挿入しました");
}
catch (Exception ex)
{
    Console.WriteLine($"エラー: {ex.Message}");
    Console.WriteLine($"詳細: {ex}");
}
