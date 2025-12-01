namespace ReactApp.Server.DTOs;

/// <summary>
/// 園児クラス割り当て情報DTO
/// </summary>
public class ChildClassAssignmentDto
{
    public int AcademicYear { get; set; }
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public bool IsCurrent { get; set; }
    public bool IsFuture { get; set; }
    public DateTime AssignedAt { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// クラス別園児一覧DTO
/// </summary>
public class ClassWithChildrenDto
{
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public int Grade { get; set; }
    public int AssignedCount { get; set; }
    public List<ChildAssignmentInfo> Children { get; set; } = new();
}

/// <summary>
/// 園児割り当て情報
/// </summary>
public class ChildAssignmentInfo
{
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public int Age { get; set; }
    public string CurrentClassId { get; set; } = string.Empty;
    public string CurrentClassName { get; set; } = string.Empty;
    public bool IsAssigned { get; set; }
}

/// <summary>
/// 園児一覧取得用DTO
/// </summary>
public class AvailableChildDto
{
    public int ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public int Age { get; set; }
    public string CurrentClassId { get; set; } = string.Empty;
    public string CurrentClassName { get; set; } = string.Empty;
    public string? FutureClassId { get; set; }
    public string? FutureClassName { get; set; }
    public bool IsAssignedToFuture { get; set; }
}

/// <summary>
/// 園児クラス割り当て登録リクエスト
/// </summary>
public class AssignChildToClassRequest
{
    public int AcademicYear { get; set; }
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public string ClassId { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

/// <summary>
/// 一括割り当てリクエスト
/// </summary>
public class BulkAssignChildrenRequest
{
    public int AcademicYear { get; set; }
    public int NurseryId { get; set; }
    public List<ChildClassPair> Assignments { get; set; } = new();
}

public class ChildClassPair
{
    public int ChildId { get; set; }
    public string ClassId { get; set; } = string.Empty;
}
