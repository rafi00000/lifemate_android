import { useState } from 'react';
import { View } from 'react-native';
import { useToast } from '@/components/feedback/toast';
import { AmountInput } from '@/components/ui/amount-input';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { Calendar } from '@/components/ui/date-picker';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { categoryOptions } from '@/constants/categories';
import { errorMessage } from '@/services/api/errors';
import { makeStyles } from '@/theme';
import type { ExpenseCategory } from '@/types/api';
import { addDays, formatDayMonth, todayString } from '@/utils/date';
import { haptics } from '@/utils/haptics';
import { formatMoney, parseMoneyInput } from '@/utils/money';
import { useCreateExpense } from './api';
import { alertMessage } from './budget-copy';

interface AddExpenseSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Log an expense in three taps: amount, category, save. */
export function AddExpenseSheet({ visible, onClose }: AddExpenseSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add expense" testID="add-expense">
      <AddExpenseForm onClose={onClose} />
    </BottomSheet>
  );
}

function AddExpenseForm({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const toast = useToast();
  const create = useCreateExpense();
  const [today] = useState(todayString);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [date, setDate] = useState(today);
  const [pickDate, setPickDate] = useState(false);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; category?: string; form?: string }>({});

  const submit = () => {
    const minor = parseMoneyInput(amount);
    const next = {
      amount: minor === null ? (amount ? 'Enter an amount like 250 or 99.50' : 'Enter an amount') : undefined,
      category: category ? undefined : 'Choose a category',
    };
    setErrors(next);
    if (next.amount || next.category || minor === null || !category) return;

    create.mutate(
      { amount: minor, category, date, note: note.trim() },
      {
        onSuccess: ({ alerts }) => {
          onClose();
          const worst = alerts.find((a) => a.state === 'over') ?? alerts[0];
          if (worst) {
            haptics.warning();
            toast.show({ tone: 'warning', message: alertMessage(worst), durationMs: 5500 });
          } else {
            toast.success(`${formatMoney(minor)} added`);
          }
        },
        onError: (err) => setErrors({ form: errorMessage(err) }),
      },
    );
  };

  const yesterday = addDays(today, -1);
  const dateChoice = date === today ? 'today' : date === yesterday ? 'yesterday' : 'pick';

  return (
    <View style={styles.body}>
      <AmountInput value={amount} onChangeText={setAmount} error={errors.amount ?? errors.form} autoFocus />
      <View style={styles.group}>
        <ChipGroup<ExpenseCategory>
          accessibilityLabel="Category"
          options={categoryOptions}
          value={category}
          onChange={(c) => {
            setCategory(c);
            setErrors((e) => ({ ...e, category: undefined }));
          }}
        />
        {errors.category ? (
          <Text variant="caption" tone="dangerText" accessibilityLiveRegion="polite" style={styles.inlineError}>
            {errors.category}
          </Text>
        ) : null}
      </View>
      <ChipGroup
        scroll
        accessibilityLabel="Date"
        value={pickDate ? 'pick' : dateChoice}
        onChange={(v) => {
          if (v === 'pick') return setPickDate(true);
          setPickDate(false);
          setDate(v === 'today' ? today : yesterday);
        }}
        options={[
          { value: 'today', label: 'Today', icon: 'sun' },
          { value: 'yesterday', label: 'Yesterday', icon: 'rotate-ccw' },
          { value: 'pick', label: dateChoice === 'pick' ? formatDayMonth(date) : 'Other day', icon: 'calendar' },
        ]}
      />
      {pickDate ? (
        <Calendar
          value={date}
          onChange={(d) => {
            setDate(d);
            setPickDate(false);
          }}
        />
      ) : null}
      <TextField value={note} onChangeText={setNote} placeholder="Note (optional), e.g. Lunch at campus" maxLength={200} icon="edit-3" />
      <Button label="Save expense" size="lg" fullWidth onPress={submit} loading={create.isPending} testID="expense-save" />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.space.lg, paddingBottom: t.space.xs },
  group: { gap: t.space.sm },
  inlineError: { marginLeft: t.space.xxs },
}));
