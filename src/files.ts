import { isWeb } from './platform';

/**
 * Cross-platform helpers for reading/writing files. Native uses expo-file-system,
 * expo-document-picker and expo-sharing. Web downloads/uploads via the browser.
 */

function downloadBlob(name: string, blob: Blob): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function pickTextFile(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}

function pickImageFile(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

/** Trigger a browser download of a JSON backup (web) or delegate to caller for native. */
export async function downloadBackupFile(json: string, filename: string): Promise<boolean> {
  if (!isWeb) return false;
  downloadBlob(filename, new Blob([json], { type: 'application/json' }));
  return true;
}

/** Let the user pick a JSON backup file. Returns its text, or null if cancelled. */
export async function pickBackupFile(): Promise<string | null> {
  if (!isWeb) return null;
  return pickTextFile();
}

/** Let the user pick an image for a book cover; returns a usable web URI/data URL, or null. */
export async function pickCoverImageOnWeb(): Promise<string | null> {
  return pickImageFile();
}
