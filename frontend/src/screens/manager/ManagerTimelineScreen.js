import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const ManagerTimelineScreen = () => (
  <View style={styles.container}>
    <Text>Timeline of daily reports will be shown here.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});

export default ManagerTimelineScreen;
