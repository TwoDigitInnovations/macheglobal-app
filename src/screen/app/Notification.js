import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Linking
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { GetApi, PostApi } from '../../Assets/Helpers/Service';
import Constants, { FONTS, SIZES } from '../../Assets/Helpers/constant';
import { NotificationIcon } from '../../../Theme';
import moment from 'moment';
import { LoadContext, ToastContext } from '../../../App';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native-paper';


const Notification = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getNotifications();
    });
    return unsubscribe;
  }, [navigation]);

  const getNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      setLoading(true);
      const response = await GetApi('notifications', '');
      console.log('Notifications API response:', response);
      
      if (response && response.data) {
        setNotifications(Array.isArray(response.data) ? response.data : []);
      } else {
        console.warn('Unexpected response format:', response);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setToast({
        show: true,
        message: error.response?.data?.message || 'Failed to load notifications',
        type: 'error',
        duration: 3000
      });
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await PostApi(`notifications/${notificationId}/read`, {});
      // Update local state to mark as read
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const renderOrderDetails = (order) => {
    if (!order) return null;
    
    // Format order ID to show last 6 characters for better readability
    const formatOrderId = (id) => {
      if (!id) return 'N/A';
      return `#${id.slice(-6).toUpperCase()}`;
    };

    return (
      <View style={styles.orderContainer}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.orderInfo}>
          <Text style={styles.orderText}>
            <Text style={{fontFamily: FONTS.SemiBold}}>Order ID:</Text> {formatOrderId(order.orderId || order._id)}
          </Text>
          <Text style={styles.orderText}>
            <Text style={{fontFamily: FONTS.SemiBold}}>Total:</Text> ${order.totalPrice?.toLocaleString('en-IN')}
          </Text>
          <Text style={[
            styles.orderText,
            {color: order.isDelivered ? 'green' : order.isShipped ? 'orange' : 'blue'}
          ]}>
            <Text style={{color: Constants.darkGray}}>Status: </Text>
            {order.isDelivered ? 'Delivered' : order.isShipped ? 'Shipped' : 'Processing'}
          </Text>
        </View>
      </View>
    );
  };

  const renderSuggestedProducts = (products) => {
    if (!products || products.length === 0) return null;
    
    // Function to get the first available image from product
    const getProductImage = (product) => {
      // Check for variants with images first
      if (product.varients && product.varients.length > 0 && product.varients[0].image && product.varients[0].image.length > 0) {
        return product.varients[0].image[0];
      }
      // Check for direct image array
      if (product.images && product.images.length > 0) {
        return typeof product.images[0] === 'string' ? product.images[0] : (product.images[0].url || 'https://via.placeholder.com/100');
      }
      // Check for single image property
      if (product.image) {
        return product.image;
      }
      // Default placeholder
      return 'https://via.placeholder.com/100';
    };

    // Function to get the price
    const getProductPrice = (product) => {
      // Check for variants with selected price
      if (product.varients && product.varients.length > 0 && product.varients[0].selected && product.varients[0].selected.length > 0) {
        return product.varients[0].selected[0].price || 0;
      }
      // Check for direct price
      if (product.price) {
        return product.price;
      }
      // Check for offer price
      if (product.offerprice) {
        return product.offerprice;
      }
      return 0;
    };

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.sectionTitle}>You Might Also Like</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsScrollView}
        >
          {products.map((product) => (
            <TouchableOpacity 
              key={product._id} 
              style={styles.productCard}
              onPress={() => navigation.navigate('Preview', { 
                slug: product.slug || product._id,
                id: product._id 
              })}
            >
              <Image 
                source={{ uri: getProductImage(product) }} 
                style={styles.productImage} 
                resizeMode="cover"
                defaultSource={{uri: 'https://via.placeholder.com/100'}}
              />
              <Text style={styles.productName} numberOfLines={1}>
                {product.name || 'Product'}
              </Text>
              <Text style={styles.productPrice}>
                ${getProductPrice(product).toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader showback={true} item={t("My Notifications")} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Constants.saffron} />
          <Text style={styles.loadingText}>Loading your notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <NotificationIcon width={80} height={80} color={Constants.lightGray} />
          <Text style={styles.emptyTitle}>No Notifications Yet</Text>
          <Text style={styles.emptySubtitle}>We'll notify you when something new arrives</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.notificationItem,
                !item.isRead && styles.unreadNotification
              ]}
              onPress={() => markAsRead(item._id)}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.iconContainer}>
                  <NotificationIcon height={22} color={Constants.white} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationMessage}>{item.message}</Text>
                  <Text style={styles.notificationTime}>
                    {moment(item.createdAt).format('DD MMM, hh:mm A')}
                  </Text>
                </View>
              </View>
              
              {item.order && renderOrderDetails(item.order)}
              {item.suggestedProducts && item.suggestedProducts.length > 0 && 
                renderSuggestedProducts(item.suggestedProducts)
              }
              
              {item.type === 'order' && (
                <TouchableOpacity 
                  style={styles.viewOrderButton}
                  onPress={() => navigation.navigate('Orderview', { id: item.order?._id })}
                >
                  <Text style={styles.viewOrderText}>View Order</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Constants.darkGray,
    fontFamily: FONTS.Regular,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    color: Constants.black,
    fontFamily: FONTS.SemiBold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Constants.gray,
    fontFamily: FONTS.Regular,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: Constants.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: Constants.saffron,
  },
  notificationHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Constants.saffron,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
    color: Constants.black,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
    color: Constants.gray,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: FONTS.Regular,
    color: Constants.lightGray,
  },
  orderContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Constants.lightBackground,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
    color: Constants.black,
    marginBottom: 8,
  },
  orderInfo: {
    marginLeft: 8,
  },
  orderText: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
    color: Constants.darkGray,
    marginBottom: 4,
  },
  suggestionsContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  productsScrollView: {
    paddingVertical: 8,
  },
  productCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: Constants.white,
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  productName: {
    fontSize: 12,
    fontFamily: FONTS.Medium,
    color: Constants.black,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontFamily: FONTS.SemiBold,
    color: Constants.saffron,
  },
  viewOrderButton: {
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: Constants.saffron,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewOrderText: {
    color: Constants.white,
    fontFamily: FONTS.Medium,
    fontSize: 14,
  },
});
