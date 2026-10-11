import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { useConfirm } from '@/components/feedback/dialog';
import { useToast } from '@/components/feedback/toast';
import { StackHeader } from '@/components/layout/headers';
import { Screen } from '@/components/layout/screen';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { Avatar, Divider, Pill } from '@/components/ui/misc';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useChangePassword, useDeleteAccount, useUpdateName } from '@/features/account/api';
import { API_URL } from '@/services/api/config';
import { errorMessage, toApiError } from '@/services/api/errors';
import { getPermissionState, reminderAvailability, requestPermission, type PermissionState } from '@/services/notifications/reminders';
import { useAuth } from '@/store/auth';
import { usePreferences, type ThemeMode } from '@/store/preferences';
import { makeStyles } from '@/theme';
import { validateName, validateNewPassword } from '@/utils/validation';

type Sheet = 'name' | 'password' | 'delete' | null;

export default function SettingsScreen() {
  const styles = useStyles();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const themeMode = usePreferences((s) => s.themeMode);
  const setThemeMode = usePreferences((s) => s.setThemeMode);
  const confirm = useConfirm();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [permission, setPermission] = useState<PermissionState>('undetermined');

  // Re-check when returning from system settings.
  useFocusEffect(
    useCallback(() => {
      void getPermissionState().then(setPermission);
    }, []),
  );

  const enableNotifications = async () => {
    const state = await requestPermission();
    setPermission(state);
    if (state === 'denied') void Linking.openSettings();
  };

  return (
    <Screen header={<StackHeader title="Settings" />}>
      <Card style={styles.profile}>
        <Avatar name={user?.name ?? '?'} size={56} />
        <View style={styles.flex}>
          <Text variant="headline">{user?.name}</Text>
          <Text variant="callout" tone="textSecondary">
            {user?.email}
          </Text>
        </View>
      </Card>

      <Group title="Account">
        <Row icon="user" label="Name" value={user?.name} onPress={() => setSheet('name')} />
        <Divider inset={52} />
        <Row icon="lock" label="Change password" onPress={() => setSheet('password')} />
      </Group>

      <Group title="Reminders">
        <Row
          icon="bell"
          label="Notifications"
          trailing={
            permission === 'granted' ? (
              <Pill label="On" tone="success" icon="check" />
            ) : permission === 'unsupported' ? (
              <Pill label={reminderAvailability === 'expo-go' ? 'Installed app only' : 'Phone only'} />
            ) : (
              <Button label={permission === 'denied' ? 'Open settings' : 'Turn on'} variant="secondary" onPress={enableNotifications} />
            )
          }
        />
        {reminderAvailability === 'expo-go' ? (
          <Text variant="caption" tone="textSecondary" style={styles.hint}>
            Expo Go can’t show reminders. They work in the installed LifeMate app (APK).
          </Text>
        ) : null}
        {Platform.OS === 'android' && permission === 'granted' ? (
          <Text variant="caption" tone="textSecondary" style={styles.hint}>
            If reminders arrive late, set LifeMate’s battery usage to “Unrestricted” in Android settings.
          </Text>
        ) : null}
      </Group>

      <Group title="Appearance">
        <View style={styles.padded}>
          <SegmentedControl<ThemeMode>
            value={themeMode}
            onChange={setThemeMode}
            accessibilityLabel="Theme"
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </View>
      </Group>

      <Group title="About">
        <Row icon="info" label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
        {__DEV__ ? (
          <>
            <Divider inset={52} />
            <Row icon="server" label="API" value={API_URL.replace(/^https?:\/\//, '')} />
          </>
        ) : null}
      </Group>

      <View style={styles.actions}>
        <Button
          label="Sign out"
          variant="secondary"
          icon="log-out"
          fullWidth
          onPress={async () => {
            if (await confirm({ title: 'Sign out?', message: 'Your data stays safe in your account.', confirmLabel: 'Sign out' })) void signOut();
          }}
          testID="settings-sign-out"
        />
        <Button label="Delete account" variant="ghost" fullWidth onPress={() => setSheet('delete')} />
      </View>

      <NameSheet visible={sheet === 'name'} onClose={() => setSheet(null)} current={user?.name ?? ''} />
      <PasswordSheet visible={sheet === 'password'} onClose={() => setSheet(null)} />
      <DeleteSheet visible={sheet === 'delete'} onClose={() => setSheet(null)} />
    </Screen>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.group}>
      <Text variant="overline" tone="textSecondary" style={styles.groupTitle}>
        {title}
      </Text>
      <Card padded={false}>{children}</Card>
    </View>
  );
}

function Row({ icon, label, value, onPress, trailing }: { icon: IconName; label: string; value?: string; onPress?: () => void; trailing?: ReactNode }) {
  const styles = useStyles();
  const content = (
    <>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={18} tone="primary" />
      </View>
      <Text variant="bodyMedium" style={styles.flex}>
        {label}
      </Text>
      {value ? (
        <Text variant="callout" tone="textSecondary" numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      ) : null}
      {trailing}
      {onPress ? <Icon name="chevron-right" size={18} tone="textTertiary" /> : null}
    </>
  );
  return onPress ? (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={value ? `${label}, ${value}` : label}>
      {content}
    </Pressable>
  ) : (
    <View style={styles.row}>{content}</View>
  );
}

// Sheet bodies are separate components so their state (including typed
// passwords) is discarded whenever the sheet closes.

function NameSheet({ visible, onClose, current }: { visible: boolean; onClose: () => void; current: string }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Your name">
      <NameForm onClose={onClose} current={current} />
    </BottomSheet>
  );
}

