import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const ManagerInventoryScreen = () => (
  <View style={styles.container}>
    <Text>Inventory overview per site will appear here.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});

export default ManagerInventoryScreen;
