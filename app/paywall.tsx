import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Layers3, Check, X } from "lucide-react-native";
import { usePaywall } from "../src/hooks/usePaywall";
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from "../src/config/legal";
import { t } from "../src/i18n";
import { useTheme } from '../src/theme/useTheme';
import { useTabletColumn } from '../src/theme/useTabletColumn';

export default function PaywallScreen() {
  const theme = useTheme();
  const tabletColumn = useTabletColumn(640);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ctaLabel, loading, errorMsg, handlePurchase, handleRestore } =
    usePaywall(() => router.back());

  const steps = [
    { title: t("featAdsTitle"), desc: t("featAdsDesc") },
    { title: t("feat1Title"), desc: t("feat1Desc") },
    { title: t("feat2Title"), desc: t("feat2Desc") },
    { title: t("feat3Title"), desc: t("feat3Desc") },
    { title: t("feat4Title"), desc: t("feat4Desc") },
  ];

  return (
    <View className="flex-1 px-6 py-4" style={{ backgroundColor: theme.background }}>
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t("cancel")}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        className="self-end rounded-full p-2"
        style={{ backgroundColor: theme.card }}
      >
        <X size={18} color={theme.textMuted} />
      </TouchableOpacity>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ ...tabletColumn }}>
          <View className="mb-2 flex-row items-center">
            <Layers3 size={22} color={theme.primary} />
            <Text className="ml-2 text-2xl font-extrabold" style={{ color: theme.text }}>
              {t("paywallTitle")}
            </Text>
          </View>
          <Text className="mb-6 text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
            {t("antiSubHeadline")}
          </Text>

          <View className="mb-2">
            {steps.map((s, i) => (
              <View key={s.title} className="flex-row">
                <View className="items-center" style={{ width: 32 }}>
                  <View
                    className="h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: i === 0 ? theme.primary : theme.controlSurface }}
                  >
                    <Text
                      className="text-xs font-extrabold"
                      style={{ color: i === 0 ? theme.onPrimary : theme.text }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  {i < steps.length - 1 ? (
                    <View style={{ flex: 1, width: 2, backgroundColor: theme.cardBorder, marginVertical: 2 }} />
                  ) : null}
                </View>
                <View className="mb-5 ml-3 flex-1 pb-1">
                  <Text className="text-sm font-bold" style={{ color: theme.text }}>{s.title}</Text>
                  <Text className="mt-0.5 text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
                    {s.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mb-4 rounded-xl p-4" style={{ backgroundColor: theme.controlSurface }}>
            <Text className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              {t("antiSubDesc")}
            </Text>
          </View>

          {errorMsg ? (
            <Text
              accessibilityRole="alert"
              className="mb-3 text-center text-xs" style={{ color: theme.danger }}
            >
              {errorMsg}
            </Text>
          ) : null}
        </ScrollView>

        <View
          className="pt-2"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        >
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
            accessibilityState={{ disabled: loading, busy: loading }}
            className={`min-h-[56px] flex-row items-center justify-center rounded-2xl p-4 ${
              loading ? "bg-blue-900" : "bg-blue-600 active:bg-blue-500"
            }`}
          >
            {loading ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <>
                <Check size={18} color={theme.onPrimary} strokeWidth={3} />
                <Text className="ml-2 text-base font-extrabold" style={{ color: theme.onPrimary }}>
                  {ctaLabel}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View className="mt-4 flex-row items-center justify-center gap-5">
            <TouchableOpacity
              onPress={handleRestore}
              disabled={loading}
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Text className="text-xs underline" style={{ color: theme.textSecondary }}>
                {t("restorePurchases")}
              </Text>
            </TouchableOpacity>
            <Text className="text-xs" style={{ color: theme.textMuted }}>•</Text>
            <Text className="text-xs" style={{ color: theme.textMuted }}>{t("oneTimePayment")}</Text>
          </View>

          <View className="mt-3 flex-row items-center justify-center gap-5">
            <TouchableOpacity
              onPress={() => Linking.openURL(TERMS_OF_USE_URL)}
              accessibilityRole="link"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Text className="text-xs underline" style={{ color: theme.textMuted }}>
                {t("termsOfUse")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
              accessibilityRole="link"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Text className="text-xs underline" style={{ color: theme.textMuted }}>
                {t("privacyPolicy")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
