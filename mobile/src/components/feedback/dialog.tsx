import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Keyframe } from 'react-native-reanimated';
import { duration, easing, makeStyles, useTheme } from '@/theme';
import { Button } from '../ui/button';
import { Text } from '../ui/text';

/**
 * Dialogs settle in with a short fade and a barely-there scale. Web uses a
 * plain fade (custom keyframes break layout in Reanimated's web layer).
 */
const dialogEnter =
  Platform.OS === 'web'
    ? FadeIn.duration(duration.base)
    : new Keyframe({
        0: { opacity: 0, transform: [{ scale: 0.95 }] },
        100: { opacity: 1, transform: [{ scale: 1 }], easing: easing.standard },
      }).duration(duration.base);

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const DialogContext = createContext<Confirm | null>(null);

/** `const confirm = useConfirm(); if (await confirm({...})) ...` */
export function useConfirm(): Confirm {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useConfirm must be used inside <DialogProvider>');
  return ctx;
}

/**
 * Confirmation dialogs for irreversible actions only (delete, sign out).
 * Routine, undoable actions use an Undo toast instead of interrupting.
 */
export function DialogProvider({ children }: { children: ReactNode }) {
  const t = useTheme();
  const styles = useStyles();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  };

  return (
    <DialogContext.Provider value={confirm}>
      {children}
      <Modal visible={!!options} transparent statusBarTranslucent animationType="none" onRequestClose={() => close(false)}>
        {options ? (
          <View style={styles.center}>
            <Animated.View entering={FadeIn.duration(duration.fast)} exiting={FadeOut.duration(duration.fast)} style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.overlay }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => close(false)} accessibilityLabel="Cancel" />
            </Animated.View>
            <Animated.View
              entering={dialogEnter}
              style={styles.dialog}
              accessibilityViewIsModal
              accessibilityRole="alert">
              <Text variant="headline" accessibilityRole="header">
                {options.title}
              </Text>
              {options.message ? (
                <Text variant="body" tone="textSecondary" style={styles.message}>
                  {options.message}
                </Text>
              ) : null}
              <View style={styles.actions}>
                <Button label={options.cancelLabel ?? 'Cancel'} variant="ghost" onPress={() => close(false)} />
                <Button
                  label={options.confirmLabel ?? 'Confirm'}
                  variant={options.destructive ? 'danger' : 'primary'}
                  onPress={() => close(true)}
                />
              </View>
            </Animated.View>
          </View>
        ) : null}
      </Modal>
    </DialogContext.Provider>
  );
}

const useStyles = makeStyles((t) => ({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: t.space.xxl },
  dialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.xl,
    padding: t.space.xxl,
    ...t.elevation.floating,
  },
  message: { marginTop: t.space.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: t.space.sm, marginTop: t.space.xxl },
}));
