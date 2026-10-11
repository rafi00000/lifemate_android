import { View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme';

/**
 * The LifeMate mark: a leaf (calm, growth, everyday life) whose vein is a
 * check mark (things getting done). Same geometry as assets/brand/logo.svg.
 * Wrapped in a View so it stacks above decorative siblings on every
 * platform (a bare <svg> paints beneath positioned elements on web).
 */
export function LogoMark({ size = 64 }: { size?: number }) {
  const t = useTheme();
  const bg = t.scheme === 'dark' ? '#4F7A6F' : t.colors.primary;
  return (
    <View style={{ width: size, height: size }} accessibilityRole="image" accessibilityLabel="LifeMate logo">
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Rect width={64} height={64} rx={18} fill={bg} />
        <G transform="translate(-1 1)">
          <Path d="M16 48 C16 27 29 15 50 14 C50 35 37 48 16 48 Z" fill="#FFFFFF" />
          <Path d="M24 34 L30.5 40 L41 26" stroke={bg} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      </Svg>
    </View>
  );
}
