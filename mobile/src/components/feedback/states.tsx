import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { enterFade, makeStyles, useTheme } from '@/theme';
import { Button } from '../ui/button';
import { Icon, type IconName } from '../ui/icon';
import { Text } from '../ui/text';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Empty states explain what belongs here and offer the one action that
 * fills it, in an encouraging tone rather than an error tone.
 */
export function EmptyState({ icon, title, message, actionLabel, onAction, compact, style }: EmptyStateProps) {
  const styles = useStyles();
  return (
    <Animated.View entering={enterFade} style={[styles.container, compact && styles.compact, style]}>
      <View style={[styles.halo, compact && styles.haloCompact]}>
        <View style={styles.badge}>
          <Icon name={icon} size={compact ? 20 : 24} tone="primary" />
        </View>
      </View>
      <Text variant={compact ? 'cardTitle' : 'section'} align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="callout" tone="textSecondary" align="center" style={styles.message}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" icon="plus" style={styles.action} />
      ) : null}
    </Animated.View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  compact?: boolean;
}

export function ErrorState({ message, onRetry, retrying, compact }: ErrorStateProps) {
  const t = useTheme();
  const styles = useStyles();
  return (
    <Animated.View entering={enterFade} style={[styles.container, compact && styles.compact]} accessibilityRole="alert">
      <View style={[styles.badge, { backgroundColor: t.colors.warningSoft }]}>
        <Icon name="cloud-off" size={22} tone="warningText" />
      </View>
      <Text variant="cardTitle" align="center">
        Couldn’t load this
      </Text>
      <Text variant="callout" tone="textSecondary" align="center" style={styles.message}>
        {message}
      </Text>
      {onRetry ? <Button label="Try again" onPress={onRetry} loading={retrying} variant="secondary" icon="refresh-cw" style={styles.action} /> : null}
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  container: { alignItems: 'center', paddingVertical: t.space.huge, paddingHorizontal: t.space.xxl, gap: t.space.sm },
  compact: { paddingVertical: t.space.xl },
  halo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.surfaceMuted,
    marginBottom: t.space.sm,
  },
  haloCompact: { width: 64, height: 64, borderRadius: 32 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.primarySoft,
  },
  message: { maxWidth: 300 },
  action: { marginTop: t.space.md },
}));
