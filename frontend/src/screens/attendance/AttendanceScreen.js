import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { Card, Text, Button, Avatar, IconButton, Divider, FAB, useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';

export default function AttendanceScreen() {
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    // Mock today's attendance
    setTodayAttendance({
      checkIn: '09:30 AM',
      checkOut: null,
      duration: '8h 30m',
      site: 'Site A - Chennai',
    });
    setIsCheckedIn(!!todayAttendance?.checkIn);
  }, []);

  const handleCheckIn = () => {
    Alert.alert(
      'Check In',
      'Scan QR code to check in to your site',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Scan QR', onPress: () => setShowQRScanner(true) },
      ]
    );
  };

  const handleCheckOut = () => {
    Alert.alert(
      'Check Out',
      'Confirm check out from site?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Check Out', 
          style: 'destructive',
          onPress: () => Alert.alert('Checked out successfully!')
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Today's Attendance Card */}
        <Card style={styles.card}>
          <Card.Title
            title="Today's Attendance"
            subtitle={todayAttendance?.site}
            left={(props) => <Avatar.Icon {...props} icon="calendar-today" />}
          />
          <Card.Content>
            <View style={styles.statusRow}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {isCheckedIn ? 'Checked In' : 'Not Checked In'}
              </Text>
              <Text variant="bodyMedium" style={{ color: isCheckedIn ? '#10b981' : '#ef4444' }}>
                {isCheckedIn ? '● Active' : '● Pending'}
              </Text>
            </View>
            
            <Divider style={{ marginVertical: 12 }} />
            
            <View style={styles.timeRow}>
              <View>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Check In</Text>
                <Text variant="titleLarge">{todayAttendance?.checkIn || '--:--'}</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Check Out</Text>
                <Text variant="titleLarge">{todayAttendance?.checkOut || '--:--'}</Text>
              </View>
            </View>
            
            <Text variant="bodyMedium" style={{ marginTop: 8 }}>
              Duration: <Text style={{ fontWeight: 'bold' }}>{todayAttendance?.duration || '0h 0m'}</Text>
            </Text>
          </Card.Content>
        </Card>

        {/* Recent Attendance */}
        <Card style={styles.card}>
          <Card.Title title="Recent Attendance" left={(props) => <Avatar.Icon {...props} icon="history" />} />
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
              Last 7 days attendance history
            </Text>
          </Card.Content>
        </Card>

        {/* QR Scanner Info */}
        {!isCheckedIn && (
          <Card style={styles.card}>
            <Card.Content style={{ alignItems: 'center' }}>
              <Avatar.Icon size={64} icon="qrcode-scan" style={{ backgroundColor: theme.colors.primaryContainer, marginBottom: 16 }} />
              <Text variant="titleMedium" style={{ textAlign: 'center', marginBottom: 8 }}>
                Scan QR Code to Check In
              </Text>
              <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.outline }}>
                Hold your phone over the QR code at your site entrance
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        icon={isCheckedIn ? "clock-out" : "map-marker-check"}
        style={styles.fab}
        onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
        label={isCheckedIn ? "Check Out" : "Check In"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dividerVertical: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
