import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../store/auth';
import api from '../lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const signIn = useAuth((state) => state.signIn);

  // Prevent Android back button from navigating away from login
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.access_token) {
        signIn(res.data.access_token);
      }
    } catch (error: any) {
      if (!error.response) {
        Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
      } else if (error.response.status === 401) {
        Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        Alert.alert('서버 오류', '잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-3xl font-bold mb-8 text-blue-600">만실</Text>

          <View className="w-full">
            <View className="mb-4">
              <Text className="mb-1 text-gray-600">이메일</Text>
              <TextInput
                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50"
                placeholder="enter@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-gray-600">비밀번호</Text>
              <TextInput
                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50"
                placeholder="비밀번호"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
              />
            </View>

            <TouchableOpacity
              className="w-full bg-blue-600 p-4 rounded-lg mt-4 items-center"
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text className="text-white font-bold">
                {loading ? '로그인 중...' : '로그인'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
