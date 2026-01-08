import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import type {
  StaffDto,
  CreateStaffRequestDto,
  UpdateStaffRequestDto,
  ClassDto,
  StaffClassAssignmentDto,
  StaffClassAssignmentRequestDto,
} from '../types/master';

/**
 * 職員作成・編集ページ
 * 新規作成モードと編集モードの両対応（タブUI: 基本情報、クラス担当）
 */
export function StaffFormPage() {
  const navigate = useNavigate();
  const { staffId } = useParams<{ staffId: string }>();
  const isEditMode = !!staffId;

  const [staff, setStaff] = useState<StaffDto | null>(null);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'basic' | 'assignments'>('basic');

  // 基本情報フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    role: '',
    position: '',
    resignationDate: '',
    remark: '',
    isActive: true,
  });

  // クラス担当状態
  const [classAssignments, setClassAssignments] = useState<StaffClassAssignmentDto[]>([]);
  const [newAssignment, setNewAssignment] = useState({
    classId: '',
    role: 'MainTeacher',
    academicYear: new Date().getFullYear(),
  });

  // 初期データ読み込み
  useEffect(() => {
    loadData();
  }, [staffId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // クラス一覧を取得
      const classesData = await masterService.getClasses({ isActive: true });
      setClasses(classesData);

      // 編集モードの場合は職員データを取得
      if (isEditMode && staffId) {
        const staffData = await masterService.getStaffById(parseInt(staffId, 10));
        setStaff(staffData);

        // 電話番号をハイフン付き形式にフォーマット
        const formatPhoneNumber = (phone: string): string => {
          const cleaned = phone.replace(/\D/g, '');
          if (cleaned.length === 11) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
          } else if (cleaned.length === 10) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
          }
          return phone;
        };

        // 日付をYYYY-MM-DD形式にフォーマット
        const formatDateForInput = (dateString: string | undefined): string => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
          } catch {
            return '';
          }
        };

        setFormData({
          name: staffData.name,
          phoneNumber: formatPhoneNumber(staffData.phoneNumber),
          email: staffData.email || '',
          role: staffData.role,
          position: staffData.position || '',
          resignationDate: formatDateForInput(staffData.resignationDate),
          remark: staffData.remark || '',
          isActive: staffData.isActive,
        });
        setClassAssignments(staffData.classAssignments);
      }
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
      setErrors({ general: 'データの取得に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // 入力値変更ハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'phoneNumber') {
      // 電話番号のハイフン自動挿入
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      if (cleaned.length > 3 && cleaned.length <= 7) {
        formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
      } else if (cleaned.length > 7) {
        formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
      }
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // エラークリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '氏名は必須です';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = '電話番号は必須です';
    } else if (!/^\d{3}-\d{4}-\d{4}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = '電話番号は XXX-XXXX-XXXX の形式で入力してください';
    }

    if (!formData.role) {
      newErrors.role = '役割は必須です';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'メールアドレスの形式が正しくありません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});
      setSuccessMessage('');

      if (isEditMode && staffId) {
        // 編集モード
        const updateRequest: UpdateStaffRequestDto = {
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          email: formData.email || undefined,
          role: formData.role,
          position: formData.position || undefined,
          resignationDate: formData.resignationDate || undefined,
          remark: formData.remark || undefined,
          isActive: formData.isActive,
        };
        await masterService.updateStaff(parseInt(staffId, 10), updateRequest);
        // 編集モードは一覧に戻る
        navigate('/desktop/staff');
      } else {
        // 新規作成モード
        const createRequest: CreateStaffRequestDto = {
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          email: formData.email || undefined,
          role: formData.role,
          position: formData.position || undefined,
          remark: formData.remark || undefined,
        };
        await masterService.createStaff(createRequest);

        // 新規作成モードはフォームをクリアして同じページに留まる
        setFormData({
          name: '',
          phoneNumber: '',
          email: '',
          role: '',
          position: '',
          resignationDate: '',
          remark: '',
          isActive: true,
        });
        setSuccessMessage('職員を登録しました');

        // 3秒後に成功メッセージをクリア
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error: unknown) {
      console.error('保存に失敗しました:', error);

      // Extract error message from API response
      let errorMessage = '保存に失敗しました';
      if (typeof error === 'object' && error !== null) {
        const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
        if (axiosError.response?.data?.error?.message) {
          errorMessage = axiosError.response.data.error.message;
        }
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  // クラス担当追加
  const handleAddAssignment = async () => {
    if (!isEditMode || !staffId) return;

    if (!newAssignment.classId) {
      alert('クラスを選択してください');
      return;
    }

    try {
      const assignmentRequest: StaffClassAssignmentRequestDto = {
        classId: newAssignment.classId,
        role: newAssignment.role,
        academicYear: newAssignment.academicYear,
      };

      const updatedAssignments = await masterService.updateStaffClassAssignments(
        parseInt(staffId, 10),
        [...classAssignments.map(a => ({
          classId: a.classId,
          role: a.role || 'MainTeacher',
          academicYear: a.academicYear,
        })), assignmentRequest]
      );

      setClassAssignments(updatedAssignments);
      setNewAssignment({
        classId: '',
        role: 'MainTeacher',
        academicYear: new Date().getFullYear(),
      });
    } catch (error) {
      console.error('クラス担当の追加に失敗しました:', error);
      alert('クラス担当の追加に失敗しました');
    }
  };

  // クラス担当削除
  const handleRemoveAssignment = async (index: number) => {
    if (!isEditMode || !staffId) return;

    if (!confirm('このクラス担当を削除してもよろしいですか？')) {
      return;
    }

    try {
      const updatedAssignments = classAssignments.filter((_, i) => i !== index);
      const assignmentRequests = updatedAssignments.map(a => ({
        classId: a.classId,
        role: a.role || 'MainTeacher',
        academicYear: a.academicYear,
      }));

      const result = await masterService.updateStaffClassAssignments(
        parseInt(staffId, 10),
        assignmentRequests
      );

      setClassAssignments(result);
    } catch (error) {
      console.error('クラス担当の削除に失敗しました:', error);
      alert('クラス担当の削除に失敗しました');
    }
  };

  // キャンセル
  const handleCancel = () => {
    navigate('/desktop/staff');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? '職員編集' : '職員新規作成'}
          </h1>
        </div>

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {successMessage}
          </div>
        )}

        {/* エラーメッセージ */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {errors.general}
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-md">
            <div className="p-6 space-y-6">
              {/* 基本情報セクション */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 氏名 */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      氏名 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="例: 山田 花子"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  {/* 電話番号 */}
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      電話番号 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="090-1234-5678"
                    />
                    {errors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                    )}
                  </div>

                  {/* メールアドレス */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="example@example.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  {/* 役割 */}
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                      役割 <span className="text-red-600">*</span>
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.role ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">選択してください</option>
                      <option value="teacher">教職員</option>
                      <option value="admin">管理者</option>
                      <option value="principal">園長</option>
                      <option value="nurse">看護師</option>
                    </select>
                    {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                  </div>

                  {/* 役職 */}
                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                      役職
                    </label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="例: 主任、副主任"
                    />
                  </div>

                  {/* 退職日（編集時のみ） */}
                  {isEditMode && (
                    <div>
                      <label htmlFor="resignationDate" className="block text-sm font-medium text-gray-700 mb-2">
                        退職日
                      </label>
                      <input
                        type="date"
                        id="resignationDate"
                        name="resignationDate"
                        value={formData.resignationDate}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        退職日を設定すると、職員の退職状況を記録できます
                      </p>
                    </div>
                  )}

                  {/* 担当クラス（編集時のみ） */}
                  {isEditMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        担当クラス
                      </label>
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[42px] flex items-center">
                        {classAssignments.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {classAssignments.map((assignment, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-200"
                              >
                                {assignment.className || assignment.classId}
                                {assignment.academicYear && ` (${assignment.academicYear}年度)`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">担当クラスなし</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        クラス担当の追加・削除は「クラス担当管理」タブで行えます
                      </p>
                    </div>
                  )}

                  {/* ID（編集時のみ） */}
                  {isEditMode && staff && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID
                      </label>
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        <span className="text-gray-900 font-mono">
                          {String(staff.staffId).padStart(6, '0')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 備考 */}
                  <div className="md:col-span-2">
                    <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-2">
                      備考
                    </label>
                    <textarea
                      id="remark"
                      name="remark"
                      value={formData.remark}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="職員に関する備考を入力してください（最大500文字）"
                      maxLength={500}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.remark.length}/500文字
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* フッター（保存・キャンセルボタン） */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-md flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-all duration-200"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium transition-all duration-200 ${
                  isSaving
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-lg'
                }`}
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    保存中...
                  </span>
                ) : (
                  '保存する'
                )}
              </button>
            </div>
          </form>
      </div>
    </DashboardLayout>
  );
}
