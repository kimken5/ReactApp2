using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReactApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddEventDefaultConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Eventsテーブルのデフォルト制約を追加
            migrationBuilder.Sql(@"
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
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // デフォルト制約を削除（ロールバック時）
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Events_IsAllDay')
                    ALTER TABLE Events DROP CONSTRAINT DF_Events_IsAllDay;

                IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Events_RecurrencePattern')
                    ALTER TABLE Events DROP CONSTRAINT DF_Events_RecurrencePattern;

                IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Events_TargetAudience')
                    ALTER TABLE Events DROP CONSTRAINT DF_Events_TargetAudience;

                IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Events_RequiresPreparation')
                    ALTER TABLE Events DROP CONSTRAINT DF_Events_RequiresPreparation;

                IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Events_IsActive')
                    ALTER TABLE Events DROP CONSTRAINT DF_Events_IsActive;

                IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Events_CreatedAt')
                    ALTER TABLE Events DROP CONSTRAINT DF_Events_CreatedAt;

                IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Events_LastModified')
                    ALTER TABLE Events DROP CONSTRAINT DF_Events_LastModified;
            ");
        }
    }
}
