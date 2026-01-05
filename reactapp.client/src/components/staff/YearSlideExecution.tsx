import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../desktop/components/layout/DashboardLayout';
import { academicYearService } from '../../services/academicYearService';
import type { AcademicYear, YearSlidePreview, YearSlideRequest } from '../../types/academicYear';

/**
 * 年度スライド実行画面
 * プレビュー → 確認 → 実行の3ステップ
 */
export default function YearSlideExecution() {
  const navigate = useNavigate();

  // TODO: 実際のnurseryIdとuserIdはユーザーコンテキストから取得
  const nurseryId = 1;
  const userId = 1;

  const [step, setStep] = useState<'select' | 'preview' | 'confirm' | 'executing' | 'result'>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [targetYear, setTargetYear] = useState<number | null>(null);
  const [preview, setPreview] = useState<YearSlidePreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [yearsData, current] = await Promise.all([
        academicYearService.getAcademicYears(nurseryId),
        academicYearService.getCurrentYear(nurseryId),
      ]);

      setYears(yearsData);
      setCurrentYear(current);

      if (!current) {
        setError('現在年度が設定されていません。先に年度を作成してください。');
      }
    } catch (err) {
      setError('データの読み込みに失敗しました');
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPreview = async () => {
    if (!targetYear) {
      setError('スライド先の年度を選択してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const previewData = await academicYearService.getYearSlidePreview(nurseryId, targetYear);
      setPreview(previewData);
      setStep('preview');
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('プレビューの取得に失敗しました');
      }
      console.error('Failed to load preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSlide = async () => {
    if (!targetYear || !confirmed) {
      setError('確認チェックを入れてください');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStep('executing');

      const request: YearSlideRequest = {
        nurseryId,
        targetYear,
        confirmed: true,
        executedByUserId: userId,
      };

      const slideResult = await academicYearService.executeYearSlide(request);

      if (slideResult.success) {
        setResult(
          `年度スライドが正常に完了しました。\n` +
          `${slideResult.previousYear}年度 → ${slideResult.newYear}年度\n` +
          `園児: ${slideResult.slidedChildrenCount}名\n` +
          `職員: ${slideResult.slidedStaffCount}名`
        );
        setStep('result');
      } else {
        setError(slideResult.errorMessage || '年度スライドに失敗しました');
        setStep('confirm');
      }
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('年度スライドの実行に失敗しました');
      }
      setStep('confirm');
      console.error('Failed to execute year slide:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    navigate('/staff/academic-years');
  };

  if (loading && step === 'select') {
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">年度スライド実行</h1>
            <p className="text-sm text-gray-600">
              現在年度のクラス割り当てを新年度にコピーします
            </p>
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

      {/* ステップインジケーター */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center ${step === 'select' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="ml-2 font-medium">年度選択</span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200"></div>
          <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="ml-2 font-medium">プレビュー</span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200"></div>
          <div className={`flex items-center ${['confirm', 'executing', 'result'].includes(step) ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['confirm', 'executing', 'result'].includes(step) ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="ml-2 font-medium">実行</span>
          </div>
        </div>
      </div>

        {/* ステップ1: 年度選択 */}
        {step === 'select' && (
          <div className="bg-white rounded-md shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">スライド先の年度を選択</h2>

            {currentYear && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  現在年度: <span className="font-semibold">{currentYear.year}年度</span>
                </p>
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="targetYear" className="block text-sm font-medium text-gray-700 mb-2">
                スライド先年度
              </label>
              <select
                id="targetYear"
                value={targetYear || ''}
                onChange={(e) => setTargetYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">選択してください</option>
                {years
                  .filter((y) => y.isFuture)
                  .map((y) => (
                    <option key={y.year} value={y.year}>
                      {y.year}年度
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={handleLoadPreview}
              disabled={!targetYear || loading}
              className="w-full px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
            >
              プレビューを表示
            </button>
          </div>
        )}

        {/* ステップ2: プレビュー */}
        {step === 'preview' && preview && (
          <div className="bg-white rounded-md shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">スライド内容の確認</h2>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">現在年度</p>
                <p className="text-2xl font-bold text-gray-900">{preview.currentYear}年度</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-600">スライド先年度</p>
                <p className="text-2xl font-bold text-blue-900">{preview.targetYear}年度</p>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 mb-1">影響を受ける園児数</p>
                <p className="text-3xl font-bold text-gray-900">{preview.affectedChildrenCount}名</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 mb-1">影響を受ける職員数</p>
                <p className="text-3xl font-bold text-gray-900">{preview.affectedStaffCount}名</p>
              </div>
            </div>

            {preview.warnings.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h3 className="text-sm font-semibold text-yellow-900 mb-2">警告</h3>
                <ul className="space-y-1">
                  {preview.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-800">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-md hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                実行に進む
              </button>
              <button
                onClick={() => setStep('select')}
                className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                戻る
              </button>
            </div>
          </div>
        )}

        {/* ステップ3: 確認と実行 */}
        {step === 'confirm' && (
          <div className="bg-white rounded-md shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-red-900">最終確認</h2>

            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-sm font-semibold text-red-900 mb-2">重要な注意事項</h3>
            <ul className="space-y-2 text-sm text-red-800">
              <li className="flex items-start">
                <span className="mr-2">⚠️</span>
                <span>年度スライドを実行すると、元に戻すことはできません</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">⚠️</span>
                <span>現在年度のクラス割り当てが新年度にコピーされます</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">⚠️</span>
                <span>現在年度は過去年度となり、新年度が現在年度になります</span>
              </li>
            </ul>
          </div>

            <div className="mb-6">
              <label className="flex items-center p-4 border-2 border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-900">
                  上記の内容を理解し、年度スライドを実行します
                </span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleExecuteSlide}
                disabled={!confirmed || loading}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-md hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '実行中...' : '年度スライドを実行'}
              </button>
              <button
                onClick={() => setStep('preview')}
                disabled={loading}
                className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                戻る
              </button>
            </div>
          </div>
        )}

        {/* 実行中 */}
        {step === 'executing' && (
          <div className="bg-white rounded-md shadow-md p-6">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg text-gray-700">年度スライドを実行中...</p>
              <p className="text-sm text-gray-500 mt-2">しばらくお待ちください</p>
            </div>
          </div>
        )}

        {/* 完了 */}
        {step === 'result' && result && (
          <div className="bg-white rounded-md shadow-md p-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">年度スライド完了</h2>
              <div className="bg-gray-50 rounded-md p-4 mb-6">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result}</pre>
              </div>
              <button
                onClick={handleBackToList}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                年度管理画面に戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
