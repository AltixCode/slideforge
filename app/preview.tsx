import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Download, Check, Lock } from 'lucide-react-native';
import { useSlideStore, FREE_SLIDE_LIMIT } from '../src/store/useSlideStore';
import { THEMES } from '../src/presets/themes';
import { drawAsImage } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import { CarouselCard, CardScene, cardPointSize, CARD_WIDTH, CARD_HEIGHT } from '../src/engine/carouselRenderer';
import { saveCards, stageCard } from '../src/engine/exporter';
import { useTheme } from '../src/theme/useTheme';
import { t } from '../src/i18n';
import { PaywallModal } from '../src/components/PaywallModal';

export default function PreviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { slides, theme: cardTheme, setTheme, isPro, exportableSlides } = useSlideStore();
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(0);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const exportable = exportableSlides();
  const locked = slides.length - exportable.length;
  // The card renders at cardPointSize() points so its snapshot lands at exactly
  // 1080x1350 pixels; the preview scales that down to the column width. Export
  // always snapshots the full-size canvas, never this scaled view.
  const card = cardPointSize();
  const scale = (width - 48) / card.width;

  const handleExport = async () => {
    if (!exportable.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    setDone(0);
    try {
      const staged: string[] = [];
      for (let i = 0; i < exportable.length; i++) {
        // Rendered off-screen at the full design size rather than snapshotted
        // from the preview: a snapshot only captures what the view actually
        // drew, so a card scrolled out of sight exported short, and a deck
        // longer than the screen would export whatever happened to be visible.
        const image = await drawAsImage(
          <CardScene slide={exportable[i]} index={i} total={slides.length} theme={cardTheme} />,
          { width: CARD_WIDTH, height: CARD_HEIGHT },
        );
        if (!image) throw new Error(`card ${i + 1} did not render`);
        const tmp = `${FileSystem.cacheDirectory}slideforge_raw_${i}.png`;
        await FileSystem.writeAsStringAsync(tmp, image.encodeToBase64(), {
          encoding: FileSystem.EncodingType.Base64,
        });
        staged.push(await stageCard(tmp, i));
        setDone(i + 1);
      }
      const outcome = await saveCards(staged);
      if (outcome.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t('savedTitle'), t('savedDesc', { count: outcome.count }));
      } else if (outcome.reason === 'permission') {
        Alert.alert(t('permissionDenied'), t('permissionDeniedDesc'));
      } else {
        // Not a permission problem: telling the user to grant access they
        // already granted sends them in a circle.
        Alert.alert(t('exportFailed'), t('exportFailedDesc'));
      }
    } catch {
      Alert.alert(t('exportFailed'), t('exportFailedDesc'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 px-5" style={{ backgroundColor: theme.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-xs font-semibold tracking-widest mt-4 mb-3" style={{ color: theme.textMuted }}>
          {t('cardStyle')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          {THEMES.map((th) => {
            const selected = th.id === cardTheme.id;
            return (
              <TouchableOpacity
                key={th.id}
                onPress={() => { Haptics.selectionAsync(); setTheme(th.id); }}
                accessibilityRole="button"
                accessibilityLabel={th.label}
                className="mr-2 px-4 py-2.5 rounded-xl border flex-row items-center"
                style={{
                  backgroundColor: selected ? theme.primaryLight : theme.card,
                  borderColor: selected ? theme.primary : theme.cardBorder,
                }}
              >
                <View className="w-3.5 h-3.5 rounded-full mr-2" style={{ backgroundColor: th.accent }} />
                <Text className="text-xs font-bold" style={{ color: selected ? theme.primary : theme.textSecondary }}>
                  {th.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {slides.map((slide, i) => {
          const isLocked = i >= exportable.length;
          return (
            <View key={i} className="mb-4">
              <View className="rounded-2xl overflow-hidden" style={{ opacity: isLocked ? 0.45 : 1 }}>
                <View style={{ width: card.width * scale, height: card.height * scale }}>
                  <View style={{ transform: [{ scale }], transformOrigin: 'top left' }}>
                    <CarouselCard
                      slide={slide}
                      index={i}
                      total={slides.length}
                      theme={cardTheme}
                    />
                  </View>
                </View>
              </View>
              {isLocked ? (
                <TouchableOpacity
                  onPress={() => setPaywallVisible(true)}
                  accessibilityRole="button"
                  className="flex-row items-center justify-center mt-2 py-2 rounded-xl"
                  style={{ backgroundColor: theme.controlSurface }}
                >
                  <Lock size={13} color={theme.warning} />
                  <Text className="text-xs font-bold ml-1.5" style={{ color: theme.warning }}>
                    {t('lockedCard', { limit: FREE_SLIDE_LIMIT })}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        onPress={handleExport}
        disabled={exporting || !exportable.length}
        accessibilityRole="button"
        className="p-4 rounded-2xl flex-row items-center justify-center mb-2"
        style={{ backgroundColor: exporting ? theme.controlSurface : theme.primary }}
      >
        {exporting ? (
          <>
            <ActivityIndicator color={theme.text} />
            <Text className="font-bold text-base ml-2" style={{ color: theme.text }}>
              {t('exportingProgress', { current: done, total: exportable.length })}
            </Text>
          </>
        ) : (
          <>
            <Download size={18} color={theme.onPrimary} />
            <Text className="font-bold text-base ml-2" style={{ color: theme.onPrimary }}>
              {t('saveCards', { count: exportable.length })}
            </Text>
          </>
        )}
      </TouchableOpacity>
      {locked > 0 ? (
        <Text className="text-[11px] text-center mb-2" style={{ color: theme.textMuted }}>
          {t('lockedFooter', { count: locked })}
        </Text>
      ) : null}

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </SafeAreaView>
  );
}
