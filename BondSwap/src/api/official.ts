import { getPrefix } from './base';

export const PREFIX = '/meta';

const get = getPrefix(PREFIX);

export async function getOfficialAddress(): Promise<string[]> {
  return get(`/official-address`);
}

export async function getCurrentTime(): Promise<number> {
  return get(`/getTime`);
}