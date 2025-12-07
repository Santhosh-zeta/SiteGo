import React from 'react';
import { View, ScrollView, FlatList } from 'react-native';
import { Card, Text, Avatar, Button, IconButton, useTheme, Searchbar } from 'react-native-paper';
import { useState } from 'react';

export default function SitesScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const mockSites = [
    {
      id: 1,
      name: 'Site A - Chennai',
      location: 'Madurapakkam, TN',
      status: 'active',
      workers: 25,
      supervisor: 'Ravi Kumar',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
    },
    {
      id: 2,
      name: 'Site B - Vellore',
      location: 'VIT Campus Area',
      status: 'active',
      workers: 18,
      supervisor: 'Priya Sharma',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
    },
    {
      id: 3,
      name: 'Site C - Tambaram',
      location: 'GST Road, Chennai',
      status: 'paused',
      workers: 12,
      supervisor: 'Arun Patel',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
    },
  ];

  const filteredSites = mockSites.filter(site =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'paused': return '#f59e0b';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const SiteCard = ({ site }) => (
    <Card style={{ marginBottom: 16 }}>
      <Card.Cover source={{ uri: site.image }} />
      <Card.Content>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
            {site.name}
          </Text>
          <View style={{ 
            backgroundColor: getStatusColor(site.status) + '20',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 20,
          }}>
            <Text variant="labelSmall" style={{ color: getStatusColor(site.status), fontWeight: '600' }}>
              {site.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginBottom: 12 }}>
          {site.location}
        </Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <Text variant="labelLarge">{site.workers}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Workers</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Avatar.Text size={32} label={site.supervisor[0]} />
            <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 4 }}>
              Supervisor
            </Text>
          </View>
        </View>
        
        <Button mode="outlined" style={{ marginTop: 8 }}>
          View Details
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 24, paddingTop: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
            My Sites
          </Text>
          <IconButton icon="filter-variant" size={24} />
        </View>

        {/* Search Bar */}
        <Searchbar
          placeholder="Search sites..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ marginBottom: 24 }}
        />

        {/* Sites List */}
        <FlatList
          data={filteredSites}
          renderItem={({ item }) => <SiteCard site={item} />}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}
