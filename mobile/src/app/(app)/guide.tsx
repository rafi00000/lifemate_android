import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { StackHeader } from '@/components/layout/headers';
import { Screen } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { Divider } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { CORE_FEATURES, type CoreFeature } from '@/features/onboarding/content';
import { useSpotlight } from '@/features/onboarding/spotlight-store';
import { enterCard, makeStyles } from '@/theme';

const GOOD_TO_KNOW: { icon: IconName; title: string; body: string }[] = [
  { icon: 'cloud', title: 'Synced to the cloud', body: 'Sign in on another phone and everything is there. Pull down on any screen to refresh.' },
  { icon: 'rotate-ccw', title: 'Undo is always close', body: 'Completed a task or paid a bill by mistake? Tap Undo on the message at the bottom.' },
  { icon: 'bell', title: 'Reminders', body: 'Allow notifications when asked. If they arrive late, set LifeMate’s battery usage to “Unrestricted”.' },
  { icon: 'target', title: 'Budgets carry forward', body: 'Set a budget once and it applies to later months until you change it.' },
  { icon: 'users', title: 'Shared lists', body: 'Everyone on a shared grocery list can add and tick items. Only the owner can delete it.' },
  { icon: 'user', title: 'Profile & settings', body: 'Tap your initials on the Today screen for your account, theme and this guide.' },
];

/** Help centre: what LifeMate can do, where each feature lives, and how to use it. */
export default function GuideScreen() {
  const styles = useStyles();
  const startSpotlight = useSpotlight((s) => s.start);

  const showMeAround = () => {
    router.navigate('/');
    setTimeout(startSpotlight, 350);
  };

  return (
    <Screen header={<StackHeader title="Help & guide" />}>
      <Animated.View entering={enterCard(0)}>
        <Card tone="tinted" style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="compass" size={24} tone="primaryStrong" />
          </View>
          <Text variant="headline" tone="primaryStrong">
            New to LifeMate?
          </Text>
          <Text variant="callout" tone="textSecondary">
            Take the one-minute tour, or let us point out where everything lives.
          </Text>
          <View style={styles.heroActions}>
            <Button label="Take the tour" icon="play" onPress={() => router.push('/welcome-tour')} style={styles.flex} testID="guide-tour" />
            <Button label="Show me around" variant="secondary" onPress={showMeAround} style={[styles.flex, styles.onTint]} />
          </View>
        </Card>
      </Animated.View>

      <Text variant="overline" tone="textSecondary" style={styles.sectionTitle}>
        Core features
      </Text>
      <View style={styles.stack}>
        {CORE_FEATURES.map((feature, i) => (
          <Animated.View key={feature.id} entering={enterCard(i + 1)}>
            <FeatureCard feature={feature} />
          </Animated.View>
        ))}
      </View>

      <Text variant="overline" tone="textSecondary" style={styles.sectionTitle}>
        Good to know
      </Text>
      <Card padded={false}>
        {GOOD_TO_KNOW.map((item, i) => (
          <View key={item.title}>
            {i > 0 ? <Divider inset={56} /> : null}
            <View style={styles.knowRow}>
              <View style={styles.knowIcon}>
                <Icon name={item.icon} size={18} tone="primary" />
              </View>
              <View style={styles.flex}>
                <Text variant="bodyMedium">{item.title}</Text>
                <Text variant="caption" tone="textSecondary">
                  {item.body}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

function FeatureCard({ feature }: { feature: CoreFeature }) {
  const styles = useStyles();
  return (
    <Card>
      <View style={styles.cardHeader}>
        <View style={styles.featureIcon}>
          <Icon name={feature.icon} size={20} tone="primaryStrong" />
        </View>
        <View style={styles.flex}>
          <Text variant="cardTitle">{feature.title}</Text>
          <Text variant="caption" tone="textSecondary">
            {feature.tab} tab
          </Text>
        </View>
        <Pressable
          onPress={() => router.navigate(feature.href)}
          hitSlop={12}
          style={styles.open}
          accessibilityRole="button"
          accessibilityLabel={`Open ${feature.tab}`}>
          <Text variant="label" tone="primary">
            Open
          </Text>
          <Icon name="chevron-right" size={16} tone="primary" />
        </Pressable>
      </View>
      <Text variant="callout" tone="textSecondary" style={styles.tagline}>
        {feature.tagline}
      </Text>
      <View style={styles.tips}>
        {feature.tips.map((tip) => (
          <View key={tip} style={styles.tip}>
            <Icon name="check" size={14} tone="success" />
            <Text variant="callout" style={styles.flex}>
              {tip}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  hero: { gap: t.space.sm, marginTop: t.space.sm },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: t.space.xs },
  heroActions: { flexDirection: 'row', gap: t.space.sm, marginTop: t.space.md },
  // The tinted hero shares the secondary button's colour; lift it onto the surface.
  onTint: { backgroundColor: t.colors.surface },
  sectionTitle: { marginTop: t.space.xxl, marginBottom: t.space.sm, marginLeft: t.space.xs },
  stack: { gap: t.space.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  featureIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  open: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: t.space.xs },
  tagline: { marginTop: t.space.md },
  tips: { gap: t.space.sm, marginTop: t.space.md },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: t.space.sm },
  knowRow: { flexDirection: 'row', alignItems: 'flex-start', gap: t.space.md, padding: t.space.lg },
  knowIcon: { width: 28, alignItems: 'center', paddingTop: 2 },
}));
