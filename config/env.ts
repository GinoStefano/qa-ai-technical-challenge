import dotenv from 'dotenv';

dotenv.config();

export const API_TIMEOUT_MS = 60_000;
const configuredBaseUrl = 'https://api.dify.ai/v1';
export const DIFY_BASE_URL = `${configuredBaseUrl.replace(/\/+$/, '')}/`;

export function getDifyApiKey(): string {
  const apiKey = process.env.DIFY_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('Falta configurar DIFY_API_KEY en el entorno o en el archivo .env.');
  }

  return apiKey.replace(/^Bearer\s+/i, '').trim();
}