function NameForm({ onClose, current }: { onClose: () => void; current: string }) {
  const styles = useStyles();
  const update = useUpdateName();
  const toast = useToast();
  const [name, setName] = useState(current);
  const [error, setError] = useState<string>();
  return (
    <View style={styles.sheet}>
      <TextField value={name} onChangeText={setName} error={error} autoFocus maxLength={60} accessibilityLabel="Name" />
      <Button
        label="Save"
        size="lg"
        fullWidth
        loading={update.isPending}
        onPress={() => {
          const problem = validateName(name);
          if (problem) return setError(problem);
          update.mutate(name.trim(), {
            onSuccess: () => {
              toast.success('Name updated');
              onClose();
            },
            onError: (err) => setError(errorMessage(err)),
          });
        }}
      />
    </View>
  );
}

function PasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Change password">
      <PasswordForm onClose={onClose} />
    </BottomSheet>
  );
}

function PasswordForm({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const change = useChangePassword();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});

  const submit = () => {
    const e = { current: current ? undefined : 'Enter your current password', next: validateNewPassword(next) };
    setErrors(e);
    if (e.current || e.next) return;
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          toast.success('Password changed. Other devices were signed out.');
          onClose();
        },
        onError: (err) => {
          const apiErr = toApiError(err);
          setErrors(apiErr.code === 'INVALID_CREDENTIALS' ? { current: apiErr.message } : { next: apiErr.message });
        },
      },
    );
  };

  return (
    <View style={styles.sheet}>
      <TextField label="Current password" value={current} onChangeText={setCurrent} error={errors.current} secureToggle autoComplete="current-password" />
      <TextField label="New password" value={next} onChangeText={setNext} error={errors.next} secureToggle helper="At least 8 characters, with a letter and a number." autoComplete="new-password" />
      <Button label="Change password" size="lg" fullWidth onPress={submit} loading={change.isPending} />
    </View>
  );
}

function DeleteSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Delete account">
      <DeleteForm />
    </BottomSheet>
  );
}

function DeleteForm() {
  const styles = useStyles();
  const remove = useDeleteAccount();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  return (
    <View style={styles.sheet}>
      <Text variant="body" tone="textSecondary">
        This permanently deletes your account and all your tasks, expenses, budgets, bills, lists and notes. It can’t be undone.
      </Text>
      <TextField label="Confirm with your password" value={password} onChangeText={setPassword} error={error} secureToggle />
      <Button
        label="Delete my account"
        variant="danger"
        size="lg"
        fullWidth
        loading={remove.isPending}
        onPress={() => {
          if (!password) return setError('Enter your password');
          remove.mutate(password, { onError: (err) => setError(errorMessage(err)) });
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: t.space.lg, marginTop: t.space.sm },
  group: { marginTop: t.space.xxl },
  groupTitle: { marginBottom: t.space.sm, marginLeft: t.space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingHorizontal: t.space.lg, paddingVertical: t.space.md, minHeight: 56 },
  rowIcon: { width: 28, alignItems: 'center' },
  value: { maxWidth: '50%' },
  padded: { padding: t.space.md },
  hint: { paddingHorizontal: t.space.lg, paddingBottom: t.space.md },
  actions: { marginTop: t.space.xxxl, gap: t.space.sm },
  sheet: { gap: t.space.lg, paddingBottom: t.space.xs },
}));
