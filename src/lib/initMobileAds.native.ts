import mobileAds from 'react-native-google-mobile-ads';

export function initMobileAds(): Promise<unknown> {
  return mobileAds().initialize();
}
