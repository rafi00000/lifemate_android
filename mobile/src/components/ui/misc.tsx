import { View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import { Icon, type IconName } from './icon';
import { Text } from './text';

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const t = useTheme();
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Text variant={size >= 44 ? 'cardTitle' : 'label'} tone="primaryStrong">
        {initials}
      </Text>
    </View>
  );
}

type PillTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'accent';

interface PillProps {
  label: string;
  tone?: PillTone;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

/** Small status label. Always text, so status never relies on colour alone. */
export function Pill({ label, tone = 'neutral', icon, style }: PillProps) {
  const t = useTheme();
  const styles = useStyles();
  const palette = {
    neutral: { bg: t.colors.surfaceMuted, fg: t.colors.textSecondary },
    primary: { bg: t.colors.primarySoft, fg: t.colors.primaryStrong },
    success: { bg: t.colors.successSoft, fg: t.colors.successText },
    warning: { bg: t.colors.warningSoft, fg: t.colors.warningText },
    danger: { bg: t.colors.dangerSoft, fg: t.colors.dangerText },
    accent: { bg: t.colors.accentSoft, fg: t.colors.accentText },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }, style]}>
      {icon ? <Icon name={icon} size={12} color={palette.fg} /> : null}
      <Text variant="label" color={palette.fg} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Round tinted icon badge used for categories and list leading icons. */
export function IconBadge({ icon, color, size = 40 }: { icon: IconName; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.36,
        backgroundColor: `${color}22`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={icon} size={Math.round(size * 0.45)} color={color} />
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.colors.border, marginLeft: inset }} />;
}

const useStyles = makeStyles((t) => ({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: t.space.sm + 2,
    paddingVertical: 3,
    borderRadius: t.radius.pill,
  },
}));
