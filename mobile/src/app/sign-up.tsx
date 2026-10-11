import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { View, type TextInput } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { AuthLayout, FooterLink, FormError } from '@/features/auth/auth-form';
import { toApiError } from '@/services/api/errors';
import { useAuth } from '@/store/auth';
import { makeStyles, useTheme } from '@/theme';
import { passwordStrength, validateEmail, validateName, validateNewPassword } from '@/utils/validation';

const STRENGTH_LABEL = ['', 'Too weak', 'Good', 'Strong'] as const;

export default function SignUpScreen() {
  const register = useAuth((s) => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    const next = { name: validateName(name), email: validateEmail(email), password: validateNewPassword(password) };
    setErrors(next);
    setFormError(null);
    if (next.name || next.email || next.password) return;
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.kind === 'conflict') setErrors({ email: apiErr.message });
      else setFormError(apiErr.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="One account keeps your day in sync across devices."
      footer={<FooterLink prompt="Already have an account?" action="Sign in" onPress={() => router.replace('/sign-in')} />}>
      <FormError message={formError} />
      <TextField
        label="Your name"
        icon="user"
        value={name}
        onChangeText={setName}
        error={errors.name}
        placeholder="What should we call you?"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        testID="sign-up-name"
      />
      <TextField
        ref={emailRef}
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
        testID="sign-up-email"
      />
      <View>
        <TextField
          ref={passwordRef}
          label="Password"
          icon="lock"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          helper="At least 8 characters, with a letter and a number."
          placeholder="Create a password"
          secureToggle
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
          testID="sign-up-password"
        />
        {password ? <StrengthMeter score={passwordStrength(password)} /> : null}
      </View>
      <Button label="Create account" size="lg" fullWidth loading={submitting} onPress={submit} testID="sign-up-submit" />
    </AuthLayout>
  );
}

function StrengthMeter({ score }: { score: 0 | 1 | 2 | 3 }) {
  const t = useTheme();
  const styles = useStyles();
  const color = score <= 1 ? t.colors.warning : t.colors.success;
  return (
    <View style={styles.meter} accessibilityLabel={`Password strength: ${STRENGTH_LABEL[score]}`}>
      <View style={styles.bars}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i <= score ? color : t.colors.track }]} />
        ))}
      </View>
      <Text variant="label" tone={score <= 1 ? 'warningText' : 'successText'}>
        {STRENGTH_LABEL[score]}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  meter: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, marginTop: t.space.sm, marginLeft: t.space.xxs },
  bars: { flexDirection: 'row', gap: t.space.xs, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
}));
