import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_CONFIG } from '../../config/maps';
import ErrorMessage from '../../components/ErrorMessage';
import { Post } from '../../Assets/Helpers/Service';

const storeLocation = {
  latitude: 29.7049215,
  longitude: -95.58094542,
};

// const orders = [
//   {id: 1, latitude: 29.2501, longitude: -95.14},
//   {id: 2, latitude: 29.2412, longitude: -95.145},
//   {id: 3, latitude: 29.2395, longitude: -95.138},
//   {id: 4, latitude: 29.2467, longitude: -95.1501},
//   {id: 5, latitude: 29.2433, longitude: -95.1422},
//   {id: 6, latitude: 29.2488, longitude: -95.1366},
//   {id: 7, latitude: 29.2375, longitude: -95.1477},
//   {id: 8, latitude: 29.24, longitude: -95.1344},
//   {id: 9, latitude: 29.2444, longitude: -95.1488},
//   {id: 10, latitude: 29.2499, longitude: -95.1433},
// ];

export default function TestMap() {
  const [sortedOrders, setSortedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [data, setData] = useState([]); // Data is fetching
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef(null);

  const acceptedOrderForDriver = () => {
    setLoading(true);
    setError(null);
    const raw = {
      lat: 29.7074,
      lng: -95.5612,
    };
    Post('/optimize-route', raw).then(
      async res => {
        setLoading(false);
        console.log('$%#@^&**', res.route);
        // const newData = res?.route.map(f => { return { ...f, latitude: f.latitude.toFixed(6), longitude: f.longitude.toFixed(6) } })
        // console.log('new data--------->', newData)
        setData(res?.route || []);
      },
      err => {
        setLoading(false);
        setError(err.message || 'Failed to fetch route data');
        setData([]);
        console.log(err);
      },
    );
  };

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      acceptedOrderForDriver();
    }

    return () => {
      isMounted = false;
    };
  }, [retryTrigger]);

  const orders = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter(order => {
        // Check if coordinates exist in the expected structure
        const coords = order.Local_address?.location?.coordinates || order.coordinates;
        return Array.isArray(coords) && coords.length === 2 && coords[0] !== null && coords[1] !== null;
      })
      .map((order, index) => ({
        id: order.orderId || `order-${index}`, // Ensure unique ID
        sequence: order.sequence || index + 1, // Use sequence from backend
        latitude: Number(order.Local_address?.location?.coordinates[1]?.toFixed(6) || order.coordinates[1]?.toFixed(6)),
        longitude: Number(order.Local_address?.location?.coordinates[0]?.toFixed(6) || order.coordinates[0]?.toFixed(6)),
        originalOrder: order, // Keep reference to original order data
      }))
      .sort((a, b) => a.sequence - b.sequence); // Sort by sequence from backend
  }, [data]);

  useEffect(() => {
    console.log('Orders from backend (optimized):', orders);

    // Add a small delay to prevent rapid updates that cause view insertion issues
    const timeoutId = setTimeout(() => {
      // Validate orders before setting them
      const validOrders = orders.filter(order => {
        const isValid = order.latitude && order.longitude &&
          !isNaN(order.latitude) && !isNaN(order.longitude);
        if (!isValid) {
          console.warn('Invalid order found:', order);
        }
        return isValid;
      });
      console.log('Valid orders:', validOrders);
      // Since backend already provides optimized route, use it directly
      setSortedOrders(validOrders);
      setIsMapReady(true);
    }, 100); // Small delay to prevent rapid updates

    return () => clearTimeout(timeoutId);
  }, [orders]);
  console.log(orders)
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Optimizing route...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        error={error}
        onRetry={() => {
          setError(null);
          setRetryTrigger(prev => prev + 1);
        }}
      />
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No delivery orders available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sortedOrders.length > 0 ? (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          // key={`map-${sortedOrders.length}`}
          style={styles.map}
          initialRegion={{
            latitude: storeLocation.latitude,
            longitude: storeLocation.longitude,
            ...GOOGLE_MAPS_CONFIG.DEFAULT_REGION,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          // loadingEnabled={true}
          onMapReady={() => {
            console.log('Map is ready');
          }}
          onError={(mapError) => {
            console.error('MapView Error:', mapError);
          }}>
          <Marker coordinate={storeLocation} title="Store" pinColor="green" />

          {sortedOrders.map((order, index) => (
            <Marker
              key={order.id}
              coordinate={{ latitude: order.latitude, longitude: order.longitude }}
              title={`Stop ${index + 1}`}
              description={`Order ID: ${order.id}`}
              pinColor={index === 0 ? 'orange' : 'red'}
            />
          ))}

          {sortedOrders.length > 0 && (
            <MapViewDirections
              // key={`route-${sortedOrders.length}-${sortedOrders[0]?.id}`}
              origin={storeLocation}
              destination={
                sortedOrders.length === 1
                  ? {
                    latitude: sortedOrders[0].latitude,
                    longitude: sortedOrders[0].longitude,
                  }
                  : {
                    latitude: sortedOrders[sortedOrders.length - 1].latitude,
                    longitude: sortedOrders[sortedOrders.length - 1].longitude,
                  }
              }
              waypoints={
                sortedOrders.length > 1
                  ? sortedOrders.slice(0, -1).map(o => ({
                    latitude: o.latitude,
                    longitude: o.longitude,
                  }))
                  : []
              }
              apikey={GOOGLE_MAPS_CONFIG.API_KEY}
              strokeWidth={4}
              strokeColor="#007AFF"
              // strokeColors={['#007AFF']}
              optimizeWaypoints={false}
              onStart={params => {
                console.log(
                  `Started routing between "${params.origin}" and "${params.destination}"`,
                );
              }}
              // onReady={result => {
              //   console.log(`Distance: ${result.distance} km`);
              //   console.log(`Duration: ${result.duration} min.`);
              // }}
              onReady={result => {
                console.log(`Distance: ${result.distance} km`);
                const edgePadding = { top: 50, right: 50, bottom: 50, left: 50 };
                mapRef.current.fitToCoordinates(result.coordinates, {
                  edgePadding,
                  animated: true,
                });
              }}
              onError={errorMessage => {
                console.error('MapViewDirections Error:', errorMessage);
                // Don't crash the app on routing errors
              }}
            />
          )}
        </MapView>
      )
        : (
          <MapView
            // key={'map-empty'}
            style={styles.map}
            initialRegion={{
              latitude: storeLocation.latitude,
              longitude: storeLocation.longitude,
              ...GOOGLE_MAPS_CONFIG.DEFAULT_REGION,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            // loadingEnabled={true}
            onMapReady={() => {
              console.log('Empty map is ready');
            }}>
            <Marker coordinate={storeLocation} title="Store" pinColor="green" />
          </MapView>
        )}

      <View style={styles.orderInfoContainer}>
        <Text style={styles.orderInfoText}>
          Total Orders: {sortedOrders.length}
        </Text>
        {sortedOrders.length > 0 && (
          <Text style={styles.orderInfoText}>
            Next Stop: {sortedOrders[0].id}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  orderInfoContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
  },
  orderInfoText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
});
