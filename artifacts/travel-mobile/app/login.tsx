import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

function getFirebaseError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'メールアドレスまたはパスワードが正しくありません';
    case 'auth/email-already-in-use':
      return 'このメールアドレスはすでに使用されています';
    case 'auth/weak-password':
      return 'パスワードは6文字以上にしてください';
    case 'auth/invalid-email':
      return '正しいメールアドレスを入力してください';
    case 'auth/too-many-requests':
      return 'しばらく時間をおいて再度お試しください';
    default:
      return '認証エラーが発生しました。もう一度お試しください';
  }
}

export default function LoginScreen() {
  const colors = useColors();
  const { signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/trips');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('エラー', getFirebaseError(err.code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 32, paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Branding */}
        <View style={styles.hero}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Feather name="send" size={34} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.foreground, fontFamily: 'Outfit_700Bold' }]}>
            TravelCraft
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground, fontFamily: 'Outfit_400Regular' }]}>
            旅行の思い出を、みんなで共有しよう
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Outfit_700Bold' }]}>
            {mode === 'login' ? 'ログイン' : 'アカウント作成'}
          </Text>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Outfit_400Regular' }]}>
              メールアドレス
            </Text>
            <TextInput
              style={[styles.input, {
                color: colors.foreground,
                backgroundColor: colors.muted,
                borderColor: colors.border,
                fontFamily: 'Outfit_400Regular',
              }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Outfit_400Regular' }]}>
              パスワード
            </Text>
            <View style={styles.pwRow}>
              <TextInput
                style={[styles.input, styles.pwInput, {
                  color: colors.foreground,
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                  fontFamily: 'Outfit_400Regular',
                }]}
                placeholder="6文字以上"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.eyeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => setShowPw(!showPw)}
              >
                <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={[styles.primaryBtnText, { fontFamily: 'Outfit_700Bold' }]}>
                  {mode === 'login' ? 'ログイン' : 'アカウント作成'}
                </Text>
            }
          </TouchableOpacity>

          {/* Switch mode */}
          <TouchableOpacity style={styles.switchBtn} onPress={() => {
            setMode(m => m === 'login' ? 'signup' : 'login');
            setEmail(''); setPassword('');
          }}>
            <Text style={[styles.switchText, { color: colors.secondary, fontFamily: 'Outfit_400Regular' }]}>
              {mode === 'login' ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの方はこちら'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  hero: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 76, height: 76, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#f4622a', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  appName: { fontSize: 32, marginBottom: 6 },
  tagline: { fontSize: 14, textAlign: 'center' },

  card: {
    borderRadius: 20, borderWidth: 1,
    padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
  },
  cardTitle: { fontSize: 22, marginBottom: 20 },

  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 12, marginBottom: 6 },
  input: {
    height: 48, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, fontSize: 15,
  },
  pwRow: { flexDirection: 'row', gap: 8 },
  pwInput: { flex: 1 },
  eyeBtn: {
    width: 48, height: 48, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  primaryBtn: {
    height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#f4622a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  primaryBtnText: { fontSize: 16, color: '#fff' },
  disabledBtn: { opacity: 0.7 },

  switchBtn: { marginTop: 16, alignItems: 'center', padding: 8 },
  switchText: { fontSize: 13 },
});
