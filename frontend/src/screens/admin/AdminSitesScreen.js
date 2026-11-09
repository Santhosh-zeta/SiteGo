import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  Card,
  Paragraph,
  Text,
  ActivityIndicator,
  HelperText,
  TextInput,
  Button,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { adminAPI } from '../../services/api';

const AdminSitesScreen = () => {
  const navigation = useNavigation();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [geofence, setGeofence] = useState([]); // [[lat, lng], ...]

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadSites = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await adminAPI.getSites();
      setSites(res.data.data);
    } catch (e) {
      console.log('Admin sites error', e?.response?.data || e.message);
      setErrorMsg('Failed to load sites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleOpenMap = () => {
    navigation.navigate('SiteMap', {
      onGeofenceSelected: (points) => {
        setGeofence(points || []);
      },
    });
  };

  const handleCreate = async () => {
    setFormError('');
    setFormSuccess('');

    if (!name || !address || !startDate || !endDate || !budget) {
      setFormError('Name, address, start date, end date, and budget are required.');
      return;
    }

    if (!geofence || geofence.length < 3) {
      setFormError('Please pick a geofence on the map (at least 3 points).');
      return;
    }

    setSaving(true);
    try {
      await adminAPI.createSite({
        name,
        address,
        startDate,
        endDate,
        budget: Number(budget),
        description,
        geofence,
      });
      setFormSuccess('Site created.');
      setName('');
      setAddress('');
      setStartDate('');
      setEndDate('');
      setBudget('');
      setDescription('');
      setGeofence([]);
      await loadSites();
    } catch (e) {
      console.log('Create site error', e?.response?.data || e.message);
      setFormError(e?.response?.data?.message || 'Failed to create site.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.root}>
      <Text variant="titleLarge" style={styles.title}>
        Sites
      </Text>
      <Paragraph style={styles.subtitle}>
        Manage construction sites and define geofences via map.
      </Paragraph>

      <Card style={styles.formCard}>
        <Card.Title title="Add New Site" />
        <Card.Content>
          <TextInput
            label="Site Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            label="Address"
            value={address}
            onChangeText={setAddress}
            style={styles.input}
          />
          <View style={styles.row}>
            <TextInput
              label="Start Date (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
              style={styles.inputHalf}
            />
            <TextInput
              label="End Date (YYYY-MM-DD)"
              value={endDate}
              onChangeText={setEndDate}
              style={styles.inputHalf}
            />
          </View>
          <TextInput
            label="Budget"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            style={styles.input}
          />

          <Button
            mode="outlined"
            onPress={handleOpenMap}
            style={styles.button}
          >
            {geofence.length
              ? `Geofence: ${geofence.length} points selected`
              : 'Pick Geofence on Map'}
          </Button>

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
            Create Site
          </Button>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {errorMsg ? (
        <HelperText type="error" visible={true} style={styles.error}>
          {errorMsg}
        </HelperText>
      ) : null}

      {sites.length === 0 ? (
        <Text style={styles.empty}>No sites found.</Text>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={sites}
          keyExtractor={(s) => String(s.id)}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.name}>{item.name}</Text>
                <Paragraph style={styles.meta}>{item.address}</Paragraph>
                <Paragraph style={styles.meta}>
                  {item.start_date} → {item.end_date}
                </Paragraph>
                <Paragraph style={styles.meta}>Budget: {item.budget}</Paragraph>
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
  title: { marginBottom: 4 },
  subtitle: { color: '#666', marginBottom: 12 },
  formCard: { borderRadius: 12, elevation: 2, marginBottom: 12 },
  input: { marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  inputHalf: { flex: 1, marginBottom: 8 },
  button: { marginTop: 4 },
  success: { marginTop: 4, color: 'green' },
  divider: { marginVertical: 8 },
  list: { paddingVertical: 8, gap: 8 },
  card: { borderRadius: 12, elevation: 2, marginBottom: 8 },
  name: { fontWeight: '600', marginBottom: 4 },
  meta: { color: '#666', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 16, color: '#666' },
  error: { marginTop: 8, textAlign: 'center' },
});

export default AdminSitesScreen;
