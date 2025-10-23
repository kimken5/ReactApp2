using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

/// <summary>
/// 園児マスタ
/// </summary>
public partial class Child
{
    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 園児ID
    /// </summary>
    public int ChildId { get; set; }

    /// <summary>
    /// 氏名
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// 生年月日
    /// </summary>
    public DateTime DateOfBirth { get; set; }

    /// <summary>
    /// 性別
    /// </summary>
    public string Gender { get; set; } = null!;

    /// <summary>
    /// クラスID
    /// </summary>
    public string? ClassId { get; set; }

    /// <summary>
    /// 医療メモ
    /// </summary>
    public string? MedicalNotes { get; set; }

    /// <summary>
    /// 特別指示
    /// </summary>
    public string? SpecialInstructions { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }

    public string? ClassId1 { get; set; }

    public int? ClassNurseryId { get; set; }
}
