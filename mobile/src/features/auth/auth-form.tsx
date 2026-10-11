import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark } from '@/components/brand/logo';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { enterCard, enterFade, makeStyles } from '@/theme';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Shared frame for sign-in and sign-up: back, brand, title, form, footer. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <IconButton icon="arrow-left" label="Go back" variant="soft" onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
        </View>
        <Animated.View entering={enterCard(0)} style={styles.header}>
          <LogoMark size={48} />
          <Text variant="title" accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text variant="body" tone="textSecondary">
            {subtitle}
          </Text>
        </Animated.View>
        <Animated.View entering={enterCard(1)} style={styles.form}>
          {children}
        </Animated.View>
        <View style={styles.footer}>{footer}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Inline form-level error (e.g. wrong password), announced politely. */
export function FormError({ message }: { message: string | null }) {
  const styles = useStyles();
  if (!message) return null;
  return (
    <Animated.View entering={enterFade} style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon name="alert-circle" size={18} tone="dangerText" />
      <Text variant="callout" tone="dangerText" style={styles.errorText}>
        {message}
      </Text>
    </Animated.View>
  );
}

export function FooterLink({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="link" accessibilityLabel={`${prompt} ${action}`}>
      <Text variant="callout" tone="textSecondary" align="center">
        {prompt} <Text variant="callout" tone="primary" style={{ fontFamily: 'Inter_600SemiBold' }}>{action}</Text>
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  content: { flexGrow: 1, paddingHorizontal: t.space.xxl, maxWidth: 480, width: '100%', alignSelf: 'center' },
  topRow: { flexDirection: 'row', marginLeft: -t.space.xs, marginBottom: t.space.xl },
  header: { gap: t.space.sm, marginBottom: t.space.xxl },
  title: { marginTop: t.space.lg },
  form: { gap: t.space.lg },
  footer: { marginTop: 'auto', paddingTop: t.space.xxxl },
  error: {
    flexDirection: 'row',
    gap: t.space.sm,
    alignItems: 'center',
    padding: t.space.md,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.dangerSoft,
  },
  errorText: { flex: 1 },
}));
