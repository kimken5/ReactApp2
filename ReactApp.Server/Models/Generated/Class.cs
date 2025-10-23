using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// クラスマスタ
/// </summary>
public partial class Class
{
    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// クラスID
    /// </summary>
    public string ClassId { get; set; } = null!;

    /// <summary>
    /// クラス名
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// 年齢グループ最小値
    /// </summary>
    public int AgeGroupMin { get; set; }

    /// <summary>
    /// 年齢グループ最大値
    /// </summary>
    public int AgeGroupMax { get; set; }

    /// <summary>
    /// 最大定員数
    /// </summary>
    public int MaxCapacity { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
