import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Paragraph, Text } from 'react-native-paper';

const AdminUsersScreen = () => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="User Management" />
        <Card.Content>
          <Paragraph>
            Here you will be able to:
          </Paragraph>
          <Paragraph>• View all users</Paragraph>
          <Paragraph>• Create new users</Paragraph>
          <Paragraph>• Assign roles (worker / supervisor / manager / admin)</Paragraph>
          <Paragraph>• Reset passwords / deactivate accounts</Paragraph>
          <Text style={styles.note}>
            Backend routes will be wired later once user management APIs are ready.
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

export default AdminUsersScreen;
