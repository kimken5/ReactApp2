using ReactApp.Server.DTOs;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// ユーザー検索サービスインターフェース
    /// 電話番号による保護者・スタッフの存在確認と役割判定を提供
    /// </summary>
    public interface IUserLookupService
    {
        /// <summary>
        /// 電話番号によるユーザー存在確認と役割判定
        /// 保護者・スタッフの両方を検索し、統合結果を返却
        /// </summary>
        /// <param name="phoneNumber">検索対象の電話番号</param>
        /// <returns>ユーザー検索結果（役割情報含む）</returns>
        Task<UserLookupResult> CheckUserByPhoneNumberAsync(string phoneNumber);

        /// <summary>
        /// 保護者として登録されているかチェック
        /// 園児との関連付けがあることも確認
        /// </summary>
        /// <param name="phoneNumber">検索対象の電話番号</param>
        /// <returns>保護者として有効な場合true</returns>
        Task<bool> IsParentAsync(string phoneNumber);

        /// <summary>
        /// スタッフとして登録されているかチェック
        /// アクティブなスタッフのみを対象
        /// </summary>
        /// <param name="phoneNumber">検索対象の電話番号</param>
        /// <returns>スタッフとして有効な場合true</returns>
        Task<bool> IsStaffAsync(string phoneNumber);

        /// <summary>
        /// ユーザー種別フラグを取得
        /// 複数の役割を持つ場合は組み合わせで返却
        /// </summary>
        /// <param name="phoneNumber">検索対象の電話番号</param>
        /// <returns>ユーザー種別フラグ</returns>
        Task<UserTypeFlags> GetUserTypesAsync(string phoneNumber);

        /// <summary>
        /// 保護者情報の詳細取得
        /// 園児数や最終ログイン時刻など付加情報を含む
        /// </summary>
        /// <param name="phoneNumber">検索対象の電話番号</param>
        /// <returns>保護者詳細情報（見つからない場合はnull）</returns>
        Task<ParentLookupInfo?> GetParentInfoAsync(string phoneNumber);

        /// <summary>
        /// スタッフ情報の詳細取得
        /// 職位や最終ログイン時刻など付加情報を含む
        /// </summary>
        /// <param name="phoneNumber">検索対象の電話番号</param>
        /// <returns>スタッフ詳細情報（見つからない場合はnull）</returns>
        Task<StaffLookupInfo?> GetStaffInfoAsync(string phoneNumber);

        /// <summary>
        /// ユーザーの役割選択履歴を保存
        /// 次回ログイン時の自動選択に使用
        /// </summary>
        /// <param name="phoneNumber">対象の電話番号</param>
        /// <param name="preferredRole">選択された役割</param>
        /// <returns>保存処理の成功可否</returns>
        Task<bool> SaveRolePreferenceAsync(string phoneNumber, UserType preferredRole);

        /// <summary>
        /// 保存された役割選択履歴を取得
        /// 自動選択のために使用
        /// </summary>
        /// <param name="phoneNumber">対象の電話番号</param>
        /// <returns>保存された役割（未保存の場合はnull）</returns>
        Task<UserType?> GetSavedRolePreferenceAsync(string phoneNumber);

        /// <summary>
        /// 電話番号の正規化
        /// ハイフンや空白を除去し、統一形式に変換
        /// </summary>
        /// <param name="phoneNumber">正規化対象の電話番号</param>
        /// <returns>正規化された電話番号</returns>
        string NormalizePhoneNumber(string phoneNumber);
    }
}