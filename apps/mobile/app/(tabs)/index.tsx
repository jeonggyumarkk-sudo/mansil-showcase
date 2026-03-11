import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Property } from '@mansil/types';
import { useProperties } from '../../store/properties';
import { useAuth } from '../../store/auth';

export default function PropertyListScreen() {
  const { properties, loading, error, fetchProperties } = useProperties();
  const token = useAuth((state) => state.token);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchProperties(controller.signal);
    return () => controller.abort();
  }, [token, fetchProperties]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProperties();
    setRefreshing(false);
  }, [fetchProperties]);

  const renderItem = useCallback(({ item }: { item: Property }) => {
    const displayPrice = item.deposit || item.salePrice || item.monthlyRent || '0';

    return (
      <TouchableOpacity
        className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-200"
        onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-semibold text-gray-900">{item.title}</Text>
          <Text className="text-blue-600 font-bold">{item.transactionType}</Text>
        </View>
        <Text className="text-gray-600 mb-1">{item.address}</Text>
        <View className="flex-row justify-between mt-2">
          <Text className="text-gray-500">{item.areaPyeong} 평</Text>
          <Text className="font-bold text-gray-800">
            {Number(displayPrice).toLocaleString()}원
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, []);

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100 p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-blue-600 px-6 py-3 rounded-lg"
          onPress={() => fetchProperties()}
        >
          <Text className="text-white font-bold">다시 시도</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['left', 'right']}>
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold mb-4 text-gray-800">매물 목록</Text>
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <View className="items-center mt-10">
              <Text className="text-gray-500">등록된 매물이 없습니다.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
