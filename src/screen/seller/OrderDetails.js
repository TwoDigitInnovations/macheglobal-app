import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
  SafeAreaView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { GetApi } from '../../Assets/Helpers/Service';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';

const OrderDetails = () => {
  console.log('OrderDetails component rendered');
  const route = useRoute();
  const navigation = useNavigation();
  
  // Log the route params to see what we're receiving
  console.log('Route params:', route.params);
  
  const [order, setOrder] = useState(route.params?.orderData || null);
  const [loading, setLoading] = useState(!route.params?.orderData);
  const orderId = route.params?.orderId;
  
  console.log('Initial state - order:', order ? 'exists' : 'null', 'loading:', loading);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching order details for orderId:', orderId);
      const response = await GetApi(`orders/details/${orderId}`);
      
      // Log the complete response in a readable format
      console.log('=== Order Details API Response ===');
      console.log('Status:', response?.status);
      console.log('Data:', response?.data);
      console.log('Full Response Object:', JSON.stringify(response, null, 2));
      console.log('=================================');
      
      if (response?.status === true && response.data) {
        console.log('Order data received, updating state...');
        setOrder(response.data);
      } else {
        Alert.alert('Error', 'Failed to fetch order details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we don't already have the order data
    if (orderId && !order) {
      fetchOrderDetails();
    } else if (!orderId && !order) {
      Alert.alert('Error', 'No order data available');
      navigation.goBack();
    }
  }, [orderId, order]);

  const handleCallCustomer = (phone) => {
    if (!phone) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'delivered':
        return '#10B981';
      case 'shipped':
        return '#3B82F6';
      case 'processing':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMM yyyy, hh:mm a');
    } catch (error) {
      return dateString;
    }
  };

  if (loading && !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text>Unable to load order details</Text>
      </View>
    );
  }

  // Ensure we have valid order data
  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No order data available</Text>
      </View>
    );
  }

  // Format order items to ensure they have all required fields
  const formatOrderItems = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => ({
      id: item.id?._id || item._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1, // Default to 1 if quantity is missing
      image: item.image
    }));
  };

  // Get order details with fallbacks
  const orderDetails = {
    orderNumber: order.orderNumber || `#${order.id || order._id}`,
    status: order.status || order.orderStatus || 'processing',
    date: order.date || order.createdAt,
    items: formatOrderItems(order.items || order.orderItems),
    paymentStatus: order.paymentStatus || (order.isPaid ? 'paid' : 'pending'),
    paymentMethod: order.paymentMethod || 'N/A',
    shippingAddress: order.shippingAddress || {},
    total: order.amount || order.totalPrice || 0,
    subTotal: order.amount || order.totalPrice || 0, 
    shipping: 0, 
    tax: 0 
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Order Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusHeader}>
            <Text style={styles.orderNumber}>Order {orderDetails.orderNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orderDetails.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(orderDetails.status) }]}>
                {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.orderDate}>
            {formatDate(orderDetails.date)}
          </Text>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressContainer}>
            <Icon name="location-on" size={20} color="#6B7280" style={styles.icon} />
            <View>
              <Text style={styles.addressName}>{orderDetails.shippingAddress.name || 'N/A'}</Text>
              <Text style={styles.addressText}>
                {`${orderDetails.shippingAddress.address || ''}, ${orderDetails.shippingAddress.city || ''}, ${orderDetails.shippingAddress.postalCode || ''}`}
              </Text>
              <Text style={styles.addressText}>
                {orderDetails.shippingAddress.country || ''}
              </Text>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => handleCallCustomer(orderDetails.shippingAddress.phone)}
              >
                <Icon name="phone" size={16} color="#3B82F6" />
                <Text style={styles.contactButtonText}>
                  {orderDetails.shippingAddress.phone || 'N/A'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({orderDetails.items.length})</Text>
          {orderDetails.items.map((item, index) => {
            // Get the image URL - check multiple possible locations
            const imageUrl = item.image || 
                           item.product?.image || 
                           (item.product?.images && item.product.images[0]);
            
            // Debug log
            console.log('Order Item Details:', {
              itemId: item.id || item._id,
              name: item.name || item.product?.name,
              imageUrl,
              item: JSON.stringify(item, null, 2)
            });
            
            // Construct the full image URL
            let imageSource = null;
            if (imageUrl) {
              if (typeof imageUrl === 'string') {
                if (imageUrl.startsWith('http')) {
                  imageSource = { uri: imageUrl };
                } else if (imageUrl.startsWith('uploads/')) {
                  imageSource = { uri: `http://192.168.56.1:3003/${imageUrl}` };
                } else {
                  imageSource = { uri: `http://192.168.56.1:3003/uploads/${imageUrl}` };
                }
              } else if (imageUrl.url) {
                // Handle case where image is an object with url property
                imageSource = { uri: imageUrl.url };
              }
            }
            
            return (
              <View key={item.id || index} style={styles.orderItem}>
                <View style={styles.itemImageContainer}>
                  {imageSource ? (
                    <Image 
                      source={imageSource}
                      style={styles.itemImage} 
                      resizeMode="cover"
                      onError={(error) => {
                        console.log('Image load error:', {
                          error,
                          imageSource,
                          originalUrl: imageUrl,
                          item: JSON.stringify(item, null, 2)
                        });
                      }}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Icon name="image" size={30} color="#9CA3AF" />
                    </View>
                  )}
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name || item.product?.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ${item.price?.toFixed(2)} × {item.quantity || item.qty || 1}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ${((item.price || 0) * (item.quantity || item.qty || 1)).toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${orderDetails.subTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>
              {orderDetails.shipping > 0 ? `$${orderDetails.shipping.toFixed(2)}` : 'Free'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${orderDetails.tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${orderDetails.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.paymentInfo}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Method:</Text>
              <Text style={styles.paymentValue}>
                {orderDetails.paymentMethod === 'wallet' ? 'Wallet' : 
                 orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                 orderDetails.paymentMethod}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Status:</Text>
              <View style={[styles.paymentStatus, 
                { backgroundColor: orderDetails.paymentStatus === 'paid' ? '#D1FAE5' : '#FEE2E2' }]}>
                <Text style={[
                  styles.paymentStatusText,
                  { color: orderDetails.paymentStatus === 'paid' ? '#065F46' : '#B91C1C' }
                ]}>
                  {orderDetails.paymentStatus.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

      
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  contactButtonText: {
    color: '#3B82F6',
    marginLeft: 6,
    fontWeight: '500',
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    alignSelf: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  paymentInfo: {
    marginTop: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default OrderDetails;
