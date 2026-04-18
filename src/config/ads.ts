import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/** Production native advanced unit (Android — AdMob "AD UNIT1"). */
export const ANDROID_NATIVE_AD_UNIT_ID = 'ca-app-pub-7196794781919537/4229565831';

/**
 * Native ad unit for `NativeAd.createForAdRequest`.
 * - `__DEV__`: Google test native unit (required for safe development).
 * - Release Android: your AdMob native advanced ID.
 * - Release iOS: still test ID until you add an iOS native unit in AdMob.
 */
export function getNativeAdUnitId(): string {
  if (__DEV__) return TestIds.NATIVE;
  if (Platform.OS === 'android') return ANDROID_NATIVE_AD_UNIT_ID;
  return TestIds.NATIVE;
}
