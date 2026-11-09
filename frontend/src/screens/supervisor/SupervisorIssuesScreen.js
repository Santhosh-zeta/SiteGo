// src/screens/supervisor/SupervisorIssuesScreen.js
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Card, Paragraph, Text, Chip } from 'react-native-paper';
import { issuesAPI } from '../../services/api';

const SupervisorIssuesScreen = () => {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const loadIssues = async () => {
      try {
        const res = await issuesAPI.getMy('supervisor');
        setIssues(res.data.data);
      } catch (e) {
        console.log('Issues load error', e?.response?.data || e.message);
      }
    };
    loadIssues();
  }, []);

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Paragraph style={styles.title}>{item.title}</Paragraph>
        <Paragraph>{item.description}</Paragraph>
        <Paragraph style={styles.meta}>
          Site: {item.siteName} • Priority: {item.priority}
        </Paragraph>
        <Chip style={styles.chip}>{item.status}</Chip>
      </Card.Content>
    </Card>
  );

  if (issues.length === 0) {
    return <Text style={styles.empty}>No issues assigned to you.</Text>;
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={issues}
      keyExtractor={(i) => String(i.id)}
      renderItem={renderItem}
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: 16, gap: 8 },
  card: { borderRadius: 12, elevation: 2 },
  title: { fontWeight: '600', marginBottom: 4 },
  meta: { marginTop: 8, color: '#666' },
  chip: { marginTop: 8, alignSelf: 'flex-start' },
  empty: { flex: 1, textAlign: 'center', marginTop: 40, color: '#666' },
});

export default SupervisorIssuesScreen;
