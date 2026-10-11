import { memo } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { CATEGORY_META } from '@/constants/categories';
import { enterFade, exitFade, layoutTransition, makeStyles } from '@/theme';
import type { Expense } from '@/types/api';
import { formatMoney } from '@/utils/money';

interface ExpenseRowProps {
  expense: Expense;
  onPress: (expense: Expense) => void;
}

export const ExpenseRow = memo(function ExpenseRow({ expense, onPress }: ExpenseRowProps) {
  const styles = useStyles();
  const meta = CATEGORY_META[expense.category];
  const title = expense.note || meta.label;
  return (
    <Animated.View entering={enterFade} exiting={exitFade} layout={layoutTransition}>
      <Pressable
        style={styles.row}
        onPress={() => onPress(expense)}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${meta.label}, ${formatMoney(expense.amount)}`}
        accessibilityHint="Opens the expense to edit">
        <IconBadge icon={meta.icon} color={meta.color} size={40} />
        <View style={styles.text}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.meta}>
            <Text variant="caption" tone="textSecondary">
              {meta.label}
            </Text>
            {expense.bill ? <Icon name="calendar" size={12} tone="textTertiary" /> : null}
          </View>
        </View>
        <Text variant="amount">{formatMoney(expense.amount)}</Text>
      </Pressable>
    </Animated.View>
  );
});

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingVertical: t.space.md, minHeight: 60 },
  text: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: t.space.xs },
}));
