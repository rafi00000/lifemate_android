import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useConfirm } from '@/components/feedback/dialog';
import { EmptyState } from '@/components/feedback/states';
import { useToast } from '@/components/feedback/toast';
import { AmountInput } from '@/components/ui/amount-input';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { Calendar } from '@/components/ui/date-picker';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { categoryOptions } from '@/constants/categories';
import { EditorScaffold } from '@/features/forms/editor-scaffold';
import { FormSection } from '@/features/forms/form-section';
import { useDeleteExpense, useUpdateExpense } from '@/features/money/api';
import { errorMessage } from '@/services/api/errors';
import { qk } from '@/services/query-client';
import type { Expense, ExpenseCategory, Paged } from '@/types/api';
import { formatLongDate } from '@/utils/date';
import { parseMoneyInput, toMoneyInput } from '@/utils/money';
import { goBack } from '@/utils/navigation';

/** Edit or delete an existing expense (new ones use the quick sheet). */
export default function ExpenseEditorScreen() {
  const { id, month } = useLocalSearchParams<{ id: string; month?: string }>();
  const qc = useQueryClient();
  // Expenses are always opened from a month list that is already cached.
  const expense = qc
    .getQueriesData<InfiniteData<Paged<Expense>>>({ queryKey: month ? qk.expenses(month) : qk.expensesAll })
    .flatMap(([, data]) => data?.pages.flatMap((p) => p.data) ?? [])
    .find((e) => e.id === id);

  if (!expense) {
    return (
      <EditorScaffold title="Expense" footer={null}>
        <EmptyState icon="search" title="Expense not found" message="It may have been deleted on another device." actionLabel="Go back" onAction={() => goBack()} />
      </EditorScaffold>
    );
  }
  return <ExpenseForm expense={expense} />;
}

function ExpenseForm({ expense }: { expense: Expense }) {
  const update = useUpdateExpense();
  const remove = useDeleteExpense();
  const confirm = useConfirm();
  const toast = useToast();
  const [amount, setAmount] = useState(toMoneyInput(expense.amount));
  const [category, setCategory] = useState<ExpenseCategory>(expense.category);
  const [date, setDate] = useState(expense.date);
  const [note, setNote] = useState(expense.note);
  const [error, setError] = useState<string>();

  const save = () => {
    const minor = parseMoneyInput(amount);
    if (minor === null) return setError('Enter an amount like 250 or 99.50');
    update.mutate(
      { id: expense.id, input: { amount: minor, category, date, note: note.trim() } },
      {
        onSuccess: () => {
          toast.success('Expense updated');
          goBack();
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );
  };

  const destroy = async () => {
    if (!(await confirm({ title: 'Delete this expense?', message: 'Your monthly totals will update.', confirmLabel: 'Delete', destructive: true }))) return;
    remove.mutate(expense.id, {
      onSuccess: () => toast.success('Expense deleted'),
      onError: (err) => toast.error(errorMessage(err)),
    });
    goBack();
  };

  return (
    <EditorScaffold
      title="Edit expense"
      headerRight={<IconButton icon="trash-2" label="Delete expense" tone="dangerText" onPress={destroy} />}
      footer={<Button label="Save changes" size="lg" fullWidth onPress={save} loading={update.isPending} />}>
      <AmountInput value={amount} onChangeText={setAmount} error={error} />
      {expense.bill ? (
        <Text variant="caption" tone="textSecondary" align="center">
          Logged from a bill payment.
        </Text>
      ) : null}
      <FormSection label="Category" icon="tag">
        <ChipGroup<ExpenseCategory> options={categoryOptions} value={category} onChange={setCategory} />
      </FormSection>
      <FormSection label={`Date · ${formatLongDate(date)}`} icon="calendar">
        <Calendar value={date} onChange={setDate} />
      </FormSection>
      <FormSection label="Note" icon="edit-3">
        <TextField value={note} onChangeText={setNote} placeholder="What was it for?" maxLength={200} />
      </FormSection>
    </EditorScaffold>
  );
}
