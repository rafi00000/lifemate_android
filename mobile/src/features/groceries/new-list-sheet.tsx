import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { errorMessage } from '@/services/api/errors';
import { makeStyles } from '@/theme';
import { validateRequired } from '@/utils/validation';
import { useCreateList } from './api';

const SUGGESTIONS = ['Weekly bazar', 'Monthly groceries', 'Pharmacy', 'Flat essentials'];

export function NewListSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="New list">
      <NewListForm onClose={onClose} />
    </BottomSheet>
  );
}

function NewListForm({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const create = useCreateList();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();

  const submit = () => {
    const problem = validateRequired(name, 'List name', 60);
    setError(problem);
    if (problem) return;
    create.mutate(name.trim(), {
      onSuccess: (list) => {
        onClose();
        router.push({ pathname: '/grocery/[id]', params: { id: list.id } });
      },
      onError: (err) => setError(errorMessage(err)),
    });
  };

  return (
    <View style={styles.body}>
      <TextField value={name} onChangeText={setName} placeholder="List name" error={error} autoFocus returnKeyType="done" onSubmitEditing={submit} maxLength={60} accessibilityLabel="List name" />
      <ChipGroup scroll value={null} onChange={(v) => setName(v)} options={SUGGESTIONS.map((s) => ({ value: s, label: s }))} accessibilityLabel="Suggestions" />
      <Button label="Create list" size="lg" fullWidth onPress={submit} loading={create.isPending} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({ body: { gap: t.space.lg, paddingBottom: t.space.xs } }));
