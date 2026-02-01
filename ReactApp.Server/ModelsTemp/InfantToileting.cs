using System;
using System.Collections.Generic;

namespace ReactApp.Server.ModelsTemp;

/// <summary>
/// 乳児排泄記録
/// </summary>
public partial class InfantToileting
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
    /// 記録日
    /// </summary>
    public DateOnly RecordDate { get; set; }

    /// <summary>
    /// 排泄時刻
    /// </summary>
    public DateTime ToiletingTime { get; set; }

    /// <summary>
    /// おしっこありフラグ
    /// </summary>
    public bool HasUrine { get; set; }

    /// <summary>
    /// おしっこ量（Little:少量/Normal:普通/Lot:多量）
    /// </summary>
    public string? UrineAmount { get; set; }

    /// <summary>
    /// うんちありフラグ
    /// </summary>
    public bool HasStool { get; set; }

    /// <summary>
    /// うんち量（Little:少量/Normal:普通/Lot:多量）
    /// </summary>
    public string? BowelAmount { get; set; }

    /// <summary>
    /// うんちの種類（Normal:正常/Soft:軟便/Diarrhea:下痢/Hard:硬い/Bloody:血便）
    /// </summary>
    public string? BowelCondition { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 作成者ID
    /// </summary>
    public int CreatedBy { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ID
    /// </summary>
    public int UpdatedBy { get; set; }
}
