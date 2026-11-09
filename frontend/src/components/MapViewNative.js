import React from 'react';
import { View } from 'react-native';
import MapView from 'react-native-maps';

export default function MapViewNative(props) {
  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }} {...props} />
    </View>
  );
}
