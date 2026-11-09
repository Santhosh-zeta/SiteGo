import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Paragraph } from 'react-native-paper';

const WorkerTasksScreen = () => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="My Tasks" />
        <Card.Content>
          <Paragraph>
            Worker tasks API is not wired yet. Once backend routes for
            tasks are ready, this screen will show your assignments and
            let you mark them as completed.
          </Paragraph>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { flex: 1, borderRadius: 12, elevation: 2 },
});

export default WorkerTasksScreen;
