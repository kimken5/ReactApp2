using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 写真園児関係テーブル
/// </summary>
public partial class PhotoChild
{
    /// <summary>
    /// 写真ID
    /// </summary>
    public int PhotoId { get; set; }

    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 園児ID
    /// </summary>
    public int ChildId { get; set; }

    /// <summary>
    /// 主対象フラグ
    /// </summary>
    public bool IsPrimarySubject { get; set; }

    /// <summary>
    /// 追加日時
    /// </summary>
    public DateTime AddedAt { get; set; }

    /// <summary>
    /// 追加職員ID
    /// </summary>
    public int? AddedByStaffId { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }
}
