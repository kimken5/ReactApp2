import type { AcademicYear, YearSlidePreview } from '../../types/academicYear';

/**
 * 年度管理デモデータ
 */

// デモ用年度データ
export const mockAcademicYears: AcademicYear[] = [
  {
    nurseryId: 1,
    year: 2023,
    startDate: '2023-04-01',
    endDate: '2024-03-31',
    isCurrent: false,
    isFuture: false,
    notes: '2023年度（過去年度）',
    createdAt: '2023-02-01T09:00:00Z',
    updatedAt: '2023-02-15T10:30:00Z',
  },
  {
    nurseryId: 1,
    year: 2024,
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    isCurrent: true,
    isFuture: false,
    notes: '2024年度（現在年度）',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-04-01T08:00:00Z',
  },
  {
    nurseryId: 1,
    year: 2025,
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    isCurrent: false,
    isFuture: true,
    notes: '2025年度（未来年度・スライド準備中）',
    createdAt: '2024-11-01T09:00:00Z',
  },
  {
    nurseryId: 1,
    year: 2026,
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    isCurrent: false,
    isFuture: true,
    notes: '2026年度（未来年度）',
    createdAt: '2024-11-15T14:30:00Z',
  },
];

// 現在年度を取得
export const getCurrentMockYear = (): AcademicYear | null => {
  return mockAcademicYears.find(y => y.isCurrent) || null;
};

// 特定年度を取得
export const getMockYearByYear = (year: number): AcademicYear | null => {
  return mockAcademicYears.find(y => y.year === year) || null;
};

// 未来年度一覧を取得
export const getFutureMockYears = (): AcademicYear[] => {
  return mockAcademicYears.filter(y => y.isFuture);
};

// 年度スライドプレビューデモデータ
export const getMockYearSlidePreview = (targetYear: number): YearSlidePreview => {
  const currentYear = getCurrentMockYear();

  return {
    currentYear: currentYear?.year || 2024,
    targetYear: targetYear,
    affectedChildrenCount: 85,
    affectedStaffCount: 12,
    classSummaries: [
      {
        classId: '1',
        className: 'ひよこ組',
        childrenCount: 12,
      },
      {
        classId: '2',
        className: 'うさぎ組',
        childrenCount: 15,
      },
      {
        classId: '3',
        className: 'ぱんだ組',
        childrenCount: 18,
      },
      {
        classId: '4',
        className: 'きりん組',
        childrenCount: 20,
      },
      {
        classId: '5',
        className: 'ぞう組',
        childrenCount: 20,
      },
    ],
    staffSummaries: [
      {
        classId: '1',
        className: 'ひよこ組',
        staffCount: 3,
      },
      {
        classId: '2',
        className: 'うさぎ組',
        staffCount: 2,
      },
      {
        classId: '3',
        className: 'ぱんだ組',
        staffCount: 2,
      },
      {
        classId: '4',
        className: 'きりん組',
        staffCount: 3,
      },
      {
        classId: '5',
        className: 'ぞう組',
        staffCount: 2,
      },
    ],
    warnings: [
      'らいおん組（年長）の園児20名は卒園処理が必要です',
      '新入園児の受け入れ準備を確認してください',
      '職員のクラス配置を再確認してください',
    ],
  };
};

// 年度スライド実行結果のデモデータ
export const getMockYearSlideResult = (targetYear: number) => {
  const currentYear = getCurrentMockYear();

  return {
    success: true,
    previousYear: currentYear?.year || 2024,
    newYear: targetYear,
    slidedChildrenCount: 85,
    slidedStaffCount: 12,
    executedAt: new Date().toISOString(),
    executedByUserId: 1,
    messages: [
      `${currentYear?.year || 2024}年度から${targetYear}年度への年度スライドが完了しました`,
      '85名の園児のクラスが更新されました',
      '12名の職員のクラス配置が更新されました',
      '現在年度が更新されました',
    ],
  };
};

// 年度作成後の新しい年度データを生成
export const createMockAcademicYear = (year: number, isFuture: boolean = true): AcademicYear => {
  return {
    nurseryId: 1,
    year: year,
    startDate: `${year}-04-01`,
    endDate: `${year + 1}-03-31`,
    isCurrent: false,
    isFuture: isFuture,
    notes: `${year}年度（デモ作成）`,
    createdAt: new Date().toISOString(),
  };
};
