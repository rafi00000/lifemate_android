import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useConfirm } from '@/components/feedback/dialog';
import { SkeletonList } from '@/components/feedback/skeleton';
import { ErrorState } from '@/components/feedback/states';
import { useToast } from '@/components/feedback/toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { EditorScaffold } from '@/features/forms/editor-scaffold';
import { useDeleteNote, useNote, useSaveNote } from '@/features/notes/api';
import { errorMessage } from '@/services/api/errors';
import { enterFade, exitFade, layoutTransition, makeStyles, MAX_FONT_SCALE, useTheme } from '@/theme';
import type { ChecklistItem, Note } from '@/types/api';
import { goBack } from '@/utils/navigation';

type DraftItem = ChecklistItem & { key: string };
let keySeq = 0;
const withKey = (c: ChecklistItem): DraftItem => ({ ...c, key: c.id ?? `new-${++keySeq}` });

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useNote(id);
  if (id && !existing.data) {
    return (
      <EditorScaffold title="Note" footer={null}>
        {existing.isError ? <ErrorState message={errorMessage(existing.error)} onRetry={() => void existing.refetch()} /> : <SkeletonList count={3} />}
      </EditorScaffold>
    );
  }
  return <NoteForm note={existing.data} />;
}

function NoteForm({ note }: { note?: Note }) {
  const t = useTheme();
  const styles = useStyles();
  const editing = !!note;
  const id = note?.id;
  const save = useSaveNote();
  const remove = useDeleteNote();
  const confirm = useConfirm();
  const toast = useToast();

  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [items, setItems] = useState<DraftItem[]>(() => note?.checklist.map(withKey) ?? []);
  const [error, setError] = useState<string>();

  const cleanItems = items.filter((i) => i.text.trim()).map(({ id: itemId, text, done }) => ({ id: itemId, text: text.trim(), done }));
  const isEmpty = !title.trim() && !body.trim() && cleanItems.length === 0;

  const submit = () => {
    if (isEmpty) return setError('Write something first');
    save.mutate(
      { id, input: { title: title.trim(), body, pinned, checklist: cleanItems } },
      {
        onSuccess: () => {
          toast.success(editing ? 'Note saved' : 'Note added');
          goBack();
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );
  };

  const destroy = async () => {
    if (!id || !(await confirm({ title: 'Delete this note?', confirmLabel: 'Delete', destructive: true }))) return;
    remove.mutate(id, { onSuccess: () => toast.success('Note deleted'), onError: (err) => toast.error(errorMessage(err)) });
    goBack();
  };

  const updateItem = (key: string, patch: Partial<DraftItem>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  return (
    <EditorScaffold
      title={editing ? 'Note' : 'New note'}
      headerRight={
        <>
          <IconButton icon="bookmark" label={pinned ? 'Unpin note' : 'Pin note'} tone={pinned ? 'accentText' : 'textSecondary'} variant={pinned ? 'soft' : 'plain'} onPress={() => setPinned((p) => !p)} />
          {editing ? <IconButton icon="trash-2" label="Delete note" tone="dangerText" onPress={destroy} /> : null}
        </>
      }
      footer={<Button label="Save note" size="lg" fullWidth onPress={submit} loading={save.isPending} />}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor={t.colors.textTertiary}
        maxLength={120}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[t.typography.title, styles.title, { color: t.colors.text }]}
        accessibilityLabel="Note title"
      />
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Start writing…"
        placeholderTextColor={t.colors.textTertiary}
        multiline
        maxLength={10000}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[t.typography.body, styles.body, { color: t.colors.text }]}
        accessibilityLabel="Note text"
      />
      {error ? (
        <Text variant="caption" tone="dangerText">
          {error}
        </Text>
      ) : null}

      <View style={styles.checklist}>
        {items.map((item) => (
          <Animated.View key={item.key} entering={enterFade} exiting={exitFade} layout={layoutTransition} style={styles.itemRow}>
            <Checkbox checked={item.done} onToggle={() => updateItem(item.key, { done: !item.done })} label={`Done: ${item.text || 'item'}`} size={22} />
            <TextInput
              value={item.text}
              onChangeText={(text) => updateItem(item.key, { text })}
              placeholder="List item"
              placeholderTextColor={t.colors.textTertiary}
              maxLength={200}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
              style={[t.typography.body, styles.itemInput, { color: item.done ? t.colors.textTertiary : t.colors.text }, item.done && styles.strike]}
              accessibilityLabel="Checklist item"
              returnKeyType="next"
              onSubmitEditing={() => setItems((l) => [...l, withKey({ text: '', done: false })])}
            />
            <IconButton icon="x" label="Remove item" size={32} tone="textTertiary" onPress={() => setItems((l) => l.filter((i) => i.key !== item.key))} />
          </Animated.View>
        ))}
        {items.length < 100 ? (
          <Pressable
            style={styles.addItem}
            onPress={() => setItems((l) => [...l, withKey({ text: '', done: false })])}
            accessibilityRole="button"
            accessibilityLabel="Add checklist item">
            <Icon name="plus-square" size={20} tone="primary" />
            <Text variant="bodyMedium" tone="primary">
              {items.length ? 'Add item' : 'Add a checklist'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </EditorScaffold>
  );
}

const useStyles = makeStyles((t) => ({
  title: { paddingVertical: t.space.md },
  body: { minHeight: 120, textAlignVertical: 'top', paddingVertical: t.space.sm },
  checklist: { marginTop: t.space.lg, gap: t.space.xs },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  itemInput: { flex: 1, paddingVertical: t.space.sm },
  strike: { textDecorationLine: 'line-through' },
  addItem: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingVertical: t.space.md, minHeight: 48 },
}));
