using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

/// <summary>
/// クラスエンティティ
/// 保育園のクラス情報を管理するデータモデル
/// 複合主キー: (NurseryId, ClassId)
/// </summary>
public class Class
{
    /// <summary>
    /// 保育園ID（複合主キーの第1カラム）
    /// 所属する保育園の識別子
    /// </summary>
    [Required]
    [Column(Order = 0)]
    public int NurseryId { get; set; }

    /// <summary>
    /// クラスID（複合主キーの第2カラム）
    /// 保育園内でのクラスの識別子
    /// </summary>
    [Required]
    [Column(Order = 1)]
    [StringLength(50)]
    public string ClassId { get; set; } = string.Empty;

    /// <summary>
    /// クラス名（必須）
    /// 最大50文字、クラスの表示名
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 年齢グループ最小値（必須）
    /// このクラスの対象年齢の下限
    /// </summary>
    [Required]
    public int AgeGroupMin { get; set; }

    /// <summary>
    /// 年齢グループ最大値（必須）
    /// このクラスの対象年齢の上限
    /// </summary>
    [Required]
    public int AgeGroupMax { get; set; }

    /// <summary>
    /// 最大定員数（必須）
    /// このクラスの収容可能人数
    /// </summary>
    [Required]
    public int MaxCapacity { get; set; }

    /// <summary>
    /// 作成日時（必須）
    /// クラス情報の登録日時
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時（任意）
    /// クラス情報の最終更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 有効/無効フラグ（必須）
    /// デフォルト: true
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = true;

    // ナビゲーションプロパティ（関連エンティティとの関係性）

    /// <summary>
    /// このクラスに所属する園児のコレクション
    /// </summary>
    public ICollection<Child> Children { get; set; } = new List<Child>();
}