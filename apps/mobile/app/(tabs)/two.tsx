import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '../../store/auth';

export default function MyPropertiesScreen() {
  const signOut = useAuth((state) => state.signOut);

  const handleSignOut = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['left', 'right']}>
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold mb-6 text-gray-800">내 매물</Text>

        <View className="bg-white rounded-lg p-6 items-center mb-4">
          <FontAwesome name="building" size={48} color="#9ca3af" />
          <Text className="text-gray-500 mt-4 text-center">
            등록된 매물이 없습니다.{'\n'}매물을 등록해 보세요.
          </Text>
        </View>

        <View className="mt-auto">
          <TouchableOpacity
            className="bg-red-500 p-4 rounded-lg items-center"
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Text className="text-white font-bold">로그아웃</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
