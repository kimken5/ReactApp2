-- Eventsテーブルのデフォルト制約を追加

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
