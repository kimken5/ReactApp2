-- DailyAttendances（日次出欠表）テーブル作成
CREATE TABLE DailyAttendances (
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    AttendanceDate DATE NOT NULL,
    CONSTRAINT PK_DailyAttendances PRIMARY KEY (NurseryId, ChildId, AttendanceDate),
    Status NVARCHAR(20) NOT NULL DEFAULT 'blank',  -- blank(未記録), present(出席), absent(欠席), late(遅刻)
    ArrivalTime TIME NULL,  -- 到着時刻（遅刻の場合など）
    Notes NVARCHAR(500) NULL,  -- 備考（体調、様子など）
    AbsenceNotificationId INT NULL,  -- 欠席連絡ID（欠席連絡経由の場合）
    RecordedByStaffId INT NULL,  -- 記録スタッフID
    RecordedByStaffNurseryId INT NULL,  -- 記録スタッフ保育園ID
    RecordedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),  -- 記録日時
    UpdatedByStaffId INT NULL,  -- 更新スタッフID
    UpdatedByStaffNurseryId INT NULL,  -- 更新スタッフ保育園ID
    UpdatedAt DATETIME2 NULL,  -- 更新日時
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),  -- 作成日時
    IsActive BIT NOT NULL DEFAULT 1  -- 論理削除フラグ
);
GO

-- インデックス作成
CREATE INDEX IX_DailyAttendances_Date_Status ON DailyAttendances (NurseryId, AttendanceDate, Status);
CREATE INDEX IX_DailyAttendances_Child_Date ON DailyAttendances (NurseryId, ChildId, AttendanceDate DESC);
CREATE INDEX IX_DailyAttendances_AbsenceNotification ON DailyAttendances (AbsenceNotificationId) WHERE AbsenceNotificationId IS NOT NULL;
CREATE INDEX IX_DailyAttendances_IsActive ON DailyAttendances (NurseryId, IsActive) WHERE IsActive = 1;
GO

-- テーブルコメント
EXEC sp_addextendedproperty 'MS_Description', '日次出欠表テーブル', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances';

-- カラムコメント
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '園児ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'ChildId';
EXEC sp_addextendedproperty 'MS_Description', '出欠日', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'AttendanceDate';
EXEC sp_addextendedproperty 'MS_Description', '出欠ステータス', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'Status';
EXEC sp_addextendedproperty 'MS_Description', '到着時刻', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'ArrivalTime';
EXEC sp_addextendedproperty 'MS_Description', '備考', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'Notes';
EXEC sp_addextendedproperty 'MS_Description', '欠席連絡ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'AbsenceNotificationId';
EXEC sp_addextendedproperty 'MS_Description', '記録スタッフID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'RecordedByStaffId';
EXEC sp_addextendedproperty 'MS_Description', '記録スタッフ保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'RecordedByStaffNurseryId';
EXEC sp_addextendedproperty 'MS_Description', '記録日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'RecordedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新スタッフID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'UpdatedByStaffId';
EXEC sp_addextendedproperty 'MS_Description', '更新スタッフ保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'UpdatedByStaffNurseryId';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'UpdatedAt';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '論理削除フラグ', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'IsActive';
GO
