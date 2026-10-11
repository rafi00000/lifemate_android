import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useConfirm } from '@/components/feedback/dialog';
import { SkeletonList } from '@/components/feedback/skeleton';
import { ErrorState } from '@/components/feedback/states';
import { useToast } from '@/components/feedback/toast';
import { AmountInput } from '@/components/ui/amount-input';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { Calendar } from '@/components/ui/date-picker';
import { IconButton } from '@/components/ui/icon-button';
import { TextField } from '@/components/ui/text-field';
import { categoryOptions } from '@/constants/categories';
import { useBill, useDeleteBill, useSaveBill } from '@/features/bills/api';
import { EditorScaffold } from '@/features/forms/editor-scaffold';
import { FormSection } from '@/features/forms/form-section';
import { useEnsureNotificationPermission } from '@/features/reminders/use-ensure-permission';
import { errorMessage, toApiError } from '@/services/api/errors';
import type { Bill, BillRecurrence, ExpenseCategory } from '@/types/api';
import { formatLongDate, todayString } from '@/utils/date';
import { parseMoneyInput, toMoneyInput } from '@/utils/money';
import { validateRequired } from '@/utils/validation';
import { goBack } from '@/utils/navigation';

const REMINDER_DAYS = [
  { value: '0', label: 'On the day' },
  { value: '1', label: '1 day before' },
  { value: '3', label: '3 days before' },
  { value: '7', label: '1 week before' },
];

export default function BillEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useBill(id);
  if (id && !existing.data) {
    return (
      <EditorScaffold title="Bill" footer={null}>
        {existing.isError ? <ErrorState message={errorMessage(existing.error)} onRetry={() => void existing.refetch()} /> : <SkeletonList count={4} />}
      </EditorScaffold>
    );
  }
  return <BillForm bill={existing.data} />;
}

function BillForm({ bill }: { bill?: Bill }) {
  const editing = !!bill;
  const save = useSaveBill();
  const remove = useDeleteBill();
  const confirm = useConfirm();
  const toast = useToast();
  const ensurePermission = useEnsureNotificationPermission();

  const [name, setName] = useState(bill?.name ?? '');
  const [amount, setAmount] = useState(bill ? toMoneyInput(bill.amount) : '');
  const [category, setCategory] = useState<ExpenseCategory>(bill?.category ?? 'bills');
  const [dueDate, setDueDate] = useState(bill?.dueDate ?? todayString());
  const [recurrence, setRecurrence] = useState<BillRecurrence>(bill?.recurrence ?? 'monthly');
  const [reminderDays, setReminderDays] = useState(bill?.reminderDaysBefore ?? 1);
  const [notes, setNotes] = useState(bill?.notes ?? '');
  const [errors, setErrors] = useState<{ name?: string; amount?: string; form?: string }>({});

  const submit = async () => {
    const minor = parseMoneyInput(amount);
    const next = {
      name: validateRequired(name, 'Name', 100),
      amount: minor === null ? 'Enter the amount, e.g. 1200' : undefined,
    };
    setErrors(next);
    if (next.name || next.amount || minor === null) return;
    try {
      await save.mutateAsync({
        id: bill?.id,
        input: { name: name.trim(), amount: minor, category, dueDate, recurrence, reminderDaysBefore: reminderDays, notes: notes.trim() },
      });
      await ensurePermission();
      toast.success(editing ? 'Bill updated' : 'Bill added');
      goBack();
    } catch (err) {
      setErrors({ form: toApiError(err).message });
    }
  };

  const destroy = async () => {
    if (!bill) return;
    if (!(await confirm({ title: `Delete ${bill.name}?`, message: 'Its reminders will be removed too. Past expenses stay.', confirmLabel: 'Delete', destructive: true }))) return;
    remove.mutate(bill.id, { onSuccess: () => toast.success('Bill deleted'), onError: (err) => toast.error(errorMessage(err)) });
    goBack();
  };

  return (
    <EditorScaffold
      title={editing ? 'Edit bill' : 'New bill'}
      headerRight={editing ? <IconButton icon="trash-2" label="Delete bill" tone="dangerText" onPress={destroy} /> : null}
      footer={<Button label={editing ? 'Save changes' : 'Add bill'} size="lg" fullWidth onPress={submit} loading={save.isPending} testID="bill-save" />}>
      <AmountInput value={amount} onChangeText={setAmount} error={errors.amount ?? errors.form} autoFocus={!editing} />
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        error={errors.name}
        placeholder="e.g. Internet (Link3), Rent, Netflix"
        maxLength={100}
        testID="bill-name"
      />
      <FormSection label="Repeats" icon="repeat">
        <ChipGroup<BillRecurrence>
          value={recurrence}
          onChange={setRecurrence}
          options={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'yearly', label: 'Yearly' },
            { value: 'none', label: 'One-time' },
          ]}
        />
      </FormSection>
      <FormSection
        label={`${recurrence === 'none' ? 'Due' : 'Next due'} · ${formatLongDate(dueDate)}`}
        icon="calendar"
        hint={recurrence === 'monthly' && Number(dueDate.slice(8)) > 28 ? 'In shorter months it falls on the last day.' : undefined}>
        <Calendar value={dueDate} onChange={setDueDate} />
      </FormSection>
      <FormSection label="Remind me" icon="bell" hint="Reminders arrive at 9:00 AM.">
        <ChipGroup scroll value={String(reminderDays)} onChange={(v) => setReminderDays(Number(v))} options={REMINDER_DAYS} />
      </FormSection>
      <FormSection label="Category" icon="tag">
        <ChipGroup<ExpenseCategory> options={categoryOptions} value={category} onChange={setCategory} />
      </FormSection>
      <FormSection label="Notes" icon="align-left">
        <TextField value={notes} onChangeText={setNotes} placeholder="Where or how you pay it (optional)" multiline maxLength={500} />
      </FormSection>
    </EditorScaffold>
  );
}
