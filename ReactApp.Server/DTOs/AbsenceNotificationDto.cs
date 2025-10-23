using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs;

/// <summary>
/// 欠席・遅刻連絡作成DTO
/// 新しい欠席または遅刻の連絡を作成するためのリクエストデータ
/// </summary>
public class CreateAbsenceNotificationDto
{
    /// <summary>
    /// 園児ID（必須）
    /// 欠席・遅刻対象の園児識別子
    /// </summary>
    [Required]
    public int ChildId { get; set; }

    /// <summary>
    /// 通知タイプ（必須）
    /// 'absence'（欠席）、'lateness'（遅刻）、'pickup'（お迎え）を指定
    /// </summary>
    [Required]
    [StringLength(20)]
    [RegularExpression("^(absence|lateness|pickup)$", ErrorMessage = "通知タイプは 'absence'、'lateness'、または 'pickup' である必要があります")]
    public string NotificationType { get; set; } = string.Empty;

    /// <summary>
    /// 日付（必須）
    /// 欠席・遅刻・お迎えの日付
    /// </summary>
    [Required]
    public DateTime Ymd { get; set; }

    /// <summary>
    /// 予定到着時刻（任意）
    /// 遅刻・お迎えの場合の予定時刻（TIME型）
    /// </summary>
    public TimeSpan? ExpectedArrivalTime { get; set; }

    /// <summary>
    /// 理由（必須）
    /// illness（体調不良）、familyEvent（家庭の事情）、other（その他）
    /// </summary>
    [Required]
    [StringLength(50)]
    [RegularExpression("^(illness|familyEvent|other)$", ErrorMessage = "理由は有効な値である必要があります")]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// 追加メモ（任意）
    /// 最大200文字の追加情報や特記事項
    /// </summary>
    [StringLength(200)]
    public string? AdditionalNotes { get; set; }
}

/// <summary>
/// 欠席・遅刻連絡更新DTO
/// 既存の欠席または遅刻連絡を更新するためのリクエストデータ
/// </summary>
public class UpdateAbsenceNotificationDto
{
    public DateTime? Ymd { get; set; }

    public TimeSpan? ExpectedArrivalTime { get; set; }

    [StringLength(50)]
    [RegularExpression("^(illness|familyEvent|other)$", ErrorMessage = "理由は有効な値である必要があります")]
    public string? Reason { get; set; }

    [StringLength(200)]
    public string? AdditionalNotes { get; set; }
}

/// <summary>
/// 欠席・遅刻連絡DTO
/// 欠席または遅刻連絡の詳細情報を表すデータ転送オブジェクト
/// </summary>
public class AbsenceNotificationDto
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public string NotificationType { get; set; } = string.Empty;
    public DateTime Ymd { get; set; }
    public TimeSpan? ExpectedArrivalTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? AdditionalNotes { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? StaffResponse { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
}

/// <summary>
/// 欠席・遅刻連絡レスポンスDTO
/// APIレスポンス用の欠席または遅刻連絡情報
/// </summary>
public class AbsenceNotificationResponseDto
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public string NotificationType { get; set; } = string.Empty;
    public DateTime Ymd { get; set; }
    public TimeSpan? ExpectedArrivalTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? AdditionalNotes { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? StaffResponse { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
}