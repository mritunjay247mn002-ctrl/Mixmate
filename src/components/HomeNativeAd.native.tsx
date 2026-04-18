import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from 'react-native-google-mobile-ads';
import { FS, SP, RAD } from '../utils/theme';
import { getNativeAdUnitId } from '../config/ads';

export default function HomeNativeAd() {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let loaded: NativeAd | null = null;

    NativeAd.createForAdRequest(getNativeAdUnitId())
      .then((ad) => {
        if (cancelled) {
          ad.destroy();
          return;
        }
        loaded = ad;
        setNativeAd(ad);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (loaded) {
        loaded.destroy();
        loaded = null;
      }
    };
  }, []);

  if (failed) return null;

  if (!nativeAd) {
    return (
      <View style={styles.shell}>
        <ActivityIndicator color="rgba(255,255,255,0.35)" size="small" />
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <Text style={styles.adMark}>Ad</Text>
      <NativeAdView nativeAd={nativeAd} style={styles.card}>
        <View style={styles.row}>
          {nativeAd.icon ? (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <Image
                source={{ uri: nativeAd.icon.url }}
                style={styles.icon}
              />
            </NativeAsset>
          ) : null}
          <View style={styles.textCol}>
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text style={styles.headline} numberOfLines={2}>
                {nativeAd.headline}
              </Text>
            </NativeAsset>
            {nativeAd.body ? (
              <NativeAsset assetType={NativeAssetType.BODY}>
                <Text style={styles.body} numberOfLines={2}>
                  {nativeAd.body}
                </Text>
              </NativeAsset>
            ) : null}
          </View>
        </View>
        <NativeMediaView
          resizeMode="cover"
          style={styles.media}
        />
        {nativeAd.callToAction ? (
          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <View style={styles.cta}>
              <Text style={styles.ctaTxt}>{nativeAd.callToAction}</Text>
            </View>
          </NativeAsset>
        ) : null}
      </NativeAdView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: SP.md,
    marginTop: SP.lg,
    marginBottom: SP.sm,
  },
  adMark: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RAD.full,
    overflow: 'hidden',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  card: {
    borderRadius: RAD.lg,
    overflow: 'hidden',
    padding: SP.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  row: {
    flexDirection: 'row',
    gap: SP.sm,
    alignItems: 'flex-start',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  textCol: { flex: 1, minWidth: 0 },
  headline: {
    color: '#fff',
    fontSize: FS.md,
    fontWeight: '800',
  },
  body: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.65)',
    fontSize: FS.xs,
    lineHeight: 18,
  },
  media: {
    width: '100%',
    marginTop: SP.sm,
    minHeight: 120,
    maxHeight: 180,
    borderRadius: RAD.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  cta: {
    marginTop: SP.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RAD.full,
    backgroundColor: 'rgba(0,229,255,0.2)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,229,255,0.45)',
  },
  ctaTxt: {
    color: '#00E5FF',
    fontSize: FS.sm,
    fontWeight: '800',
  },
  shell: {
    marginHorizontal: SP.md,
    marginTop: SP.lg,
    paddingVertical: SP.md,
    alignItems: 'center',
  },
});
