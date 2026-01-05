import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../desktop/components/layout/DashboardLayout';
import { academicYearService } from '../../services/academicYearService';
import type { CreateAcademicYearRequest } from '../../types/academicYear';

/**
 * 年度作成・編集フォーム
 * 未来年度は1世代のみ作成可能。既に存在する場合は編集モードになる
 */
export default function AcademicYearCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // TODO: 実際のnurseryIdはユーザーコンテキストから取得
  const nurseryId = 1;

  const [formData, setFormData] = useState({
    year: 0, // 初期化時に設定
    startDate: '',
    endDate: '',
    isFuture: true,
    notes: '',
  });

  useEffect(() => {
    loadYearData();
  }, []);

  const loadYearData = async () => {
    try {
      setInitialLoading(true);

      // 現在年度を取得
      const currentYear = await academicYearService.getCurrentYear(nurseryId);

      if (!currentYear) {
        setError('現在年度が設定されていません。先に現在年度を作成してください。');
        setInitialLoading(false);
        return;
      }

      // 全年度を取得して未来年度をチェック
      const allYears = await academicYearService.getAcademicYears(nurseryId);
      const futureYears = allYears.filter(y => y.isFuture);

      if (futureYears.length > 0) {
        // 既に未来年度が存在する場合は編集モード
        const existingYear = futureYears[0];
        setIsEditMode(true);

        setFormData({
          year: existingYear.year,
          startDate: existingYear.startDate || '',
          endDate: existingYear.endDate || '',
          isFuture: true,
          notes: existingYear.notes || '',
        });
      } else {
        // 未来年度が存在しない場合は新規作成モード
        setIsEditMode(false);

        // 現在年度+1を新年度とする
        const newYear = currentYear.year + 1;

        // 現在年度の終了日+1日を開始日とする
        let defaultStartDate = '';
        if (currentYear.endDate) {
          const endDate = new Date(currentYear.endDate);
          endDate.setDate(endDate.getDate() + 1);
          defaultStartDate = endDate.toISOString().split('T')[0];
        } else {
          // 終了日がない場合は翌年4月1日
          defaultStartDate = `${newYear}-04-01`;
        }

        setFormData({
          year: newYear,
          startDate: defaultStartDate,
          endDate: '', // 終了日は未設定
          isFuture: true,
          notes: '',
        });
      }
    } catch (err) {
      console.error('Failed to load year data:', err);
      setError('年度情報の取得に失敗しました');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!formData.startDate) {
      setError('開始日を入力してください');
      return;
    }
    if (!formData.endDate) {
      setError('終了日を入力してください');
      return;
    }

    // 開始日が終了日より後でないかチェック
    if (formData.startDate >= formData.endDate) {
      setError('開始日は終了日より前である必要があります');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: CreateAcademicYearRequest = {
        nurseryId,
        year: formData.year,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isFuture: formData.isFuture,
        notes: formData.notes || undefined,
      };

      // 編集モードか新規作成モードかで分岐
      if (isEditMode) {
        await academicYearService.updateAcademicYear(nurseryId, formData.year, request);
      } else {
        await academicYearService.createAcademicYear(request);
      }

      // 成功したら一覧画面に戻る
      navigate('/desktop/academic-years');
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(isEditMode ? '年度の更新に失敗しました' : '年度の作成に失敗しました');
      }
      console.error('Failed to create/update academic year:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/desktop/academic-years');
  };

  if (initialLoading) {
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
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isEditMode ? '未来年度の編集' : '新規年度作成'}
          </h1>
          <p className="text-sm text-gray-600">
            {isEditMode
              ? '既存の未来年度を編集します。未来年度は1世代のみ作成可能です。'
              : '新しい年度を作成します。年度は現在年度+1に自動設定されます。'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isEditMode && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              未来年度が既に存在します。このフォームで編集できます。
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-md p-6">
          {/* 年度 */}
          <div className="mb-6">
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              年度
            </label>
            <input
              type="text"
              id="year"
              value={`${formData.year}年度`}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-sm cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              {isEditMode ? '年度は変更できません' : '現在年度+1が自動的に設定されます'}
            </p>
          </div>

          {/* 開始日 */}
          <div className="mb-6">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              開始日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              {isEditMode ? '開始日を変更できます' : '現在年度の終了日+1日がデフォルトで設定されます'}
            </p>
          </div>

          {/* 終了日 */}
          <div className="mb-6">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              終了日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="endDate"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              年度の終了日を入力してください
            </p>
          </div>

          {/* 備考 */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              備考（任意）
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={500}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="年度に関する追加情報があれば入力してください"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.notes.length} / 500文字
            </p>
          </div>

          {/* ボタン */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-md hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              {loading ? (isEditMode ? '更新中...' : '作成中...') : (isEditMode ? '更新' : '作成')}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-5 py-2.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium"
            >
              キャンセル
            </button>
          </div>
        </form>

        {/* 注意事項 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-sm font-semibold text-yellow-900 mb-2">注意事項</h3>
          <ul className="space-y-1 text-xs text-yellow-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>未来年度は1世代のみ作成可能です</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>一度作成した年度は削除できません</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>開始日は終了日より前である必要があります</span>
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
