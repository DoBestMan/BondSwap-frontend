import axios from 'axios';

export interface Res<T> {
  code: number;
  message?: string;
  data: T;
}

export const API_PREFIX = 'https://bswap-ethereum.info/api/v1';

export async function get<T>(
  url: string,
  headers?: Record<string, string>
): Promise<T> {
  const sep = url.includes('?') ? '&' : '?';
  const res = await axios.get<T>(`${API_PREFIX}${url}${sep}_t=${Date.now()}`, {
    headers,
  });

  return res.data;
}

export function getPrefix(prefix: string) {
  return async function<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return get<T>(prefix + url, headers);
  }
}
