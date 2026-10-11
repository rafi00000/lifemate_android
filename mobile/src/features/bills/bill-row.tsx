import { memo } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/misc';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { CATEGORY_META } from '@/constants/categories';
import { enterFade, exitFade, layoutTransition, makeStyles } from '@/theme';
import type { Bill, BillRecurrence } from '@/types/api';
import { diffDays, dueLabel, todayString } from '@/utils/date';
import { formatMoney } from '@/utils/money';

export const BILL_RECURRENCE_LABEL: Record<BillRecurrence, string> = {
  none: 'One-time',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

interface BillRowProps {
  bill: Bill;
  onPress: (bill: Bill) => void;
  onPay?: (bill: Bill) => void;
  compact?: boolean;
}

export const BillRow = memo(function BillRow({ bill, onPress, onPay, compact }: BillRowProps) {
  const styles = useStyles();
  const today = todayString();
  const days = diffDays(today, bill.dueDate);
  const overdue = !bill.isPaid && days < 0;
  const soon = !bill.isPaid && days >= 0 && days <= 3;
  const meta = CATEGORY_META[bill.category];
  const label = bill.isPaid ? `Paid${bill.lastPayment ? ` on ${bill.lastPayment.paidOn}` : ''}` : dueLabel(bill.dueDate, today);

  return (
    <Animated.View entering={enterFade} exiting={exitFade} layout={layoutTransition}>
      <View style={styles.row}>
        <Pressable
          style={styles.main}
          onPress={() => onPress(bill)}
          accessibilityRole="button"
          accessibilityLabel={`${bill.name}, ${formatMoney(bill.amount)}, ${label}, ${BILL_RECURRENCE_LABEL[bill.recurrence]}`}
          accessibilityHint="Opens the bill to edit">
          <IconBadge icon={meta.icon} color={meta.color} size={compact ? 36 : 42} />
          <View style={styles.text}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {bill.name}
            </Text>
            <View style={styles.metaRow}>
              {overdue ? <Icon name="alert-circle" size={13} tone="dangerText" /> : null}
              <Text variant="caption" tone={overdue ? 'dangerText' : soon ? 'warningText' : 'textSecondary'} numberOfLines={1} style={styles.flexShrink}>
                {label}
              </Text>
              {/* Frequency as a quiet icon keeps the row on one line; it is spoken via the row label. */}
              {!compact && bill.recurrence !== 'none' ? <Icon name="repeat" size={12} tone="textTertiary" /> : null}
            </View>
          </View>
          <Text variant="amount" tone={bill.isPaid ? 'textTertiary' : 'text'}>
            {formatMoney(bill.amount)}
          </Text>
        </Pressable>
        {onPay && !bill.isPaid ? (
          <PressableScale
            onPress={() => onPay(bill)}
            pressedScale={0.92}
            accessibilityLabel={`Mark ${bill.name} as paid`}
            style={[styles.pay, overdue && styles.payUrgent]}
            testID={`bill-pay-${bill.id}`}>
            <Text variant="label" tone={overdue ? 'onPrimary' : 'primaryStrong'}>
              Pay
            </Text>
          </PressableScale>
        ) : null}
      </View>
    </Animated.View>
  );
});

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingVertical: t.space.md },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: 44 },
  text: { flex: 1, gap: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.xs },
  flexShrink: { flexShrink: 1 },
  pay: {
    height: 36,
    paddingHorizontal: t.space.lg,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payUrgent: { backgroundColor: t.colors.primary },
}));
