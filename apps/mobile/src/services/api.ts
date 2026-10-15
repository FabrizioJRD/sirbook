import { GenerateBlockRequest, BlockContent } from '@sirbook/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface GenerateApiResponse {
  success: boolean;
  content: BlockContent;
  cached: boolean;
  cacheKey: string;
  sourcesCount: number;
  error?: string;
}

export async function generateBlockContentMobile(
  request: GenerateBlockRequest
): Promise<GenerateApiResponse> {
  const url = `${API_BASE_URL}/api/generate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error || `HTTP error ${response.status}`);
  }

  return response.json();
}
