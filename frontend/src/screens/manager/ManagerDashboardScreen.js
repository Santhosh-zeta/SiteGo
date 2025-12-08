import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Paragraph } from 'react-native-paper';

const ManagerDashboardScreen = () => (
  <ScrollView contentContainerStyle={styles.container}>
    <Card style={styles.card}>
      <Card.Title title="Project Progress" />
      <Card.Content>
        <Text variant="headlineLarge">0%</Text>
        <Paragraph>Progress charts will appear here.</Paragraph>
      </Card.Content>
    </Card>

    <Card style={styles.card}>
      <Card.Title title="Productivity" />
      <Card.Content>
        <Paragraph>Graphs for worker productivity.</Paragraph>
      </Card.Content>
    </Card>

    <Card style={styles.card}>
      <Card.Title title="Material Usage" />
      <Card.Content>
        <Paragraph>Material usage insights.</Paragraph>
      </Card.Content>
    </Card>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  card: { borderRadius: 12, elevation: 2 },
});

export default ManagerDashboardScreen;
