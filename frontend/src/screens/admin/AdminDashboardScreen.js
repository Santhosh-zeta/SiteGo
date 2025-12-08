import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Paragraph } from 'react-native-paper';

const AdminDashboardScreen = () => (
  <ScrollView contentContainerStyle={styles.container}>
    <Card style={styles.card}>
      <Card.Title title="Organization Overview" />
      <Card.Content>
        <Text variant="headlineMedium">0 Active Sites</Text>
        <Paragraph>Total workers, supervisors, and managers will show here.</Paragraph>
      </Card.Content>
    </Card>

    <Card style={styles.card}>
      <Card.Title title="Open Issues" />
      <Card.Content>
        <Paragraph>Escalated issues and analytics will appear here.</Paragraph>
      </Card.Content>
    </Card>

    <Card style={styles.card}>
      <Card.Title title="AI Quality Insights" />
      <Card.Content>
        <Paragraph>AI defect distribution and trends will be visualized here.</Paragraph>
      </Card.Content>
    </Card>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  card: { borderRadius: 12, elevation: 2 },
});

export default AdminDashboardScreen;
