import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Dialog,
  HelperText,
  IconButton,
  Menu,
  Paragraph,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { adminAPI } from '../../services/api';

const ROLES = ['worker', 'supervisor', 'manager', 'admin'];
const STATUSES = ['active', 'inactive', 'suspended'];

const emptyForm = {
  email: '',
  name: '',
  phone: '',
  role: 'worker',
  status: 'active',
};

const AdminUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [search, setSearch] = useState('');

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data.data);
    } catch (e) {
      console.log('Admin getUsers error', e?.response?.data || e.message);
      setErrorMsg('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.email || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditingUser(null);
    setForm({ ...emptyForm });
    setFormError('');
    setDialogVisible(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      name: user.name || '',
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    });
    setFormError('');
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setFormError('');
    setSaving(true);
    try {
      if (editingUser) {
        // basic info
        await adminAPI.updateUser(editingUser.id, {
          name: form.name,
          phone: form.phone,
        });
        if (form.role !== editingUser.role) {
          await adminAPI.updateUserRole(editingUser.id, form.role);
        }
        if (form.status !== editingUser.status) {
          await adminAPI.updateUserStatus(editingUser.id, form.status);
        }
      } else {
        await adminAPI.createUser({
          email: form.email,
          name: form.name,
          phone: form.phone,
          role: form.role,
        });
      }
      await loadUsers();
      setDialogVisible(false);
    } catch (e) {
      console.log('Save user error', e?.response?.data || e.message);
      setFormError(e?.response?.data?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    // simple confirm
    const ok = true; // replace with your own confirm UI if needed
    if (!ok) return;
    try {
      await adminAPI.deleteUser(user.id);
      await loadUsers();
    } catch (e) {
      console.log('Delete user error', e?.response?.data || e.message);
      setErrorMsg('Failed to delete user.');
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.root}>
      <Text variant="titleLarge" style={styles.title}>
        Users
      </Text>
      <Paragraph style={styles.subtitle}>
        Manage all users, their roles and statuses.
      </Paragraph>

      <View style={styles.searchRow}>
        <TextInput
          mode="outlined"
          placeholder="Search by name or email"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          left={
            <TextInput.Icon icon="magnify" />
          }
        />
        <Button mode="contained" onPress={openCreate}>
          New
        </Button>
      </View>

      {errorMsg ? (
        <HelperText type="error" visible={true}>
          {errorMsg}
        </HelperText>
      ) : null}

      {filteredUsers.length === 0 ? (
        <Text style={styles.empty}>No users found.</Text>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.email}>{item.email}</Text>
                    <Paragraph style={styles.nameLine}>
                      {item.name || 'No name'} • {item.phone || 'No phone'}
                    </Paragraph>
                    <Paragraph style={styles.meta}>
                      Role: {item.role} • Status: {item.status}
                    </Paragraph>
                  </View>
                  <View style={styles.actions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => openEdit(item)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="red"
                      onPress={() => handleDelete(item)}
                    />
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}
        />
      )}

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeDialog}>
          <Dialog.Title>
            {editingUser ? 'Edit User' : 'Create User'}
          </Dialog.Title>
          <Dialog.Content>
            {!editingUser && (
              <TextInput
                label="Email"
                value={form.email}
                onChangeText={(v) => handleChange('email', v)}
                style={styles.field}
                keyboardType="email-address"
              />
            )}
            <TextInput
              label="Name"
              value={form.name}
              onChangeText={(v) => handleChange('name', v)}
              style={styles.field}
            />
            <TextInput
              label="Phone"
              value={form.phone}
              onChangeText={(v) => handleChange('phone', v)}
              style={styles.field}
              keyboardType="phone-pad"
            />
            <TextInput
              label="Role"
              value={form.role}
              onChangeText={(v) => handleChange('role', v)}
              style={styles.field}
              right={
                <TextInput.Icon icon="account-badge" />
              }
            />
            {editingUser && (
              <TextInput
                label="Status"
                value={form.status}
                onChangeText={(v) => handleChange('status', v)}
                style={styles.field}
                right={
                  <TextInput.Icon icon="account-check" />
                }
              />
            )}
            {formError ? (
              <HelperText type="error" visible={true}>
                {formError}
              </HelperText>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button
              onPress={handleSave}
              loading={saving}
              mode="contained"
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  title: { marginBottom: 4 },
  subtitle: { color: '#666', marginBottom: 12 },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInput: { flex: 1 },
  list: { paddingVertical: 8, gap: 8 },
  card: { borderRadius: 12, elevation: 2, marginBottom: 8 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  email: { fontWeight: '600', marginBottom: 2 },
  nameLine: { color: '#444', marginBottom: 2 },
  meta: { color: '#666', fontSize: 12 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  field: { marginBottom: 8 },
  empty: { marginTop: 16, textAlign: 'center', color: '#666' },
});

export default AdminUsersScreen;
