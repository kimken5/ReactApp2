using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// スタッフ管理サービスインターフェース
    /// 保育園スタッフの登録・更新・検索機能を提供
    /// 役職・クラス別の管理とアクセス制御を含む
    /// </summary>
    public interface IStaffService
    {
        /// <summary>
        /// 全スタッフ一覧取得
        /// </summary>
        /// <returns>全アクティブスタッフの一覧</returns>
        Task<IEnumerable<StaffDto>> GetAllStaffAsync();

        /// <summary>
        /// 特定IDスタッフの詳細取得
        /// </summary>
        /// <param name="id">スタッフID</param>
        /// <returns>スタッフ詳細情報（見つからない場合はnull）</returns>
        Task<StaffDto?> GetStaffByIdAsync(int id);

        /// <summary>
        /// 電話番号でスタッフ検索
        /// </summary>
        /// <param name="phoneNumber">電話番号</param>
        /// <returns>該当スタッフ情報（見つからない場合はnull）</returns>
        Task<StaffDto?> GetStaffByPhoneNumberAsync(string phoneNumber);

        /// <summary>
        /// 役職別スタッフ一覧取得
        /// </summary>
        /// <param name="role">役職名</param>
        /// <returns>該当役職のスタッフ一覧</returns>
        Task<IEnumerable<StaffDto>> GetStaffByRoleAsync(string role);

        /// <summary>
        /// クラス別スタッフ一覧取得
        /// </summary>
        /// <param name="classId">クラスID</param>
        /// <returns>該当クラスのスタッフ一覧</returns>
        Task<IEnumerable<StaffDto>> GetStaffByClassIdAsync(string classId);

        /// <summary>
        /// 新規スタッフ登録
        /// </summary>
        /// <param name="dto">スタッフ登録データ</param>
        /// <returns>登録されたスタッフ情報</returns>
        Task<StaffDto> CreateStaffAsync(CreateStaffDto dto);

        /// <summary>
        /// スタッフ情報更新
        /// </summary>
        /// <param name="id">スタッフID</param>
        /// <param name="dto">更新データ</param>
        /// <returns>更新処理の成功可否</returns>
        Task<bool> UpdateStaffAsync(int id, UpdateStaffDto dto);

        /// <summary>
        /// スタッフ非アクティブ化
        /// </summary>
        /// <param name="id">スタッフID</param>
        /// <returns>非アクティブ化処理の成功可否</returns>
        Task<bool> DeactivateStaffAsync(int id);

        /// <summary>
        /// スタッフ削除処理
        /// </summary>
        /// <param name="id">スタッフID</param>
        /// <returns>削除処理の成功可否</returns>
        Task<bool> DeleteStaffAsync(int id);
    }
}