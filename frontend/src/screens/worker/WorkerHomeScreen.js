import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Surface, Text, Button, Card, Paragraph } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { workerAPI } from '../../services/api';

const WorkerHomeScreen = () => {
  const { user, signOut } = useAuth();
  const [attendanceText, setAttendanceText] = useState('Loading...');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await workerAPI.getTodayAttendance();
        const { isCheckedIn, attendance } = res.data.data;

        if (!attendance) {
          setAttendanceText('Not checked in today');
        } else if (isCheckedIn) {
          setAttendanceText(`Checked in at ${attendance.siteName}`);
        } else {
          setAttendanceText(`Checked out from ${attendance.siteName}`);
        }
      } catch (e) {
        console.log('attendance/today error', e?.response?.data || e.message);
        setAttendanceText('Could not load attendance');
      }
    };
    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">Hi, {user?.name || 'Worker'}</Text>
        <Paragraph>{user?.email}</Paragraph>
        <Button mode="outlined" onPress={signOut} style={styles.signOut}>
          Sign out
        </Button>
      </Surface>

      <Card style={styles.card}>
        <Card.Title title="Attendance" />
        <Card.Content>
          <Paragraph>{attendanceText}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Today’s Tasks" />
        <Card.Content>
          <Paragraph>Task API will be wired later.</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Announcements" />
        <Card.Content>
          <Paragraph>No announcements yet.</Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  header: { padding: 16, borderRadius: 12, elevation: 2, gap: 4 },
  signOut: { marginTop: 8, alignSelf: 'flex-start' },
  card: { borderRadius: 12, elevation: 2 },
});

export default WorkerHomeScreen;
