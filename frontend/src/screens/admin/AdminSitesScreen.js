import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Paragraph, Text } from 'react-native-paper';

const AdminSitesScreen = () => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Site Management" />
        <Card.Content>
          <Paragraph>
            Here you will be able to:
          </Paragraph>
          <Paragraph>• Create and edit construction sites</Paragraph>
          <Paragraph>• Assign supervisors to each site</Paragraph>
          <Paragraph>• Define geofence boundaries on a map</Paragraph>
          <Paragraph>• Configure site-specific settings</Paragraph>
          <Text style={styles.note}>
            Map + geofence editor will be added once maps integration is wired.
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

export default AdminSitesScreen;
