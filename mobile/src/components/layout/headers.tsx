import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { makeStyles } from '@/theme';
import { IconButton } from '../ui/icon-button';
import { Text } from '../ui/text';
import { goBack } from '@/utils/navigation';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  overline?: string;
  right?: ReactNode;
}

/** Large serif page title used at the top of every tab. */
export function PageTitle({ title, subtitle, overline, right }: PageTitleProps) {
  const styles = useStyles();
  return (
    <View style={styles.pageTitle}>
      <View style={styles.flex}>
        {overline ? (
          <Text variant="overline" tone="textSecondary" style={styles.overline}>
            {overline}
          </Text>
        ) : null}
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="callout" tone="textSecondary" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

interface StackHeaderProps {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
}

/** Compact header for pushed screens (editors, details) with a back button. */
export function StackHeader({ title, right, onBack }: StackHeaderProps) {
  const styles = useStyles();
  return (
    <View style={styles.stackHeader}>
      <IconButton icon="arrow-left" label="Go back" variant="soft" onPress={onBack ?? (() => goBack())} />
      <Text variant="section" numberOfLines={1} style={styles.stackTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.stackRight}>{right}</View>
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  meta?: string;
}

export function SectionHeader({ title, actionLabel, onAction, meta }: SectionHeaderProps) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text variant="section" accessibilityRole="header" style={styles.flex}>
        {title}
        {meta ? <Text variant="callout" tone="textTertiary">{`  ${meta}`}</Text> : null}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button" accessibilityLabel={`${actionLabel}: ${title}`}>
          <Text variant="label" tone="primary">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  pageTitle: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: t.space.md,
    paddingTop: t.space.lg,
    paddingBottom: t.space.xl,
  },
  overline: { marginBottom: t.space.xs },
  subtitle: { marginTop: t.space.xs },
  right: { flexDirection: 'row', gap: t.space.sm, paddingBottom: t.space.xxs },
  stackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.md,
    paddingHorizontal: t.gutter - 4,
    height: 60,
  },
  stackTitle: { flex: 1 },
  stackRight: { flexDirection: 'row', gap: t.space.xs, minWidth: 40, justifyContent: 'flex-end' },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: t.space.xxl,
    marginBottom: t.space.md,
  },
}));
