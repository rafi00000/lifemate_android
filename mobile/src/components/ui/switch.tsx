import { Platform, Switch as RNSwitch } from 'react-native';
import { useTheme } from '@/theme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

/** Native switch in LifeMate colours (React Native Web needs its own props). */
export function Switch({ value, onValueChange, accessibilityLabel, disabled }: SwitchProps) {
  const t = useTheme();
  const webColors = Platform.OS === 'web' ? { activeThumbColor: t.colors.surface, activeTrackColor: t.colors.primary } : {};
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ true: t.colors.primary, false: t.colors.borderStrong }}
      thumbColor={t.colors.surface}
      accessibilityLabel={accessibilityLabel}
      {...webColors}
    />
  );
}
