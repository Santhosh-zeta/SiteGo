// src/screens/supervisor/SupervisorDashboardScreen.js
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Surface, Text, Card, Paragraph } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';

const SupervisorDashboardScreen = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    workersPresent: 0,
    materialsScanned: 0,
    openIssues: 0,
    qualityChecks: 0,
  });

  useEffect(() => {
    // TODO: call dashboard endpoints
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">
          Site Overview
        </Text>
        <Paragraph>
          Supervisor: {user?.name}
        </Paragraph>
      </Surface>

      <Card style={styles.card}>
        <Card.Title title="Workers Present" />
        <Card.Content>
          <Text variant="headlineLarge">
            {summary.workersPresent}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Materials Scanned Today" />
        <Card.Content>
          <Text variant="headlineLarge">
            {summary.materialsScanned}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Open Issues" />
        <Card.Content>
          <Text variant="headlineLarge">
            {summary.openIssues}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Quality Checks" />
        <Card.Content>
          <Text variant="headlineLarge">
            {summary.qualityChecks}
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  header: { padding: 16, borderRadius: 12, elevation: 2, gap: 4 },
  card: { borderRadius: 12, elevation: 2 },
});

export default SupervisorDashboardScreen;
