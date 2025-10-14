import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator, 
  FlatList,
  StyleSheet,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Post } from '../../Assets/Helpers/Service';


export default function SellerOrdersScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  
  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      
      const response = await Post('product/getOrderBySeller', {});
      
      console.log('Orders API Response:', response);
      
      if (response?.status === true && Array.isArray(response?.data)) {
        // Map the API response to match our UI structure
        const formattedOrders = response.data.map(order => ({
          id: order._id,
          orderNumber: order.orderId,
          customerName: order.user?.name || 'Customer',
          date: order.createdAt,
          amount: order.totalPrice,
          status: order.isDelivered ? 'delivered' : 'processing',
          items: order.orderItems?.map(item => ({
            id: item._id || item.product?._id,
            product: item.product, // Include the full product object
            name: item.name || item.product?.name,
            price: item.price || item.product?.price,
            quantity: item.quantity || item.qty,
            image: item.image || item.product?.image // Include the image
          })) || [],
          orderStatus: order.isDelivered ? 'delivered' : 'processing',
          paymentStatus: order.isPaid ? 'paid' : 'pending',
          paymentMethod: order.paymentMethod,
          shippingAddress: order.shippingAddress
        }));
        
        setOrders(formattedOrders);
      } else {
        console.log('No orders found or invalid response format');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error === 'No internet connection') {
        Alert.alert('No Internet', 'Please check your internet connection');
      } else {
        Alert.alert('Error', 'Failed to load orders. Please try again.');
      }
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load orders on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(false);
  }, []);

  const handleOrderPress = (order) => {
    console.log('=== Order Pressed ===');
    console.log('Order ID:', order.id || order._id);
    console.log('Order Data:', JSON.stringify(order, null, 2));
    
    // Navigate to order details with order data
    console.log('Navigating to OrderDetails...');
    navigation.navigate('OrderDetails', { 
      orderId: order.id || order._id, 
      orderData: order 
    });
    
    console.log('Navigation called');
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    
    switch(normalizedStatus) {
      case 'delivered':
      case 'completed':
        return {
          bg: styles.statusDeliveredBg,
          text: styles.statusDeliveredText
        };
      case 'processing':
      case 'pending':
      case 'confirmed':
        return {
          bg: styles.statusPendingBg,
          text: styles.statusPendingText
        };
      case 'shipped':
      case 'out for delivery':
        return {
          bg: styles.statusShippedBg,
          text: styles.statusShippedText
        };
      case 'cancelled':
      case 'rejected':
        return {
          bg: styles.statusCancelledBg,
          text: styles.statusCancelledText
        };
      default:
        return {
          bg: styles.statusDefaultBg,
          text: styles.statusDefaultText
        };
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  const renderOrderItem = ({ item }) => {
    const statusColors = getStatusColor(item.status || item.orderStatus);
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderRow}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber} numberOfLines={1}>
              {item.orderNumber || item.orderId || `#${item.id || item._id}`}
            </Text>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customerName || item.userName || item.user?.name || 'Customer'}
            </Text>
            <Text style={styles.orderDate}>
              {formatDate(item.date || item.orderDate || item.createdAt)}
            </Text>
            {item.items?.length > 0 && (
              <Text style={styles.itemCount}>
                {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
              </Text>
            )}
          </View>
          
          <View style={styles.orderRight}>
            <Text style={styles.orderAmount}>
              {formatAmount(item.amount || item.totalAmount || item.total)}
            </Text>
            <View style={[styles.statusBadge, statusColors.bg]}>
              <Text style={[styles.statusText, statusColors.text]} numberOfLines={1}>
                {item.status || item.orderStatus || 'Pending'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id?.toString() || item._id?.toString() || Math.random().toString()}
        contentContainerStyle={orders.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              Your orders will appear here once customers place orders
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40, 
  },
  orderCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
    marginRight: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusDeliveredBg: {
    backgroundColor: '#D1FAE5',
  },
  statusDeliveredText: {
    color: '#065F46',
  },
  statusPendingBg: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    color: '#92400E',
  },
  statusShippedBg: {
    backgroundColor: '#DBEAFE',
  },
  statusShippedText: {
    color: '#1E40AF',
  },
  statusCancelledBg: {
    backgroundColor: '#FEE2E2',
  },
  statusCancelledText: {
    color: '#991B1B',
  },
  statusDefaultBg: {
    backgroundColor: '#E5E7EB',
  },
  statusDefaultText: {
    color: '#374151',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});