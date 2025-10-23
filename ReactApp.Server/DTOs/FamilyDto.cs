using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 家族メンバー作成DTO
    /// 新しい家族メンバーを直接登録するためのデータ転送オブジェクト
    /// </summary>
    public class CreateFamilyMemberDto
    {
        [Required]
        public int ChildId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string RelationshipType { get; set; } = string.Empty;
    }

    public class FamilyMemberDto
    {
        public int Id { get; set; }
        public int ParentId { get; set; }
        public string ParentName { get; set; } = string.Empty;
        public string ParentPhoneNumber { get; set; } = string.Empty;
        public int ChildId { get; set; }
        public string ChildName { get; set; } = string.Empty;
        public string RelationshipType { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public bool IsPrimaryContact { get; set; }
        public bool CanReceiveNotifications { get; set; }
        public bool CanViewReports { get; set; }
        public bool CanViewPhotos { get; set; }
        public bool HasPickupPermission { get; set; }
        public DateTime JoinedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
        public int? InvitedByParentId { get; set; }
        public string? InvitedByParentName { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    public class UpdateFamilyMemberDto
    {
        [StringLength(100)]
        public string? DisplayName { get; set; }

        public bool? IsPrimaryContact { get; set; }

        public bool? CanReceiveNotifications { get; set; }

        public bool? CanViewReports { get; set; }

        public bool? CanViewPhotos { get; set; }

        public bool? HasPickupPermission { get; set; }

        public bool? IsActive { get; set; }
    }
}