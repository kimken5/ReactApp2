using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReactApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AcademicYearNotesAndIsFutureColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFuture",
                table: "AcademicYears",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "AcademicYears",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AcademicYears_Nursery_Future",
                table: "AcademicYears",
                columns: new[] { "NurseryId", "IsFuture" },
                filter: "[IsFuture] = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AcademicYears_Nursery_Future",
                table: "AcademicYears");

            migrationBuilder.DropColumn(
                name: "IsFuture",
                table: "AcademicYears");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "AcademicYears");
        }
    }
}
