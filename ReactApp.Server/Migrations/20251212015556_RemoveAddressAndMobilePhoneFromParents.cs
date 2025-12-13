using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReactApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAddressAndMobilePhoneFromParents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // インデックスは既に存在しないため削除をスキップ
            // migrationBuilder.DropIndex(
            //     name: "IX_Parents_MobilePhone_NurseryId",
            //     table: "Parents");

            // AddressとMobilePhoneカラムは以前のマイグレーションで既に追加済みのため
            // 実際のスキーマではこれらのカラムを削除する必要はない
            // （ユーザーが提供したスクリプトに基づき、これらのカラムは最初から存在しない）

            // Note: 実際のテーブルスキーマには Address と MobilePhone が存在しないため
            // DROP COLUMN は実行不要。モデルから削除しただけで十分。
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Parents",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MobilePhone",
                table: "Parents",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Parents_MobilePhone_NurseryId",
                table: "Parents",
                columns: new[] { "MobilePhone", "NurseryId" },
                filter: "[MobilePhone] IS NOT NULL");
        }
    }
}
