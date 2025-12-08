import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Button,
  Text,
  Card,
  Paragraph,
  HelperText,
  TextInput,
} from 'react-native-paper';
import { workerAPI } from '../../services/api';

const WorkerAttendanceScreen = () => {
  const [status, setStatus] = useState('Not checked in');
  const [siteId, setSiteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fakeLocation = { latitude: 0, longitude: 0 }; // TODO: real GPS

  const handleCheckIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await workerAPI.checkIn(Number(siteId), fakeLocation);
      const data = res.data.data;
      setStatus(`Checked in at ${data.siteName}`);
    } catch (e) {
      console.log('Check-in error', e?.response?.data || e.message);
      setErrorMsg(e?.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await workerAPI.checkOut(fakeLocation);
      const data = res.data.data;
      setStatus(
        `Checked out from ${data.siteName} (${data.totalHours} hrs)`
      );
    } catch (e) {
      console.log('Check-out error', e?.response?.data || e.message);
      setErrorMsg(e?.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Attendance" />
        <Card.Content>
          <TextInput
            label="Site ID"
            value={siteId}
            onChangeText={setSiteId}
            keyboardType="numeric"
            style={styles.input}
          />
          <Paragraph>Status: {status}</Paragraph>
          {errorMsg ? (
            <HelperText type="error" visible={true}>
              {errorMsg}
            </HelperText>
          ) : null}
          <View style={styles.buttons}>
            <Button
              mode="contained"
              onPress={handleCheckIn}
              loading={loading}
              disabled={loading || !siteId}
            >
              Check In
            </Button>
            <Button
              mode="outlined"
              onPress={handleCheckOut}
              loading={loading}
              disabled={loading}
            >
              Check Out
            </Button>
          </View>
          <Text style={styles.note}>
            Later: use real GPS and infer Site ID from worker assignment.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { flex: 1, borderRadius: 12, elevation: 2 },
  input: { marginBottom: 12 },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  note: { marginTop: 16, color: '#666' },
});

export default WorkerAttendanceScreen;
