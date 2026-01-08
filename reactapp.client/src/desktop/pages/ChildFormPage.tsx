import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import { fetchAllergens, type Allergen } from '../../services/allergenService';
import type {
  ChildDto,
  CreateChildRequestDto,
  UpdateChildRequestDto,
  ClassDto,
  ParentDto,
  CreateParentWithChildDto,
} from '../types/master';

/**
 * 園児作成・編集ページ
 * 新規作成モードと編集モードの両対応
 */
export function ChildFormPage() {
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();
  const isEditMode = !!childId;

  const [child, setChild] = useState<ChildDto | null>(null);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [parents, setParents] = useState<ParentDto[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 保護者登録モード: 'select' = 既存選択, 'create' = 新規作成
  const [parentMode, setParentMode] = useState<'select' | 'create'>('create'); // デフォルトは「新規保護者を作成」

  // フォーム状態
  const [formData, setFormData] = useState({
    familyName: '',
    firstName: '',
    familyFurigana: '',
    firstFurigana: '',
    allergy: '',
    dateOfBirth: '',
    gender: '',
    classId: '',
    bloodType: '',
    medicalNotes: '',
    specialInstructions: '',
    noPhoto: false,
    parentIds: [] as number[],
    graduationDate: '',
    graduationStatus: '',
    withdrawalReason: '',
    isActive: true,
  });

  // 保護者作成用フォーム状態
  const [parent1Data, setParent1Data] = useState<CreateParentWithChildDto>({
    phoneNumber: '',
    name: '',
    email: '',
  });

  const [parent2Data, setParent2Data] = useState<CreateParentWithChildDto>({
    phoneNumber: '',
    name: '',
    email: '',
  });

  const [enableParent2, setEnableParent2] = useState(false);

  // オートコンプリート用状態
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [showParentSuggestions, setShowParentSuggestions] = useState(false);

  // アレルゲンマスター取得
  useEffect(() => {
    const loadAllergens = async () => {
      try {
        const data = await fetchAllergens();
        setAllergens(data);
      } catch (error) {
        console.error('アレルゲンマスターの取得に失敗しました:', error);
      }
    };

    loadAllergens();
  }, []);

  // 初期データ読み込み
  useEffect(() => {
    loadData();
  }, [childId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // クラス一覧と保護者一覧を並列取得
      const [classesData, parentsData] = await Promise.all([
        masterService.getClasses({ isActive: true }),
        masterService.getParents(),
      ]);

      setClasses(classesData);
      setParents(parentsData);

      // 編集モードの場合は園児データを取得
      if (isEditMode && childId) {
        const childData = await masterService.getChild(parseInt(childId, 10));
        setChild(childData);
        setFormData({
          familyName: childData.familyName,
          firstName: childData.firstName,
          familyFurigana: childData.familyFurigana || '',
          firstFurigana: childData.firstFurigana || '',
          allergy: childData.allergy || '',
          dateOfBirth: childData.dateOfBirth.split('T')[0],
          gender: childData.gender,
          classId: childData.classId || '',
          bloodType: childData.bloodType || '',
          medicalNotes: childData.medicalNotes || '',
          specialInstructions: childData.specialInstructions || '',
          noPhoto: childData.noPhoto,
          parentIds: childData.parents.map(p => p.id),
          graduationDate: childData.graduationDate?.split('T')[0] || '',
          graduationStatus: childData.graduationStatus || '',
          withdrawalReason: childData.withdrawalReason || '',
          isActive: childData.isActive,
        });
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
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

  // 保護者1データ変更
  const handleParent1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
      // 電話番号のハイフン自動挿入
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      if (cleaned.length > 3 && cleaned.length <= 7) {
        formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
      } else if (cleaned.length > 7) {
        formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
      }
      setParent1Data(prev => ({ ...prev, [name]: formatted }));
    } else {
      setParent1Data(prev => ({ ...prev, [name]: value }));
    }

    if (errors[`parent1.${name}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`parent1.${name}`];
        return newErrors;
      });
    }
  };

  // 保護者2データ変更
  const handleParent2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
      // 電話番号のハイフン自動挿入
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      if (cleaned.length > 3 && cleaned.length <= 7) {
        formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
      } else if (cleaned.length > 7) {
        formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
      }
      setParent2Data(prev => ({ ...prev, [name]: formatted }));
    } else {
      setParent2Data(prev => ({ ...prev, [name]: value }));
    }

    if (errors[`parent2.${name}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`parent2.${name}`];
        return newErrors;
      });
    }
  };

  // 保護者選択変更ハンドラ
  const handleParentToggle = (parentId: number) => {
    setFormData(prev => {
      const parentIds = prev.parentIds.includes(parentId)
        ? prev.parentIds.filter(id => id !== parentId)
        : [...prev.parentIds, parentId];
      return { ...prev, parentIds };
    });
  };

  // オートコンプリート: 保護者を追加
  const handleAddParent = (parent: ParentDto) => {
    if (formData.parentIds.length >= 2) {
      alert('保護者は最大2名まで登録できます');
      return;
    }
    setFormData(prev => ({
      ...prev,
      parentIds: [...prev.parentIds, parent.id]
    }));
    setParentSearchQuery('');
    setShowParentSuggestions(false);
  };

  // オートコンプリート: 保護者を削除
  const handleRemoveParent = (parentId: number) => {
    setFormData(prev => ({
      ...prev,
      parentIds: prev.parentIds.filter(id => id !== parentId)
    }));
  };

  // フィルタされた保護者候補を取得
  const getFilteredParents = () => {
    if (!parentSearchQuery.trim()) return [];
    const query = parentSearchQuery.toLowerCase();
    return parents.filter(parent => {
      if (formData.parentIds.includes(parent.id)) return false;
      const name = parent.name || '';
      const phoneNumber = parent.phoneNumber || '';
      return name.toLowerCase().includes(query) || phoneNumber.includes(query);
    }).slice(0, 10);
  };

  // 選択済み保護者を取得
  const getSelectedParents = () => {
    return parents.filter(parent => formData.parentIds.includes(parent.id));
  };

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.familyName.trim()) {
      newErrors.familyName = '姓は必須です';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = '名は必須です';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = '生年月日は必須です';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.dateOfBirth = '生年月日は今日以前の日付を指定してください';
      }
    }

    if (!formData.gender) {
      newErrors.gender = '性別は必須です';
    }

    // 新規作成時の保護者バリデーション
    if (!isEditMode) {
      if (parentMode === 'select') {
        if (formData.parentIds.length === 0) {
          newErrors.parentIds = '保護者を1人以上選択してください';
        }
      } else if (parentMode === 'create') {
        // 保護者1（必須）
        if (!parent1Data.phoneNumber.trim()) {
          newErrors['parent1.phoneNumber'] = '保護者1の電話番号は必須です';
        }
        if (!parent1Data.name.trim()) {
          newErrors['parent1.name'] = '保護者1の氏名は必須です';
        }

        // 保護者2（有効化されている場合のみ）
        if (enableParent2) {
          if (!parent2Data.phoneNumber.trim()) {
            newErrors['parent2.phoneNumber'] = '保護者2の電話番号は必須です';
          }
          if (!parent2Data.name.trim()) {
            newErrors['parent2.name'] = '保護者2の氏名は必須です';
          }
        }
      }
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

      if (isEditMode && childId) {
        // 編集モード
        const updateRequest: UpdateChildRequestDto = {
          familyName: formData.familyName,
          firstName: formData.firstName,
          familyFurigana: formData.familyFurigana || undefined,
          firstFurigana: formData.firstFurigana || undefined,
          allergy: formData.allergy || undefined,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          classId: formData.classId || undefined,
          bloodType: formData.bloodType || undefined,
          medicalNotes: formData.medicalNotes || undefined,
          specialInstructions: formData.specialInstructions || undefined,
          noPhoto: formData.noPhoto,
          graduationDate: formData.graduationDate || undefined,
          graduationStatus: formData.graduationStatus || undefined,
          withdrawalReason: formData.withdrawalReason || undefined,
          isActive: formData.isActive,
        };
        await masterService.updateChild(parseInt(childId, 10), updateRequest);
      } else {
        // 新規作成モード
        const createRequest: CreateChildRequestDto = {
          familyName: formData.familyName,
          firstName: formData.firstName,
          familyFurigana: formData.familyFurigana || undefined,
          firstFurigana: formData.firstFurigana || undefined,
          allergy: formData.allergy || undefined,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          classId: formData.classId || undefined,
          bloodType: formData.bloodType || undefined,
          medicalNotes: formData.medicalNotes || undefined,
          specialInstructions: formData.specialInstructions || undefined,
          noPhoto: formData.noPhoto,
          parentRegistrationMode: parentMode,
          parentIds: parentMode === 'select' ? formData.parentIds : [],
          parent1: parentMode === 'create' ? {
            phoneNumber: parent1Data.phoneNumber,
            name: parent1Data.name,
            email: parent1Data.email || undefined,
          } : undefined,
          parent2: parentMode === 'create' && enableParent2 ? {
            phoneNumber: parent2Data.phoneNumber,
            name: parent2Data.name,
            email: parent2Data.email || undefined,
          } : undefined,
        };
        await masterService.createChild(createRequest);
      }

      navigate('/desktop/children');
    } catch (error: any) {
      console.error('保存に失敗しました:', error);

      // バックエンドからのエラーメッセージを取得
      let errorMessage = '保存に失敗しました';

      // AxiosErrorの場合
      if (error?.response?.data) {
        const responseData = error.response.data;
        // ApiResponse形式のエラーメッセージ (バックエンドのApiError)
        if (responseData.error?.message) {
          errorMessage = responseData.error.message;
        }
        // ApiResponse形式（直接messageプロパティ）
        else if (responseData.message) {
          errorMessage = responseData.message;
        }
        // ASP.NET Core のProblemDetails形式
        else if (responseData.title) {
          errorMessage = responseData.title;
        }
        // その他の形式
        else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
      }
      // 一般的なエラー
      else if (error?.message) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  // キャンセル
  const handleCancel = () => {
    navigate('/desktop/children');
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
            {isEditMode ? '園児編集' : '園児新規作成'}
          </h1>
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

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-md">
          <div className="p-6 space-y-6">
            {/* 基本情報セクション */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">基本情報</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 姓 */}
                <div>
                  <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-2">
                    姓 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="familyName"
                    name="familyName"
                    value={formData.familyName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                      errors.familyName ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="例: 山田"
                  />
                  {errors.familyName && <p className="mt-1 text-sm text-red-600">{errors.familyName}</p>}
                </div>

                {/* 名 */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    名 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                      errors.firstName ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="例: 太郎"
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>

                {/* 姓（ふりがな） */}
                <div>
                  <label htmlFor="familyFurigana" className="block text-sm font-medium text-gray-700 mb-2">
                    姓（ふりがな）
                  </label>
                  <input
                    type="text"
                    id="familyFurigana"
                    name="familyFurigana"
                    value={formData.familyFurigana}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    placeholder="例: やまだ"
                  />
                </div>

                {/* 名（ふりがな） */}
                <div>
                  <label htmlFor="firstFurigana" className="block text-sm font-medium text-gray-700 mb-2">
                    名（ふりがな）
                  </label>
                  <input
                    type="text"
                    id="firstFurigana"
                    name="firstFurigana"
                    value={formData.firstFurigana}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    placeholder="例: たろう"
                  />
                </div>

                {/* 生年月日 */}
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                    生年月日 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                      errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* 性別 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性別 <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={formData.gender === 'Male'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="text-gray-700">男</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={formData.gender === 'Female'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="text-gray-700">女</span>
                    </label>
                  </div>
                  {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                </div>

                {/* クラス */}
                <div>
                  <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-2">
                    クラス
                  </label>
                  <select
                    id="classId"
                    name="classId"
                    value={formData.classId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  >
                    <option value="">未所属</option>
                    {classes.map(cls => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 血液型 */}
                <div>
                  <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700 mb-2">
                    血液型
                  </label>
                  <select
                    id="bloodType"
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  >
                    <option value="">不明</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="O">O</option>
                    <option value="AB">AB</option>
                  </select>
                </div>

                {/* ID（編集モード時のみ表示） */}
                {isEditMode && childId && (
                  <div>
                    <label htmlFor="childId" className="block text-sm font-medium text-gray-700 mb-2">
                      ID
                    </label>
                    <input
                      type="text"
                      id="childId"
                      name="childId"
                      value={String(childId).padStart(6, '0')}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 font-mono cursor-not-allowed"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 医療・特記事項セクション */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">医療・特記事項</h2>
              <div className="space-y-4">
                {/* 食物アレルギー */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    食物アレルギー
                  </label>
                  <div className="grid grid-cols-4 gap-3 p-4 border border-gray-200 rounded-md bg-gray-50">
                    {allergens.map((allergenItem) => {
                      const currentAllergies = formData.allergy || '';
                      const allergyIdList = currentAllergies.split(',').filter(a => a);
                      const isChecked = allergyIdList.includes(String(allergenItem.id));

                      return (
                        <label key={allergenItem.id} className="flex items-center cursor-pointer hover:bg-white px-2 py-1 rounded transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let newAllergyIds: string[];
                              if (e.target.checked) {
                                newAllergyIds = [...allergyIdList, String(allergenItem.id)];
                              } else {
                                newAllergyIds = allergyIdList.filter(id => id !== String(allergenItem.id));
                              }
                              setFormData({
                                ...formData,
                                allergy: newAllergyIds.join(','),
                              });
                            }}
                            className="mr-2 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700">{allergenItem.allergenName}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">該当する食物アレルギーをすべて選択してください</p>
                </div>

                {/* 医療メモ */}
                <div>
                  <label htmlFor="medicalNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    医療メモ
                  </label>
                  <textarea
                    id="medicalNotes"
                    name="medicalNotes"
                    value={formData.medicalNotes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    placeholder="アレルギー、既往症などを入力してください"
                  />
                </div>

                {/* 特記事項 */}
                <div>
                  <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700 mb-2">
                    特記事項
                  </label>
                  <textarea
                    id="specialInstructions"
                    name="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    placeholder="保育上の注意点などを入力してください"
                  />
                </div>
              </div>
            </div>

            {/* 保護者セクション（新規作成時のみ） */}
            {!isEditMode && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  保護者登録 <span className="text-red-600">*</span>
                </h2>

                {/* 保護者登録モード切り替え */}
                <div className="mb-6">
                  <div className="flex gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setParentMode('create')}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                        parentMode === 'create'
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      新規保護者を作成
                    </button>
                    <button
                      type="button"
                      onClick={() => setParentMode('select')}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                        parentMode === 'select'
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      既存保護者を選択
                    </button>
                  </div>
                </div>

                {/* 既存保護者選択モード */}
                {parentMode === 'select' && (
                  <div>
                    {/* オートコンプリート検索 */}
                    <div className="mb-4 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        保護者を追加（最大2名）
                      </label>
                      <input
                        type="text"
                        value={parentSearchQuery}
                        onChange={(e) => {
                          setParentSearchQuery(e.target.value);
                          setShowParentSuggestions(true);
                        }}
                        onFocus={() => setShowParentSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowParentSuggestions(false), 200)}
                        placeholder="保護者名または電話番号を入力..."
                        className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                        disabled={formData.parentIds.length >= 2}
                      />

                      {/* 候補リスト */}
                      {showParentSuggestions && parentSearchQuery && formData.parentIds.length < 2 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {getFilteredParents().length === 0 ? (
                            <div className="px-4 py-3 text-gray-500 text-sm">
                              該当する保護者が見つかりません
                            </div>
                          ) : (
                            getFilteredParents().map((parent) => (
                              <button
                                key={parent.id}
                                type="button"
                                onClick={() => handleAddParent(parent)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{parent.name || '名前未登録'}</div>
                                <div className="text-sm text-gray-600">{parent.phoneNumber}</div>
                                {parent.email && <div className="text-sm text-gray-600">{parent.email}</div>}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* 選択済み保護者一覧 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        選択済み保護者 ({getSelectedParents().length}人)
                      </label>
                      {getSelectedParents().length === 0 ? (
                        <div className="px-4 py-3 border border-gray-200 rounded-md bg-gray-50 text-gray-500 text-sm">
                          保護者が選択されていません
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {getSelectedParents().map((parent) => (
                            <div
                              key={parent.id}
                              className="flex items-start justify-between p-4 border border-gray-200 rounded-md bg-white"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{parent.name || '名前未登録'}</div>
                                <div className="text-sm text-gray-600">{parent.phoneNumber}</div>
                                {parent.email && <div className="text-sm text-gray-600">{parent.email}</div>}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveParent(parent.id)}
                                className="ml-4 px-3 py-1 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition border border-red-200"
                              >
                                削除
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {errors.parentIds && (
                      <p className="mt-2 text-sm text-red-600">{errors.parentIds}</p>
                    )}
                  </div>
                )}

                {/* 新規保護者作成モード */}
                {parentMode === 'create' && (
                  <div className="space-y-6">
                    {/* 保護者1（必須） */}
                    <div className="p-6 border border-gray-300 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        保護者1 <span className="text-red-600">*</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            氏名 <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={parent1Data.name}
                            onChange={handleParent1Change}
                            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                              errors['parent1.name'] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="例: 山田 花子"
                          />
                          {errors['parent1.name'] && (
                            <p className="mt-1 text-sm text-red-600">{errors['parent1.name']}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            電話番号 <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={parent1Data.phoneNumber}
                            onChange={handleParent1Change}
                            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                              errors['parent1.phoneNumber'] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="例: 090-1234-5678"
                          />
                          {errors['parent1.phoneNumber'] && (
                            <p className="mt-1 text-sm text-red-600">{errors['parent1.phoneNumber']}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            メールアドレス
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={parent1Data.email}
                            onChange={handleParent1Change}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                            placeholder="例: example@example.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 保護者2追加ボタン */}
                    {!enableParent2 && (
                      <button
                        type="button"
                        onClick={() => setEnableParent2(true)}
                        className="w-full px-6 py-3 bg-white border-2 border-dashed border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                      >
                        + 保護者2を追加
                      </button>
                    )}

                    {/* 保護者2（任意） */}
                    {enableParent2 && (
                      <div className="p-6 border border-gray-300 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">保護者2（任意）</h3>
                          <button
                            type="button"
                            onClick={() => {
                              setEnableParent2(false);
                              setParent2Data({ phoneNumber: '', name: '', email: '' });
                            }}
                            className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition border border-red-200"
                          >
                            削除
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              氏名 <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={parent2Data.name}
                              onChange={handleParent2Change}
                              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                                errors['parent2.name'] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="例: 山田 太郎"
                            />
                            {errors['parent2.name'] && (
                              <p className="mt-1 text-sm text-red-600">{errors['parent2.name']}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              電話番号 <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="tel"
                              name="phoneNumber"
                              value={parent2Data.phoneNumber}
                              onChange={handleParent2Change}
                              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                                errors['parent2.phoneNumber'] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="例: 090-1234-5678"
                            />
                            {errors['parent2.phoneNumber'] && (
                              <p className="mt-1 text-sm text-red-600">{errors['parent2.phoneNumber']}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              メールアドレス
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={parent2Data.email}
                              onChange={handleParent2Change}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                              placeholder="例: example@example.com"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 卒園・退園情報セクション（編集時のみ） */}
            {isEditMode && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">卒園・退園情報</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 卒園日 */}
                  <div>
                    <label htmlFor="graduationDate" className="block text-sm font-medium text-gray-700 mb-2">
                      卒園日
                    </label>
                    <input
                      type="date"
                      id="graduationDate"
                      name="graduationDate"
                      value={formData.graduationDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    />
                  </div>

                  {/* 卒園ステータス */}
                  <div>
                    <label htmlFor="graduationStatus" className="block text-sm font-medium text-gray-700 mb-2">
                      卒園ステータス
                    </label>
                    <select
                      id="graduationStatus"
                      name="graduationStatus"
                      value={formData.graduationStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    >
                      <option value="">未設定</option>
                      <option value="Active">在籍中</option>
                      <option value="Graduated">卒園済み</option>
                      <option value="Withdrawn">退園</option>
                    </select>
                  </div>

                  {/* 退園理由 */}
                  <div className="md:col-span-2">
                    <label htmlFor="withdrawalReason" className="block text-sm font-medium text-gray-700 mb-2">
                      退園理由
                    </label>
                    <textarea
                      id="withdrawalReason"
                      name="withdrawalReason"
                      value={formData.withdrawalReason}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                      placeholder="退園理由を入力してください"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* フッター（保存・キャンセルボタン） */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-md flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-md font-medium hover:shadow-md transition-all duration-200"
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
