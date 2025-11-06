using ReactApp.Server.DTOs.Desktop;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デスクトップアプリ用マスタ管理サービスインターフェース
    /// </summary>
    public interface IDesktopMasterService
    {
        // 保育園情報管理
        Task<NurseryDto?> GetNurseryAsync(int nurseryId);
        Task<NurseryDto> UpdateNurseryAsync(int nurseryId, UpdateNurseryRequestDto request);

        // クラス管理
        Task<List<ClassDto>> GetClassesAsync(int nurseryId, ClassFilterDto filter);
        Task<ClassDto?> GetClassByIdAsync(int nurseryId, string classId);
        Task<ClassDto> CreateClassAsync(int nurseryId, CreateClassRequestDto request);
        Task<ClassDto> UpdateClassAsync(int nurseryId, string classId, UpdateClassRequestDto request);
        Task DeleteClassAsync(int nurseryId, string classId);

        // 園児管理
        Task<List<ChildDto>> GetChildrenAsync(int nurseryId, ChildFilterDto filter);
        Task<ChildDto?> GetChildByIdAsync(int nurseryId, int childId);
        Task<ChildDto> CreateChildAsync(int nurseryId, CreateChildRequestDto request);
        Task<ChildDto> UpdateChildAsync(int nurseryId, int childId, UpdateChildRequestDto request);
        Task DeleteChildAsync(int nurseryId, int childId);

        // 保護者管理
        Task<List<ParentDto>> GetParentsAsync(int nurseryId, ParentFilterDto filter);
        Task<ParentDto?> GetParentByIdAsync(int nurseryId, int parentId);
        Task<ParentDto> CreateParentAsync(int nurseryId, CreateParentRequestDto request);
        Task<ParentDto> UpdateParentAsync(int nurseryId, int parentId, UpdateParentRequestDto request);
        Task DeleteParentAsync(int nurseryId, int parentId);

        // 職員管理
        Task<List<StaffDto>> GetStaffAsync(int nurseryId, StaffFilterDto filter);
        Task<StaffDto?> GetStaffByIdAsync(int nurseryId, int staffId);
        Task<StaffDto> CreateStaffAsync(int nurseryId, CreateStaffRequestDto request);
        Task<StaffDto> UpdateStaffAsync(int nurseryId, int staffId, UpdateStaffRequestDto request);
        Task DeleteStaffAsync(int nurseryId, int staffId);
        Task<List<StaffClassAssignmentDto>> UpdateStaffClassAssignmentsAsync(int nurseryId, int staffId, List<StaffClassAssignmentRequestDto> assignments);

        // クラス構成管理
        Task<ClassCompositionDto> GetClassCompositionAsync(int nurseryId, string classId);
        Task<ClassCompositionDto> UpdateClassCompositionAsync(int nurseryId, string classId, UpdateClassCompositionRequestDto request);
    }
}
