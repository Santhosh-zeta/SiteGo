import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MapViewNative() {
  return (
    <View style={styles.center}>
      <Text>Map is only available on mobile (Android/iOS).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
