namespace ReactApp.Server.DTOs.InfantRecords;

/// <summary>
/// クラス内の園児一覧取得レスポンス
/// </summary>
public class ClassChildrenResponse
{
    public string ClassId { get; set; } = null!;
    public string ClassName { get; set; } = null!;
    public List<InfantRecordChildDto> Children { get; set; } = new();
}

/// <summary>
/// 園児基本情報（生活記録用）
/// </summary>
public class InfantRecordChildDto
{
    public int ChildId { get; set; }
    public string ChildName { get; set; } = null!;
    public int AgeMonths { get; set; }
}
