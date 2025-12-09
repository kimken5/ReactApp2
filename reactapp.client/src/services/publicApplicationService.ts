/**
 * 保護者向け入園申込フォーム - APIサービス
 */

import axios from 'axios';
import type {
  CreateApplicationRequest,
  CreateApplicationResponse,
  ValidateKeyResponse,
  PostalCodeResponse,
} from '../types/publicApplication';

const API_BASE_URL = '/api/application';

/**
 * ApplicationKeyの有効性を検証
 */
export async function validateApplicationKey(key: string): Promise<ValidateKeyResponse> {
  try {
    const response = await axios.post<ValidateKeyResponse>(`${API_BASE_URL}/validate-key`, {
      applicationKey: key,
    });
    return response.data;
  } catch (error) {
    console.error('ApplicationKey検証エラー:', error);
    throw error;
  }
}

/**
 * 入園申込を送信
 */
export async function submitApplication(
  key: string,
  data: CreateApplicationRequest
): Promise<CreateApplicationResponse> {
  try {
    const response = await axios.post<CreateApplicationResponse>(
      `${API_BASE_URL}/submit`,
      data,
      {
        params: { key },
      }
    );
    return response.data;
  } catch (error) {
    console.error('申込送信エラー:', error);
    throw error;
  }
}

/**
 * 郵便番号から住所を取得（外部API使用）
 * zipcloud API: https://zipcloud.ibsnet.co.jp/doc/api
 */
export async function fetchAddressByPostalCode(postalCode: string): Promise<PostalCodeResponse | null> {
  try {
    // ハイフンを除去
    const cleanedPostalCode = postalCode.replace(/-/g, '');

    // 7桁の数字かチェック
    if (!/^\d{7}$/.test(cleanedPostalCode)) {
      return null;
    }

    const response = await axios.get(`https://zipcloud.ibsnet.co.jp/api/search`, {
      params: {
        zipcode: cleanedPostalCode,
      },
    });

    if (response.data.status === 200 && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        prefecture: result.address1, // 都道府県
        city: result.address2 + result.address3, // 市区町村 + 町域
      };
    }

    return null;
  } catch (error) {
    console.error('郵便番号検索エラー:', error);
    return null;
  }
}
