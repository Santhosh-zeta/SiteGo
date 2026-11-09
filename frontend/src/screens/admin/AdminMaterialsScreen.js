import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  Card,
  Paragraph,
  Text,
  ActivityIndicator,
  HelperText,
  Chip,
  TextInput,
  Button,
  Divider,
} from 'react-native-paper';
import { adminAPI } from '../../services/api';

const AdminMaterialsScreen = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadMaterials = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await adminAPI.getMaterials();
      setMaterials(res.data.data);
    } catch (e) {
      console.log('Admin materials error', e?.response?.data || e.message);
      setErrorMsg('Failed to load materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleCreate = async () => {
    setFormError('');
    setFormSuccess('');

    if (!name || !category || !unit) {
      setFormError('Name, category, and unit are required.');
      return;
    }

    setSaving(true);
    try {
      await adminAPI.createMaterial({
        name,
        category,
        unit,
        standard_price: price ? Number(price) : null,
        qr_code: qrCode || null,
      });
      setFormSuccess('Material created.');
      setName('');
      setCategory('');
      setUnit('');
      setPrice('');
      setQrCode('');
      await loadMaterials();
    } catch (e) {
      console.log('Create material error', e?.response?.data || e.message);
      setFormError(
        e?.response?.data?.message || 'Failed to create material.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.root}>
      <Text variant="titleLarge" style={styles.screenTitle}>
        Material Master
      </Text>
      <Paragraph style={styles.screenSubtitle}>
        Manage all materials used across your sites.
      </Paragraph>

      <Card style={styles.formCard}>
        <Card.Title title="Add New Material" />
        <Card.Content>
          <View style={styles.formRow}>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              style={styles.inputHalf}
            />
            <TextInput
              label="Category"
              value={category}
              onChangeText={setCategory}
              style={styles.inputHalf}
            />
          </View>
          <View style={styles.formRow}>
            <TextInput
              label="Unit (e.g. kg, bag)"
              value={unit}
              onChangeText={setUnit}
              style={styles.inputHalf}
            />
            <TextInput
              label="Standard Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              style={styles.inputHalf}
            />
          </View>
          <TextInput
            label="QR Code (optional)"
            value={qrCode}
            onChangeText={setQrCode}
            style={styles.inputFull}
          />

          {formError ? (
            <HelperText type="error" visible={true}>
              {formError}
            </HelperText>
          ) : null}
          {formSuccess ? (
            <Paragraph style={styles.success}>{formSuccess}</Paragraph>
          ) : null}

          <Button
            mode="contained"
            onPress={handleCreate}
            loading={saving}
            style={styles.button}
          >
            Create Material
          </Button>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      <View style={styles.listHeaderRow}>
        <Text variant="titleMedium">Existing Materials</Text>
        <Text style={styles.countText}>{materials.length} items</Text>
      </View>

      {errorMsg ? (
        <HelperText type="error" visible={true} style={styles.error}>
          {errorMsg}
        </HelperText>
      ) : null}

      {materials.length === 0 ? (
        <Text style={styles.empty}>No materials found.</Text>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={materials}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Paragraph style={styles.meta}>
                      {item.category} • {item.unit}
                    </Paragraph>
                    {item.standard_price && (
                      <Paragraph style={styles.meta}>
                        Price: {item.standard_price}
                      </Paragraph>
                    )}
                  </View>
                  {item.qr_code && (
                    <Chip style={styles.chip} compact>
                      QR
                    </Chip>
                  )}
                </View>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  screenTitle: { marginBottom: 4 },
  screenSubtitle: { color: '#666', marginBottom: 12 },
  formCard: { borderRadius: 12, elevation: 2, marginBottom: 12 },
  formRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  inputHalf: { flex: 1 },
  inputFull: { marginBottom: 8 },
  button: { marginTop: 4 },
  success: { marginTop: 4, color: 'green' },
  divider: { marginVertical: 8 },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  countText: { color: '#666' },
  list: { paddingVertical: 8, gap: 8 },
  card: { borderRadius: 12, elevation: 2, marginBottom: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontWeight: '600', marginBottom: 2 },
  meta: { color: '#666', fontSize: 12 },
  chip: { alignSelf: 'flex-start' },
  empty: { textAlign: 'center', marginTop: 16, color: '#666' },
  error: { marginTop: 8, textAlign: 'center' },
});

export default AdminMaterialsScreen;
