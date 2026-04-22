import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { signInWithMagicLink } from '@/services/auth';
import { COLORS } from '@/lib/constants';
import { ChevronLeft, Mail, Info } from 'lucide-react-native';
import { useAppColors } from '@/lib/theme';

export default function SignUp() {
  const router = useRouter();
  const colors = useAppColors();
  const [email, setEmail] = useState('');
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);

  const handleMagicLinkSignUp = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    try {
      setIsSendingMagicLink(true);
      await signInWithMagicLink(email);
      router.push({
        pathname: '/(auth)/check-email',
        params: { email },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={16} color={colors.primary} strokeWidth={3} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Start sharing your travel stories
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: colors.primary }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
              ]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary, shadowColor: colors.primary },
              isSendingMagicLink && styles.buttonDisabled,
            ]}
            onPress={handleMagicLinkSignUp}
            disabled={isSendingMagicLink}
            activeOpacity={0.85}
          >
            <Mail size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>
              {isSendingMagicLink ? 'Sending code...' : 'Create account with email'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
          <Info size={16} color={colors.accent} strokeWidth={2.5} style={{ marginRight: 8 }} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            We'll send a 6-digit code to your email to verify your account. No password needed.
          </Text>
        </View>

        {/* Terms */}
        <Text style={[styles.terms, { color: colors.textLight }]}>
          By creating an account, you agree to our{' '}
          <Text style={[styles.termsLink, { color: colors.accent }]}>Terms of Service</Text> and{' '}
          <Text style={[styles.termsLink, { color: colors.accent }]}>Privacy Policy</Text>
        </Text>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Already have an account?{' '}
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 36,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  form: {
    gap: 18,
  },
  inputWrapper: {
    gap: 7,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    paddingVertical: 17,
    marginTop: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  infoBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  terms: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  termsLink: {
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 15,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});
