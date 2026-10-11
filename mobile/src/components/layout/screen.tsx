import { useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, TAB_BAR_HEIGHT, useTheme } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Pull-to-refresh handler; shows the native spinner while it resolves. */
  onRefresh?: () => Promise<unknown>;
  /** Leaves room for the floating tab bar (tab screens). */
  withTabBar?: boolean;
  /** Extra bottom space for a floating action button. */
  withFab?: boolean;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  header?: ReactNode;
  testID?: string;
}

/**
 * Standard page: safe-area aware, page background, consistent gutters,
 * optional pull-to-refresh (manual sync with the cloud).
 */
export function Screen({ children, onRefresh, withTabBar, withFab, scroll = true, contentStyle, header, testID }: ScreenProps) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const bottom = insets.bottom + (withTabBar ? TAB_BAR_HEIGHT + t.space.xl : t.space.xxl) + (withFab ? 72 : 0);

  const refresh = onRefresh
    ? async () => {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    : undefined;

  if (!scroll) {
    return (
      <View testID={testID} style={[styles.root, { paddingTop: insets.top }]}>
        {header}
        <View style={[styles.fill, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View testID={testID} style={[styles.root, { paddingTop: insets.top }]}>
      {header}
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.content, { paddingBottom: bottom }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          refresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={t.colors.primary}
              colors={[t.colors.primary]}
              progressBackgroundColor={t.colors.surface}
            />
          ) : undefined
        }>
        {children}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  fill: { flex: 1 },
  content: { paddingHorizontal: t.gutter, paddingTop: t.space.sm },
}));
