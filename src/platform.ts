import { Platform } from 'react-native';

/** True when running in a browser/Electron web renderer, not on iOS/Android. */
export const isWeb = Platform.OS === 'web';

/** True when running on a native phone/tablet (iOS or Android). */
export const isNative = !isWeb;
