import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const ManagerDocumentsScreen = () => (
  <View style={styles.container}>
    <Text>Documents (drawings, PDFs) list and viewer will be here.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});

export default ManagerDocumentsScreen;
