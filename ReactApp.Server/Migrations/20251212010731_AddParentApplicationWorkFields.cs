using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReactApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddParentApplicationWorkFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AddressLine",
                table: "Parents",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Parents",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "Parents",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HomePhone",
                table: "Parents",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MobilePhone",
                table: "Parents",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameKana",
                table: "Parents",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostalCode",
                table: "Parents",
                type: "nvarchar(8)",
                maxLength: 8,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Prefecture",
                table: "Parents",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AlterColumn<DateOnly>(
                name: "StartDate",
                table: "AcademicYears",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<DateOnly>(
                name: "EndDate",
                table: "AcademicYears",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.CreateIndex(
                name: "IX_Parents_MobilePhone_NurseryId",
                table: "Parents",
                columns: new[] { "MobilePhone", "NurseryId" },
                filter: "[MobilePhone] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Parents_PostalCode",
                table: "Parents",
                column: "PostalCode",
                filter: "[PostalCode] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Parents_MobilePhone_NurseryId",
                table: "Parents");

            migrationBuilder.DropIndex(
                name: "IX_Parents_PostalCode",
                table: "Parents");

            migrationBuilder.DropColumn(
                name: "AddressLine",
                table: "Parents");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Parents");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "Parents");

            migrationBuilder.DropColumn(
                name: "HomePhone",
                table: "Parents");

            migrationBuilder.DropColumn(
                name: "MobilePhone",
                table: "Parents");

            migrationBuilder.DropColumn(
                name: "NameKana",
                table: "Parents");

            migrationBuilder.DropColumn(
                name: "PostalCode",
                table: "Parents");

            migrationBuilder.DropColumn(
                name: "Prefecture",
                table: "Parents");

            migrationBuilder.AlterColumn<DateTime>(
                name: "StartDate",
                table: "AcademicYears",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateOnly),
                oldType: "date");

            migrationBuilder.AlterColumn<DateTime>(
                name: "EndDate",
                table: "AcademicYears",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateOnly),
                oldType: "date");
        }
    }
}
