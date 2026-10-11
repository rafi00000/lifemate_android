import { useState } from 'react';
import { View } from 'react-native';
import { useToast } from '@/components/feedback/toast';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { IconBadge } from '@/components/ui/misc';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { CATEGORY_META } from '@/constants/categories';
import { useRetained } from '@/hooks/use-retained';
import { errorMessage } from '@/services/api/errors';
import { makeStyles } from '@/theme';
import type { Bill } from '@/types/api';
import { dueLabel, formatDayMonth, nextOccurrence } from '@/utils/date';
import { haptics } from '@/utils/haptics';
import { formatMoney } from '@/utils/money';
import { usePayBill, useUndoBillPayment } from './api';

interface PayBillSheetProps {
  bill: Bill | null;
  onClose: () => void;
}

/**
 * Confirms a payment and (by default) logs it as an expense, so the bill and
 * the monthly spending stay consistent. Undo restores both.
 */
export function PayBillSheet({ bill, onClose }: PayBillSheetProps) {
  const shown = useRetained(bill);
  return (
    <BottomSheet visible={!!bill} onClose={onClose} title="Mark as paid">
      {shown ? <PayBillPanel key={shown.id} bill={shown} onClose={onClose} /> : null}
    </BottomSheet>
  );
}

function PayBillPanel({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const styles = useStyles();
  const toast = useToast();
  const pay = usePayBill();
  const undo = useUndoBillPayment();
  const [logExpense, setLogExpense] = useState(true);
  const meta = CATEGORY_META[bill.category];

  const confirm = () => {
    pay.mutate(
      { bill, logExpense },
      {
        onSuccess: (updated) => {
          haptics.success();
          onClose();
          const next = bill.recurrence !== 'none' ? ` Next due ${formatDayMonth(updated.dueDate)}.` : '';
          toast.success(`${bill.name} paid.${next}`, {
            label: 'Undo',
            onPress: () => undo.mutate(bill.id, { onError: (err) => toast.error(errorMessage(err)) }),
          });
        },
        onError: (err) => {
          onClose();
          toast.error(errorMessage(err));
        },
      },
    );
  };

  return (
    <View style={styles.body}>
      <View style={styles.summary}>
        <IconBadge icon={meta.icon} color={meta.color} size={48} />
        <View style={styles.flex}>
          <Text variant="cardTitle">{bill.name}</Text>
          <Text variant="caption" tone="textSecondary">
            {dueLabel(bill.dueDate)}
          </Text>
        </View>
        <Text variant="amountL">{formatMoney(bill.amount)}</Text>
      </View>
      {bill.recurrence !== 'none' ? (
        <Text variant="callout" tone="textSecondary">
          After paying, this bill moves to its next due date: {formatDayMonth(nextOccurrence(bill.dueDate, bill.recurrence, bill.anchorDay))}.
        </Text>
      ) : null}
      <View style={styles.toggle}>
        <View style={styles.flex}>
          <Text variant="bodyMedium">Add to expenses</Text>
          <Text variant="caption" tone="textSecondary">
            Counts towards this month’s {meta.label.toLowerCase()} spending.
          </Text>
        </View>
        <Switch value={logExpense} onValueChange={setLogExpense} accessibilityLabel="Add this payment to expenses" />
      </View>
      <Button label={`Paid ${formatMoney(bill.amount)}`} icon="check" size="lg" fullWidth onPress={confirm} loading={pay.isPending} testID="bill-pay-confirm" />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.space.lg, paddingBottom: t.space.xs },
  summary: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  flex: { flex: 1, gap: 2 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.md,
    padding: t.space.lg,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceMuted,
  },
}));
