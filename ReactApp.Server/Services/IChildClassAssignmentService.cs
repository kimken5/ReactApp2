using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services;

/// <summary>
/// 園児クラス割り当てサービスインターフェース
/// </summary>
public interface IChildClassAssignmentService
{
    /// <summary>
    /// 指定年度の全クラスと割り当て済み園児を取得
    /// </summary>
    Task<List<ClassWithChildrenDto>> GetClassesWithChildren(int nurseryId, int academicYear);

    /// <summary>
    /// 指定年度の割り当て可能な園児一覧を取得
    /// </summary>
    Task<List<AvailableChildDto>> GetAvailableChildren(int nurseryId, int academicYear);

    /// <summary>
    /// 園児をクラスに割り当て
    /// </summary>
    Task<ChildClassAssignmentDto> AssignChildToClass(AssignChildToClassRequest request, int userId);

    /// <summary>
    /// 園児のクラス割り当てを解除
    /// </summary>
    Task<bool> UnassignChildFromClass(int nurseryId, int academicYear, int childId);

    /// <summary>
    /// 一括で園児をクラスに割り当て
    /// </summary>
    Task<List<ChildClassAssignmentDto>> BulkAssignChildren(BulkAssignChildrenRequest request, int userId);
}
