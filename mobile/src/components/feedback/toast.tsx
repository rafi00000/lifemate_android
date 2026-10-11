import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import Animated, { FadeOutDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { duration, easing, makeStyles, TAB_BAR_HEIGHT, useTheme } from '@/theme';
import { Icon, type IconName } from '../ui/icon';
import { Text } from '../ui/text';

type ToastTone = 'neutral' | 'success' | 'warning' | 'danger';

interface ToastOptions {
  message: string;
  tone?: ToastTone;
  /** e.g. { label: 'Undo', onPress } */
  action?: { label: string; onPress: () => void };
  durationMs?: number;
}

interface ToastState extends ToastOptions {
  id: number;
}

interface ToastApi {
  show: (options: ToastOptions) => void;
  success: (message: string, action?: ToastOptions['action']) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const ICONS: Record<ToastTone, IconName> = {
  neutral: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  danger: 'alert-circle',
};

/**
 * One toast at a time, floating above the tab bar. Toasts confirm actions
 * and offer Undo; they are announced to screen readers and never cover the
 * primary content for long.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((options: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current);
    counter.current += 1;
    setToast({ ...options, id: counter.current });
    AccessibilityInfo.announceForAccessibility(options.message);
    timer.current = setTimeout(() => setToast(null), options.durationMs ?? (options.action ? 5000 : 3200));
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message, action) => show({ message, tone: 'success', action }),
      error: (message) => show({ message, tone: 'danger', durationMs: 4500 }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastHost toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastHost({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  const tone = toast.tone ?? 'neutral';
  const iconColor = {
    neutral: t.colors.secondary,
    success: t.colors.success,
    warning: t.colors.warning,
    danger: t.colors.danger,
  }[tone];

  return (
    // Sits above the floating action button (tab bar + 20 + 56dp FAB), so a
    // toast never blocks the next "add" tap.
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + TAB_BAR_HEIGHT + 20 + 56 + t.space.md }]}>
      <Animated.View
        key={toast.id}
        entering={SlideInDown.duration(duration.base).easing(easing.standard)}
        exiting={FadeOutDown.duration(duration.fast)}
        style={styles.toast}
        accessibilityLiveRegion="polite">
        <Icon name={ICONS[tone]} size={18} color={iconColor} />
        <Text variant="callout" color={t.scheme === 'light' ? '#F2F6F4' : t.colors.text} style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
        {toast.action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={toast.action.label}
            hitSlop={12}
            onPress={() => {
              toast.action?.onPress();
              onDismiss();
            }}>
            <Text variant="button" color={t.scheme === 'light' ? '#BFE0D4' : t.colors.primary}>
              {toast.action.label}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  host: { position: 'absolute', left: t.gutter, right: t.gutter, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.md,
    width: '100%',
    maxWidth: 520,
    minHeight: 52,
    paddingHorizontal: t.space.lg,
    paddingVertical: t.space.md,
    borderRadius: t.radius.md,
    // Inverted surface so the toast reads clearly over any content.
    backgroundColor: t.scheme === 'light' ? '#24352F' : t.colors.surfaceRaised,
    ...t.elevation.floating,
    ...(t.scheme === 'dark' ? t.elevation.hairline : {}),
  },
  message: { flex: 1 },
}));
