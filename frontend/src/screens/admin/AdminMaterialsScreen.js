import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Paragraph, Text } from 'react-native-paper';

const AdminMaterialsScreen = () => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Material Master Data" />
        <Card.Content>
          <Paragraph>
            Here you will be able to:
          </Paragraph>
          <Paragraph>• Add new materials (name, category, unit)</Paragraph>
          <Paragraph>• Manage QR codes for each material</Paragraph>
          <Paragraph>• Set standard prices and descriptions</Paragraph>
          <Paragraph>• View and edit existing material records</Paragraph>
          <Text style={styles.note}>
            This screen will later connect to /api/materials/master endpoints.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { flex: 1, borderRadius: 12, elevation: 2 },
  note: { marginTop: 16, color: '#666' },
});

export default AdminMaterialsScreen;
