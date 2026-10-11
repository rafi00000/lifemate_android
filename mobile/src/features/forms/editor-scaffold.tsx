import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackHeader } from '@/components/layout/headers';
import { makeStyles } from '@/theme';

interface EditorScaffoldProps {
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
  /** Sticky bottom action (Save). Stays above the keyboard. */
  footer: ReactNode;
}

/** Full-screen editor layout shared by task, expense, bill, budget and note. */
export function EditorScaffold({ title, headerRight, children, footer }: EditorScaffoldProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top }}>
        <StackHeader title={title} right={headerRight} />
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: t.gutter, paddingBottom: t.space.xxxl, maxWidth: 640, width: '100%', alignSelf: 'center' },
  footer: {
    paddingHorizontal: t.gutter,
    paddingTop: t.space.md,
    backgroundColor: t.colors.background,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
}));
