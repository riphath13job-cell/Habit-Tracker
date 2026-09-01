import * as SecureStore from 'expo-secure-store';
import { isWeb } from './platform';

function webGet(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function webSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  } catch {
    // storage full or unavailable
  }
}

function webDelete(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Secure, cross-platform key/value store. Uses the OS keychain (expo-secure-store)
 * on native, and localStorage on the web/Electron renderer so the AI API key
 * keeps working on the desktop build.
 */
export async function secureGetItem(key: string): Promise<string | null> {
  if (isWeb) return webGet(key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function secureSetItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    webSet(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function secureDeleteItem(key: string): Promise<void> {
  if (isWeb) {
    webDelete(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // nothing stored yet — fine
  }
}
