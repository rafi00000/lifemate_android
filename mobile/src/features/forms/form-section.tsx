import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { makeStyles } from '@/theme';

interface FormSectionProps {
  label: string;
  icon?: IconName;
  hint?: string;
  children: ReactNode;
}

/** Labelled group inside editor screens: icon + label above the control. */
export function FormSection({ label, icon, hint, children }: FormSectionProps) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.labelRow}>
        {icon ? <Icon name={icon} size={16} tone="textSecondary" /> : null}
        <Text variant="label" tone="textSecondary">
          {label}
        </Text>
      </View>
      {children}
      {hint ? (
        <Text variant="caption" tone="textTertiary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  section: { gap: t.space.md, marginTop: t.space.xxl },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm, marginLeft: t.space.xxs },
}));
