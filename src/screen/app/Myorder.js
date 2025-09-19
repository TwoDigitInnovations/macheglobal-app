/* eslint-disable quotes */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
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
} from 'react-native';
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

const Myorder = () => {
  const { t } = useTranslation();
  const [orderlist, setorderlist] = useState();
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [user, setuser] = useContext(UserContext);
  const [page, setPage] = useState(1);
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

  useEffect(() => {
    if (IsFocused) {
      getorders(1);
      setalredyfavorite(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [IsFocused]);

  const getorders = (p, text, favorite) => {
    setPage(p);
    let url;
    if (text) {
      url = `order/my-orders?page=${p}&search=${text}`;
    } else if (favorite) {
      url = `order/my-orders?page=${p}&filter=favorite`;
      setLoading(true);
    } else {
      url = `getProductRequestbyUser?page=${p}`;

      // setLoading(true);
    }
    GetApi(url, {}).then(
      async res => {
        setLoading(false);
        console.log('orderData:', res.data[0]);
        setorderlist(res.data);
        setCurrentData(res.data);
        if (p === 1) {
          setorderlist(res.data);
        } else {
          setorderlist([...orderlist, ...res.data]);
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  const getordersearch = text => {
    // setLoading(true);
    GetApi(`order/my-orders?page=1&search=${text}`).then(
      async res => {
        // setLoading(false);
        console.log(res);
        setorderlist(res.data);
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  const fetchNextPage = () => {
    // console.log('end');
    // console.log('end', curentData.length);
    if (curentData.length === 20) {
      getorders(page + 1);
      // setPage(page + 1);
    }
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
      {/* <View style={styles.toppart}>
          <Image
            source={require('../../Assets/Images/logosmall.png')}
            style={styles.logoimg}
          />
          <Text style={styles.ordertxt}>My orders</Text>
          <TouchableOpacity onPress={() => navigate('Profile')}>
            <Image
              // source={require('../../Assets/Images/profile3.png')}
              style={styles.logoimg}
              source={
                user?.avatar
                  ? {
                      uri: `${user.avatar}`,
                    }
                  : require('../../Assets/Images/profile3.png')
              }
            />
          </TouchableOpacity>
        </View> */}
      {/* <View style={[styles.inpcov]}>
          <SearchIcon height={20} width={20} />
          <TextInput
            style={styles.input}
            placeholder="Search order"
            placeholderTextColor={Constants.light_black}
            onChangeText={name => getorders(1, name)}></TextInput>
          {orderlist && orderlist.length > 0 && alredyfavorite ? (
            <TouchableOpacity
              onPress={() => {
                getorders(1), setalredyfavorite(false);
              }}>
              <Image
                source={require('../../Assets/Images/favorite.png')}
                style={{height: 20, width: 20, alignSelf: 'center'}}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                getorders(1, null, 'favorite'), setalredyfavorite(true);
              }}>
              <Image
                source={require('../../Assets/Images/love.png')}
                style={{height: 20, width: 20, alignSelf: 'center'}}
              />
            </TouchableOpacity>
          )}
        </View> */}

      <View
        style={{ paddingHorizontal: 15, flex: 1 }}>
        <FlatList
          data={orderlist}
          ListEmptyComponent={() => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                height: Dimensions.get('window').height - 300,
              }}>
              <Text
                style={{
                  color: Constants.black,
                  fontSize: 20,
                  fontFamily: FONTS.Medium,
                }}>
                {!orderlist ? t('Loading...') : t('No Orders')}
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.card, { marginBottom: orderlist.length === index + 1 ? 100 : 0 }]}
              onPress={() => navigate('Orderview', { id: item?._id })}>
              <View
                style={{
                  flexDirection: 'row',
                  marginBottom: 5,
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}>
                <View style={{ flexDirection: 'row', flex: 1, marginRight: 10 }}>
                  <View style={styles.ordiccov}>
                    <OrderIcon />
                  </View>
                  <View
                    style={{
                      flexDirection: 'column',
                      marginLeft: 10,
                      flex: 1,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                      <Text style={styles.txt1}>ID</Text>
                      <Text
                        style={styles.txt1}
                        numberOfLines={1}
                        ellipsizeMode="tail">
                        :- {item?.orderId}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                      <Text style={[styles.txt2, { marginTop: -5 }]}>
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
                    </View>
                  </View>
                </View>
                <View style={{ width: 100, alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.delevered,
                      {
                        backgroundColor:
                          item?.status === 'Completed'
                            ? Constants.green + 20
                            : item?.status === 'Pending'
                              ? Constants.saffron + 20
                              : item?.status === 'Cancel'
                                ? Constants.red + 20
                                : Constants.pink + 20,
                        color:
                          item?.status === 'Completed'
                            ? Constants.green
                            : item?.status === 'Pending'
                              ? Constants.saffron
                              : item?.status === 'Cancel'
                                ? Constants.red
                                : Constants.pink,
                        borderRadius: 50,
                        paddingHorizontal: 10,
                        fontSize: 14,
                      },
                    ]}>
                    {item?.status === 'Driverassigned' ? 'Driver Assigned' : item?.status}
                  </Text>
                </View>
              </View>
              <View style={{ marginVertical: 5 }}>
                {item?.productDetail.map((prod, index) => (
                  <View key={index}>
                    <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                      <Image
                        source={
                          prod?.image
                            ? {
                              uri: `${prod.image[0]}`,
                            }
                            : require('../../Assets/Images/veg.png')
                        }
                        style={styles.cartimg}
                        resizeMode="contain"
                        onError={error => {
                          console.log('Product image loading error:', error);
                        }}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row' }}>
                          <Text style={styles.boxtxt}>
                            {i18n.language === 'vi' ? (prod?.product?.vietnamiesName || prod?.product?.name) : prod?.product?.name}
                            {/* {prod?.product?.name} */}
                          </Text>

                        </View>

                        {/* <Text style={styles.qty}>
                        {prod?.price_slot?.value} {prod?.price_slot?.unit}
                      </Text> */}
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 3,
                            // marginVertical: 10,
                          }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              gap: 5,
                              alignItems: 'center',
                            }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}>
                              <Text style={styles.boxtxt2}>{t('Qty')}</Text>
                              <Text style={styles.boxtxt2}>:- {prod?.qty}</Text>
                            </View>
                            <View
                              style={{
                                height: 5,
                                width: 5,
                                backgroundColor: Constants.customgrey2,
                                borderRadius: '50%',
                              }}
                            />
                            <Text style={styles.boxtxt3}>
                              {Currency} {Number(prod?.price ?? 0).toFixed(2)}{' '}
                            </Text>
                          </View>
                          {item?.status === 'Completed' && (
                            <Pressable
                              // onPress={() => cancelOrder(item._id)}
                              onPress={() => {
                                setModalData({
                                  productId: prod?.product?._id,
                                  orderId: item?._id,
                                  productName: prod?.product?.name,
                                  productImage: prod?.image,
                                });
                                setRatingModal(true);
                              }}
                              style={({ pressed }) => [
                                {
                                  backgroundColor: Constants.pink,
                                  paddingVertical: 4,
                                  paddingHorizontal: 16,
                                  borderRadius: 6,
                                  height: 30,
                                },
                              ]}>
                              <Text
                                style={{
                                  color: 'white',
                                  fontSize: 14,
                                  fontWeight: '500',
                                }}>
                                {t('Review')}
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}>
                <View style={{ flexDirection: 'column' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.txt3}>{t('Total Items')}</Text>
                    <Text style={styles.txt3}>
                      {':'}{' '}
                      {item?.productDetail?.reduce(
                        (sum, prod) => sum + (prod?.qty || 0),
                        0,
                      )}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.txt3}>{t('Total')}</Text>
                    <Text style={styles.txt3}>
                      {''} {Currency} {Number(item?.total).toFixed(2)}
                    </Text>
                  </View>
                </View>
                {/* Secret Code */}
                {item?.SecretCode && item?.status === 'Preparing' && (
                  <View
                    style={{
                      flexDirection: 'column',
                      backgroundColor: Constants.saffron + 40,
                      padding: 10,
                      borderRadius: 10,
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.txt4}>{t('Secret Code')}</Text>
                      <Text style={styles.txt4}>
                        {':'} {item?.SecretCode}
                      </Text>
                    </View>
                  </View>
                )}
                {item?.isShipmentDelivery &&
                  (item?.status === 'Pending' ||
                    item?.status === 'Shipped') && (
                    <View
                      style={{
                        flexDirection: 'column',
                        backgroundColor: Constants.saffron + 40,
                        padding: 10,
                        borderRadius: 10,
                      }}>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.txt4}>
                          {t('Delivery Expected')}
                        </Text>
                        <Text style={styles.txt4}>
                          {':'}{' '}
                          {formatDate2(
                            addBusinessDays(new Date(item.createdAt), 5),
                          )}{' '}
                          11 PM
                        </Text>
                      </View>
                      {item?.trackingNo && item?.trackingLink && (
                        <View>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}>
                            <Text style={styles.txt4}>
                              {t('Tracking Number')}
                            </Text>
                            <Text style={styles.txt4}>
                              {':'} {item?.trackingNo}
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}>
                            <Text style={styles.txt4}>{t('Company Name')}</Text>
                            <Text style={styles.txt4}>
                              {':'} {item?.trackingLink}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                {/* Rating module */}
                {/* {item?.status === 'Completed' && (
                  <Pressable
                    // onPress={() => cancelOrder(item._id)}
                    onPress={() => {
                      setId(item?._id);
                      setRatingModal(true);
                    }}
                    style={({pressed}) => [
                      {
                        backgroundColor: Constants.pink,
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 6,
                      },
                    ]}>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 14,
                        fontWeight: '500',
                      }}>
                      {t('Give rating')}
                    </Text>
                  </Pressable>
                )} */}
                {/* I am here */}
                {(() => {
                  const createdTime = new Date(item.createdAt);
                  const now = new Date();
                  const diffInMinutes = (now - createdTime) / (1000 * 60);

                  return (
                    item?.status === "Pending" && diffInMinutes <= 15
                  );
                })() ? (
                  <Pressable
                    onPress={() => cancelOrder(item._id)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: pressed ? '#b91c1c' : '#dc2626',
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 6,
                      },
                    ]}>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 14,
                        fontWeight: '500',
                      }}>
                      {t('Cancel Order')}
                    </Text>
                  </Pressable>
                ) : item?.status === 'Cancel' ? null : (
                  <View>
                    {item?.status === 'Preparing' &&
                      (item?.isDriveUp || item?.isOrderPickup) &&
                      item?.createdAt &&
                      new Date() - new Date(item?.createdAt) >=
                      30 * 60 * 1000 && (
                        <View
                          style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            justifyContent: 'flex-end',
                            gap: 8,
                          }}>
                          {item?.isDriveUp && (
                            <Pressable
                              onPress={() => {
                                setId(item?._id);
                                setModalVisible(true);
                              }}
                              style={({ pressed }) => [
                                {
                                  backgroundColor: pressed
                                    ? '#b45309'
                                    : Constants.saffron,
                                  paddingVertical: 8,
                                  paddingHorizontal: 16,
                                  borderRadius: 6,
                                  marginRight: 8,
                                },
                              ]}>
                              <Text
                                style={{
                                  color: 'white',
                                  fontSize: 14,
                                  fontWeight: '500',
                                }}>
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
                                {
                                  backgroundColor: pressed
                                    ? '#b45309'
                                    : Constants.saffron,
                                  paddingVertical: 8,
                                  paddingHorizontal: 16,
                                  borderRadius: 6,
                                },
                              ]}>
                              <Text
                                style={{
                                  color: 'white',
                                  fontSize: 14,
                                  fontWeight: '500',
                                }}>
                                {t("I'm here")}
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                  </View>
                )}

                {item?.status === 'Completed' &&
                  item?.deliveredAt &&
                  (item?.isShipmentDelivery || item?.isLocalDelivery) &&
                  (() => {
                    const deliveredTime = new Date(item?.deliveredAt).getTime();
                    const currentTime = new Date().getTime();
                    const hoursSinceDelivery =
                      (currentTime - deliveredTime) / (1000 * 60 * 60);

                    return hoursSinceDelivery <= 24;
                  })() && (
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                        gap: 8,
                      }}>
                      <Pressable
                        onPress={() => {
                          setId(item?._id);
                          setModalVisible2(true);
                        }}
                        style={({ pressed }) => [
                          {
                            backgroundColor: pressed
                              ? '#b45309'
                              : Constants.red,
                            paddingVertical: 8,
                            paddingHorizontal: 16,
                            borderRadius: 6,
                          },
                        ]}>
                        <Text
                          style={{
                            color: 'white',
                            fontSize: 14,
                            fontWeight: '500',
                          }}>
                          {t('Return Order')}
                        </Text>
                      </Pressable>
                    </View>
                  )}
              </View>
            </TouchableOpacity>
          )}
          onEndReached={() => {
            if (orderlist && orderlist.length > 0) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.05}
        />
        <Modal
          animationType="none"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setId(null);
          }}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View style={{ backgroundColor: 'white', width: '100%' }}>
                <Text style={styles.txt}>{t('Parking Information')}</Text>
                <Text style={styles.label}>{t('Car Brand')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('Enter Car brand')}
                  placeholderTextColor={Constants.customgrey}
                  value={modalText?.carBrand}
                  onChangeText={carBrand =>
                    setModalText({ ...modalText, carBrand })
                  }
                />
                <Text style={styles.label}>{t('Car Color')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('Enter Car color')}
                  placeholderTextColor={Constants.customgrey}
                  value={modalText?.carColor}
                  onChangeText={carColor =>
                    setModalText({ ...modalText, carColor })
                  }
                />
                <Text style={styles.label}>{t('Parking Pickup Spot')}</Text>
                {/* <TextInput
                  style={styles.input}
                  placeholder={t("Enter Parking spot")}
                  placeholderTextColor={Constants.customgrey}
                  value={modalText?.parkingNo}
                  onChangeText={parkingNo => setModalText({ ...modalText, parkingNo })}
                /> */}
                <Dropdown
                  style={styles.input}
                  data={[1, 2, 3, 4, 5, 6].map(zip => ({
                    label: zip.toString(),
                    value: zip,
                  }))}
                  value={modalText?.parkingNo}
                  onChange={item => {
                    setModalText(prev => ({ ...prev, parkingNo: item.value }));
                  }}
                  placeholder={t('Enter Parking spot')}
                  placeholderStyle={{ color: Constants.customgrey }}
                  selectedTextStyle={{ color: Constants.black }}
                  maxHeight={200}
                  labelField="label"
                  valueField="value"
                  renderItem={item => (
                    <Text style={{ padding: 10, color: Constants.black }}>
                      {item.label}
                    </Text>
                  )}
                />

                <View style={styles.cancelAndLogoutButtonWrapStyle}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={async () => {
                      setModalVisible(false);
                      setId(null);
                      setModalText({
                        carBrand: '',
                        carColor: '',
                        parkingNo: '',
                      });
                    }}
                    style={styles.logOutButtonStyle2}>
                    <Text style={styles.modalText2}>{t('Cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={async () => {
                      // setModalVisible(false);
                      // setId(null);
                      handleSubmit();
                    }}
                    style={styles.logOutButtonStyle}>
                    <Text style={styles.modalText}>{t('Submit')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          animationType="none"
          transparent={true}
          visible={modalVisible2}
          onRequestClose={() => {
            setModalVisible2(false);
            setId(null);
          }}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View style={{ backgroundColor: 'white', width: '100%' }}>
                <Text style={[styles.txt, { textAlign: 'center' }]}>
                  {t('Are you sure?')}
                </Text>
                <Text style={[styles.label, { textAlign: 'center' }]}>
                  {t('Do you really want to Return your order?')}
                </Text>

                <View style={styles.cancelAndLogoutButtonWrapStyle}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={async () => {
                      setModalVisible2(false);
                      setId(null);
                    }}
                    style={styles.logOutButtonStyle2}>
                    <Text style={styles.modalText2}>{t('No, keep it')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={async () => {
                      // setModalVisible(false);
                      // setId(null);
                      ReturnOrder();
                    }}
                    style={styles.logOutButtonStyle}>
                    <Text style={styles.modalText}>{t('Yes, Return it!')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          animationType="none"
          transparent={true}
          visible={ratingModal}
          onRequestClose={() => {
            setRatingModal(false);
            setId(null);
          }}>
          <View style={styles.centeredView}>
            <View style={[styles.modalView, { paddingTop: 10 }]}>
              <View style={{ backgroundColor: 'white', width: '100%' }}>
                <Text
                  style={[
                    styles.txt,
                    {
                      textAlign: 'center',
                      borderBottomWidth: 1,
                      paddingBottom: 10,
                      borderColor: Constants.customgrey3,
                    },
                  ]}>
                  {t('Review Product')}
                </Text>
                <Text style={[styles.label, { textAlign: 'center' }]}>
                  {modalData?.productName}
                </Text>
                <Text
                  style={[
                    styles.label,
                    {
                      fontFamily: FONTS.Regular,
                      fontWeight: '500',
                      textAlign: 'left',
                      marginTop: 10,
                    },
                  ]}>
                  {t('Write your review')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { height: 100, textAlignVertical: 'top' },
                  ]}
                  placeholder={t('Write your review')}
                  placeholderTextColor={Constants.customgrey}
                  value={ratingData.review}
                  onChangeText={review =>
                    setRatingData({ ...ratingData, review })
                  }
                  multiline={true}
                  numberOfLines={4}
                />

                <Text
                  style={[
                    styles.label,
                    {
                      fontFamily: FONTS.Regular,
                      fontWeight: '500',
                      textAlign: 'left',
                      marginTop: 10,
                    },
                  ]}>
                  {t('Upload Images (up to 6)')}
                </Text>
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

                        if (
                          result &&
                          result.status &&
                          result.data &&
                          result.data.file
                        ) {
                          setRatingData(prevData => ({
                            ...prevData,
                            images: [...prevData.images, result.data.file],
                          }));
                          Toast.show({
                            type: 'success',
                            text1: t("Image uploaded successfully"),
                          })
                          console.log(
                            'Image uploaded successfully:',
                            result.data.file,
                          );
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
                        setLoading(false); // Hide loading state
                      }
                    }
                  }}
                />

                <View style={styles.cancelAndLogoutButtonWrapStyle}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={async () => {
                      setRatingModal(false);
                      setModalData({
                        productId: null,
                        orderId: null,
                        productName: '',
                        productImage: '',
                      });
                      setId(null);
                      setRatingData({
                        review: '',
                        images: [],
                      });
                    }}
                    style={styles.logOutButtonStyle2}>
                    <Text style={styles.modalText2}>{t('Cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={async () => {
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
    backgroundColor: Constants.white,
    // padding: 20,
    paddingBottom: 70,
  },
  label: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS.Regular,
    fontWeight: '700',
    marginBottom: 1,
  },
  logoimg: {
    height: 40,
    width: 40,
    borderRadius: 70,
  },
  toppart: {
    padding: 20,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  inpcov: {
    borderWidth: 1,
    borderColor: Constants.customgrey,
    backgroundColor: Constants.white,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginHorizontal: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    color: Constants.black,
    fontWeight: '500',
    borderRadius: 10,
    textAlign: 'left',
    fontSize: 16,
    fontFamily: FONTS.Regular,
    marginTop: 5,
    paddingHorizontal: 10,
    height: 45,
    width: '100%',
    marginBottom: 10,
  },
  ordertxt: {
    color: Constants.black,
    fontSize: 18,
    fontFamily: FONTS.Bold,
    alignSelf: 'center',
  },
  ordiccov: {
    height: 40,
    width: 40,
    backgroundColor: Constants.pink,
    borderRadius: 30,
    padding: 7,
    alignSelf: 'center',
  },
  txt1: {
    color: Constants.black,
    fontSize: 15,
    fontFamily: FONTS.Medium,
    // flex: 1,
    marginVertical: 5,
  },
  txt3: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS.Medium,
    // alignSelf: 'center',
  },
  txt2: {
    color: Constants.black,
    fontSize: 14,
    fontFamily: FONTS.Regular,
    // flex:1
  },
  txt: {
    color: Constants.black,
    fontSize: 20,
    marginVertical: 10,
    fontFamily: FONTS.Medium,
  },
  txt4: {
    color: Constants.black,
    fontSize: 14,
    fontFamily: FONTS.Medium,
    // alignSelf: 'center',
  },
  card: {
    // flexDirection: 'row',
    justifyContent: 'space-between',
    // flex:1,
    // height:75,
    borderBottomWidth: 2,
    borderColor: Constants.customgrey,
    paddingBottom: 10,
    width: '100%',
    marginVertical: 10,
  },
  delevered: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Regular,
    backgroundColor: Constants.pink,
    padding: 5,
    borderRadius: 3,
    marginVertical: 5,
    textAlign: 'center',
    width: 120
  },
  boxtxt3: {
    color: Constants.black,
    fontSize: 14,
    // fontWeight: '500',
    fontFamily: FONTS.Bold,
  },
  boxtxt2: {
    color: Constants.black,
    fontSize: 14,
    fontFamily: FONTS.Bold,
  },
  cartimg: {
    // height: 40,
    width: 40,
    // resizeMode: 'contain',
  },
  boxtxt: {
    color: Constants.black,
    fontSize: 14,
    // fontWeight: '500',
    fontFamily: FONTS.Medium,
  },
  favfiltxt: {
    color: Constants.saffron,
    fontSize: 16,
    fontFamily: FONTS.Bold,
  },
  favfilcov: {
    borderWidth: 1,
    borderColor: Constants.saffron,
    // width:'50%',
    gap: 5,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignSelf: 'flex-end',
    marginTop: 10,
    marginRight: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    fontSize: 14,
    color: Constants.customgrey,
    fontFamily: FONTS.Bold,
    // marginBottom: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: 22,
    backgroundColor: '#rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },
  cancelAndLogoutButtonWrapStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 5,
  },
  logOutButtonStyle: {
    // flex: 0.5,
    backgroundColor: Constants.saffron,
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
    width: '50%',
  },
  logOutButtonStyle2: {
    // flex: 0.5,
    backgroundColor: Constants.white,
    borderColor: Constants.saffron,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
    width: '50%',
  },
  modalText: {
    color: Constants.white,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 16,
  },
  modalText2: {
    color: Constants.saffron,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 16,
  },
});
