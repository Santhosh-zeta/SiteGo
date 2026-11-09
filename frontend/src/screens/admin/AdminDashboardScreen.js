import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Paragraph } from 'react-native-paper';

const AdminDashboardScreen = () => (
  <ScrollView contentContainerStyle={styles.container}>
    <Card style={styles.card}>
      <Card.Title title="Admin Console" />
      <Card.Content>
        <Text variant="headlineMedium">Welcome, Admin</Text>
        <Paragraph style={styles.subtitle}>
          Use the tabs to manage materials and sites. User & analytics APIs can
          be added later.
        </Paragraph>
      </Card.Content>
    </Card>

    <Card style={styles.card}>
      <Card.Title title="Key Areas" />
      <Card.Content>
        <Paragraph>• Material Master – define materials & QR mapping.</Paragraph>
        <Paragraph>• Sites – define sites and geofences (later via maps).</Paragraph>
        <Paragraph>• Users – role management (backend not ready yet).</Paragraph>
      </Card.Content>
    </Card>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  card: { borderRadius: 12, elevation: 2 },
  subtitle: { marginTop: 4, color: '#666' },
});

export default AdminDashboardScreen;
