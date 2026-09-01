import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { isWeb } from '../platform';
import { pickCoverImageOnWeb } from '../files';

/** Copy the (already resized) image out of the cache into the document directory. */
export function persistCoverImage(sourceUri: string): string {
  // On web the image is already a usable data URL / blob URL, so keep it.
  if (isWeb) return sourceUri;
  const { Directory, File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
  const dir = new Directory(Paths.document, 'book-covers');
  try {
    dir.create({ idempotent: true, intermediates: true });
  } catch {
    // Directory already exists.
  }
  const dest = new File(dir, `cover-${Date.now()}.jpg`);
  try {
    new File(sourceUri).copy(dest);
    return dest.uri;
  } catch {
    return sourceUri;
  }
}

/** Open the photo library, let the user crop to a 2:3 cover, then resize + save it. */
export async function pickAndCropCover(): Promise<string | null> {
  if (isWeb) {
    const dataUri = await pickCoverImageOnWeb();
    if (!dataUri) return null;
    return persistCoverImage(dataUri);
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [2, 3],
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;
  const manip = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 600 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  );
  return persistCoverImage(manip.uri);
}