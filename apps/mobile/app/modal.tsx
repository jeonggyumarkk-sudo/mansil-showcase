import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text } from 'react-native';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center p-5">
      <Text className="text-xl font-bold mb-4">매물 상세</Text>
      <View className="h-px w-4/5 bg-gray-200 my-6" />
      <Text className="text-gray-500 text-center">
        매물 상세 정보가 여기에 표시됩니다.
      </Text>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
