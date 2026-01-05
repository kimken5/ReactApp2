import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../desktop/components/layout/DashboardLayout';
import { staffClassAssignmentService } from '../../services/staffClassAssignmentService';
import { academicYearService } from '../../services/academicYearService';
import type { ClassStaffAssignment, AvailableStaff, AssignedStaff } from '../../types/staffClassAssignment';
import type { AcademicYear } from '../../types/academicYear';
import { AssignmentRoleLabels, AssignmentRoles } from '../../types/staffClassAssignment';

/**
 * クラス別担任割り当て画面
 */
export default function StaffClassAssignment() {
  const navigate = useNavigate();

  // TODO: 実際のnurseryIdとuserIdはユーザーコンテキストから取得
  const nurseryId = 1;
  const userId = 1;

  const [loading, setLoading] = useState(true);
  const [isOperating, setIsOperating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const [classAssignments, setClassAssignments] = useState<ClassStaffAssignment[]>([]);
  const [availableStaff, setAvailableStaff] = useState<AvailableStaff[]>([]);

  // 割り当てモーダル用の状態
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassStaffAssignment | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [assignmentRole, setAssignmentRole] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // 役割編集モーダル用の状態
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<{ classId: string; staff: AssignedStaff } | null>(null);
  const [editRole, setEditRole] = useState<string>('');
  const [editNotes, setEditNotes] = useState('');

  // 削除確認モーダル用の状態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<{ classId: string; staffId: number; staffName: string } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadAssignmentData();
    }
  }, [selectedYear]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [yearsData, current] = await Promise.all([
        academicYearService.getAcademicYears(nurseryId),
        academicYearService.getCurrentYear(nurseryId),
      ]);

      setYears(yearsData);
      setCurrentYear(current);

      if (current) {
        setSelectedYear(current.year);
      } else {
        setError('現在年度が設定されていません。');
      }
    } catch (err) {
      setError('データの読み込みに失敗しました');
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentData = async (showLoadingScreen = true) => {
    if (!selectedYear) return;

    try {
      if (showLoadingScreen) {
        setLoading(true);
      }
      setError(null);

      const [assignments, staff] = await Promise.all([
        staffClassAssignmentService.getClassStaffAssignments(nurseryId, selectedYear),
        staffClassAssignmentService.getAvailableStaff(nurseryId, selectedYear),
      ]);

      setClassAssignments(assignments);
      setAvailableStaff(staff);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('担任割り当て情報の読み込みに失敗しました');
      }
      console.error('Failed to load assignment data:', err);
    } finally {
      if (showLoadingScreen) {
        setLoading(false);
      }
    }
  };

  const handleOpenAssignModal = (cls: ClassStaffAssignment) => {
    setSelectedClass(cls);
    setSelectedStaffId(null);
    setAssignmentRole('');
    setAssignmentNotes('');
    setShowAssignModal(true);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedClass(null);
    setSelectedStaffId(null);
    setAssignmentRole('');
    setAssignmentNotes('');
  };

  const handleAssignStaff = async () => {
    if (!selectedClass || !selectedStaffId || !selectedYear) return;

    try {
      setIsOperating(true);
      setError(null);

      await staffClassAssignmentService.assignStaffToClass({
        nurseryId,
        academicYear: selectedYear,
        staffId: selectedStaffId,
        classId: selectedClass.classId,
        assignmentRole: assignmentRole || undefined,
        notes: assignmentNotes || undefined,
        assignedByUserId: userId,
      });

      handleCloseAssignModal();
      await loadAssignmentData(false);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('スタッフの割り当てに失敗しました');
      }
      console.error('Failed to assign staff:', err);
    } finally {
      setIsOperating(false);
    }
  };

  const handleUnassignStaff = async () => {
    if (!deletingStaff || !selectedYear) return;

    try {
      setIsOperating(true);
      setError(null);
      setShowDeleteConfirm(false);

      await staffClassAssignmentService.unassignStaffFromClass({
        nurseryId,
        academicYear: selectedYear,
        staffId: deletingStaff.staffId,
        classId: deletingStaff.classId,
      });

      setDeletingStaff(null);
      await loadAssignmentData(false);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('担任割り当ての解除に失敗しました');
      }
      console.error('Failed to unassign staff:', err);
    } finally {
      setIsOperating(false);
    }
  };

  const handleOpenEditRoleModal = (classId: string, staff: AssignedStaff) => {
    setEditingStaff({ classId, staff });
    setEditRole(staff.assignmentRole || '');
    setEditNotes(staff.notes || '');
    setShowEditRoleModal(true);
  };

  const handleCloseEditRoleModal = () => {
    setShowEditRoleModal(false);
    setEditingStaff(null);
    setEditRole('');
    setEditNotes('');
  };

  const handleUpdateRole = async () => {
    if (!editingStaff || !selectedYear) return;

    try {
      setIsOperating(true);
      setError(null);

      await staffClassAssignmentService.updateAssignmentRole(
        nurseryId,
        selectedYear,
        editingStaff.staff.staffId,
        editingStaff.classId,
        {
          assignmentRole: editRole || undefined,
          notes: editNotes || undefined,
        }
      );

      handleCloseEditRoleModal();
      await loadAssignmentData(false);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('役割の更新に失敗しました');
      }
      console.error('Failed to update role:', err);
    } finally {
      setIsOperating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">クラス別担任割り当て</h1>
            <p className="text-sm text-gray-600">各クラスの担任を割り当てます</p>
          </div>
          <button
            onClick={() => navigate('/desktop/academic-years')}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            年度管理に戻る
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* 年度選択 */}
        <div className="mb-6 bg-white rounded-md shadow-md p-6">
          <label htmlFor="yearSelect" className="block text-sm font-medium text-gray-700 mb-2">
            対象年度
          </label>
          <select
            id="yearSelect"
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map((year) => (
              <option key={year.year} value={year.year}>
                {year.year}年度 {year.isCurrent ? '(現在)' : year.isFuture ? '(未来)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* クラス一覧 */}
        <div className="space-y-4">
          {classAssignments.map((cls) => (
            <div key={cls.classId} className="bg-white rounded-md shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{cls.className}</h2>
                  <p className="text-sm text-gray-600">
                    対象年齢: {cls.ageGroupMin}〜{cls.ageGroupMax}歳 | 定員: {cls.maxCapacity}名
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAssignModal(cls)}
                  disabled={isOperating}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md hover:shadow-md transition-all duration-200 font-medium disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  担任を追加
                </button>
              </div>

              {/* 割り当て済みスタッフ一覧 */}
              {cls.assignedStaff.length > 0 ? (
                <div className="space-y-2">
                  {cls.assignedStaff.map((staff) => (
                    <div
                      key={staff.staffId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{staff.staffName}</span>
                          {staff.assignmentRole && (
                            <span
                              className={`px-2 py-1 text-xs rounded-md ${
                                staff.assignmentRole === AssignmentRoles.MainTeacher
                                  ? 'bg-purple-100 text-purple-800'
                                  : staff.assignmentRole === AssignmentRoles.AssistantTeacher
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {AssignmentRoleLabels[staff.assignmentRole] || staff.assignmentRole}
                            </span>
                          )}
                        </div>
                        {staff.notes && <p className="text-sm text-gray-600 mt-1">{staff.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        {/* 編集ボタン */}
                        <button
                          onClick={() => handleOpenEditRoleModal(cls.classId, staff)}
                          disabled={isOperating}
                          className="relative group p-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 hover:bg-blue-100 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="編集"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            編集
                          </span>
                        </button>
                        {/* 削除ボタン */}
                        <button
                          onClick={() => {
                            setDeletingStaff({ classId: cls.classId, staffId: staff.staffId, staffName: staff.staffName });
                            setShowDeleteConfirm(true);
                          }}
                          disabled={isOperating}
                          className="relative group p-2 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="解除"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            解除
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">担任が割り当てられていません</p>
              )}
            </div>
          ))}
        </div>

        {/* 担任割り当てモーダル */}
        {showAssignModal && selectedClass && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={handleCloseAssignModal}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
                {/* モーダルヘッダー */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">
                    担任を割り当て - {selectedClass.className}
                  </h2>
                  <button
                    onClick={handleCloseAssignModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* モーダルコンテンツ */}
                <div className="p-6 space-y-6">
                  <div>
                    <label htmlFor="staffSelect" className="block text-sm font-medium text-gray-700 mb-2">
                      スタッフ <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="staffSelect"
                      value={selectedStaffId || ''}
                      onChange={(e) => setSelectedStaffId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">選択してください</option>
                      {availableStaff.map((staff) => (
                        <option key={staff.staffId} value={staff.staffId}>
                          {staff.name}
                          {staff.currentAssignedClasses.length > 0 &&
                            ` (現在: ${staff.currentAssignedClasses.join(', ')})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="roleSelect" className="block text-sm font-medium text-gray-700 mb-2">
                      役割
                    </label>
                    <select
                      id="roleSelect"
                      value={assignmentRole}
                      onChange={(e) => setAssignmentRole(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">なし</option>
                      <option value={AssignmentRoles.MainTeacher}>{AssignmentRoleLabels.MainTeacher}</option>
                      <option value={AssignmentRoles.AssistantTeacher}>{AssignmentRoleLabels.AssistantTeacher}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="notesInput" className="block text-sm font-medium text-gray-700 mb-2">
                      備考
                    </label>
                    <textarea
                      id="notesInput"
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      rows={3}
                      maxLength={200}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="備考を入力（任意）"
                    />
                  </div>
                </div>

                {/* モーダルフッター */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                  <button
                    onClick={handleCloseAssignModal}
                    disabled={isOperating}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleAssignStaff}
                    disabled={!selectedStaffId || isOperating}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium hover:shadow-md transition-all duration-200 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                  >
                    {isOperating ? '割り当て中...' : '割り当て'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 役割編集モーダル */}
        {showEditRoleModal && editingStaff && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={handleCloseEditRoleModal}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
                {/* モーダルヘッダー */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">
                    役割を編集 - {editingStaff.staff.staffName}
                  </h2>
                  <button
                    onClick={handleCloseEditRoleModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* モーダルコンテンツ */}
                <div className="p-6 space-y-6">
                  <div>
                    <label htmlFor="editRoleSelect" className="block text-sm font-medium text-gray-700 mb-2">
                      役割
                    </label>
                    <select
                      id="editRoleSelect"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">なし</option>
                      <option value={AssignmentRoles.MainTeacher}>{AssignmentRoleLabels.MainTeacher}</option>
                      <option value={AssignmentRoles.AssistantTeacher}>{AssignmentRoleLabels.AssistantTeacher}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="editNotesInput" className="block text-sm font-medium text-gray-700 mb-2">
                      備考
                    </label>
                    <textarea
                      id="editNotesInput"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                      maxLength={200}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="備考を入力（任意）"
                    />
                  </div>
                </div>

                {/* モーダルフッター */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                  <button
                    onClick={handleCloseEditRoleModal}
                    disabled={isOperating}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleUpdateRole}
                    disabled={isOperating}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium hover:shadow-md transition-all duration-200 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                  >
                    {isOperating ? '更新中...' : '更新'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 削除確認モーダル */}
        {showDeleteConfirm && deletingStaff && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">担任割り当てを解除</h3>
                </div>
                <div className="px-6 py-6">
                  <p className="text-gray-600 mb-6">
                    「{deletingStaff.staffName}」の担任割り当てを解除しますか？
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletingStaff(null);
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleUnassignStaff}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
                    >
                      解除する
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
