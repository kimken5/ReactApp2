-- カレンダーイベントのデモデータ挿入スクリプト
-- NurseryId = 1 として挿入

-- 既存のデモデータをクリア（必要に応じて）
-- DELETE FROM Events WHERE NurseryId = 1 AND CreatedBy = 'デモデータ';

-- 今月と来月のイベントを作成
DECLARE @Today DATE = GETDATE();
DECLARE @ThisMonthStart DATE = DATEFROMPARTS(YEAR(@Today), MONTH(@Today), 1);
DECLARE @NextMonthStart DATE = DATEADD(MONTH, 1, @ThisMonthStart);

-- 全日イベント（全体お知らせ）
INSERT INTO Events (NurseryId, TargetGradeLevel, TargetClassId, Title, Description, Category, StartDateTime, EndDateTime, IsAllDay, RecurrencePattern, TargetAudience, RequiresPreparation, PreparationInstructions, IsActive, CreatedBy, CreatedAt, LastModified)
VALUES
(1, NULL, NULL, '保護者会総会', '年度初めの保護者会総会を開催します', 'general_announcement', DATEADD(DAY, 5, @ThisMonthStart), DATEADD(DAY, 5, @ThisMonthStart), 1, 'none', 'all', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),
(1, NULL, NULL, '避難訓練', '火災を想定した避難訓練を実施します', 'general_event', DATEADD(DAY, 10, @ThisMonthStart), DATEADD(DAY, 10, @ThisMonthStart), 1, 'none', 'all', 1, '防災頭巾を準備してください', 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),
(1, NULL, NULL, '園休日（創立記念日）', '創立記念日のため休園です', 'nursery_holiday', DATEADD(DAY, 15, @ThisMonthStart), DATEADD(DAY, 15, @ThisMonthStart), 1, 'none', 'all', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE());

-- 時間指定イベント（クラス活動）
INSERT INTO Events (NurseryId, TargetGradeLevel, TargetClassId, Title, Description, Category, StartDateTime, EndDateTime, IsAllDay, RecurrencePattern, TargetAudience, RequiresPreparation, PreparationInstructions, IsActive, CreatedBy, CreatedAt, LastModified)
VALUES
(1, NULL, '1-A', '体操教室', '専門講師による体操教室', 'class_activity',
    DATEADD(HOUR, 10, DATEADD(DAY, 3, @ThisMonthStart)),
    DATEADD(HOUR, 11, DATEADD(DAY, 3, @ThisMonthStart)),
    0, 'none', 'specific_class', 1, '運動しやすい服装でお願いします', 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),

(1, NULL, '2-B', '英語教室', 'ネイティブ講師による英語レッスン', 'class_activity',
    DATEADD(HOUR, 14, DATEADD(DAY, 4, @ThisMonthStart)),
    DATEADD(HOUR, 15, DATEADD(DAY, 4, @ThisMonthStart)),
    0, 'none', 'specific_class', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),

(1, NULL, '1-A', '音楽教室', 'リトミックと楽器遊び', 'class_activity',
    DATEADD(HOUR, 13, DATEADD(DAY, 7, @ThisMonthStart)),
    DATEADD(HOUR, 14, DATEADD(DAY, 7, @ThisMonthStart)),
    0, 'none', 'specific_class', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE());

-- 学年活動
INSERT INTO Events (NurseryId, TargetGradeLevel, TargetClassId, Title, Description, Category, StartDateTime, EndDateTime, IsAllDay, RecurrencePattern, TargetAudience, RequiresPreparation, PreparationInstructions, IsActive, CreatedBy, CreatedAt, LastModified)
VALUES
(1, 3, NULL, '年長組遠足', '動物園への遠足', 'grade_activity', DATEADD(DAY, 12, @ThisMonthStart), DATEADD(DAY, 12, @ThisMonthStart), 1, 'none', 'all', 1, 'お弁当、水筒、帽子をご用意ください', 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),
(1, 2, NULL, '年中組プール開始', 'プール活動開始日', 'grade_activity', DATEADD(DAY, 8, @ThisMonthStart), DATEADD(DAY, 8, @ThisMonthStart), 1, 'none', 'all', 1, '水着・タオル・ゴーグルをご用意ください', 1, 'デモデータ', GETUTCDATE(), GETUTCDATE());

-- 全体行事
INSERT INTO Events (NurseryId, TargetGradeLevel, TargetClassId, Title, Description, Category, StartDateTime, EndDateTime, IsAllDay, RecurrencePattern, TargetAudience, RequiresPreparation, PreparationInstructions, IsActive, CreatedBy, CreatedAt, LastModified)
VALUES
(1, NULL, NULL, '誕生日会', '今月のお誕生日会', 'general_event',
    DATEADD(HOUR, 10, DATEADD(DAY, 20, @ThisMonthStart)),
    DATEADD(HOUR, 11, DATEADD(DAY, 20, @ThisMonthStart)),
    0, 'none', 'all', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),

(1, NULL, NULL, '身体測定', '身長・体重測定', 'general_event',
    DATEADD(HOUR, 9, DATEADD(DAY, 18, @ThisMonthStart)),
    DATEADD(HOUR, 12, DATEADD(DAY, 18, @ThisMonthStart)),
    0, 'none', 'all', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE());

-- 来月のイベント
INSERT INTO Events (NurseryId, TargetGradeLevel, TargetClassId, Title, Description, Category, StartDateTime, EndDateTime, IsAllDay, RecurrencePattern, TargetAudience, RequiresPreparation, PreparationInstructions, IsActive, CreatedBy, CreatedAt, LastModified)
VALUES
(1, NULL, NULL, '運動会', '秋の大運動会', 'general_event', DATEADD(DAY, 10, @NextMonthStart), DATEADD(DAY, 10, @NextMonthStart), 1, 'none', 'all', 1, '運動しやすい服装、水筒、お弁当をご持参ください', 1, 'デモデータ', GETUTCDATE(), GETUTCDATE()),
(1, NULL, NULL, '個人面談期間', '個人面談を実施します（予約制）', 'general_announcement', DATEADD(DAY, 15, @NextMonthStart), DATEADD(DAY, 19, @NextMonthStart), 1, 'none', 'all', 0, NULL, 1, 'デモデータ', GETUTCDATE(), GETUTCDATE());

PRINT '✓ カレンダーイベントのデモデータを挿入しました';
