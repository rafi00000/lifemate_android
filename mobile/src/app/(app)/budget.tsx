import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { SkeletonList } from '@/components/feedback/skeleton';
import { ErrorState } from '@/components/feedback/states';
import { useToast } from '@/components/feedback/toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/misc';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { CATEGORY_META } from '@/constants/categories';
import { EditorScaffold } from '@/features/forms/editor-scaffold';
import { FormSection } from '@/features/forms/form-section';
import { useBudget, useSaveBudget } from '@/features/money/api';
import { errorMessage } from '@/services/api/errors';
import { makeStyles } from '@/theme';
import { EXPENSE_CATEGORIES, type BudgetPlan, type ExpenseCategory } from '@/types/api';
import { formatMonth, monthKey, todayString } from '@/utils/date';
import { CURRENCY_SYMBOL, formatMoney, parseMoneyInput, toMoneyInput } from '@/utils/money';
import { goBack } from '@/utils/navigation';

type Limits = Partial<Record<ExpenseCategory, string>>;

export default function BudgetScreen() {
  const { month = monthKey(todayString()) } = useLocalSearchParams<{ month?: string }>();
  const budget = useBudget(month);
  if (!budget.data) {
    return (
      <EditorScaffold title={`Budget · ${formatMonth(month, true)}`} footer={null}>
        {budget.isError ? <ErrorState message={errorMessage(budget.error)} onRetry={() => void budget.refetch()} /> : <SkeletonList count={5} />}
      </EditorScaffold>
    );
  }
  return <BudgetForm month={month} plan={budget.data} />;
}

function BudgetForm({ month, plan }: { month: string; plan: BudgetPlan }) {
  const styles = useStyles();
  const toast = useToast();
  const save = useSaveBudget(month);

  const [overall, setOverall] = useState(plan.overall ? toMoneyInput(plan.overall) : '');
  const [limits, setLimits] = useState<Limits>(() => Object.fromEntries(plan.categories.map((c) => [c.category, toMoneyInput(c.limit)])));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryTotal = Object.values(limits).reduce((sum, v) => sum + (v ? (parseMoneyInput(v) ?? 0) : 0), 0);
  const overallMinor = overall ? parseMoneyInput(overall) : null;

  const submit = () => {
    const next: Record<string, string> = {};
    if (overall && overallMinor === null) next.overall = 'Enter an amount like 20000';
    const categories: { category: ExpenseCategory; limit: number }[] = [];
    for (const [category, value] of Object.entries(limits) as [ExpenseCategory, string | undefined][]) {
      if (value === undefined) continue;
      const minor = parseMoneyInput(value);
      if (minor === null) next[category] = 'Enter an amount';
      else categories.push({ category, limit: minor });
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate(
      { overall: overallMinor, categories },
      {
        onSuccess: () => {
          toast.success(`Budget saved for ${formatMonth(month)}`);
          goBack();
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  const toggleCategory = (c: ExpenseCategory, on: boolean) =>
    setLimits((l) => {
      const copy = { ...l };
      if (on) copy[c] = '';
      else delete copy[c];
      return copy;
    });

  return (
    <EditorScaffold title={`Budget · ${formatMonth(month, true)}`} footer={<Button label="Save budget" size="lg" fullWidth onPress={submit} loading={save.isPending} />}>
      <>
          <Text variant="body" tone="textSecondary" style={styles.intro}>
            Set what you’d like to spend this month. Your budget carries forward to later months until you change it.
          </Text>
          {plan.inherited && plan.sourceMonth ? (
            <Card tone="muted" style={styles.note}>
              <Text variant="caption" tone="textSecondary">
                Currently using your {formatMonth(plan.sourceMonth)} budget. Saving creates one for {formatMonth(month)}.
              </Text>
            </Card>
          ) : null}

          <FormSection label="Monthly budget" icon="target" hint="Leave empty for no overall limit.">
            <TextField
              value={overall}
              onChangeText={(v) => setOverall(v.replace(/[^0-9.,]/g, ''))}
              placeholder="e.g. 25000"
              keyboardType="decimal-pad"
              error={errors.overall}
              trailing={<Text variant="bodyMedium" tone="textTertiary" style={styles.unit}>{CURRENCY_SYMBOL}</Text>}
              accessibilityLabel="Monthly budget in taka"
              testID="budget-overall"
            />
          </FormSection>

          <FormSection
            label="Category limits"
            icon="layers"
            hint={
              categoryTotal > 0
                ? `Category limits add up to ${formatMoney(categoryTotal)}${overallMinor && categoryTotal > overallMinor ? ', more than the monthly budget' : ''}.`
                : 'Optional. Turn on the categories you want to keep an eye on.'
            }>
            <Card padded={false}>
              {EXPENSE_CATEGORIES.map((c, i) => {
                const meta = CATEGORY_META[c];
                const on = limits[c] !== undefined;
                return (
                  <View key={c} style={[styles.catRow, i > 0 && styles.catBorder]}>
                    <View style={styles.catTop}>
                      <IconBadge icon={meta.icon} color={meta.color} size={34} />
                      <Text variant="bodyMedium" style={styles.flex}>
                        {meta.label}
                      </Text>
                      <Switch value={on} onValueChange={(v) => toggleCategory(c, v)} accessibilityLabel={`Limit for ${meta.label}`} />
                    </View>
                    {on ? (
                      <TextField
                        value={limits[c] ?? ''}
                        onChangeText={(v) => setLimits((l) => ({ ...l, [c]: v.replace(/[^0-9.,]/g, '') }))}
                        placeholder="Limit"
                        keyboardType="decimal-pad"
                        error={errors[c]}
                        trailing={<Text variant="bodyMedium" tone="textTertiary" style={styles.unit}>{CURRENCY_SYMBOL}</Text>}
                        accessibilityLabel={`${meta.label} limit in taka`}
                      />
                    ) : null}
                  </View>
                );
              })}
            </Card>
          </FormSection>
      </>
    </EditorScaffold>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  intro: { marginTop: t.space.sm },
  note: { marginTop: t.space.lg, padding: t.space.md },
  unit: { paddingHorizontal: t.space.md },
  catRow: { padding: t.space.md, gap: t.space.md },
  catBorder: { borderTopWidth: 1, borderTopColor: t.colors.border },
  catTop: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
}));
