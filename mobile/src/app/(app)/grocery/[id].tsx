import { useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConfirm } from '@/components/feedback/dialog';
import { SkeletonList } from '@/components/feedback/skeleton';
import { EmptyState, ErrorState } from '@/components/feedback/states';
import { useToast } from '@/components/feedback/toast';
import { StackHeader } from '@/components/layout/headers';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { Divider } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import {
  useAddItem,
  useClearPurchased,
  useDeleteItem,
  useDeleteList,
  useGroceryList,
  useRenameList,
  useToggleItem,
  useUpdateItem,
} from '@/features/groceries/api';
import { ItemRow } from '@/features/groceries/item-row';
import { ItemSheet } from '@/features/groceries/item-sheet';
import { parseQuickItem } from '@/features/groceries/parse-item';
import { ShareSheet } from '@/features/groceries/share-sheet';
import { errorMessage } from '@/services/api/errors';
import { makeStyles, useTheme } from '@/theme';
import type { GroceryItem } from '@/types/api';
import { goBack } from '@/utils/navigation';

export default function GroceryListScreen() {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const list = useGroceryList(id);
  const add = useAddItem(id);
  const toggle = useToggleItem(id);
  const updateItem = useUpdateItem(id);
  const deleteItem = useDeleteItem(id);
  const clear = useClearPurchased(id);
  const rename = useRenameList(id);
  const deleteList = useDeleteList();
  const confirm = useConfirm();
  const toast = useToast();

  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<GroceryItem | null>(null);
  const [menu, setMenu] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const items = useMemo(() => list.data?.items ?? [], [list.data]);
  const pending = useMemo(() => items.filter((i) => !i.purchased), [items]);
  const bought = useMemo(() => items.filter((i) => i.purchased), [items]);

  const onError = (err: unknown) => toast.error(errorMessage(err));

  const submit = () => {
    if (!draft.trim()) return;
    add.mutate(parseQuickItem(draft), { onError });
    setDraft('');
    // Keep the keyboard up for the next item: shopping lists are typed in bursts.
    inputRef.current?.focus();
  };

  const removeItem = (item: GroceryItem) => {
    setEditing(null);
    deleteItem.mutate(item.id, {
      onSuccess: () =>
        toast.success(`${item.name} removed`, {
          label: 'Undo',
          onPress: () => add.mutate({ name: item.name, quantity: item.quantity, unit: item.unit }, { onError }),
        }),
      onError,
    });
  };

  const destroyList = async () => {
    setMenu(false);
    if (!(await confirm({ title: `Delete “${list.data?.name}”?`, message: 'All items will be deleted for everyone it’s shared with.', confirmLabel: 'Delete', destructive: true }))) return;
    deleteList.mutate(id, { onSuccess: () => toast.success('List deleted'), onError });
    goBack();
  };

  if (list.isError && !list.data) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StackHeader title="List" />
        <ErrorState message={errorMessage(list.error)} onRetry={() => void list.refetch()} />
      </View>
    );
  }

  const data = list.data;
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top }}>
        <StackHeader
          title={data?.name ?? 'List'}
          right={
            data ? (
              <>
                <IconButton icon={data.members.length || !data.isOwner ? 'users' : 'user-plus'} label="Share list" onPress={() => setSharing(true)} />
                <IconButton
                  icon="more-vertical"
                  label="List options"
                  onPress={() => {
                    setNewName(data.name);
                    setMenu(true);
                  }}
                />
              </>
            ) : null
          }
        />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled">
        {!data ? (
          <SkeletonList count={6} />
        ) : (
          <>
            {items.length > 0 ? (
              <View style={styles.progressRow}>
                <ProgressBar value={bought.length / items.length} color={pending.length === 0 ? t.colors.success : t.colors.primary} style={styles.flex} />
                <Text variant="label" tone="textSecondary">
                  {bought.length}/{items.length}
                </Text>
              </View>
            ) : null}

            {pending.length === 0 && bought.length === 0 ? (
              <EmptyState icon="shopping-cart" title="This list is empty" message="Type items below. Try “2 kg rice” or “eggs x12”." compact />
            ) : pending.length === 0 ? (
              <EmptyState icon="check" title="All bought" message="Nice. Clear the cart when you’re home." compact />
            ) : (
              <Card padded={false}>
                <View style={styles.inner}>
                  {pending.map((item, i) => (
                    <View key={item.id}>
                      {i > 0 ? <Divider inset={38} /> : null}
                      <ItemRow item={item} onToggle={(it) => toggle.mutate({ id: it.id, purchased: true }, { onError })} onPress={setEditing} />
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {bought.length > 0 ? (
              <>
                <View style={styles.cartHeader}>
                  <Text variant="overline" tone="textSecondary">
                    In the cart · {bought.length}
                  </Text>
                  <Pressable onPress={() => clear.mutate(undefined, { onError })} hitSlop={12} accessibilityRole="button" accessibilityLabel="Clear bought items">
                    <Text variant="label" tone="primary">
                      Clear
                    </Text>
                  </Pressable>
                </View>
                <Card padded={false} tone="muted">
                  <View style={styles.inner}>
                    {bought.map((item, i) => (
                      <View key={item.id}>
                        {i > 0 ? <Divider inset={38} /> : null}
                        <ItemRow item={item} onToggle={(it) => toggle.mutate({ id: it.id, purchased: false }, { onError })} onPress={setEditing} />
                      </View>
                    ))}
                  </View>
                </Card>
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      {data ? (
        <View style={[styles.addBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.flex}>
            <TextField
              ref={inputRef}
              value={draft}
              onChangeText={setDraft}
              placeholder="Add item, e.g. 2 kg rice"
              icon="plus"
              returnKeyType="done"
              blurOnSubmit={false}
              onSubmitEditing={submit}
              maxLength={100}
              accessibilityLabel="New item"
              testID="grocery-add-input"
            />
          </View>
          <IconButton icon="arrow-up" label="Add item" variant="filled" size={48} onPress={submit} disabled={!draft.trim()} testID="grocery-add-submit" />
        </View>
      ) : null}

      <ItemSheet
        item={editing}
        onClose={() => setEditing(null)}
        onDelete={() => editing && removeItem(editing)}
        onSave={(input) => {
          if (editing) updateItem.mutate({ id: editing.id, input }, { onError });
          setEditing(null);
        }}
      />
      {data ? <ShareSheet list={data} visible={sharing} onClose={() => setSharing(false)} onLeft={() => goBack()} /> : null}
      <BottomSheet visible={menu} onClose={() => setMenu(false)} title="List options">
        <View style={styles.menu}>
          <TextField label="Name" value={newName} onChangeText={setNewName} maxLength={60} />
          <Button
            label="Rename"
            variant="secondary"
            loading={rename.isPending}
            onPress={() => {
              if (!newName.trim()) return;
              rename.mutate(newName.trim(), { onSuccess: () => setMenu(false), onError });
            }}
          />
          {data?.isOwner ? <Button label="Delete list" variant="ghost" icon="trash-2" onPress={destroyList} /> : null}
        </View>
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: t.gutter, paddingTop: t.space.sm, maxWidth: 640, width: '100%', alignSelf: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, marginBottom: t.space.lg },
  inner: { paddingHorizontal: t.space.lg },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: t.space.xxl, marginBottom: t.space.sm, paddingHorizontal: t.space.xs },
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.sm,
    paddingHorizontal: t.gutter,
    paddingTop: t.space.md,
    backgroundColor: t.colors.background,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  menu: { gap: t.space.md, paddingBottom: t.space.xs },
}));
