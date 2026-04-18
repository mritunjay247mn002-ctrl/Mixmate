const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Ensures AdMob DELAY_APP_MEASUREMENT_INIT is present with tools:replace so manifest
 * merge cannot fail against react-native-google-mobile-ads' library manifest.
 */
function withAdMobAndroidManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;

    const meta = app['meta-data'] || [];
    const name = 'com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT';
    const exists = meta.some((m) => m.$?.['android:name'] === name);
    if (!exists) {
      meta.push({
        $: {
          'android:name': name,
          'android:value': 'false',
          'tools:replace': 'android:value',
        },
      });
      app['meta-data'] = meta;
    }
    return cfg;
  });
}

module.exports = withAdMobAndroidManifest;
