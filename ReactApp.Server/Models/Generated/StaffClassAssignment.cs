using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 職員クラス割当テーブル
/// </summary>
public partial class StaffClassAssignment
{
    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 職員ID
    /// </summary>
    public int StaffId { get; set; }

    /// <summary>
    /// クラスID
    /// </summary>
    public string ClassId { get; set; } = null!;

    /// <summary>
    /// 割当役割
    /// </summary>
    public string AssignmentRole { get; set; } = null!;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
