import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import { staffClassAssignmentService } from '../../services/staffClassAssignmentService';
import { academicYearService } from '../../services/academicYearService';
import type { ClassDto, StaffDto, ChildDto, AssignedStaffDto, AssignedChildDto } from '../types/master';
import { AssignmentRoles, AssignmentRoleLabels } from '../../types/staffClassAssignment';

/**
 * クラス構成管理ページ
 * 担任の追加/削除、園児の追加/削除を行う
 */
export function ClassCompositionPage() {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();

  const [classData, setClassData] = useState<ClassDto | null>(null);
  const [allStaff, setAllStaff] = useState<StaffDto[]>([]);
  const [allChildren, setAllChildren] = useState<ChildDto[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<StaffDto[]>([]);
  const [assignedChildren, setAssignedChildren] = useState<ChildDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // オートコンプリート用状態
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [showStaffSuggestions, setShowStaffSuggestions] = useState(false);
  const [childSearchQuery, setChildSearchQuery] = useState('');
  const [showChildSuggestions, setShowChildSuggestions] = useState(false);

  // 役割管理用状態
  const [currentAcademicYear, setCurrentAcademicYear] = useState<number>(new Date().getFullYear());
  const [staffRoles, setStaffRoles] = useState<Map<number, string>>(new Map());
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // 削除確認用状態
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<StaffDto | null>(null);
  const [deleteConfirmChild, setDeleteConfirmChild] = useState<ChildDto | null>(null);

  // 初期データ読み込み
  useEffect(() => {
    if (classId) {
      loadData();
    }
  }, [classId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // 現在の年度を取得
      const years = await academicYearService.getAcademicYears(1); // nurseryId = 1
      const currentYear = years.find(y => y.isCurrent);
      if (currentYear) {
        setCurrentAcademicYear(currentYear.year);
      }

      // クラス情報、クラス構成、全職員、全園児を並列取得
      const [classInfo, composition, staffList, childrenList] = await Promise.all([
        masterService.getClass(classId!),
        masterService.getClassComposition(classId!),
        masterService.getStaff(),
        masterService.getChildren({ isActive: true }),
      ]);

      setClassData(classInfo);
      setAllStaff(staffList);
      setAllChildren(childrenList);

      // 実データから既に割り当てられている職員と園児を設定
      const assignedStaffData = composition.assignedStaff.map(assigned => {
        const fullStaff = staffList.find(s => s.staffId === assigned.staffId);
        return fullStaff || {
          nurseryId: 0,
          staffId: assigned.staffId,
          name: assigned.name,
          role: assigned.assignmentRole,
          phoneNumber: '',
          isActive: true,
          createdAt: '',
        } as StaffDto;
      });

      const assignedChildrenData = composition.assignedChildren.map(assigned => {
        const fullChild = childrenList.find(c => c.childId === assigned.childId);
        return fullChild || {
          nurseryId: 0,
          childId: assigned.childId,
          familyName: assigned.name.split(' ')[0] || assigned.name,
          firstName: assigned.name.split(' ')[1] || '',
          name: assigned.name,
          familyFurigana: assigned.furigana?.split(' ')[0],
          firstFurigana: assigned.furigana?.split(' ')[1],
          furigana: assigned.furigana,
          dateOfBirth: '',
          gender: '',
          classId: '',
          className: '',
          isActive: true,
          noPhoto: false,
          createdAt: '',
          age: 0,
          parents: [],
        } as ChildDto;
      });

      setAssignedStaff(assignedStaffData);
      setAssignedChildren(assignedChildrenData);

      // 現在年度のスタッフ役割割り当てを取得
      if (currentYear && classInfo) {
        try {
          const assignments = await staffClassAssignmentService.getClassStaffAssignments(
            classInfo.nurseryId,
            currentYear.year
          );
          const classAssignment = assignments.find(a => a.classId === classId);
          if (classAssignment) {
            const roleMap = new Map<number, string>();
            classAssignment.assignedStaff.forEach(staff => {
              if (staff.assignmentRole) {
                roleMap.set(staff.staffId, staff.assignmentRole);
              }
            });
            setStaffRoles(roleMap);
          }
        } catch (error) {
          console.warn('スタッフ役割の取得に失敗しました:', error);
        }
      }

    } catch (error) {
      console.error('データの取得に失敗しました:', error);
      setErrors({ general: 'データの取得に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // 職員を追加
  const handleAddStaff = (staff: StaffDto) => {
    if (!assignedStaff.find(s => s.staffId === staff.staffId)) {
      setAssignedStaff(prev => [...prev, staff]);
    }
    setStaffSearchQuery('');
    setShowStaffSuggestions(false);
  };

  // 職員を削除（確認後）
  const handleRemoveStaff = (staffId: number) => {
    setAssignedStaff(prev => prev.filter(s => s.staffId !== staffId));
    setDeleteConfirmStaff(null);
  };

  // 園児を追加
  const handleAddChild = (child: ChildDto) => {
    if (!assignedChildren.find(c => c.childId === child.childId)) {
      setAssignedChildren(prev => [...prev, child]);
    }
    setChildSearchQuery('');
    setShowChildSuggestions(false);
  };

  // 園児を削除（確認後）
  const handleRemoveChild = (childId: number) => {
    setAssignedChildren(prev => prev.filter(c => c.childId !== childId));
    setDeleteConfirmChild(null);
  };

  // フィルタされた職員候補を取得
  const getFilteredStaff = () => {
    if (!staffSearchQuery.trim()) return [];
    const query = staffSearchQuery.toLowerCase();
    return allStaff.filter(staff => {
      if (assignedStaff.find(s => s.staffId === staff.staffId)) return false;
      const name = staff.name || '';
      return name.toLowerCase().includes(query);
    }).slice(0, 10);
  };

  // フィルタされた園児候補を取得
  const getFilteredChildren = () => {
    if (!childSearchQuery.trim()) return [];
    const query = childSearchQuery.toLowerCase();
    return allChildren.filter(child => {
      if (assignedChildren.find(c => c.childId === child.childId)) return false;
      const name = child.name || '';
      const furigana = child.furigana || '';
      return name.toLowerCase().includes(query) || furigana.toLowerCase().includes(query);
    }).slice(0, 10);
  };

  // 役割を変更（ドロップダウンから直接）
  const handleRoleChange = async (staffId: number, newRole: string) => {
    if (!classData) return;

    try {
      setIsUpdatingRole(true);
      setErrors({});

      const roleValue = newRole === '' ? undefined : newRole;

      await staffClassAssignmentService.updateAssignmentRole(
        classData.nurseryId,
        currentAcademicYear,
        staffId,
        classId!,
        { assignmentRole: roleValue, notes: undefined }
      );

      // ローカル状態を更新
      const newRoleMap = new Map(staffRoles);
      if (roleValue) {
        newRoleMap.set(staffId, roleValue);
      } else {
        newRoleMap.delete(staffId);
      }
      setStaffRoles(newRoleMap);

      setSuccessMessage('役割を更新しました');
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('役割の更新に失敗しました:', error);
      setErrors({ general: '役割の更新に失敗しました' });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // 保存処理
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrors({});

      // 実際のAPI呼び出し
      await masterService.updateClassComposition(classId!, {
        staffIds: assignedStaff.map(s => s.staffId),
        childIds: assignedChildren.map(c => c.childId),
      });

      setSuccessMessage('クラス構成を保存しました');
      // 保存後も画面に留まる

    } catch (error) {
      console.error('保存に失敗しました:', error);
      setErrors({ general: '保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
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

  if (!classData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">クラス情報が見つかりませんでした</p>
          <button
            onClick={() => navigate('/desktop/classes')}
            className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            一覧に戻る
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            クラス構成管理
          </h1>
          <p className="text-gray-600">
            {classData.name} ({classData.classId}) の担任・園児を設定します
          </p>
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

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 担任職員セクション */}
              <div className="border border-gray-200 rounded-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              担任職員
            </h2>

            {/* 職員検索・追加 */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                職員を追加
              </label>
              <input
                type="text"
                value={staffSearchQuery}
                onChange={(e) => {
                  setStaffSearchQuery(e.target.value);
                  setShowStaffSuggestions(true);
                }}
                onFocus={() => setShowStaffSuggestions(true)}
                onBlur={() => setTimeout(() => setShowStaffSuggestions(false), 200)}
                placeholder="職員名を入力..."
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
              />

              {/* 候補リスト */}
              {showStaffSuggestions && staffSearchQuery && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {getFilteredStaff().length === 0 ? (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      該当する職員が見つかりません
                    </div>
                  ) : (
                    getFilteredStaff().map((staff) => (
                      <button
                        key={staff.staffId}
                        type="button"
                        onClick={() => handleAddStaff(staff)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{staff.name}</div>
                        <div className="text-sm text-gray-600">{staff.position || '職位未設定'}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 割り当て済み職員一覧 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                担任職員 ({assignedStaff.length}人)
              </label>
              {assignedStaff.length === 0 ? (
                <div className="px-4 py-3 border border-gray-200 rounded-md bg-gray-50 text-gray-500 text-sm">
                  担任が設定されていません
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedStaff.map((staff) => {
                    const role = staffRoles.get(staff.staffId);
                    return (
                      <div
                        key={staff.staffId}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">{staff.name}</div>
                          <div className="text-sm text-gray-600">{staff.position || '職位未設定'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={role || ''}
                            onChange={(e) => handleRoleChange(staff.staffId, e.target.value)}
                            disabled={isUpdatingRole}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">なし</option>
                            <option value={AssignmentRoles.MainTeacher}>
                              {AssignmentRoleLabels[AssignmentRoles.MainTeacher]}
                            </option>
                            <option value={AssignmentRoles.AssistantTeacher}>
                              {AssignmentRoleLabels[AssignmentRoles.AssistantTeacher]}
                            </option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmStaff(staff)}
                            className="relative group p-2 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 hover:shadow-md transition-all duration-200"
                            title="削除"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              削除
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

              {/* クラス園児セクション */}
              <div className="border border-gray-200 rounded-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              クラス園児
            </h2>

            {/* 園児検索・追加 */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                園児を追加
              </label>
              <input
                type="text"
                value={childSearchQuery}
                onChange={(e) => {
                  setChildSearchQuery(e.target.value);
                  setShowChildSuggestions(true);
                }}
                onFocus={() => setShowChildSuggestions(true)}
                onBlur={() => setTimeout(() => setShowChildSuggestions(false), 200)}
                placeholder="園児名またはふりがなを入力..."
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
              />

              {/* 候補リスト */}
              {showChildSuggestions && childSearchQuery && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {getFilteredChildren().length === 0 ? (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      該当する園児が見つかりません
                    </div>
                  ) : (
                    getFilteredChildren().map((child) => (
                      <button
                        key={child.childId}
                        type="button"
                        onClick={() => handleAddChild(child)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{child.name}</div>
                        {child.furigana && (
                          <div className="text-sm text-gray-500">{child.furigana}</div>
                        )}
                        <div className="text-sm text-gray-600">
                          {child.className || 'クラス未所属'} / {calculateAge(child.dateOfBirth)}歳
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 割り当て済み園児一覧 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                クラス園児 ({assignedChildren.length}人 / {classData.maxCapacity}人)
              </label>
              {assignedChildren.length === 0 ? (
                <div className="px-4 py-3 border border-gray-200 rounded-md bg-gray-50 text-gray-500 text-sm">
                  園児が設定されていません
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {assignedChildren.map((child) => (
                    <div
                      key={child.childId}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{child.name}</div>
                        {child.furigana && (
                          <div className="text-xs text-gray-500">{child.furigana}</div>
                        )}
                        <div className="text-sm text-gray-600">
                          {calculateAge(child.dateOfBirth)}歳
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmChild(child)}
                        className="relative group p-2 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 hover:shadow-md transition-all duration-200"
                        title="削除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          削除
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/desktop/classes')}
              className="px-6 py-2 border border-gray-200 rounded-md text-gray-700 font-medium hover:shadow-md transition-all duration-200"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium transition-all duration-200 ${
                isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
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
        </div>

      </div>

      {/* 職員削除確認モーダル */}
      {deleteConfirmStaff && (
        <>
          {/* オーバーレイ */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setDeleteConfirmStaff(null)}
          />

          {/* モーダル */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
              {/* ヘッダー */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">担任職員を削除</h3>
              </div>

              {/* コンテンツ */}
              <div className="px-6 py-6">
                <p className="text-gray-600 mb-6">
                  本当に「{deleteConfirmStaff.name}」をこのクラスの担任から削除しますか？
                </p>

                {/* ボタン */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setDeleteConfirmStaff(null)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => handleRemoveStaff(deleteConfirmStaff.staffId)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    削除する
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 園児削除確認モーダル */}
      {deleteConfirmChild && (
        <>
          {/* オーバーレイ */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setDeleteConfirmChild(null)}
          />

          {/* モーダル */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
              {/* ヘッダー */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">園児を削除</h3>
              </div>

              {/* コンテンツ */}
              <div className="px-6 py-6">
                <p className="text-gray-600 mb-6">
                  本当に「{deleteConfirmChild.name}」をこのクラスから削除しますか？
                </p>

                {/* ボタン */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setDeleteConfirmChild(null)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => handleRemoveChild(deleteConfirmChild.childId)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    削除する
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

// 年齢計算ヘルパー
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
