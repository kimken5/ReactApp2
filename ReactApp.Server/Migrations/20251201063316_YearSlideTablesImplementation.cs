using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReactApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class YearSlideTablesImplementation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // AttendanceStatisticsテーブルが存在する場合のみ削除
            migrationBuilder.Sql(@"
                IF OBJECT_ID(N'dbo.AttendanceStatistics', N'U') IS NOT NULL
                BEGIN
                    DROP TABLE [AttendanceStatistics];
                END
            ");

            // StaffClassAssignmentsの主キーが存在する場合のみ削除
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'PK_StaffClassAssignments' AND parent_object_id = OBJECT_ID('StaffClassAssignments'))
                BEGIN
                    ALTER TABLE [StaffClassAssignments] DROP CONSTRAINT [PK_StaffClassAssignments];
                END
            ");

            // StaffClassAssignmentsのインデックスを削除（存在する場合のみ）
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StaffClassAssignments_Class' AND object_id = OBJECT_ID('StaffClassAssignments'))
                BEGIN
                    DROP INDEX [IX_StaffClassAssignments_Class] ON [StaffClassAssignments];
                END

                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StaffClassAssignments_Class_Role' AND object_id = OBJECT_ID('StaffClassAssignments'))
                BEGIN
                    DROP INDEX [IX_StaffClassAssignments_Class_Role] ON [StaffClassAssignments];
                END

                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StaffClassAssignments_Staff' AND object_id = OBJECT_ID('StaffClassAssignments'))
                BEGIN
                    DROP INDEX [IX_StaffClassAssignments_Staff] ON [StaffClassAssignments];
                END
            ");

            // チェック制約が存在する場合のみ削除
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_StaffClassAssignment_Role' AND parent_object_id = OBJECT_ID('StaffClassAssignments'))
                BEGIN
                    ALTER TABLE [StaffClassAssignments] DROP CONSTRAINT [CK_StaffClassAssignment_Role];
                END
            ");

            // Parentsのインデックスを削除（存在する場合のみ）
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Parents_PhoneNumber_Unique' AND object_id = OBJECT_ID('Parents'))
                BEGIN
                    DROP INDEX [IX_Parents_PhoneNumber_Unique] ON [Parents];
                END
            ");

            // AcademicYearsの主キーが存在する場合のみ削除
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'PK_AcademicYears' AND parent_object_id = OBJECT_ID('AcademicYears'))
                BEGIN
                    ALTER TABLE [AcademicYears] DROP CONSTRAINT [PK_AcademicYears];
                END
            ");

            // AcademicYearsのインデックスが存在する場合のみ削除
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AcademicYears_Nursery_Year' AND object_id = OBJECT_ID('AcademicYears'))
                BEGIN
                    DROP INDEX [IX_AcademicYears_Nursery_Year] ON [AcademicYears];
                END
            ");

            // AcademicYearsのIdカラムが存在する場合のみ削除
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('AcademicYears') AND name = 'Id')
                BEGIN
                    ALTER TABLE [AcademicYears] DROP COLUMN [Id];
                END
            ");

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "StaffClassAssignments",
                type: "bit",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AlterColumn<string>(
                name: "AssignmentRole",
                table: "StaffClassAssignments",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<DateTime>(
                name: "AssignedAt",
                table: "StaffClassAssignments",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            // StaffClassAssignmentsにカラムを追加（存在しない場合のみ）
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('StaffClassAssignments') AND name = 'AssignedByUserId')
                BEGIN
                    ALTER TABLE [StaffClassAssignments] ADD [AssignedByUserId] INT NULL;
                END

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('StaffClassAssignments') AND name = 'IsCurrent')
                BEGIN
                    ALTER TABLE [StaffClassAssignments] ADD [IsCurrent] BIT NOT NULL DEFAULT 0;
                END

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('StaffClassAssignments') AND name = 'IsFuture')
                BEGIN
                    ALTER TABLE [StaffClassAssignments] ADD [IsFuture] BIT NOT NULL DEFAULT 0;
                END

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('StaffClassAssignments') AND name = 'Notes')
                BEGIN
                    ALTER TABLE [StaffClassAssignments] ADD [Notes] NVARCHAR(200) NULL;
                END
            ");

            // StaffClassAssignmentsの主キーを追加（存在しない場合のみ）
            // Note: Phase 1で手動作成済みの場合はスキップ
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT * FROM sys.key_constraints
                    WHERE parent_object_id = OBJECT_ID('StaffClassAssignments')
                    AND type = 'PK'
                )
                BEGIN
                    ALTER TABLE [StaffClassAssignments] ADD CONSTRAINT [PK_StaffClassAssignments] PRIMARY KEY ([AcademicYear], [NurseryId], [StaffId], [ClassId]);
                END
            ");

            // AcademicYearsの主キーを追加（存在しない場合のみ）
            // Note: Phase 1で手動作成済みの場合はスキップ
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT * FROM sys.key_constraints
                    WHERE parent_object_id = OBJECT_ID('AcademicYears')
                    AND type = 'PK'
                )
                BEGIN
                    ALTER TABLE [AcademicYears] ADD CONSTRAINT [PK_AcademicYears] PRIMARY KEY ([NurseryId], [Year]);
                END
            ");

            // ChildClassAssignmentsテーブルが存在しない場合のみ作成
            migrationBuilder.Sql(@"
                IF OBJECT_ID(N'dbo.ChildClassAssignments', N'U') IS NULL
                BEGIN
                    CREATE TABLE [ChildClassAssignments] (
                        [AcademicYear] INT NOT NULL,
                        [NurseryId] INT NOT NULL,
                        [ChildId] INT NOT NULL,
                        [ClassId] NVARCHAR(50) NOT NULL,
                        [IsCurrent] BIT NOT NULL DEFAULT 0,
                        [IsFuture] BIT NOT NULL DEFAULT 0,
                        [AssignedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        [AssignedByUserId] INT NULL,
                        [Notes] NVARCHAR(200) NULL,
                        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        [UpdatedAt] DATETIME2 NULL,
                        CONSTRAINT [PK_ChildClassAssignments] PRIMARY KEY ([AcademicYear], [NurseryId], [ChildId])
                    );
                END
            ");

            migrationBuilder.CreateIndex(
                name: "IX_StaffClassAssignments_Class_Year",
                table: "StaffClassAssignments",
                columns: new[] { "NurseryId", "ClassId", "AcademicYear" });

            migrationBuilder.CreateIndex(
                name: "IX_StaffClassAssignments_Staff_Year",
                table: "StaffClassAssignments",
                columns: new[] { "NurseryId", "StaffId", "AcademicYear" });

            migrationBuilder.CreateIndex(
                name: "IX_StaffClassAssignments_Year_Current",
                table: "StaffClassAssignments",
                columns: new[] { "NurseryId", "AcademicYear", "IsCurrent" },
                filter: "[IsCurrent] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_StaffClassAssignments_Year_Future",
                table: "StaffClassAssignments",
                columns: new[] { "NurseryId", "AcademicYear", "IsFuture" },
                filter: "[IsFuture] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Parents_PhoneNumber_Unique",
                table: "Parents",
                columns: new[] { "PhoneNumber", "NurseryId" },
                unique: true);

            // ChildClassAssignmentsのインデックスを作成（存在しない場合のみ）
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChildClassAssignments_Class_Year' AND object_id = OBJECT_ID('ChildClassAssignments'))
                BEGIN
                    CREATE INDEX [IX_ChildClassAssignments_Class_Year] ON [ChildClassAssignments] ([NurseryId], [ClassId], [AcademicYear]);
                END

                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChildClassAssignments_Year_Current' AND object_id = OBJECT_ID('ChildClassAssignments'))
                BEGIN
                    CREATE INDEX [IX_ChildClassAssignments_Year_Current] ON [ChildClassAssignments] ([NurseryId], [AcademicYear], [IsCurrent]) WHERE [IsCurrent] = 1;
                END

                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChildClassAssignments_Year_Future' AND object_id = OBJECT_ID('ChildClassAssignments'))
                BEGIN
                    CREATE INDEX [IX_ChildClassAssignments_Year_Future] ON [ChildClassAssignments] ([NurseryId], [AcademicYear], [IsFuture]) WHERE [IsFuture] = 1;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChildClassAssignments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_StaffClassAssignments",
                table: "StaffClassAssignments");

            migrationBuilder.DropIndex(
                name: "IX_StaffClassAssignments_Class_Year",
                table: "StaffClassAssignments");

            migrationBuilder.DropIndex(
                name: "IX_StaffClassAssignments_Staff_Year",
                table: "StaffClassAssignments");

            migrationBuilder.DropIndex(
                name: "IX_StaffClassAssignments_Year_Current",
                table: "StaffClassAssignments");

            migrationBuilder.DropIndex(
                name: "IX_StaffClassAssignments_Year_Future",
                table: "StaffClassAssignments");

            migrationBuilder.DropIndex(
                name: "IX_Parents_PhoneNumber_Unique",
                table: "Parents");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AcademicYears",
                table: "AcademicYears");

            migrationBuilder.DropColumn(
                name: "AssignedByUserId",
                table: "StaffClassAssignments");

            migrationBuilder.DropColumn(
                name: "IsCurrent",
                table: "StaffClassAssignments");

            migrationBuilder.DropColumn(
                name: "IsFuture",
                table: "StaffClassAssignments");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "StaffClassAssignments");

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "StaffClassAssignments",
                type: "bit",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: true);

            migrationBuilder.AlterColumn<string>(
                name: "AssignmentRole",
                table: "StaffClassAssignments",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "AssignedAt",
                table: "StaffClassAssignments",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<int>(
                name: "Id",
                table: "AcademicYears",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddPrimaryKey(
                name: "PK_StaffClassAssignments",
                table: "StaffClassAssignments",
                columns: new[] { "NurseryId", "StaffId", "ClassId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_AcademicYears",
                table: "AcademicYears",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "AttendanceStatistics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AbsentDays = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    AcademicYear = table.Column<int>(type: "int", nullable: false),
                    AttendanceRate = table.Column<decimal>(type: "DECIMAL(5,2)", nullable: false, defaultValue: 0.00m),
                    ChildId = table.Column<int>(type: "int", nullable: true),
                    ClassId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastCalculatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    Month = table.Column<int>(type: "int", nullable: true),
                    NurseryId = table.Column<int>(type: "int", nullable: false),
                    PresentDays = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    StatisticType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TardyDays = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    TotalDays = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceStatistics", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StaffClassAssignments_Class",
                table: "StaffClassAssignments",
                columns: new[] { "NurseryId", "ClassId" });

            migrationBuilder.CreateIndex(
                name: "IX_StaffClassAssignments_Class_Role",
                table: "StaffClassAssignments",
                columns: new[] { "NurseryId", "ClassId", "AssignmentRole" });

            migrationBuilder.CreateIndex(
                name: "IX_StaffClassAssignments_Staff",
                table: "StaffClassAssignments",
                columns: new[] { "NurseryId", "StaffId" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_StaffClassAssignment_Role",
                table: "StaffClassAssignments",
                sql: "[AssignmentRole] IN ('MainTeacher', 'AssistantTeacher')");

            migrationBuilder.CreateIndex(
                name: "IX_Parents_PhoneNumber_Unique",
                table: "Parents",
                column: "PhoneNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AcademicYears_Nursery_Year",
                table: "AcademicYears",
                columns: new[] { "NurseryId", "Year" });

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceStatistics_Child",
                table: "AttendanceStatistics",
                columns: new[] { "NurseryId", "ChildId", "AcademicYear" },
                filter: "[ChildId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceStatistics_Class",
                table: "AttendanceStatistics",
                columns: new[] { "NurseryId", "ClassId", "AcademicYear" },
                filter: "[ClassId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceStatistics_Type",
                table: "AttendanceStatistics",
                column: "StatisticType");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceStatistics_Year_Month",
                table: "AttendanceStatistics",
                columns: new[] { "NurseryId", "AcademicYear", "Month" });
        }
    }
}
