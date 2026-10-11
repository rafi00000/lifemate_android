import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { enterCard, makeStyles } from '@/theme';

const HIGHLIGHTS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'check-circle', title: 'Plan your day', body: 'Tasks and gentle reminders, all in one list.' },
  { icon: 'pie-chart', title: 'Know your spending', body: 'Track expenses against a monthly budget in taka.' },
  { icon: 'calendar', title: 'Never miss a bill', body: 'Recurring bills with due-date alerts.' },
];

export default function WelcomeScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Animated.View entering={enterCard(0)} style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.ring, styles.ringOuter]} />
          <View style={[styles.ring, styles.ringInner]} />
          <View style={styles.sun} />
          <LogoMark size={76} />
        </Animated.View>
        <Animated.View entering={enterCard(1)}>
          <Text variant="overline" tone="primary" align="center">
            LifeMate
          </Text>
          <Text variant="display" align="center" style={styles.headline} accessibilityRole="header">
            Your day, gently organised.
          </Text>
          <Text variant="body" tone="textSecondary" align="center" style={styles.lede}>
            Tasks, money, bills and groceries together in one calm place.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.highlights}>
        {HIGHLIGHTS.map((h, i) => (
          <Animated.View key={h.title} entering={enterCard(i + 2)} style={styles.highlight}>
            <View style={styles.highlightIcon}>
              <Icon name={h.icon} size={18} tone="primary" />
            </View>
            <View style={styles.highlightText}>
              <Text variant="cardTitle">{h.title}</Text>
              <Text variant="caption" tone="textSecondary">
                {h.body}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={enterCard(5)} style={styles.actions}>
        <Button label="Create an account" size="lg" fullWidth onPress={() => router.push('/sign-up')} testID="welcome-sign-up" />
        <Button label="I already have an account" variant="ghost" fullWidth onPress={() => router.push('/sign-in')} testID="welcome-sign-in" />
      </Animated.View>
    </ScrollView>
  );
}

const useStyles = makeStyles((t) => ({
  scroll: { flex: 1, backgroundColor: t.colors.background },
  root: { flexGrow: 1, paddingHorizontal: t.space.xxl, justifyContent: 'space-between', gap: t.space.xxxl },
  hero: { alignItems: 'center', gap: t.space.xl },
  art: { width: 200, height: 170, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: t.colors.border },
  ringOuter: { width: 190, height: 190, backgroundColor: t.colors.surfaceMuted, opacity: 0.6 },
  ringInner: { width: 130, height: 130, backgroundColor: t.colors.primarySoft },
  sun: {
    position: 'absolute',
    top: 10,
    right: 22,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: t.colors.accentSoft,
    borderWidth: 1,
    borderColor: t.colors.accent,
  },
  headline: { marginTop: t.space.sm, maxWidth: 320, alignSelf: 'center' },
  lede: { marginTop: t.space.md, maxWidth: 300, alignSelf: 'center' },
  highlights: { gap: t.space.lg, alignSelf: 'center', width: '100%', maxWidth: 380 },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: t.space.lg },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.primarySoft,
  },
  highlightText: { flex: 1, gap: 2 },
  actions: { gap: t.space.xs, width: '100%', maxWidth: 420, alignSelf: 'center' },
}));
