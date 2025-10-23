using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// スタッフDTO
    /// 保育園スタッフの基本情報をクライアントとサーバー間で伝送するためのデータ転送オブジェクト
    /// </summary>
    public class StaffDto
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        [EmailAddress]
        [StringLength(200)]
        public string? Email { get; set; }

        [Required]
        [StringLength(50)]
        public string Role { get; set; } = string.Empty;

        [StringLength(50)]
        public string? ClassId { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// スタッフ作成DTO
    /// 新しいスタッフを登録するためのリクエストデータ
    /// </summary>
    public class CreateStaffDto
    {
        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        [EmailAddress]
        [StringLength(200)]
        public string? Email { get; set; }

        [Required]
        [StringLength(50)]
        public string Role { get; set; } = string.Empty;

        [StringLength(50)]
        public string? ClassId { get; set; }
    }

    /// <summary>
    /// スタッフ更新DTO
    /// 既存スタッフ情報を更新するためのリクエストデータ
    /// </summary>
    public class UpdateStaffDto
    {
        [StringLength(50)]
        public string? Name { get; set; }

        [StringLength(15)]
        public string? PhoneNumber { get; set; }

        [EmailAddress]
        [StringLength(200)]
        public string? Email { get; set; }

        [StringLength(50)]
        public string? Role { get; set; }

        [StringLength(50)]
        public string? ClassId { get; set; }

        public bool? IsActive { get; set; }
    }
}