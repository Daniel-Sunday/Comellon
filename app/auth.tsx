import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Helper to generate a soft, low-stakes default handle
const generateDefaultUsername = () => {
  const adjectives = ['mindful', 'quiet', 'dreamy', 'thoughtful', 'silent', 'solitary', 'gentle', 'calm'];
  const nouns = ['scribe', 'thinker', 'walker', 'listener', 'poet', 'dreamer', 'observer', 'writer'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(100 + Math.random() * 900); // 3 digit number
  return `${adj}_${noun}_${num}`;
};

// List of desaturated warm colors for avatar backgrounds
const AVATAR_COLORS = ['#F0706A', '#4A6FA5', '#58B19F', '#D6A2E8', '#E28743', '#2C3E50'];
const getRandomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

export default function AuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (isSignUp && !displayName.trim()) {
      setErrorMsg('Please enter a display name.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        // Local Sandbox Mode bypass
        console.log('Supabase not configured, bypassing in sandbox mode');
        setLoading(false);
        router.replace('/');
        return;
      }

      if (isSignUp) {
        // Sign Up Flow
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('Sign up failed');

        // Create profile in public.profiles table
        const defaultUsername = generateDefaultUsername();
        const { error: profileError } = await supabase.from('profiles').insert({
          id: signUpData.user.id,
          username: defaultUsername,
          display_name: displayName.trim(),
          avatar_color: getRandomColor(),
        });

        if (profileError) throw profileError;

        setErrorMsg('Sign up successful! Please check your email or log in.');
        setIsSignUp(false);
      } else {
        // Sign In Flow
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (signInError) throw signInError;
        router.replace('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxBypass = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Minimalist Logo & Tagline */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>C</Text>
              </View>
              <Text style={styles.title}>Comellon</Text>
              <Text style={styles.subtitle}>Digital notebook therapy. Speak freely.</Text>
            </View>

            {/* Sandbox banner if Supabase not configured */}
            {!isSupabaseConfigured && (
              <View style={styles.sandboxBanner}>
                <Feather name="info" size={14} color="#8e8e93" style={{ marginRight: 6 }} />
                <Text style={styles.sandboxText}>Running in local sandbox mode.</Text>
              </View>
            )}

            {/* Form inputs */}
            <View style={styles.form}>
              {errorMsg && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {isSignUp && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Display Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Daniel"
                    placeholderTextColor="#636366"
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@domain.com"
                  placeholderTextColor="#636366"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#636366"
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitText}>
                    {isSignUp ? 'Begin Writing' : 'Open Notebook'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Toggle mode link */}
              <TouchableOpacity
                style={styles.toggleLink}
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg(null);
                }}
                activeOpacity={0.6}
              >
                <Text style={styles.toggleText}>
                  {isSignUp
                    ? 'Already have a notebook? Sign in'
                    : "Don't have a notebook? Register here"}
                </Text>
              </TouchableOpacity>

              {/* Sandbox fallback action */}
              {!isSupabaseConfigured && (
                <TouchableOpacity
                  style={styles.sandboxButton}
                  onPress={handleSandboxBypass}
                  activeOpacity={0.6}
                >
                  <Text style={styles.sandboxButtonText}>Enter Sandbox Offline</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0706A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  subtitle: {
    color: '#636366',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  sandboxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1c1e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  sandboxText: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderWidth: 1,
    borderColor: '#ff453a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ff453a',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  input: {
    backgroundColor: '#1c1c1e',
    color: '#ffffff',
    fontSize: 15,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  submitButton: {
    backgroundColor: '#F0706A',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  toggleLink: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  toggleText: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  sandboxButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: 12,
  },
  sandboxButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
});
