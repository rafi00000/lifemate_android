import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Skeleton } from '@/components/feedback/skeleton';
import { EmptyState, ErrorState } from '@/components/feedback/states';
import { PageTitle } from '@/components/layout/headers';
import { Screen } from '@/components/layout/screen';
import { Card } from '@/components/ui/card';
import { Fab } from '@/components/ui/fab';
import { Icon } from '@/components/ui/icon';
import { Avatar, Pill } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/progress';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { useGroceryLists } from '@/features/groceries/api';
import { NewListSheet } from '@/features/groceries/new-list-sheet';
import { useNotes } from '@/features/notes/api';
import { errorMessage } from '@/services/api/errors';
import { enterCard, makeStyles, useTheme } from '@/theme';
import type { GroceryListSummary, Note } from '@/types/api';

type Tab = 'groceries' | 'notes';

export default function ListsScreen() {
  const styles = useStyles();
  const [tab, setTab] = useState<Tab>('groceries');
  const [creating, setCreating] = useState(false);
  const lists = useGroceryLists();
  const notes = useNotes();

  return (
    <>
      <Screen withTabBar withFab onRefresh={() => Promise.all([lists.refetch(), notes.refetch()])}>
        <PageTitle title="Lists" subtitle="Shopping and quick notes" />
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          accessibilityLabel="Lists section"
          options={[
            { value: 'groceries', label: 'Groceries', count: lists.data?.reduce((n, l) => n + l.pendingItems, 0) },
            { value: 'notes', label: 'Notes', count: notes.data?.length },
          ]}
        />
        <View style={styles.content}>{tab === 'groceries' ? <GroceryLists query={lists} onCreate={() => setCreating(true)} /> : <Notes query={notes} />}</View>
      </Screen>
      <Fab
        label={tab === 'groceries' ? 'New list' : 'New note'}
        onPress={() => (tab === 'groceries' ? setCreating(true) : router.push('/note-editor'))}
        testID="lists-fab"
      />
      <NewListSheet visible={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function GroceryLists({ query, onCreate }: { query: ReturnType<typeof useGroceryLists>; onCreate: () => void }) {
  const styles = useStyles();
  if (query.isPending) return <ListSkeleton />;
  if (query.isError) return <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />;
  if (query.data.length === 0) {
    return (
      <EmptyState
        icon="shopping-cart"
        title="No grocery lists yet"
        message="Make a list for the weekly bazar and tick items off as you shop. You can share it with family or flatmates."
        actionLabel="Create a list"
        onAction={onCreate}
      />
    );
  }
  return (
    <View style={styles.stack}>
      {query.data.map((list, i) => (
        <Animated.View key={list.id} entering={enterCard(i)}>
          <ListCard list={list} />
        </Animated.View>
      ))}
    </View>
  );
}

function ListCard({ list }: { list: GroceryListSummary }) {
  const t = useTheme();
  const styles = useStyles();
  const bought = list.totalItems - list.pendingItems;
  const shared = list.members.length > 0 || !list.isOwner;
  const people = list.isOwner ? list.members : [list.owner, ...list.members.filter((m) => m.id !== list.owner.id)];

  return (
    <Card
      onPress={() => router.push({ pathname: '/grocery/[id]', params: { id: list.id } })}
      accessibilityLabel={`${list.name}, ${list.pendingItems} of ${list.totalItems} items left${shared ? ', shared' : ''}`}
      testID={`grocery-list-${list.id}`}>
      <View style={styles.listTop}>
        <View style={styles.listIcon}>
          <Icon name="shopping-bag" size={18} tone="primary" />
        </View>
        <View style={styles.flex}>
          <Text variant="cardTitle" numberOfLines={1}>
            {list.name}
          </Text>
          <Text variant="caption" tone="textSecondary">
            {list.totalItems === 0
              ? 'Empty list'
              : list.pendingItems === 0
                ? 'Everything bought'
                : `${list.pendingItems} to buy · ${bought} in cart`}
          </Text>
        </View>
        {shared ? (
          <View style={styles.avatars}>
            {people.slice(0, 3).map((p, i) => (
              <View key={p.id} style={[styles.avatarRing, i > 0 && styles.avatarOverlap]}>
                <Avatar name={p.name} size={26} />
              </View>
            ))}
          </View>
        ) : null}
        <Icon name="chevron-right" size={18} tone="textTertiary" />
      </View>
      {list.totalItems > 0 ? (
        <ProgressBar value={bought / list.totalItems} height={6} color={list.pendingItems === 0 ? t.colors.success : t.colors.primary} style={styles.listProgress} />
      ) : null}
      {!list.isOwner ? <Pill label={`Shared by ${list.owner.name}`} tone="primary" icon="users" style={styles.sharedPill} /> : null}
    </Card>
  );
}

function Notes({ query }: { query: ReturnType<typeof useNotes> }) {
  const styles = useStyles();
  if (query.isPending) return <ListSkeleton />;
  if (query.isError) return <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />;
  if (query.data.length === 0) {
    return (
      <EmptyState
        icon="edit-3"
        title="No notes yet"
        message="Jot down ideas, plans or quick checklists."
        actionLabel="Write a note"
        onAction={() => router.push('/note-editor')}
      />
    );
  }
  return (
    <View style={styles.stack}>
      {query.data.map((note, i) => (
        <Animated.View key={note.id} entering={enterCard(i)}>
          <NoteCard note={note} />
        </Animated.View>
      ))}
    </View>
  );
}

function NoteCard({ note }: { note: Note }) {
  const styles = useStyles();
  const done = note.checklist.filter((c) => c.done).length;
  const title = note.title || note.body.split('\n')[0] || 'Checklist';
  return (
    <Card onPress={() => router.push({ pathname: '/note-editor', params: { id: note.id } })} accessibilityLabel={`Note: ${title}`}>
      <View style={styles.noteTop}>
        <Text variant="cardTitle" numberOfLines={1} style={styles.flex}>
          {title}
        </Text>
        {note.pinned ? <Icon name="bookmark" size={16} tone="accentText" /> : null}
      </View>
      {note.body && note.title ? (
        <Text variant="callout" tone="textSecondary" numberOfLines={2} style={styles.noteBody}>
          {note.body}
        </Text>
      ) : null}
      {note.checklist.length > 0 ? (
        <View style={styles.noteChecklist}>
          {note.checklist.slice(0, 3).map((c, i) => (
            <View key={c.id ?? i} style={styles.checkLine}>
              <Icon name={c.done ? 'check-square' : 'square'} size={14} tone={c.done ? 'success' : 'textTertiary'} />
              <Text variant="caption" tone={c.done ? 'textTertiary' : 'textSecondary'} numberOfLines={1} style={c.done && styles.strike}>
                {c.text}
              </Text>
            </View>
          ))}
          <Text variant="label" tone="textTertiary">
            {done}/{note.checklist.length} done
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function ListSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.stack}>
      <Skeleton height={92} radius={20} />
      <Skeleton height={92} radius={20} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  content: { marginTop: t.space.xl },
  stack: { gap: t.space.md },
  listTop: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  listIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  listProgress: { marginTop: t.space.lg },
  avatars: { flexDirection: 'row' },
  avatarRing: { borderRadius: 15, borderWidth: 2, borderColor: t.colors.surface },
  avatarOverlap: { marginLeft: -10 },
  sharedPill: { marginTop: t.space.md },
  noteTop: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
  noteBody: { marginTop: t.space.xs },
  noteChecklist: { marginTop: t.space.md, gap: t.space.xs + 2 },
  checkLine: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
  strike: { textDecorationLine: 'line-through' },
}));
