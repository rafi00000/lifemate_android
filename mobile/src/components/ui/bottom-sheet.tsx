import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { duration, makeStyles, spring, useTheme } from '@/theme';
import { IconButton } from './icon-button';
import { Text } from './text';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /**
   * Content is mounted only while the sheet is open, so form state inside it
   * starts fresh every time the sheet opens. Put form state in a child
   * component rather than in the component that renders the sheet.
   */
  children: ReactNode;
  testID?: string;
}

const OFFSCREEN = 800;

/**
 * Modal bottom sheet for quick, focused input (add a task, log an expense).
 * - Slides up on a damped spring, backdrop fades in.
 * - Drag the handle/header down, tap the backdrop, or press Android Back to
 *   dismiss.
 * - Lifts above the keyboard.
 * Longer forms use full screens instead; sheets stay short.
 */
export function BottomSheet({ visible, onClose, title, children, testID }: BottomSheetProps) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(OFFSCREEN);
  const backdrop = useSharedValue(0);

  // Mount immediately when asked to open (adjusting state during render,
  // as React recommends, avoids an extra effect-driven render).
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      translateY.set(withSpring(0, spring.sheet));
      backdrop.set(withTiming(1, { duration: duration.base }));
    } else {
      backdrop.set(withTiming(0, { duration: duration.fast }));
      translateY.set(
        withTiming(OFFSCREEN, { duration: duration.base, easing: Easing.in(Easing.quad) }, (done) => {
          if (done) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [visible, mounted, translateY, backdrop]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateY.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > 110 || e.velocityY > 900) {
        scheduleOnRN(onClose);
      } else {
        translateY.set(withSpring(0, spring.sheet));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.get() }));

  if (!mounted) return null;

  return (
    <Modal visible transparent statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.overlay }, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.avoider} pointerEvents="box-none">
          <Animated.View
            testID={testID}
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, t.space.lg) }, sheetStyle]}
            accessibilityViewIsModal>
            <GestureDetector gesture={pan}>
              <View style={styles.header}>
                <View style={styles.handle} />
                {title ? (
                  <View style={styles.titleRow}>
                    <Text variant="headline" accessibilityRole="header" style={styles.title}>
                      {title}
                    </Text>
                    <IconButton icon="x" label="Close" variant="soft" size={34} onPress={onClose} />
                  </View>
                ) : null}
              </View>
            </GestureDetector>
            <View style={styles.body}>{children}</View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1 },
  avoider: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: t.colors.surface,
    borderTopLeftRadius: t.radius.xl,
    borderTopRightRadius: t.radius.xl,
    maxHeight: '92%',
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    ...t.elevation.floating,
  },
  header: { paddingTop: t.space.sm, paddingHorizontal: t.gutter },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.colors.borderStrong,
    marginBottom: t.space.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: t.space.sm },
  title: { flex: 1 },
  body: { paddingHorizontal: t.gutter, paddingTop: t.space.sm },
}));
