import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, BackHandler, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { duration, makeStyles, useTheme } from '@/theme';
import { haptics } from '@/utils/haptics';
import { CORE_FEATURES } from './content';
import { useSpotlight, type Rect } from './spotlight-store';

const TOOLTIP_WIDTH = 320;
const RADIUS = 18;

/** Full-screen path with a rounded-rectangle hole (even-odd fill). */
function holePath(w: number, h: number, r: Rect) {
  const rr = Math.min(RADIUS, r.width / 2, r.height / 2);
  const { x, y, width, height } = r;
  return (
    `M0 0H${w}V${h}H0Z ` +
    `M${x + rr} ${y}H${x + width - rr}A${rr} ${rr} 0 0 1 ${x + width} ${y + rr}` +
    `V${y + height - rr}A${rr} ${rr} 0 0 1 ${x + width - rr} ${y + height}` +
    `H${x + rr}A${rr} ${rr} 0 0 1 ${x} ${y + height - rr}` +
    `V${y + rr}A${rr} ${rr} 0 0 1 ${x + rr} ${y}Z`
  );
}

/**
 * "Show me around": dims the app and highlights one tab at a time with a
 * short explanation, switching to that tab behind the overlay so users see
 * exactly where each feature lives. Hardware Back or Skip ends the tour.
 */
export function SpotlightTour() {
  const t = useTheme();
  const styles = useStyles();
  const { step, tabBar, next, back, stop } = useSpotlight();
  const rootRef = useRef<View>(null);
  const [frame, setFrame] = useState<Rect | null>(null);

  const feature = step !== null ? CORE_FEATURES[step] : undefined;

  useEffect(() => {
    if (!feature) return;
    router.navigate(feature.href);
    AccessibilityInfo.announceForAccessibility(`${feature.tab}. ${feature.spotlight}`);
  }, [feature]);

  useEffect(() => {
    if (step === null) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      stop();
      return true;
    });
    return () => sub.remove();
  }, [step, stop]);

  if (!feature || step === null || !tabBar) return null;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    // The overlay may not start at the window origin; measure to align the hole.
    rootRef.current?.measureInWindow((x, y) => setFrame({ x, y, width, height }));
  };

  const slot = tabBar.width / CORE_FEATURES.length;
  const hole: Rect | null = frame
    ? {
        x: tabBar.x - frame.x + step * slot + 4,
        y: tabBar.y - frame.y + 4,
        width: slot - 8,
        height: tabBar.height - 8,
      }
    : null;

  const last = step === CORE_FEATURES.length - 1;
  const tooltipWidth = frame ? Math.min(TOOLTIP_WIDTH, frame.width - 32) : TOOLTIP_WIDTH;
  const holeCenter = hole ? hole.x + hole.width / 2 : 0;
  const tooltipLeft = frame ? Math.max(16, Math.min(holeCenter - tooltipWidth / 2, frame.width - tooltipWidth - 16)) : 16;

  return (
    <View ref={rootRef} style={styles.root} onLayout={onLayout} accessibilityViewIsModal>
      {frame && hole ? (
        <>
          <Svg width={frame.width} height={frame.height} style={styles.abs}>
            <Path d={holePath(frame.width, frame.height, hole)} fill={t.colors.overlay} fillRule="evenodd" />
          </Svg>
          <Animated.View
            key={`ring-${step}`}
            entering={FadeIn.duration(duration.base)}
            pointerEvents="none"
            style={[styles.ring, { left: hole.x - 2, top: hole.y - 2, width: hole.width + 4, height: hole.height + 4 }]}
          />
          <Animated.View
            key={`tip-${step}`}
            entering={FadeIn.duration(duration.base)}
            style={[styles.tooltip, { left: tooltipLeft, width: tooltipWidth, bottom: frame.height - hole.y + 18 }]}>
            <View style={[styles.arrow, { left: holeCenter - tooltipLeft - 8 }]} />
            <View style={styles.tipHeader}>
              <View style={styles.tipIcon}>
                <Icon name={feature.icon} size={18} tone="primaryStrong" />
              </View>
              <View style={styles.flex}>
                <Text variant="overline" tone="primary">
                  {step + 1} of {CORE_FEATURES.length} · {feature.tab}
                </Text>
                <Text variant="cardTitle">{feature.title}</Text>
              </View>
            </View>
            <Text variant="callout" tone="textSecondary">
              {feature.spotlight}
            </Text>
            <View style={styles.actions}>
              {!last ? <Button label="Skip" variant="ghost" onPress={stop} /> : <View />}
              <View style={styles.actionsRight}>
                {step > 0 ? <Button label="Back" variant="ghost" onPress={back} /> : null}
                <Button
                  label={last ? 'Finish' : 'Next'}
                  onPress={() => {
                    haptics.selection();
                    if (last) {
                      stop();
                      router.navigate('/');
                    } else next();
                  }}
                  testID="spotlight-next"
                />
              </View>
            </View>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  abs: { position: 'absolute', top: 0, left: 0 },
  ring: { position: 'absolute', borderRadius: RADIUS + 2, borderWidth: 2, borderColor: t.colors.primary },
  tooltip: {
    position: 'absolute',
    gap: t.space.md,
    padding: t.space.lg,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    ...t.elevation.floating,
  },
  arrow: {
    position: 'absolute',
    bottom: -8,
    width: 16,
    height: 16,
    backgroundColor: t.colors.surface,
    transform: [{ rotate: '45deg' }],
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  tipIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionsRight: { flexDirection: 'row', alignItems: 'center', gap: t.space.xs },
}));
