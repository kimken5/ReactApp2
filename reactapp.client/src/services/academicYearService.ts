import axios from 'axios';
import apiClient from '../desktop/services/apiClient';
import type {
  AcademicYear,
  CreateAcademicYearRequest,
  YearSlideRequest,
  YearSlidePreview,
  YearSlideResult,
} from '../types/academicYear';
import {
  mockAcademicYears,
  getCurrentMockYear,
  getMockYearByYear,
  getFutureMockYears,
  getMockYearSlidePreview,
  getMockYearSlideResult,
  createMockAcademicYear,
} from '../desktop/data/mockAcademicYears';

const API_BASE_URL = '/api/academicyear';

// デモモード判定（URLパラメータで ?demo=true が付いている場合）
const isDemoMode = (): boolean => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') === 'true';
  }
  return false;
};

/**
 * 年度管理APIサービス
 */
export const academicYearService = {
  /**
   * 指定保育園の年度一覧を取得
   */
  async getAcademicYears(nurseryId: number): Promise<AcademicYear[]> {
    if (isDemoMode()) {
      // デモモード: モックデータを返す
      return Promise.resolve([...mockAcademicYears]);
    }
    const response = await apiClient.get<AcademicYear[]>(`${API_BASE_URL}/${nurseryId}`);
    return response.data;
  },

  /**
   * 現在年度を取得
   */
  async getCurrentYear(nurseryId: number): Promise<AcademicYear | null> {
    if (isDemoMode()) {
      // デモモード: 現在年度のモックデータを返す
      return Promise.resolve(getCurrentMockYear());
    }
    try {
      const response = await apiClient.get<AcademicYear>(`${API_BASE_URL}/${nurseryId}/current`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * 指定年度を取得
   */
  async getAcademicYear(nurseryId: number, year: number): Promise<AcademicYear | null> {
    if (isDemoMode()) {
      // デモモード: 指定年度のモックデータを返す
      return Promise.resolve(getMockYearByYear(year));
    }
    try {
      const response = await apiClient.get<AcademicYear>(`${API_BASE_URL}/${nurseryId}/${year}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * 新規年度を作成
   */
  async createAcademicYear(request: CreateAcademicYearRequest): Promise<AcademicYear> {
    if (isDemoMode()) {
      // デモモード: 新規年度のモックデータを生成して返す
      const newYear = createMockAcademicYear(request.year, request.isFuture ?? true);
      mockAcademicYears.push(newYear);
      return Promise.resolve(newYear);
    }
    const response = await apiClient.post<AcademicYear>(API_BASE_URL, request);
    return response.data;
  },

  /**
   * 年度スライドのプレビューを取得
   */
  async getYearSlidePreview(nurseryId: number, targetYear: number): Promise<YearSlidePreview> {
    if (isDemoMode()) {
      // デモモード: プレビューのモックデータを返す
      return Promise.resolve(getMockYearSlidePreview(targetYear));
    }
    const response = await apiClient.get<YearSlidePreview>(
      `${API_BASE_URL}/${nurseryId}/slide/preview`,
      { params: { targetYear } }
    );
    return response.data;
  },

  /**
   * 年度スライドを実行
   */
  async executeYearSlide(request: YearSlideRequest): Promise<YearSlideResult> {
    if (isDemoMode()) {
      // デモモード: スライド実行結果のモックデータを返す
      // 現在年度を過去年度に、ターゲット年度を現在年度に更新
      mockAcademicYears.forEach(year => {
        if (year.isCurrent) {
          year.isCurrent = false;
          year.isFuture = false;
        }
        if (year.year === request.targetYear) {
          year.isCurrent = true;
          year.isFuture = false;
        }
      });
      return Promise.resolve(getMockYearSlideResult(request.targetYear));
    }
    const response = await apiClient.post<YearSlideResult>(`${API_BASE_URL}/slide`, request);
    return response.data;
  },

  /**
   * 年度が存在するか確認
   */
  async checkExists(nurseryId: number, year: number): Promise<boolean> {
    if (isDemoMode()) {
      // デモモード: モックデータから存在確認
      const exists = mockAcademicYears.some(y => y.year === year);
      return Promise.resolve(exists);
    }
    const response = await apiClient.get<{ exists: boolean }>(
      `${API_BASE_URL}/${nurseryId}/${year}/exists`
    );
    return response.data.exists;
  },
};
