import { useState } from 'react';
import { View } from 'react-native';
import { useConfirm } from '@/components/feedback/dialog';
import { useToast } from '@/components/feedback/toast';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Avatar, Pill } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { errorMessage } from '@/services/api/errors';
import { useAuth } from '@/store/auth';
import { makeStyles } from '@/theme';
import type { GroceryListDetail, Person } from '@/types/api';
import { validateEmail } from '@/utils/validation';
import { useRemoveMember, useShareList } from './api';

interface ShareSheetProps {
  list: GroceryListDetail;
  visible: boolean;
  onClose: () => void;
  onLeft: () => void;
}

/** Share a list with other LifeMate users by email (owner), or leave it (member). */
export function ShareSheet({ list, visible, onClose, onLeft }: ShareSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Share list">
      <SharePanel list={list} onClose={onClose} onLeft={onLeft} />
    </BottomSheet>
  );
}

function SharePanel({ list, onClose, onLeft }: Omit<ShareSheetProps, 'visible'>) {
  const styles = useStyles();
  const me = useAuth((s) => s.user);
  const share = useShareList(list.id);
  const removeMember = useRemoveMember(list.id);
  const confirm = useConfirm();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();

  const invite = () => {
    const problem = validateEmail(email);
    if (problem) return setError(problem);
    share.mutate(email.trim().toLowerCase(), {
      onSuccess: () => {
        setEmail('');
        setError(undefined);
        toast.success('List shared');
      },
      onError: (err) => setError(errorMessage(err)),
    });
  };

  const remove = async (person: Person) => {
    const leaving = person.id === me?.id;
    const ok = await confirm({
      title: leaving ? 'Leave this list?' : `Remove ${person.name}?`,
      message: leaving ? 'You won’t see it anymore unless the owner shares it again.' : 'They will no longer see or edit this list.',
      confirmLabel: leaving ? 'Leave' : 'Remove',
      destructive: true,
    });
    if (!ok) return;
    removeMember.mutate(person.id, {
      onSuccess: () => {
        if (leaving) {
          onClose();
          onLeft();
        } else toast.success(`${person.name} removed`);
      },
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  const people: (Person & { role: 'Owner' | 'Member' })[] = [
    { ...list.owner, role: 'Owner' },
    ...list.members.map((m) => ({ ...m, role: 'Member' as const })),
  ];

  return (
    <View style={styles.body}>
        <Text variant="callout" tone="textSecondary">
          Everyone here can add and tick items. Changes appear on their phones within seconds of opening the list.
        </Text>
        {people.map((p) => (
          <View key={p.id} style={styles.person}>
            <Avatar name={p.name} size={36} />
            <View style={styles.flex}>
              <Text variant="bodyMedium">
                {p.name}
                {p.id === me?.id ? ' (you)' : ''}
              </Text>
              <Text variant="caption" tone="textSecondary" numberOfLines={1}>
                {p.email}
              </Text>
            </View>
            {p.role === 'Owner' ? (
              <Pill label="Owner" tone="primary" />
            ) : list.isOwner || p.id === me?.id ? (
              <IconButton icon={p.id === me?.id ? 'log-out' : 'user-x'} label={p.id === me?.id ? 'Leave list' : `Remove ${p.name}`} tone="textSecondary" onPress={() => remove(p)} />
            ) : null}
          </View>
        ))}
        {list.isOwner ? (
          <View style={styles.invite}>
            <TextField
              label="Invite by email"
              value={email}
              onChangeText={setEmail}
              placeholder="their LifeMate email"
              autoCapitalize="none"
              keyboardType="email-address"
              error={error}
              helper="They need a LifeMate account."
              returnKeyType="send"
              onSubmitEditing={invite}
            />
            <Button label="Share" icon="user-plus" onPress={invite} loading={share.isPending} fullWidth />
          </View>
        ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.space.lg, paddingBottom: t.space.xs },
  flex: { flex: 1 },
  person: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  invite: { gap: t.space.md, marginTop: t.space.xs },
}));
