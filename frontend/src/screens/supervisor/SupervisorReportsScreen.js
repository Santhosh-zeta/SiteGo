// src/screens/supervisor/SupervisorReportsScreen.js
import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
  Card,
  TextInput,
  Button,
  Paragraph,
  HelperText,
} from 'react-native-paper';
// later: import reportsAPI

const SupervisorReportsScreen = () => {
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('');
  const [workersCount, setWorkersCount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccess('');

    if (!summary || !category || !workersCount) {
      setErrorMsg('Summary, category, and worker count are required.');
      return;
    }

    setLoading(true);
    try {
      // TODO: POST /reports/daily
      setSuccess('Report submitted (placeholder).');
    } catch (e) {
      console.log('Report error', e?.response?.data || e.message);
      setErrorMsg('Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Daily Work Report" />
        <Card.Content>
          <TextInput
            label="Work Summary"
            value={summary}
            onChangeText={setSummary}
            multiline
            style={styles.input}
          />
          <TextInput
            label="Category (e.g. concrete, electrical)"
            value={category}
            onChangeText={setCategory}
            style={styles.input}
          />
          <TextInput
            label="Number of workers"
            value={workersCount}
            onChangeText={setWorkersCount}
            keyboardType="numeric"
            style={styles.input}
          />

          {errorMsg ? (
            <HelperText type="error" visible={true}>
              {errorMsg}
            </HelperText>
          ) : null}
          {success ? (
            <Paragraph style={styles.success}>{success}</Paragraph>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            style={styles.button}
          >
            Submit Report
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { borderRadius: 12, elevation: 2 },
  input: { marginBottom: 12 },
  button: { marginTop: 8 },
  success: { marginTop: 8, color: 'green' },
});

export default SupervisorReportsScreen;
