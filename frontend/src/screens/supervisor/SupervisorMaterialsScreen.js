// src/screens/supervisor/SupervisorMaterialsScreen.js
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Card,
  TextInput,
  Button,
  Paragraph,
  HelperText,
} from 'react-native-paper';
import { materialsAPI } from '../../services/api'; // we set up earlier

const SupervisorMaterialsScreen = () => {
  const [siteId, setSiteId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [logType, setLogType] = useState('received'); // 'received' | 'used'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    setResult(null);

    if (!siteId || !qrCode || !quantity) {
      setErrorMsg('Site, QR code, and quantity are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await materialsAPI.scan({
        siteId,
        qrCode,
        quantity: Number(quantity),
        logType,
      });
      setResult(res.data.data);
    } catch (e) {
      console.log('Scan error', e?.response?.data || e.message);
      setErrorMsg(
        e?.response?.data?.message || 'Failed to log material'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Material Scanner" />
        <Card.Content>
          <TextInput
            label="Site ID"
            value={siteId}
            onChangeText={setSiteId}
            style={styles.input}
          />
          <TextInput
            label="QR Code"
            value={qrCode}
            onChangeText={setQrCode}
            style={styles.input}
          />
          <TextInput
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            label="Log Type (received / used)"
            value={logType}
            onChangeText={setLogType}
            style={styles.input}
          />

          {errorMsg ? (
            <HelperText type="error" visible={true}>
              {errorMsg}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            style={styles.button}
          >
            Log Material
          </Button>

          {result && (
            <Paragraph style={styles.success}>
              Logged {result.quantity} {result.material.unit} of{' '}
              {result.material.name} as {result.logType}.
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { flex: 1, borderRadius: 12, elevation: 2 },
  input: { marginBottom: 12 },
  button: { marginTop: 8 },
  success: { marginTop: 16, color: 'green' },
});

export default SupervisorMaterialsScreen;
