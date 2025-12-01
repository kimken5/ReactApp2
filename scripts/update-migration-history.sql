-- マイグレーション履歴を更新するスクリプト
-- Phase 1 でテーブルが手動作成されたため、既存のマイグレーションを履歴に記録

-- 既存のマイグレーションを履歴に追加（すでにテーブルが存在するため）
INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES
    ('20251029111821_AddIsPrimaryToParents', '9.0.0'),
    ('20251103065635_ExtendNurseryPasswordColumn', '9.0.0'),
    ('20251120051513_FixEventStaffRelationship', '9.0.0'),
    ('20251120051831_AddEventDefaultConstraints', '9.0.0'),
    ('20251120060526_RemoveClassAcademicYear', '9.0.0'),
    ('20251120121714_AddNurseryIdToParents', '9.0.0');

-- 確認
SELECT * FROM [__EFMigrationsHistory] ORDER BY [MigrationId];
