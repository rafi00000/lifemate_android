import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { useTheme, type ColorTokens } from '@/theme';

export type IconName = ComponentProps<typeof Feather>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  tone?: keyof ColorTokens;
  color?: string;
}

/**
 * Feather's thin, rounded strokes match LifeMate's calm tone. Icons are
 * decorative by default; meaningful icons get labels from their control.
 */
export function Icon({ name, size = 20, tone = 'text', color }: IconProps) {
  const t = useTheme();
  return (
    <Feather
      name={name}
      size={size}
      color={color ?? t.colors[tone]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
