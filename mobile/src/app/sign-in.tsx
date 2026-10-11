import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { AuthLayout, FooterLink, FormError } from '@/features/auth/auth-form';
import { toApiError } from '@/services/api/errors';
import { useAuth } from '@/store/auth';
import { validateEmail } from '@/utils/validation';

// Seeded demo account (server/src/scripts/seed-data.ts); dev builds only.
const DEMO = { email: 'demo@lifemate.app', password: 'LifeMate2026' };

export default function SignInScreen() {
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    const next = { email: validateEmail(email), password: password ? undefined : 'Enter your password' };
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;
    setSubmitting(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // The root navigator switches to the app once the session exists.
    } catch (err) {
      setFormError(toApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={<FooterLink prompt="New to LifeMate?" action="Create an account" onPress={() => router.replace('/sign-up')} />}>
      <FormError message={formError} />
      <TextField
        label="Email"
        icon="mail"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        testID="sign-in-email"
      />
      <TextField
        ref={passwordRef}
        label="Password"
        icon="lock"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        placeholder="Your password"
        secureToggle
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        testID="sign-in-password"
      />
      <Button label="Sign in" size="lg" fullWidth loading={submitting} onPress={submit} testID="sign-in-submit" />
      {__DEV__ ? (
        <Chip
          label="Fill demo account"
          icon="user"
          style={{ alignSelf: 'center' }}
          onPress={() => {
            setEmail(DEMO.email);
            setPassword(DEMO.password);
          }}
        />
      ) : null}
    </AuthLayout>
  );
}
