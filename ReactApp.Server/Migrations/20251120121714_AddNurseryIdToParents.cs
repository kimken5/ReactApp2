using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReactApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddNurseryIdToParents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NurseryIdカラムを追加（既存レコードにはデフォルト値1を設定）
            migrationBuilder.AddColumn<int>(
                name: "NurseryId",
                table: "Parents",
                type: "int",
                nullable: false,
                defaultValue: 1);

            // ユニークインデックスを作成（PhoneNumber + NurseryId）
            migrationBuilder.CreateIndex(
                name: "IX_Parents_PhoneNumber_Unique",
                table: "Parents",
                columns: new[] { "PhoneNumber", "NurseryId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // ユニークインデックスを削除
            migrationBuilder.DropIndex(
                name: "IX_Parents_PhoneNumber_Unique",
                table: "Parents");

            // NurseryIdカラムを削除
            migrationBuilder.DropColumn(
                name: "NurseryId",
                table: "Parents");
        }
    }
}
