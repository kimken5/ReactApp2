using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 写真マスタ
/// </summary>
public partial class Photo
{
    /// <summary>
    /// 写真ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ファイル名
    /// </summary>
    public string FileName { get; set; } = null!;

    /// <summary>
    /// ファイルパス
    /// </summary>
    public string FilePath { get; set; } = null!;

    /// <summary>
    /// サムネイルパス
    /// </summary>
    public string ThumbnailPath { get; set; } = null!;

    /// <summary>
    /// 元ファイル名
    /// </summary>
    public string? OriginalFileName { get; set; }

    /// <summary>
    /// ファイルサイズ
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// MIMEタイプ
    /// </summary>
    public string MimeType { get; set; } = null!;

    /// <summary>
    /// 幅
    /// </summary>
    public int Width { get; set; }

    /// <summary>
    /// 高さ
    /// </summary>
    public int Height { get; set; }

    /// <summary>
    /// 説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// アップロード職員保育園ID
    /// </summary>
    public int UploadedByStaffNurseryId { get; set; }

    /// <summary>
    /// アップロード職員ID
    /// </summary>
    public int UploadedByStaffId { get; set; }

    /// <summary>
    /// アップロード日時
    /// </summary>
    public DateTime UploadedAt { get; set; }

    /// <summary>
    /// 公開日時
    /// </summary>
    public DateTime PublishedAt { get; set; }

    public string VisibilityLevel { get; set; } = null!;

    public string? TargetClassId { get; set; }

    public string Status { get; set; } = null!;

    public bool RequiresConsent { get; set; }

    public int ViewCount { get; set; }

    public int DownloadCount { get; set; }

    public bool IsActive { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
