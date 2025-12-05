/* eslint-disable quotes */
/* eslint-disable react/no-unstable-nested-components */
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { OrderIcon, SearchIcon } from '../../../Theme';
import { navigate } from '../../../navigationRef';
import { useIsFocused } from '@react-navigation/native';
import { ApiFormData, GetApi, Post } from '../../Assets/Helpers/Service';
import { LoadContext, ToastContext, UserContext } from '../../../App';
import moment from 'moment';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dropdown } from 'react-native-element-dropdown';
import Toast from 'react-native-toast-message';
import MultiImageUpload from '../../Assets/Component/MultiImageUpload';
import { Image as ImageCompressor } from 'react-native-compressor';
import i18n from 'i18next';
import { RefreshControl } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native-paper';

const Myorder = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [orderlist, setorderlist] = useState([]);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [user, setuser] = useContext(UserContext);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alredyfavorite, setalredyfavorite] = useState(false);
  const [curentData, setCurrentData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [id, setId] = useState(null);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [ratingModal, setRatingModal] = useState(false);
  const [modalText, setModalText] = useState({
    carBrand: '',
    carColor: '',
    parkingNo: '',
  });
  const [modalData, setModalData] = useState({
    productId: null,
    orderId: null,
    productName: '',
    productImage: '',
  });
  const IsFocused = useIsFocused();
  const dumydata = [1, 2, 3];
  const insets = useSafeAreaInsets();
  const [ratingData, setRatingData] = useState({
    review: '',
    images: [],
  });
  const [reviewedProducts, setReviewedProducts] = useState(new Set());

  // Check if product is already reviewed
  const checkIfReviewed = async (productId) => {
    try {
      const response = await GetApi('reviews/me', {});
      if (response?.success && response?.data) {
        const reviewedIds = response.data.map(review => review.product?._id || review.product);
        setReviewedProducts(new Set(reviewedIds));
      }
    } catch (error) {
      console.error('Error checking reviews:', error);
    }
  };

  const getorders = (p, isRefreshing = false, text = '', favorite = false) => {
    setLoadingMore(p > 1);
    let url;
    let queryParams = `page=${p}&limit=10`;
    
    if (text) {
      queryParams += `&search=${encodeURIComponent(text)}`;
    }
    if (favorite) {
      queryParams += '&filter=favorite';
    }
    
    url = `orders/myorders?${queryParams}`;
    
    console.log('Fetching orders from:', url);
    
    GetApi(url, {})
      .then(response => {
        console.log('API Response:', JSON.stringify(response, null, 2));
        
        // If response is an array, handle as direct array response
        if (Array.isArray(response)) {
          console.log('Received array response, setting as orders');
          setorderlist(response);
          setCurrentData(response);
          setHasMore(false);
          return;
        }
        
        // Handle paginated response
        const ordersData = response.data || [];
        const totalPages = response.totalPages || 1;
        
        console.log('Orders data:', ordersData);
        console.log(`Current page: ${p}, Total pages: ${totalPages}`);
        
        setHasMore(p < totalPages);
        setPage(p);
        
        if (p === 1 || isRefreshing) {
          setorderlist(ordersData);
          setCurrentData(ordersData);
        } else {
          setorderlist(prevOrders => {
            // Filter out duplicates based on order ID
            const existingIds = new Set(prevOrders.map(item => item._id));
            const newOrders = ordersData.filter(item => !existingIds.has(item._id));
            return [...prevOrders, ...newOrders];
          });
        }
      })
      .catch(err => {
        console.error('Error fetching orders:', err);
        setToast({
          type: 'error',
          message: 'Failed to fetch orders. Please try again.',
          visible: true,
        });
      })
      .finally(() => {
        setLoadingMore(false);
        setRefreshing(false);
        setLoading(false);
      });
  };
  
  useEffect(() => {
    if (IsFocused) {
      getorders(1);
      setalredyfavorite(false);
      checkIfReviewed();
    }
  }, [IsFocused]);
  const fetchNextPage = () => {
    if (!loadingMore && hasMore) {
      console.log('Loading more orders, current page:', page);
      getorders(page + 1);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    getorders(1, '', false, true);
  };
  const rating = (productId, review, images) => {
    const d = {
      product: productId,
      description: review,
      images: images,
    };
    console.log(d);
    setLoading(true);
    Post('/giverate', d).then(async res => {
      setLoading(false);
      console.log(res);
      Toast.show({
        type: 'success',
        text1: res.data.message || 'Successfully submitted review',
      })
      setRatingModal(false);
      setId(null);
      setRatingData({
        review: '',
        images: [],
      });
      setModalData({
        productId: null,
        orderId: null,
        productName: '',
        productImage: '',
      });
      getorders(1);
    });
  };
  const reorder = id => {
    setLoading(true);
    Post(`order/re-order/${id}`).then(async res => {
      setLoading(false);
      console.log(res);
      getorders(1);
    });
  };
  const setfavorite = id => {
    setLoading(true);
    Post(`order/favorite/${id}`).then(async res => {
      setLoading(false);
      console.log(res);
      if (res.success) {
        setToast(res?.message);
        getorders(1);
      }
    });
  };

  const cancelOrder = id => {
    setLoading(true);
    const data = { id };
    Post(`cancalOrder`, data)
      .then(async res => {
        setLoading(false);
        console.log(res);
        setToast(res?.message || t('Order cancelled successfully'));
        getorders(1);
      })
      .catch(err => {
        setLoading(false);
        console.error(err);
        Toast.show({
          type: 'error',
          text1: t('Failed to cancel order'),
        })
      });
  };

  let secretCode1 = Math.floor(1000 + Math.random() * 9000);

  const getSecrectCode = id => {
    const data = {
      id: id,
      SecretCode: secretCode1,
    };

    console.log(data);
    setLoading(true);
    Post('getSecrectCode', data)
      .then(async res => {
        setLoading(false);
        console.log(res);
        if (res.status) {
          setToast(t('Secret code sent successfully'));
          getorders(1);
        } else {
          setToast(t('Failed to get secret code'));
        }
      })
      .catch(err => {
        setLoading(false);
        console.error(err);
        Toast.show({
          type: 'error',
          text1: t('Failed to get secret code'),
        })
      });
  };

  const handleSubmit = () => {
    const data = {
      id: id,
      parkingNo: modalText.parkingNo,
      carBrand: modalText.carBrand,
      carColor: modalText.carColor,
      SecretCode: secretCode1,
    };

    console.log(data);
    setLoading(true);
    Post('updateProductRequest', data)
      .then(async res => {
        setLoading(false);
        console.log(res);
        setModalVisible(false);
        setId(null);
        setModalText({
          carBrand: '',
          carColor: '',
          parkingNo: '',
        });
        if (res.status) {
          setToast(t('Secret code sent successfully'));
          getorders(1);
        } else {
          setToast(t('Failed to get secret code'));
        }
      })
      .catch(err => {
        setLoading(false);
        console.error(err);
        Toast.show({
          type: 'error',
          text1: t('Failed to get secret code'),
        })
      });
  };

  function formatDate2(dateInput) {
    const date = new Date(dateInput);
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-GB', options);
  }

  const addBusinessDays = (date, businessDaysToAdd) => {
    const result = new Date(date);
    let addedDays = 0;

    while (addedDays < businessDaysToAdd) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) {
        // 0 = Sunday, 6 = Saturday
        addedDays++;
      }
    }

    return result;
  };

  const ReturnOrder = () => {
    setLoading(true);
    const data = { id };
    Post(`RequestForReturn`, data)
      .then(async res => {
        setLoading(false);
        console.log(res);
        if (res.status) {
          setToast(res?.message || t('Order returned successfully'));
          getorders(1);
        } else {
          setToast(t('Failed to return order'));
        }
        setModalVisible2(false);
        setId(null);
      })
      .catch(err => {
        setLoading(false);
        console.error(err);
        Toast.show({
          type: 'error',
          text1: t('Failed to return order'),
        })
        setModalVisible2(false);
        setId(null);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item={t('My Order')} showback={true} />
      
      <View style={{ paddingHorizontal: 16, flex: 1 }}>
        <FlatList
          data={orderlist}
          onEndReached={fetchNextPage}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            loadingMore ? (
              <View style={{ padding: 15, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#FF7000" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF7000']}
              tintColor="#FF7000"
            />
          }
          keyExtractor={(item, index) => item._id + index.toString()}
          ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
              <View style={{ 
                backgroundColor: '#FFF7ED', 
                padding: 24, 
                borderRadius: 100,
                marginBottom: 8 
              }}>
                <OrderIcon height={48} width={48} color="#FF7000" />
              </View>
              <Text style={styles.emptyStateText}>
                {!orderlist ? t('Loading...') : t('No Orders')}
              </Text>
              <Text style={[styles.qty, { marginTop: 8, textAlign: 'center' }]}>
                {t('Your order history will appear here')}
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 12 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.card, { marginBottom: orderlist.length === index + 1 ? 20 : 0 }]}
              activeOpacity={0.7}
              onPress={() => navigate('Orderview', { id: item?._id })}>
              
              {/* Header Section */}
              <View style={{
                flexDirection: 'row',
                marginBottom: 12,
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <View style={{ flexDirection: 'row', flex: 1, marginRight: 12 }}>
                  <View style={styles.ordiccov}>
                    <OrderIcon color="#FFFFFF" />
                  </View>
                  <View style={{ flexDirection: 'column', marginLeft: 12, flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={styles.txt1}>#{item?._id?.substring(0, 8)}</Text>
                      <Text style={[styles.txt2, { color: '#6B7280', fontSize: 12 }]}>
                        {moment(item?.createdAt).format('MMM D, YYYY h:mm A')}
                      </Text>
                    </View>
                    
                    {/* Delivery Address */}
                    {item?.shippingAddress && (
                      <View style={styles.addressContainer}>
                        <Text style={styles.addressText} numberOfLines={1}>
                          {item.shippingAddress.name} • {item.shippingAddress.phone}
                        </Text>
                        <Text style={styles.addressText} numberOfLines={1}>
                          {item.shippingAddress.address}, {item.shippingAddress.city}, {item.shippingAddress.country} - {item.shippingAddress.postalCode}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.deliveryTypeContainer}>
                      <Text style={[styles.txt2, { fontSize: 12 }]}>
                        {item?.isOrderPickup
                          ? t('In Store Pickup')
                          : item?.isDriveUp
                            ? t('Curbside Pickup')
                            : item?.isLocalDelivery
                              ? t('Next Day Local Delivery')
                              : item?.isShipmentDelivery
                                ? t('Shipping')
                                : t('Delivery')}
                      </Text>
                      <Text style={[styles.txt2, { fontSize: 12, marginLeft: 8 }]}>
                        • {item?.orderItems?.length || 0} {item?.orderItems?.length === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
  
              {/* Products Section with Dropdown */}
              <View style={{ marginVertical: 8 }}>
                {/* First Product - Always Visible */}
                {item?.orderItems?.[0] && (
                  <View style={styles.productContainer}>
                    <Image
                      source={
                        item.orderItems[0]?.image
                          ? { uri: item.orderItems[0].image }
                          : require('../../Assets/Images/veg.png')
                      }
                      style={styles.cartimg}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, marginLeft: 12, justifyContent: 'space-between' }}>
                      <View>
                        <Text style={styles.boxtxt} numberOfLines={2}>
                          {i18n.language === 'vi' 
                            ? (item.orderItems[0]?.product?.vietnamiesName || item.orderItems[0]?.name) 
                            : (item.orderItems[0]?.name || item.orderItems[0]?.product?.name)}
                        </Text>
                      </View>
                      
                      {/* Price and Rate Button Row */}
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 8,
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{
                            backgroundColor: '#F3F4F6',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 8,
                            marginRight: 8,
                          }}>
                            <Text style={styles.boxtxt2}>
                              {t('Qty')}: {item.orderItems[0]?.qty}
                            </Text>
                          </View>
                          <Text style={styles.boxtxt3}>
                            {Currency} {Number(item.orderItems[0]?.price ?? 0).toFixed(2)}
                          </Text>
                        </View>
                        
                       
                        {(item?.orderStatus !== 'delivered' && item?.orderStatus !== 'completed') && (
                          <TouchableOpacity
                            onPress={() => {
                              const productId = item.orderItems[0]?.product?._id || item.orderItems[0]?._id;
                              const isReviewed = reviewedProducts.has(productId);
                              
                              navigation.navigate('ReviewScreen', {
                                orderId: item._id,
                                product: {
                                  _id: productId,
                                  name: item.orderItems[0]?.name || item.orderItems[0]?.product?.name,
                                  images: item.orderItems[0]?.image ? [{ url: item.orderItems[0].image }] : []
                                },
                                isUpdate: isReviewed
                              });
                            }}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              backgroundColor: '#FF7000',
                              borderRadius: 6,
                              minWidth: 100,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            <Text style={{ 
                              fontSize: 12,
                              color: '#FFFFFF',
                              fontWeight: '600',
                            }}>
                              {reviewedProducts.has(item.orderItems[0]?.product?._id || item.orderItems[0]?._id) 
                                ? t('Update Rating') 
                                : t('Rate Product')}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                )}
  
                {/* Show More Products Dropdown */}
                {item?.orderItems?.length > 1 && (
                  <View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setorderlist(prevOrders => {
                          return prevOrders.map(order => {
                            if (order._id === item._id) {
                              return {
                                ...order,
                                showAllProducts: !order.showAllProducts
                              };
                            }
                            return order;
                          });
                        });
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#FFF7ED',
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 10,
                        marginTop: 8,
                        borderWidth: 1,
                        borderColor: '#FF7000',
                        borderStyle: 'dashed',
                      }}>
                      <Text style={{
                        color: '#FF7000',
                        fontSize: 14,
                        fontFamily: FONTS.Bold,
                        marginRight: 8,
                      }}>
                        {item.showAllProducts 
                          ? t('Hide Products') 
                          : `${t('View')} ${item.orderItems.length - 1} ${t('More Products')}`}
                      </Text>
                      <Text style={{
                        color: '#FF7000',
                        fontSize: 16,
                        transform: [{ rotate: item.showAllProducts ? '180deg' : '0deg' }],
                      }}>
                        ▼
                      </Text>
                    </TouchableOpacity>
  
                    {/* Additional Products */}
                    {item.showAllProducts && item.orderItems.slice(1).map((prod, prodIndex) => (
                      <View key={prodIndex + 1} style={[styles.productContainer, { marginTop: 8 }]}>
                        <Image
                          source={
                            prod?.image
                              ? { uri: prod.image }
                              : require('../../Assets/Images/veg.png')
                          }
                          style={styles.cartimg}
                          resizeMode="cover"
                        />
                        <View style={{ flex: 1, marginLeft: 12, justifyContent: 'space-between' }}>
                          <View>
                            <Text style={styles.boxtxt} numberOfLines={2}>
                              {i18n.language === 'vi' 
                                ? (prod?.product?.vietnamiesName || prod?.name) 
                                : (prod?.name || prod?.product?.name)}
                            </Text>
                          </View>
  
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 8,
                          }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{
                                backgroundColor: '#F3F4F6',
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 8,
                                marginRight: 8,
                              }}>
                                <Text style={styles.boxtxt2}>
                                  {t('Qty')}: {prod?.qty}
                                </Text>
                              </View>
                              <Text style={styles.boxtxt3}>
                                {Currency} {Number(prod?.price ?? 0).toFixed(2)}
                              </Text>
                            </View>
  
                            {/* Rate Product Button for additional products */}
                            {(item?.orderStatus !== 'delivered' && item?.orderStatus !== 'completed') && (
                              <TouchableOpacity
                                onPress={() => {
                                  const productId = prod?.product?._id || prod?._id;
                                  const isReviewed = reviewedProducts.has(productId);
                                  
                                  navigation.navigate('ReviewScreen', {
                                    orderId: item._id,
                                    product: {
                                      _id: productId,
                                      name: prod?.name || prod?.product?.name,
                                      images: prod?.image ? [{ url: prod.image }] : []
                                    },
                                    isUpdate: isReviewed
                                  });
                                }}
                                style={{
                                  paddingVertical: 8,
                                  paddingHorizontal: 12,
                                  backgroundColor: '#FF7000',
                                  borderRadius: 6,
                                  minWidth: 100,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                <Text style={{ 
                                  fontSize: 12,
                                  color: '#FFFFFF',
                                  fontWeight: '600',
                                }}>
                                  {reviewedProducts.has(prod?.product?._id || prod?._id)
                                    ? t('Update Rating')
                                    : t('Rate Product')}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
  
              {/* Footer Section */}
              <View style={styles.divider} />
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                {/* Order Summary */}
                <View style={{ flexDirection: 'column', gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.txt2, { fontSize: 13 }]}>{t('Total Items')}: </Text>
                    <Text style={[styles.txt3, { fontSize: 15 }]}>
                      {item?.orderItems?.reduce((total, orderItem) => total + (parseInt(orderItem.qty) || 0), 0)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.txt2, { fontSize: 13 }]}>{t('Total')}: </Text>
                    <Text style={styles.boxtxt3}>
                      {Currency} {Number(item?.totalPrice || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
  
                {/* Action Buttons Container */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                  {/* Payment Status Badge */}
                  {!item?.isPaid && (
                    <View style={[styles.infoCard, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.txt4, { color: '#92400E', fontWeight: '700' }]}>
                        💳 {t('Payment Pending')}
                      </Text>
                    </View>
                  )}
  
                  {/* Secret Code Display */}
                  {item?.SecretCode && (
                    <View style={styles.infoCard}>
                      <Text style={[styles.txt4, { color: '#FF7000', fontWeight: '700' }]}>
                        {t('Secret Code')}: {item?.SecretCode}
                      </Text>
                    </View>
                  )}
  
                  {/* Delivery Expected */}
                  {item?.isShipmentDelivery && !item?.isDelivered && (
                    <View style={[styles.infoCard, { minWidth: 200 }]}>
                      <Text style={[styles.txt4, { fontWeight: '700', marginBottom: 4 }]}>
                        {t('Delivery Expected')}
                      </Text>
                      <Text style={styles.txt4}>
                        {formatDate2(addBusinessDays(new Date(item.createdAt), 5))} 11 PM
                      </Text>
                      {item?.trackingNo && (
                        <View style={{ marginTop: 6 }}>
                          <Text style={[styles.txt2, { fontSize: 12 }]}>
                            {t('Tracking')}: {item?.trackingNo}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
  
                  {/* Cancel Order Button */}
                  {(() => {
                    const createdTime = new Date(item.createdAt);
                    const now = new Date();
                    const diffInMinutes = (now - createdTime) / (1000 * 60);
                    return !item?.isPaid && !item?.isDelivered && diffInMinutes <= 15;
                  })() && (
                    <Pressable
                      onPress={() => cancelOrder(item._id)}
                      style={({ pressed }) => [
                        styles.cancelButton,
                        { opacity: pressed ? 0.85 : 1 }
                      ]}>
                      <Text style={styles.actionButtonText}>
                        {t('Cancel Order')}
                      </Text>
                    </Pressable>
                  )}
  
                  {/* I'm Here Buttons */}
                  {!item?.isDelivered &&
                    (item?.isDriveUp || item?.isOrderPickup) &&
                    item?.createdAt &&
                    new Date() - new Date(item?.createdAt) >= 30 * 60 * 1000 && (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {item?.isDriveUp && (
                          <Pressable
                            onPress={() => {
                              setId(item?._id);
                              setModalVisible(true);
                            }}
                            style={({ pressed }) => [
                              styles.secondaryButton,
                              { opacity: pressed ? 0.85 : 1 }
                            ]}>
                            <Text style={styles.actionButtonText}>
                              {item?.parkingNo
                                ? t('Update Parking Spot')
                                : t("I'm here")}
                            </Text>
                          </Pressable>
                        )}
  
                        {item?.isOrderPickup && (
                          <Pressable
                            onPress={() => getSecrectCode(item?._id)}
                            style={({ pressed }) => [
                              styles.secondaryButton,
                              { opacity: pressed ? 0.85 : 1 }
                            ]}>
                            <Text style={styles.actionButtonText}>
                              {t("I'm here")}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    )}
  
                  {/* Return Order Button */}
                  {item?.isDelivered &&
                    item?.deliveredAt &&
                    (item?.isShipmentDelivery || item?.isLocalDelivery) &&
                    (() => {
                      const deliveredTime = new Date(item?.deliveredAt).getTime();
                      const currentTime = new Date().getTime();
                      const hoursSinceDelivery = (currentTime - deliveredTime) / (1000 * 60 * 60);
                      return hoursSinceDelivery <= 24;
                    })() && (
                      <Pressable
                        onPress={() => {
                          setId(item?._id);
                          setModalVisible2(true);
                        }}
                        style={({ pressed }) => [
                          styles.cancelButton,
                          { opacity: pressed ? 0.85 : 1 }
                        ]}>
                        <Text style={styles.actionButtonText}>
                          {t('Return Order')}
                        </Text>
                      </Pressable>
                    )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
        
        {/* Modal for Parking Information */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setId(null);
          }}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View style={{ backgroundColor: 'white', width: '100%' }}>
                <Text style={[styles.txt, { textAlign: 'center' }]}>
                  {t('Parking Information')}
                </Text>
                
                <View style={styles.divider} />
                
                <Text style={styles.label}>{t('Car Brand')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('Enter Car brand')}
                  placeholderTextColor="#9CA3AF"
                  value={modalText?.carBrand}
                  onChangeText={carBrand => setModalText({ ...modalText, carBrand })}
                />
                
                <Text style={styles.label}>{t('Car Color')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('Enter Car color')}
                  placeholderTextColor="#9CA3AF"
                  value={modalText?.carColor}
                  onChangeText={carColor => setModalText({ ...modalText, carColor })}
                />
                
                <Text style={styles.label}>{t('Parking Pickup Spot')}</Text>
                <Dropdown
                  style={styles.input}
                  data={[1, 2, 3, 4, 5, 6].map(zip => ({
                    label: `Spot ${zip}`,
                    value: zip,
                  }))}
                  value={modalText?.parkingNo}
                  onChange={item => {
                    setModalText(prev => ({ ...prev, parkingNo: item.value }));
                  }}
                  placeholder={t('Select Parking spot')}
                  placeholderStyle={{ color: '#9CA3AF' }}
                  selectedTextStyle={{ color: Constants.black }}
                  maxHeight={200}
                  labelField="label"
                  valueField="value"
                  renderItem={item => (
                    <Text style={{ padding: 12, color: Constants.black }}>
                      {item.label}
                    </Text>
                  )}
                />
  
                <View style={styles.cancelAndLogoutButtonWrapStyle}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setModalVisible(false);
                      setId(null);
                      setModalText({ carBrand: '', carColor: '', parkingNo: '' });
                    }}
                    style={styles.logOutButtonStyle2}>
                    <Text style={styles.modalText2}>{t('Cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                    style={styles.logOutButtonStyle}>
                    <Text style={styles.modalText}>{t('Submit')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
  
        {/* Return Order Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible2}
          onRequestClose={() => {
            setModalVisible2(false);
            setId(null);
          }}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View style={{ backgroundColor: 'white', width: '100%', alignItems: 'center' }}>
                <View style={{
                  backgroundColor: '#FEE2E2',
                  padding: 16,
                  borderRadius: 100,
                  marginBottom: 16,
                }}>
                  <Text style={{ fontSize: 32 }}>⚠️</Text>
                </View>
                
                <Text style={[styles.txt, { textAlign: 'center', marginBottom: 8 }]}>
                  {t('Are you sure?')}
                </Text>
                <Text style={[styles.label, { textAlign: 'center', color: '#6B7280', fontWeight: '400' }]}>
                  {t('Do you really want to Return your order?')}
                </Text>
  
                <View style={styles.cancelAndLogoutButtonWrapStyle}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setModalVisible2(false);
                      setId(null);
                    }}
                    style={styles.logOutButtonStyle2}>
                    <Text style={styles.modalText2}>{t('No, keep it')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={ReturnOrder}
                    style={styles.logOutButtonStyle}>
                    <Text style={styles.modalText}>{t('Yes, Return it!')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
  
        {/* Review/Rating Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={ratingModal}
          onRequestClose={() => {
            setRatingModal(false);
            setId(null);
          }}>
          <View style={styles.centeredView}>
            <View style={[styles.modalView, { paddingTop: 20, maxHeight: '85%' }]}>
              <View style={{ backgroundColor: 'white', width: '100%' }}>
                {/* Modal Header */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                  marginBottom: 16,
                }}>
                  <Text style={[styles.txt, { marginVertical: 0, flex: 1 }]}>
                    {t('Review Product')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setRatingModal(false);
                      setModalData({
                        productId: null,
                        orderId: null,
                        productName: '',
                        productImage: '',
                      });
                      setId(null);
                      setRatingData({ review: '', images: [] });
                    }}
                    style={{
                      padding: 4,
                      backgroundColor: '#F3F4F6',
                      borderRadius: 8,
                    }}>
                    <Text style={{ fontSize: 18, color: '#6B7280' }}>✕</Text>
                  </TouchableOpacity>
                </View>
  
                {/* Product Name Badge */}
                <View style={{
                  backgroundColor: '#FFF7ED',
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  marginBottom: 20,
                  borderLeftWidth: 4,
                  borderLeftColor: '#FF7000',
                }}>
                  <Text style={[styles.label, { 
                    textAlign: 'center', 
                    color: '#FF7000',
                    fontSize: 16,
                  }]}>
                    {modalData?.productName}
                  </Text>
                </View>
  
                {/* Review Input Section */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={[styles.label, {
                    fontFamily: FONTS.Bold,
                    fontSize: 15,
                    marginBottom: 8,
                  }]}>
                    {t('Write your review')}
                  </Text>
                  <TextInput
                    style={[styles.input, { 
                      height: 120, 
                      textAlignVertical: 'top',
                      paddingTop: 12,
                      fontSize: 14,
                      lineHeight: 20,
                    }]}
                    placeholder={t('Share your experience with this product...')}
                    placeholderTextColor="#9CA3AF"
                    value={ratingData.review}
                    onChangeText={review => setRatingData({ ...ratingData, review })}
                    multiline={true}
                    numberOfLines={5}
                  />
                </View>
  
                {/* Image Upload Section */}
                <View style={{ marginBottom: 20 }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <Text style={[styles.label, {
                      fontFamily: FONTS.Bold,
                      fontSize: 15,
                    }]}>
                      {t('Upload Images')}
                    </Text>
                    <View style={{
                      backgroundColor: '#F3F4F6',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}>
                      <Text style={[styles.txt2, { fontSize: 12 }]}>
                        {ratingData.images.length}/6
                      </Text>
                    </View>
                  </View>
                  
                  <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderStyle: 'dashed',
                  }}>
                    <MultiImageUpload
                      maxImages={6}
                      onImagesUpload={async images => {
                        if (!images || images.length === 0) {
                          return;
                        }
  
                        if (ratingData.images.length + images.length > 6) {
                          Toast.show({
                            type: 'error',
                            text1: t("Maximum 6 images allowed"),
                          })
                          return;
                        }
  
                        for (let i = 0; i < images.length; i++) {
                          const image = images[i];
  
                          try {
                            setLoading(true);
  
                            const compressedImage = await ImageCompressor.compress(
                              image.uri || image,
                              {
                                compressionMethod: 'auto',
                                maxWidth: 800,
                                maxHeight: 800,
                                quality: 0.7,
                              },
                            );
  
                            const imageForUpload = {
                              uri: compressedImage,
                              type: image.type || 'image/jpeg',
                              fileName: image.fileName || 'compressed_image.jpg',
                            };
  
                            const result = await ApiFormData(imageForUpload);
  
                            if (result && result.status && result.data && result.data.file) {
                              setRatingData(prevData => ({
                                ...prevData,
                                images: [...prevData.images, result.data.file],
                              }));
                              Toast.show({
                                type: 'success',
                                text1: t("Image uploaded successfully"),
                              })
                              console.log('Image uploaded successfully:', result.data.file);
                            } else {
                              console.log('Upload failed for image:', image);
                              Toast.show({
                                type: 'error',
                                text1: t("Failed to upload image"),
                              })
                            }
                          } catch (error) {
                            console.log('Error uploading image:', error);
                            Toast.show({
                              type: 'error',
                              text1: t("Error uploading image"),
                            })
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                    />
                  </View>
                  <Text style={[styles.txt2, { 
                    fontSize: 12, 
                    marginTop: 8,
                    textAlign: 'center',
                  }]}>
                    {t('Add up to 6 photos to help others')}
                  </Text>
                </View>
  
                {/* Action Buttons */}
                <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setRatingModal(false);
                    setModalData({
                      productId: null,
                      orderId: null,
                      productName: '',
                      productImage: '',
                    });
                    setId(null);
                    setRatingData({ review: '', images: [] });
                  }}
                  style={styles.logOutButtonStyle2}>
                  <Text style={styles.modalText2}>{t('Cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (ratingData.review.trim() !== '') {
                      rating(
                        modalData.productId,
                        ratingData.review,
                        ratingData.images,
                      );
                    } else {
                      Toast.show({
                        type: 'error',
                        text1: t("Please write a review before submitting"),
                      })
                    }
                  }}
                  style={styles.logOutButtonStyle}>
                  <Text style={styles.modalText}>{t('Submit Review')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  </SafeAreaView>
);
};

export default Myorder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  addressContainer: {
    marginVertical: 6,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  deliveryTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  
  // Modern gradient header background
  toppart: {
    padding: 20,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#FF7000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  
  logoimg: {
    height: 44,
    width: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FF7000',
  },
  
  // Enhanced search container
  inpcov: {
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    height: 52,
  },
  
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: Constants.black,
    fontWeight: '500',
    borderRadius: 12,
    textAlign: 'left',
    fontSize: 15,
    fontFamily: FONTS.Regular,
    marginTop: 5,
    paddingHorizontal: 14,
    height: 48,
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  
  ordertxt: {
    color: Constants.black,
    fontSize: 22,
    fontFamily: FONTS.Bold,
    alignSelf: 'center',
    letterSpacing: 0.3,
  },
  
  // Premium card design
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  
  // Modern order icon container with gradient effect
  ordiccov: {
    height: 48,
    width: 48,
    backgroundColor: '#FF7000',
    borderRadius: 14,
    padding: 8,
    alignSelf: 'center',
    shadowColor: '#FF7000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // Enhanced typography
  txt1: {
    color: '#1F2937',
    fontSize: 16,
    fontFamily: FONTS.Bold,
    letterSpacing: 0.2,
    marginVertical: 2,
  },
  
  txt2: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: FONTS.Medium,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  
  txt3: {
    color: '#374151',
    fontSize: 15,
    fontFamily: FONTS.Bold,
    letterSpacing: 0.2,
  },
  
  txt4: {
    color: '#1F2937',
    fontSize: 13,
    fontFamily: FONTS.Medium,
    letterSpacing: 0.1,
  },
  
  txt: {
    color: '#1F2937',
    fontSize: 22,
    marginVertical: 10,
    fontFamily: FONTS.Bold,
    letterSpacing: 0.3,
  },
  
  label: {
    color: '#374151',
    fontSize: 15,
    fontFamily: FONTS.Medium,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  
  // Modern status badges with glassmorphism
  delevered: {
    color: Constants.white,
    fontSize: 13,
    fontFamily: FONTS.Bold,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    overflow: 'hidden',
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  
  // Enhanced product display
  cartimg: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  boxtxt: {
    color: '#1F2937',
    fontSize: 15,
    fontFamily: FONTS.Bold,
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  
  boxtxt2: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: FONTS.Medium,
    letterSpacing: 0.1,
  },
  
  boxtxt3: {
    color: '#FF7000',
    fontSize: 16,
    fontFamily: FONTS.Bold,
    letterSpacing: 0.2,
  },
  
  qty: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: FONTS.Medium,
    letterSpacing: 0.1,
  },
  
  favfiltxt: {
    color: '#FF7000',
    fontSize: 15,
    fontFamily: FONTS.Bold,
    letterSpacing: 0.3,
  },
  
  favfilcov: {
    borderWidth: 2,
    borderColor: '#FF7000',
    gap: 6,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
    marginTop: 10,
    marginRight: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    shadowColor: '#FF7000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  
  // Premium modal design
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
  },
  
  modalView: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  
  // Modern button styles
  cancelAndLogoutButtonWrapStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
    width: '100%',
  },
  
  logOutButtonStyle: {
    flex: 1,
    backgroundColor: '#FF7000',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  logOutButtonStyle2: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#FF7000',
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 15,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  
  modalText2: {
    color: '#FF7000',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 15,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  
  // Additional utility styles for enhanced UI
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  
  badge: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  
  badgeText: {
    color: '#FF7000',
    fontSize: 11,
    fontFamily: FONTS.Bold,
    letterSpacing: 0.5,
  },
  
  infoCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF7000',
  },
  
  actionButton: {
    backgroundColor: '#FF7000',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: '#FF7000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.Bold,
    letterSpacing: 0.3,
  },
  
  cancelButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  
  secondaryButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  
  emptyStateText: {
    color: '#6B7280',
    fontSize: 18,
    fontFamily: FONTS.Medium,
    marginTop: 16,
    letterSpacing: 0.2,
  },
  
  productContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  statusPill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
});
