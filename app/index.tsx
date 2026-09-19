import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Sparkles, Layers, ShieldCheck, ClipboardPaste } from 'lucide-react-native';
import { useSlideStore, FREE_SLIDE_LIMIT } from '../src/store/useSlideStore';
import { useTheme } from '../src/theme/useTheme';
import { useTabletColumn } from '../src/theme/useTabletColumn';
import { t } from '../src/i18n';
import { ForwardArrow } from '../src/components/DirectionalIcons';
import { AdBanner } from '../src/components/AdBanner';
import { useAdsStore } from '../src/store/adsStore';
import { showPrivacyOptionsForm } from '../src/services/ads';

// Three sentences per card, not one: the original sample left most cards
// showing a single short line over an empty background, which read as
// broken rather than minimal in the App Store preview screen. This still
// fits comfortably within the 320-char-per-slide budget.
const SAMPLE = `# Three things I learned shipping on my own

Nobody tells you the first version is meant to be embarrassing. Ship it anyway, because real feedback from five strangers beats another month of polishing alone. The moment it is live, the questions get sharper, and so do you.

---

# Pick the boring stack

The interesting stack costs you a week of yak shaving before you write a single feature that matters. Boring tools have already found their bugs, and the fixes are already indexed on Stack Overflow. Save the interesting choices for the one part of the product only you can build.

---

# Talk to five users

Five short conversations are enough to find the thing everybody trips over in the first sixty seconds. The sixth call rarely teaches you anything new, but skipping the first five costs you months of confidently building the wrong thing for nobody.`;

export default function HomeScreen() {
  // Google requires a persistent entry back into the consent form wherever UMP reports that
  // privacy options are available, which in practice means the EEA and the regulated US
  // states. It is absent everywhere else rather than shown as a dead control.
  const offerPrivacyOptions = useAdsStore((state) => state.consent.offerPrivacyOptions);
  const theme = useTheme();
  const tabletColumn = useTabletColumn();
  const router = useRouter();
  const { source, slides, truncated, isPro, setSource } = useSlideStore();
  const [focused, setFocused] = useState(false);

  const handleContinue = () => {
    if (!slides.length) {
      Alert.alert(t('nothingToSplit'), t('nothingToSplitDesc'));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/preview');
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 px-5" style={{ backgroundColor: theme.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 , ...tabletColumn}}>
        <View className="mt-4 mb-5">
          <View className="inline-flex self-start border px-3 py-1 rounded-full mb-3 flex-row items-center"
            style={{ backgroundColor: theme.primaryLight, borderColor: theme.primaryBorder }}>
            <Sparkles size={12} color={theme.primary} />
            <Text className="text-xs font-semibold ml-1.5" style={{ color: theme.primary }}>
              {t('heroBadge')}
            </Text>
          </View>
          <Text className="text-3xl font-extrabold tracking-tight" style={{ color: theme.text }}>
            {t('heroTitle')}
          </Text>
          <Text className="text-sm mt-1.5 leading-relaxed" style={{ color: theme.textSecondary }}>
            {t('heroSubtitle')}
          </Text>
        </View>

        <View className="border rounded-3xl p-4 mb-4"
          style={{ backgroundColor: theme.card, borderColor: focused ? theme.primary : theme.cardBorder }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-bold text-base" style={{ color: theme.text }}>{t('yourText')}</Text>
            <Text className="text-[11px] font-mono" style={{ color: theme.textMuted }}>
              {t('slideCount', { count: slides.length })}
            </Text>
          </View>
          <TextInput
            multiline
            value={source}
            onChangeText={setSource}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t('pastePlaceholder')}
            placeholderTextColor={theme.textMuted}
            accessibilityLabel={t('yourText')}
            style={{ color: theme.text, minHeight: 180, textAlignVertical: 'top' }}
            className="text-base leading-relaxed"
          />
          {!source ? (
            <TouchableOpacity
              onPress={() => setSource(SAMPLE)}
              accessibilityRole="button"
              className="flex-row items-center mt-3 self-start px-3 py-2 rounded-xl"
              style={{ backgroundColor: theme.controlSurface }}
            >
              <ClipboardPaste size={14} color={theme.textSecondary} />
              <Text className="text-xs font-bold ml-1.5" style={{ color: theme.textSecondary }}>
                {t('useSample')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {truncated ? (
          <View className="border rounded-2xl p-3 mb-4"
            style={{ backgroundColor: theme.warningLight, borderColor: theme.warning }}>
            <Text className="text-xs leading-relaxed" style={{ color: theme.warning }}>
              {t('truncatedNotice')}
            </Text>
          </View>
        ) : null}

        {!isPro && slides.length > FREE_SLIDE_LIMIT ? (
          <View className="border rounded-2xl p-3 mb-4"
            style={{ backgroundColor: theme.primaryLight, borderColor: theme.primaryBorder }}>
            <Text className="text-xs leading-relaxed" style={{ color: theme.primary }}>
              {t('freeLimitNotice', { limit: FREE_SLIDE_LIMIT, count: slides.length })}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={handleContinue}
          accessibilityRole="button"
          className="p-4 rounded-2xl flex-row items-center justify-center mb-6"
          style={{ backgroundColor: slides.length ? theme.primary : theme.controlSurface }}
        >
          <Layers size={18} color={slides.length ? theme.onPrimary : theme.textMuted} />
          <Text className="font-bold text-base ml-2 mr-2"
            style={{ color: slides.length ? theme.onPrimary : theme.textMuted }}>
            {t('buildCarousel', { count: slides.length })}
          </Text>
          <ForwardArrow size={18} color={slides.length ? theme.onPrimary : theme.textMuted} />
        </TouchableOpacity>

        <Text className="text-xs font-semibold tracking-widest mb-3" style={{ color: theme.textMuted }}>
          {t('archGuarantees')}
        </Text>
        <View className="border p-4 rounded-2xl flex-row items-start mb-3"
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
          <View className="p-2 rounded-xl mr-3" style={{ backgroundColor: theme.primaryLight }}>
            <Layers size={18} color={theme.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-sm mb-1" style={{ color: theme.text }}>{t('sentenceSafeTitle')}</Text>
            <Text className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              {t('sentenceSafeDesc')}
            </Text>
          </View>
        </View>
        <View className="border p-4 rounded-2xl flex-row items-start"
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
          <View className="p-2 rounded-xl mr-3" style={{ backgroundColor: theme.successLight }}>
            <ShieldCheck size={18} color={theme.success} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-sm mb-1" style={{ color: theme.text }}>{t('onDeviceTitle')}</Text>
            <Text className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              {t('onDeviceDesc')}
            </Text>
          </View>
        </View>
        {offerPrivacyOptions ? (
          <TouchableOpacity
            onPress={() => {
              void showPrivacyOptionsForm();
            }}
            accessibilityRole="button"
            className="mt-2 py-3 items-center"
            style={{ minHeight: 44 }}
          >
            <Text className="text-xs font-semibold underline" style={{ color: theme.textSecondary }}>
              {t('adPrivacySettings')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      {/* Anchored below the scroll area rather than inside it: a banner that scrolls with the
          content can sit under a finger reaching for the button above it. */}
      <AdBanner />
    </SafeAreaView>
  );
}
