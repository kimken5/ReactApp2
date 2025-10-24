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
  const [activeTab, setActiveTab] = useState<'basic' | 'assignments'>('basic');

  // 基本情報フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    role: '',
    position: '',
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
        setFormData({
          name: staffData.name,
          phoneNumber: staffData.phoneNumber,
          email: staffData.email || '',
          role: staffData.role,
          position: staffData.position || '',
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

      if (isEditMode && staffId) {
        // 編集モード
        const updateRequest: UpdateStaffRequestDto = {
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          email: formData.email || undefined,
          role: formData.role,
          position: formData.position || undefined,
          isActive: formData.isActive,
        };
        await masterService.updateStaff(parseInt(staffId, 10), updateRequest);
      } else {
        // 新規作成モード
        const createRequest: CreateStaffRequestDto = {
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          email: formData.email || undefined,
          role: formData.role,
          position: formData.position || undefined,
        };
        await masterService.createStaff(createRequest);
      }

      navigate('/desktop/staff');
    } catch (error) {
      console.error('保存に失敗しました:', error);
      setErrors({ general: '保存に失敗しました' });
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isEditMode ? '職員編集' : '職員新規作成'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? '職員情報を編集します' : '新しい職員を登録します'}
          </p>
        </div>

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

        {/* タブナビゲーション（編集時のみ） */}
        {isEditMode && (
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('basic')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'basic'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                基本情報
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'assignments'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                クラス担当管理
              </button>
            </nav>
          </div>
        )}

        {/* 基本情報タブ */}
        {activeTab === 'basic' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
            <div className="p-6 space-y-6">
              {/* 基本情報セクション */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  基本情報
                </h2>
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

                  {/* 有効/無効（編集時のみ） */}
                  {isEditMode && (
                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">有効にする</span>
                      </label>
                      <p className="mt-1 text-sm text-gray-500">
                        無効にすると、この職員は一覧に表示されなくなります
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* フッター（保存・キャンセルボタン） */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium transition ${
                  isSaving
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-indigo-700 active:bg-indigo-800'
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
        )}

        {/* クラス担当管理タブ（編集時のみ） */}
        {activeTab === 'assignments' && isEditMode && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 space-y-6">
              {/* 現在の担当クラス一覧 */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  現在の担当クラス
                </h2>
                {classAssignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">担当クラスがありません</p>
                ) : (
                  <div className="space-y-3">
                    {classAssignments.map((assignment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {assignment.className || assignment.classId}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="mr-4">
                              役割: {assignment.role === 'MainTeacher' ? '主担任' : '副担任'}
                            </span>
                            <span>年度: {assignment.academicYear}年度</span>
                          </div>
                          {assignment.assignedAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              割当日: {new Date(assignment.assignedAt).toLocaleDateString('ja-JP')}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveAssignment(index)}
                          className="ml-4 px-4 py-2 text-red-600 hover:text-red-800 font-medium"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 新規割り当て追加フォーム */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  新規クラス担当追加
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* クラス選択 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      クラス <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={newAssignment.classId}
                      onChange={(e) =>
                        setNewAssignment(prev => ({ ...prev, classId: e.target.value }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">選択してください</option>
                      {classes.map(cls => (
                        <option key={cls.classId} value={cls.classId}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 役割 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      役割 <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={newAssignment.role}
                      onChange={(e) =>
                        setNewAssignment(prev => ({ ...prev, role: e.target.value }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="MainTeacher">主担任</option>
                      <option value="AssistantTeacher">副担任</option>
                    </select>
                  </div>

                  {/* 年度 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      年度 <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={newAssignment.academicYear}
                      onChange={(e) =>
                        setNewAssignment(prev => ({ ...prev, academicYear: parseInt(e.target.value) }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() + (2 - i);
                        return (
                          <option key={year} value={year}>
                            {year}年度
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleAddAssignment}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                  >
                    追加する
                  </button>
                </div>
              </div>
            </div>

            {/* フッター */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
