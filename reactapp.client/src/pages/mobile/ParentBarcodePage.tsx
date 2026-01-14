/**
 * 保護者用バーコード表示ページ
 * URL: /mobile/barcode
 * 保護者IDをCode128形式のバーコードで表示
 * タブレットのバーコードスキャナーで読み取り、入退管理を行う
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Barcode from '../../components/mobile/Barcode';

interface ParentInfo {
  id: number;
  name: string;
  phoneNumber: string;
}

export function ParentBarcodePage() {
  const navigate = useNavigate();
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);

  useEffect(() => {
    // localStorageから保護者情報を取得
    const loadParentInfo = () => {
      try {
        const storedParent = localStorage.getItem('mobile_parent');
        if (!storedParent) {
          setError('保護者情報が見つかりません。ログインしてください。');
          return;
        }

        const parent = JSON.parse(storedParent);
        if (!parent.id) {
          setError('保護者IDが取得できません。');
          return;
        }

        setParentInfo({
          id: parent.id,
          name: parent.name || '',
          phoneNumber: parent.phoneNumber || '',
        });
      } catch (err) {
        console.error('保護者情報の取得エラー:', err);
        setError('保護者情報の読み込みに失敗しました。');
      }
    };

    loadParentInfo();

    // 画面の明るさを最大化（CSS）
    document.body.style.filter = 'brightness(1.2)';

    // クリーンアップ
    return () => {
      document.body.style.filter = '';
    };
  }, []);

  const handleBrightnessChange = (value: number) => {
    setBrightness(value);
    document.body.style.filter = `brightness(${value / 100})`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mb-4 text-red-500">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">エラー</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!parentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 flex items-center"
          >
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
          <h1 className="text-xl font-bold text-gray-900">入退管理バーコード</h1>
          <div className="w-20"></div> {/* スペーサー */}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 説明カード */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold text-blue-900 mb-1">使い方</h3>
              <p className="text-blue-800 text-sm">
                このバーコードを保育園のタブレット端末でスキャンしてください。
                入園・退園の記録が自動で登録されます。
              </p>
            </div>
          </div>
        </div>

        {/* 保護者情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">保護者情報</h2>
          <div className="space-y-2">
            <div className="flex">
              <span className="text-gray-600 w-24">氏名:</span>
              <span className="font-medium text-gray-900">{parentInfo.name}</span>
            </div>
            <div className="flex">
              <span className="text-gray-600 w-24">ID:</span>
              <span className="font-medium text-gray-900">{parentInfo.id}</span>
            </div>
          </div>
        </div>

        {/* バーコード表示エリア */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              入退管理用バーコード
            </h2>
            <p className="text-gray-600 text-sm">
              タブレット端末のバーコードリーダーでスキャンしてください
            </p>
          </div>

          {/* バーコード */}
          <div className="bg-white p-8 rounded-lg border-2 border-gray-200 mb-6">
            <Barcode
              value={parentInfo.id}
              width={3}
              height={120}
              displayValue={true}
              fontSize={24}
              margin={20}
            />
          </div>

          {/* ID表示（大きく） */}
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">保護者ID</p>
            <p className="text-5xl font-bold text-gray-900 tracking-wider">
              {parentInfo.id}
            </p>
          </div>
        </div>

        {/* 明るさ調整 */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-gray-700 font-medium">画面の明るさ</label>
            <span className="text-gray-600">{brightness}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            value={brightness}
            onChange={(e) => handleBrightnessChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>暗い</span>
            <span>明るい</span>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-6 rounded-r-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold text-yellow-900 mb-1">注意事項</h3>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• バーコードは他人に見せないでください</li>
                <li>• 画面を傷つけないよう注意してください</li>
                <li>• スキャンしやすいよう、画面を明るくしてください</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParentBarcodePage;
