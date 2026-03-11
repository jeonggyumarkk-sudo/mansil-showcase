import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import type { Property } from '@mansil/types';
import { useProperties } from '../../store/properties';
import { useAuth } from '../../store/auth';

const SEOUL_REGION = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  const { properties, loading, error, fetchProperties } = useProperties();
  const token = useAuth((state) => state.token);
  const mapRef = useRef<MapView>(null);
  const [locationGranted, setLocationGranted] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchProperties(controller.signal);
    return () => controller.abort();
  }, [token, fetchProperties]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (properties.length > 0 && mapRef.current) {
      const coords = properties
        .filter((p) => p.coordinates?.lat && p.coordinates?.lng)
        .map((p) => ({
          latitude: p.coordinates.lat,
          longitude: p.coordinates.lng,
        }));
      if (coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  }, [properties]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-4">
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
    <View className="flex-1">
      <MapView
        ref={mapRef}
        className="flex-1"
        initialRegion={SEOUL_REGION}
        showsUserLocation={locationGranted}
        showsMyLocationButton={locationGranted}
      >
        {properties
          .filter((p) => p.coordinates?.lat && p.coordinates?.lng)
          .map((property) => (
            <Marker
              key={property.id}
              coordinate={{
                latitude: property.coordinates.lat,
                longitude: property.coordinates.lng,
              }}
              title={property.title}
              description={`${property.transactionType} ${
                Number(property.deposit || property.salePrice || 0).toLocaleString()
              }원`}
            />
          ))}
      </MapView>
    </View>
  );
}
