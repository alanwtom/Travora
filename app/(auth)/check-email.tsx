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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { signInWithMagicLink, verifyOtp } from '@/services/auth';
import { COLORS } from '@/lib/constants';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function CheckEmail() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [otp, setOtp] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleResend = async () => {
    if (!email) {
      Alert.alert('Error', 'No email address provided');
      return;
    }
    try {
      setIsResending(true);
      await signInWithMagicLink(email);
      Alert.alert('Success', 'A new code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    if (!email) {
      Alert.alert('Error', 'No email address provided');
      return;
    }
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code from your email');
      return;
    }
    try {
      setIsVerifying(true);
      await verifyOtp(email, otp);
      // Success - will auto-redirect via AuthProvider
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
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
          <FontAwesome name="chevron-left" size={16} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <FontAwesome name="envelope-o" size={64} color={COLORS.accent} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{' '}
            <Text style={styles.emailText}>{email || 'your email'}</Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          <TextInput
            style={styles.otpInput}
            placeholder="123456"
            placeholderTextColor={COLORS.textLight}
            value={otp}
            onChangeText={(text) => {
              // Only allow numbers, exactly 6 digits
              const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
              setOtp(numericText);
            }}
            keyboardType="number-pad"
            textAlign="center"
            maxLength={6}
            autoFocus
          />
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, isVerifying && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isVerifying || otp.length !== 6}
          activeOpacity={0.85}
        >
          <Text style={styles.verifyButtonText}>
            {isVerifying ? 'Verifying...' : 'Verify & Sign In'}
          </Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            Check your email for a 6-digit verification code. Enter it below to sign in.
          </Text>
        </View>

        {/* Resend Link */}
        <TouchableOpacity
          style={styles.resendLink}
          onPress={handleResend}
          disabled={isResending}
          activeOpacity={0.7}
        >
          <Text style={styles.resendLinkText}>
            {isResending ? 'Sending...' : "Didn't receive it? Resend code"}
          </Text>
        </TouchableOpacity>

        {/* Back to Sign In */}
        <TouchableOpacity
          style={styles.backToSignIn}
          onPress={() => router.push('sign-in')}
          activeOpacity={0.7}
        >
          <Text style={styles.backToSignInText}>Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backToSignIn: {
    marginTop: 20,
  },
  backToSignInText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  otpContainer: {
    width: '100%',
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 18,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 8,
  },
  verifyButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  instructions: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  instructionsText: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  resendLink: {
    marginTop: 8,
  },
  resendLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent,
    textAlign: 'center',
  },
});
