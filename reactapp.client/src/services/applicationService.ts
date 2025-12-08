import axios from 'axios';
import type {
  ApplicationFormData,
  ValidateApplicationKeyResult,
  SubmitApplicationResult,
  ApiResponse,
} from '../types/application';

const API_BASE_URL = '/api/application';

/**
 * ApplicationKeyを検証する
 */
export async function validateApplicationKey(
  applicationKey: string
): Promise<ValidateApplicationKeyResult> {
  try {
    const response = await axios.post<ApiResponse<ValidateApplicationKeyResult>>(
      `${API_BASE_URL}/validate-key`,
      { applicationKey }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error.message);
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as ApiResponse<ValidateApplicationKeyResult>;
      if (!data.success) {
        throw new Error(data.error.message);
      }
    }
    throw error;
  }
}

/**
 * 入園申込を送信する
 */
export async function submitApplication(
  formData: ApplicationFormData,
  applicationKey: string
): Promise<SubmitApplicationResult> {
  try {
    const response = await axios.post<ApiResponse<SubmitApplicationResult>>(
      `${API_BASE_URL}/submit`,
      formData,
      {
        params: { key: applicationKey },
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error.message);
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as ApiResponse<SubmitApplicationResult>;
      if (!data.success) {
        throw new Error(data.error.message);
      }
    }
    throw error;
  }
}
