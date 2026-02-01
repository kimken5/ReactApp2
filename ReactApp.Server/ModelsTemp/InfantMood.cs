using System;
using System.Collections.Generic;

namespace ReactApp.Server.ModelsTemp;

/// <summary>
/// 乳児機嫌記録
/// </summary>
public partial class InfantMood
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
    /// 記録時刻
    /// </summary>
    public TimeOnly RecordTime { get; set; }

    /// <summary>
    /// 機嫌状態（Good:良い/Normal:普通/Bad:不機嫌/Crying:泣いている）
    /// </summary>
    public string MoodState { get; set; } = null!;

    /// <summary>
    /// 様子・特記事項
    /// </summary>
    public string? Notes { get; set; }

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
