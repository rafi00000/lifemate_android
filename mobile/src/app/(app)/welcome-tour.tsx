import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CORE_FEATURES, type CoreFeature } from '@/features/onboarding/content';
import { FeaturePreview } from '@/features/onboarding/feature-preview';
import { useSpotlight } from '@/features/onboarding/spotlight-store';
import { useAuth } from '@/store/auth';
import { usePreferences } from '@/store/preferences';
import { enterCard, makeStyles, useTheme } from '@/theme';
import { haptics } from '@/utils/haptics';
import { goBack } from '@/utils/navigation';

type Step = { kind: 'intro' } | { kind: 'feature'; feature: CoreFeature } | { kind: 'done' };

const STEPS: Step[] = [{ kind: 'intro' }, ...CORE_FEATURES.map((feature) => ({ kind: 'feature' as const, feature })), { kind: 'done' }];

/**
 * Step-by-step welcome tour. Opens automatically once after sign-up and can be
 * replayed from Settings → Help & guide. Each step explains one core feature,
 * shows a live preview built from real components, and says where to find it.
 */
export default function WelcomeTourScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const firstName = useAuth((s) => s.user?.name.split(' ')[0]) ?? 'there';
  const setPending = usePreferences((s) => s.setWelcomeTourPending);
  const startSpotlight = useSpotlight((s) => s.start);
  const [index, setIndex] = useState(0);
  const step = STEPS[index]!;
  const last = index === STEPS.length - 1;

  // Seen once is enough: never reopen automatically.
  useEffect(() => {
    setPending(false);
  }, [setPending]);

  const go = (to: number) => {
    if (to < 0 || to >= STEPS.length || to === index) return;
    haptics.selection();
    setIndex(to);
  };

  const showMeAround = () => {
    goBack();
    // Let the tabs settle back into view before highlighting them.
    setTimeout(startSpotlight, 350);
  };

  const swipe = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-16, 16])
    .onEnd((e) => {
      if (e.translationX < -60) scheduleOnRN(go, index + 1);
      else if (e.translationX > 60) scheduleOnRN(go, index - 1);
    });

  const content =
    step.kind === 'intro'
      ? {
          overline: 'Welcome',
          title: `Hi ${firstName}, welcome to LifeMate`,
          body: 'Five everyday tools in one calm app. This quick tour shows what each one does and where to find it.',
          tips: ['Takes about a minute', 'Swipe or tap Next to continue', 'Replay it any time from Settings'],
        }
      : step.kind === 'feature'
        ? { overline: `${index} of ${CORE_FEATURES.length}`, title: step.feature.title, body: step.feature.tagline, tips: step.feature.tips }
        : {
            overline: 'Ready',
            title: 'You’re all set',
            body: 'Your data is saved securely in the cloud and stays in sync on any phone you sign in on.',
            tips: ['Start with one task or today’s spending', 'Set a monthly budget to see what’s left', 'Help & guide lives in Settings'],
          };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.top}>
        <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: STEPS.length, now: index + 1 }}>
          {STEPS.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => go(i)}
              hitSlop={8}
              style={[styles.segment, i <= index && styles.segmentActive]}
              accessibilityLabel={`Step ${i + 1} of ${STEPS.length}`}
            />
          ))}
        </View>
        {!last ? (
          <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip the tour">
            <Text variant="label" tone="textSecondary">
              Skip
            </Text>
          </Pressable>
        ) : null}
      </View>

      <GestureDetector gesture={swipe}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Animated.View key={`preview-${index}`} entering={enterCard(0)} style={styles.preview}>
            <FeaturePreview id={step.kind === 'feature' ? step.feature.id : step.kind} />
          </Animated.View>

          <Animated.View key={`text-${index}`} entering={enterCard(1)} style={styles.text}>
            {step.kind === 'feature' ? <WhereChip feature={step.feature} /> : null}
            <Text variant="overline" tone="primary">
              {content.overline}
            </Text>
            <Text variant="title" accessibilityRole="header">
              {content.title}
            </Text>
            <Text variant="body" tone="textSecondary">
              {content.body}
            </Text>
            <View style={styles.tips}>
              {content.tips.map((tip) => (
                <View key={tip} style={styles.tip}>
                  <View style={styles.tipIcon}>
                    <Icon name="check" size={12} tone="primary" />
                  </View>
                  <Text variant="callout" style={styles.flex}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </GestureDetector>

      {last ? (
        <View style={styles.footerColumn}>
          <Button label="Show me around" icon="navigation" size="lg" fullWidth onPress={showMeAround} testID="tour-show-around" />
          <Button label="I’ll explore on my own" variant="ghost" fullWidth onPress={goBack} />
        </View>
      ) : (
        <View style={styles.footer}>
          {index > 0 ? <Button label="Back" variant="ghost" onPress={() => go(index - 1)} /> : <View />}
          <Button label={index === 0 ? 'Start the tour' : 'Next'} icon="arrow-right" size="lg" onPress={() => go(index + 1)} testID="tour-next" />
        </View>
      )}
    </View>
  );
}

function WhereChip({ feature }: { feature: CoreFeature }) {
  const t = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.where} accessibilityLabel={`Find it in the ${feature.tab} tab`}>
      <Icon name={feature.icon} size={14} color={t.colors.primaryStrong} />
      <Text variant="label" tone="primaryStrong">
        Find it in the {feature.tab} tab
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: t.colors.background },
  top: { flexDirection: 'row', alignItems: 'center', gap: t.space.lg, paddingHorizontal: t.gutter, height: 44 },
  progress: { flex: 1, flexDirection: 'row', gap: t.space.xs },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: t.colors.track },
  segmentActive: { backgroundColor: t.colors.primary },
  body: { flexGrow: 1, paddingHorizontal: t.gutter, paddingTop: t.space.xl, paddingBottom: t.space.xl, gap: t.space.xxl, maxWidth: 560, width: '100%', alignSelf: 'center' },
  preview: { minHeight: 200, justifyContent: 'center' },
  text: { gap: t.space.sm },
  where: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.xs + 2,
    alignSelf: 'flex-start',
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.xs + 2,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.primarySoft,
    marginBottom: t.space.xs,
  },
  tips: { gap: t.space.md, marginTop: t.space.md },
  tip: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  tipIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: t.gutter, paddingTop: t.space.md },
  footerColumn: { gap: t.space.xs, paddingHorizontal: t.gutter, paddingTop: t.space.md },
}));
