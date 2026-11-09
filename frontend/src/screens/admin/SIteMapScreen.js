import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { Card, Button, Text } from 'react-native-paper';

const SiteMapScreen = ({ navigation, route }) => {
  const [points, setPoints] = useState([]); // [[lat, lng], ...]

  const onMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPoints((prev) => [...prev, [latitude, longitude]]);
  };

  const handleSave = () => {
    if (route.params?.onGeofenceSelected) {
      route.params.onGeofenceSelected(points);
    }
    navigation.goBack();
  };

  const coordsForPolygon = points.map(([lat, lng]) => ({
    latitude: lat,
    longitude: lng,
  }));

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 12.9716,
          longitude: 80.2210,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        onPress={onMapPress}
      >
        {coordsForPolygon.map((c, i) => (
          <Marker key={i} coordinate={c} />
        ))}
        {coordsForPolygon.length >= 3 && (
          <Polygon
            coordinates={coordsForPolygon}
            strokeColor="#0096FF"
            fillColor="rgba(0,150,255,0.3)"
            strokeWidth={2}
          />
        )}
      </MapView>

      <Card style={styles.bottomCard}>
        <Card.Content>
          <Text>Points: {points.length}</Text>
          <Button
            mode="contained"
            disabled={points.length < 3}
            onPress={handleSave}
            style={styles.button}
          >
            Use This Geofence
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  bottomCard: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    borderRadius: 12,
  },
  button: { marginTop: 8 },
});

export default SiteMapScreen;
