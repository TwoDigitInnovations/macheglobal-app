/* eslint-disable quotes */
/* eslint-disable react-native/no-inline-styles */
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import {
  BackIcon,
  Calendar,
  Cross2Icon,
  CrossIcon,
  LocationIcon,
  MinusIcon,
  Plus2Icon,
} from '../../../Theme';
import {
  AddressContext,
  CartContext,
  LoadContext,
  UserContext,
} from '../../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from 'react-native-swiper-flatlist/src/themes';
import { navigate } from '../../../navigationRef';
import { useTranslation } from 'react-i18next';
import { Checkbox, Dialog, RadioButton } from 'react-native-paper';
// import DatePicker from 'react-native-date-picker';
import Toast from 'react-native-toast-message';
import moment from 'moment-timezone';
import { Dropdown } from 'react-native-element-dropdown';
import { GetApi, Post } from '../../Assets/Helpers/Service';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { DateTime } from 'luxon';
import { useFocusEffect } from '@react-navigation/native';
import StripeCheckoutButton from '../../Assets/Component/StripePayment';
import i18n from 'i18next';

const pickupOptions = [
  {
    label: 'In Store Pickup',
    value: 'orderPickup',
    description: 'Pick it up inside the store',
  },
  {
    label: 'Curbside Pickup',
    value: 'driveUp',
    description: 'We bring it out to your car',
  },
  {
    label: 'Next Day Local Delivery',
    value: 'localDelivery',
    description: 'Cut of time 8 pm',
  },
  {
    label: 'Shipping',
    value: 'shipping',
    description: 'Delivery in 3 to 5 business days',
  },
];

const width = Dimensions.get('window').width;

const Cart = () => {
  const { t } = useTranslation();
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [locationadd, setlocationadd] = useContext(AddressContext);
  const [user, setuser] = useContext(UserContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [totalsum, settotalsum] = useState(null);
  const [totaloff, settotaloff] = useState(null);
  const [totalFinal, setTotalFinal] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [PickupType, setPickupType] = useState(null);
  const shaloowarray = [...cartdetail];
  const [pickupDate, setPickupDate] = useState(null);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [modalView, setModalView] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [businessAddress, setBusinessAddress] = useState({
    businessAddress: user?.BusinessAddress || '',
  });
  const [localDeliveryAddress, setLocalDeliveryAddress] = useState({
    ApartmentNo: user?.ApartmentNo || '',
    SecurityGateCode: user?.SecurityGateCode || '',
    zipcode: user?.zipcode || '',
  });
  const [deliveryTip, setDeliveryTip] = useState(0);
  const [shippingDeliveryCost, setShipingDeliveryCost] = useState(0);
  const [localDeliveryCost, setLocalDeliveryCost] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [deliveryFees, setDeliveryFees] = useState(0);
  const [coupon, setCoupon] = useState(false);
  const [open, setOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [minDate, setMinDate] = useState(new Date());
  const [totalTax, setTotalTax] = useState(0);
  const [availableZipCodes, setAvailableZipCodes] = useState([]);
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [isOnce, setIsOnce] = useState(false);

  const isZipAvailable = availableZipCodes.some(
    zip => String(zip.pincode) === String(localDeliveryAddress.zipcode),
  );

  //clear data by screen change
  // useFocusEffect(
  //   React.useCallback(() => {
  //     return () => {
  //       setPickupType(null);
  //       setPickupDate(null);
  //       setDeliveryTip(0);
  //       setCoupon(false);
  //       setCouponDiscount(0);
  //       setOpen(false);
  //       setCouponCode('');
  //       setBusinessAddress({ businessAddress: user?.BusinessAddress || '' });
  //       setLocalDeliveryAddress({
  //         ApartmentNo: user?.ApartmentNo || '',
  //         SecurityGateCode: user?.SecurityGateCode || '',
  //         zipcode: user?.zipcode || '',
  //       });
  //     }
  //   }, [])
  // );

  const fetchZipCodes = async () => {
    setLoading(true);
    GetApi('getPinCode', {}).then(
      async res => {
        console.log('Zip Codes:', res);
        setAvailableZipCodes(res?.pincodes || []);
        setLoading(false);
        setCouponDiscount(0);
      },
      err => {
        console.log('Error fetching zip codes:', err);
        setLoading(false);
      },
    );
  };



  // useEffect(() => {
  //   setCoupon(false);
  //   setCouponDiscount(0);
  //   fetchZipCodes();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useFocusEffect(
    useCallback(() => {
      setCoupon(false);
      setCouponDiscount(0);
      fetchZipCodes();

      return () => { }; // cleanup if needed
    }, [])
  );

  const handleDatePickerOpen = () => setOpenDatePicker(true);
  const handleDatePickerClose = () => setOpenDatePicker(false);

  // const totalTax = parseFloat(
  //   cartdetail
  //     ?.reduce((accumulator, currentValue) => {
  //       const itemTotal = Number(currentValue?.total || 0);
  //       const taxRate = Number(currentValue?.tax || 0); // percentage
  //       const taxAmount = (itemTotal * taxRate) / 100;
  //       return accumulator + taxAmount;
  //     }, 0)
  //     .toFixed(2),
  // );

  useEffect(() => {
    const updateMinDate = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const minDate = new Date();

      if (currentHour >= 14) {
        // After 2 PM, set min date to tomorrow
        minDate.setDate(now.getDate() + 1);
      } else {
        // Before 2 PM, min date is today
        minDate.setDate(now.getDate());
      }

      minDate.setHours(0, 0, 0, 0); // Start of the day
      setPickupDate(minDate)
      setMinDate(minDate);

      AsyncStorage.setItem(
        'pickupDate',
        moment(new Date(minDate)).format('YYYY-MM-DD'))
    };

    const updateLocalMinDate = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const minDate = new Date();

      if (currentHour >= 20) {
        // After 8 PM, set min date to day after tomorrow
        minDate.setDate(now.getDate() + 2);
      } else {
        // Before 8 PM, set min date to tomorrow
        minDate.setDate(now.getDate() + 1);
      }

      minDate.setHours(0, 0, 0, 0);
      setPickupDate(minDate)

      setMinDate(minDate);
      AsyncStorage.setItem(
        'pickupDate',
        moment(new Date(minDate)).format('YYYY-MM-DD'))
    };

    if (PickupType === 'orderPickup' || PickupType === 'driveUp') {
      updateMinDate();
    } else if (PickupType === 'localDelivery' || PickupType === 'shipping') {
      updateLocalMinDate();
    }
  }, [PickupType]);

  // useEffect(() => {
  //   const sumdata =
  //     cartdetail && cartdetail.length > 0
  //       ? cartdetail.reduce((a, item) => {
  //           return Number(a) + Number(item?.price) * Number(item?.qty);
  //         }, 0)
  //       : null;
  //   console.log(sumdata);
  //   settotalsum(sumdata);
  //   // Calculate total offer
  //   const offdata =
  //     cartdetail && cartdetail.length > 0
  //       ? cartdetail.reduce((a, item) => {
  //           return Number(a) + Number(item?.offer) * Number(item?.qty);
  //         }, 0)
  //       : null;
  //   console.log(sumdata);
  //   settotaloff(offdata);
  //   setTotalFinal(offdata - couponDiscount);

  //   // Calculate delivery charge based on pickup type
  //   if (PickupType === 'localDelivery') {
  //     if (offdata < 35) {
  //       setTotalFinal(
  //         Number(
  //           (offdata + localDeliveryCost - couponDiscount + totalTax).toFixed(
  //             2,
  //           ),
  //         ),
  //       );
  //       setDeliveryFees(localDeliveryCost);
  //     } else {
  //       setTotalFinal(offdata - couponDiscount + totalTax);
  //       setDeliveryFees(0);
  //     }
  //   } else if (PickupType === 'shipping') {
  //     if (offdata < 200) {
  //       setTotalFinal(
  //         Number(
  //           (
  //             offdata +
  //             shippingDeliveryCost -
  //             couponDiscount +
  //             totalTax
  //           ).toFixed(2),
  //         ),
  //       );
  //       setDeliveryFees(shippingDeliveryCost);
  //     } else {
  //       setTotalFinal(offdata - couponDiscount + totalTax);
  //       setDeliveryFees(0);
  //     }
  //   } else {
  //     setTotalFinal(offdata - couponDiscount + totalTax);
  //     setDeliveryFees(0);
  //   }
  // }, [
  //   cartdetail,
  //   deliveryTip,
  //   PickupType,
  //   shippingDeliveryCost,
  //   localDeliveryCost,
  //   shippingFee,
  //   couponDiscount,
  //   totalTax,
  // ]);

  useEffect(() => {
    // Calculate cart total (original prices)
    const sumdata =
      cartdetail && cartdetail.length > 0
        ? cartdetail.reduce((a, item) => {
          return Number(a) + Number(item?.price) * Number(item?.qty);
        }, 0)
        : 0;
    console.log('Original Total:', cartdetail, sumdata);
    settotalsum(sumdata);

    const offdata =
      cartdetail && cartdetail.length > 0
        ? cartdetail.reduce((a, item) => {
          return Number(a) + Number(item?.offer) * Number(item?.qty);
        }, 0)
        : 0;
    console.log('Offer Total:', offdata);
    settotaloff(offdata);

    const subtotalAfterDiscount = offdata - couponDiscount;

    // Note: Tax calculation is now handled by Stripe automatically
    // We'll set a temporary tax to 0 for display purposes
    // The actual tax will be calculated by Stripe during checkout
    setTotalTax(0);

    let deliveryCharge = 0;
    let finalTotal = subtotalAfterDiscount; // No manual tax calculation

    if (PickupType === 'localDelivery') {
      if (offdata < 35) {
        deliveryCharge = localDeliveryCost;
      }
    } else if (PickupType === 'shipping') {
      if (offdata < 200) {
        deliveryCharge = shippingDeliveryCost;
      }
    }

    finalTotal += deliveryCharge;
    if (deliveryTip > 0) {
      finalTotal += deliveryTip;
    }

    setDeliveryFees(deliveryCharge);
    setTotalFinal(Number(finalTotal.toFixed(2)));

  }, [
    cartdetail,
    deliveryTip,
    PickupType,
    shippingDeliveryCost,
    localDeliveryCost,
    shippingFee,
    couponDiscount,
  ]);

  const fetchDeliveryFee = async () => {
    GetApi('getShippingCost', {})
      .then(res => {
        console.log(res?.shippingCosts);
        setShipingDeliveryCost(res?.shippingCosts[0]?.ShipmentCostForShipment);
        setLocalDeliveryCost(res?.shippingCosts[0]?.ShippingCostforLocal);
        setShippingFee(res?.shippingCosts[0]?.ShippingCost);
      })
      .catch(err => {
        console.warn('Error fetching delivery fee:', err);
      });
  };

  useEffect(() => {
    fetchDeliveryFee();
  }, [PickupType]);

  const initiatePurchase = () => {
    let newarr = cartdetail.map(item => {
      return {
        product: item.productid,
        image: item.image,
        productname: item.productname,
        price: item.offer,
        qty: item.qty,
        seller_id: item.seller_id,
        price_slot: item.price_slot,
        BarCode: item.BarCode,
        color: item.selectedColor?.color || '',
        total: item.total,
        isShipmentAvailable: item.isShipmentAvailable,
        isInStoreAvailable: item.isInStoreAvailable,
        isCurbSidePickupAvailable: item.isCurbSidePickupAvailable,
        isNextDayDeliveryAvailable: item.isNextDayDeliveryAvailable,
        slug: item.slug,
      };
    });

    const isLocalDelivery = PickupType === 'localDelivery';
    const isOrderPickup = PickupType === 'orderPickup';
    const isDriveUp = PickupType === 'driveUp';
    const isShipmentDelivery = PickupType === 'shipping';

    console.log('Boolean values in initiatePurchase:', {
      isLocalDelivery,
      isOrderPickup,
      isDriveUp,
      isShipmentDelivery,
    });

    const dateString = pickupDate;
    const formattedDate = moment(dateString, 'DD/MM/YYYY', true);

    const unavailableShippingProducts = newarr.filter(
      item => item.isShipmentAvailable === false,
    );
    const unavailableInStoreProducts = newarr.filter(
      item => item.isInStoreAvailable === false,
    );
    const unavailableCurbSideProducts = newarr.filter(
      item => item.isCurbSidePickupAvailable === false,
    );
    const unavailableLocalDeliveryProducts = newarr.filter(
      item => item.isNextDayDeliveryAvailable === false,
    );
    const availableProducts = newarr.filter(
      item => item.isShipmentAvailable === true,
    );
    const isShipmentAvailable = unavailableShippingProducts.length === 0;

    if (isShipmentDelivery) {
      if (!isShipmentAvailable) {
        if (unavailableShippingProducts.length === 1) {
          Toast.show({
            type: 'error',
            text1: t(
              "One item in your cart can't be shipped. Remove it or choose another delivery option.",
            ),
          });
        } else {
          Toast.show({
            type: 'error',
            text1: t(
              "Some items in your cart can't be shipped. Remove them or choose another delivery option.",
            ),
          });
        }
        setLoading(false);
        return false;
      }
    } else if (isOrderPickup) {
      const isInStoreAvailable = unavailableInStoreProducts.length === 0;
      if (!isInStoreAvailable) {
        if (unavailableInStoreProducts.length === 1) {
          Toast.show({
            type: 'error',
            text1: t(
              "One item in your cart can't be picked up in store. Remove it or choose another delivery option.",
            ),
          });
        } else {
          Toast.show({
            type: 'error',
            text1: t(
              "Some items in your cart can't be picked up in store. Remove them or choose another delivery option.",
            ),
          });
        }
        setLoading(false);
        return false;
      }
    } else if (isDriveUp) {
      const isCurbSideAvailable = unavailableCurbSideProducts.length === 0;
      if (!isCurbSideAvailable) {
        if (unavailableCurbSideProducts.length === 1) {
          Toast.show({
            type: 'error',
            text1: t(
              "One item in your cart can't be picked up curbside. Remove it or choose another delivery option.",
            ),
          });
        } else {
          Toast.show({
            type: 'error',
            text1: t(
              "Some items in your cart can't be picked up curbside. Remove them or choose another delivery option.",
            ),
          });
        }
        setLoading(false);
        return false;
      }
    } else if (isLocalDelivery) {
      const isNextDayDeliveryAvailable =
        unavailableLocalDeliveryProducts.length === 0;
      if (!isNextDayDeliveryAvailable) {
        if (unavailableLocalDeliveryProducts.length === 1) {
          Toast.show({
            type: 'error',
            text1: t(
              "One item in your cart can't be delivered locally. Remove it or choose another delivery option.",
            ),
          });
        } else {
          Toast.show({
            type: 'error',
            text1: t(
              "Some items in your cart can't be delivered locally. Remove them or choose another delivery option.",
            ),
          });
        }
        setLoading(false);
        return false;
      }
    }
    if (
      localDeliveryAddress?.zipcode &&
      availableZipCodes.length > 0 &&
      !isZipAvailable &&
      PickupType === 'localDelivery'
    ) {
      Toast.show({
        type: 'error',
        text1: t(
          'Selected Zip Code is not available for delivery. Please select a valid Zip Code.',
        ),
      });

      setLoading(false);
      return false;
    }

    if (!PickupType) {
      Toast.show({
        type: 'error',
        text1: t('Please select a pickup type'),
      });
      return;
    }

    if (PickupType === 'orderPickup' || PickupType === 'driveUp') {
      if (!pickupDate) {
        Toast.show({
          type: 'error',
          text1: t('Please select a pickup date'),
        });
        return;
      }
    }

    if (PickupType === 'localDelivery' && !pickupDate) {
      Toast.show({
        type: 'error',
        text1: t('Please select a delivery date'),
      });
      return;
    }

    setLoading(true);
    setShowStripePayment(true);
    console.log('newarr:', newarr);
    console.warn('pickup', PickupType);
    console.warn('pickupDate', pickupDate);
    AsyncStorage.setItem('pickupType', PickupType || '');
  };

  const handlePaymentError = error => {
    if (
      error?.code === 'Canceled' ||
      error?.code === 'UserCancel' ||
      error?.code === 'cancelled' ||
      error?.message?.toLowerCase().includes('canceled') ||
      error?.message?.toLowerCase().includes('cancelled') ||
      error?.localizedMessage?.toLowerCase().includes('canceled') ||
      error?.localizedMessage?.toLowerCase().includes('cancelled')
    ) {
      console.log('User cancelled payment - no error message needed');
      setLoading(false);
      return;
    }
    console.warn('Payment failed:', error);
    Toast.show({
      type: 'error',
      text1: t('Payment failed. Please try again.'),
    });
    setLoading(false);
  };

  const submitCheckoutWithStripeData = async stripePaymentResult => {
    const type = await AsyncStorage.getItem('pickupType');
    const date = await AsyncStorage.getItem('pickupDate');
    console.warn('data', type, date);
    console.warn('stripePaymentResult', stripePaymentResult);

    setLoading(true);
    let cart = await AsyncStorage.getItem('cartdata');
    let carDetails = JSON.parse(cart)
    try {
      let newarr = carDetails.map(item => {
        return {
          product: item.productid,
          image: item.image,
          productname: item.productname,
          price: item.offer,
          qty: item.qty,
          seller_id: item.seller_id,
          price_slot: item.price_slot,
          BarCode: item.BarCode,
          color: item.selectedColor?.color || '',
          total: item.total,
          isShipmentAvailable: item.isShipmentAvailable,
          isInStoreAvailable: item.isInStoreAvailable,
          isCurbSidePickupAvailable: item.isCurbSidePickupAvailable,
          isNextDayDeliveryAvailable: item.isNextDayDeliveryAvailable,
          slug: item.slug,
        };
      });

      const isLocalDelivery = type === 'localDelivery';
      const isOrderPickup = type === 'orderPickup';
      const isDriveUp = type === 'driveUp';
      const isShipmentDelivery = type === 'shipping';

      const dateString = date;
      const formattedDate = moment(dateString, 'YYYY-MM-DD').format();

      console.log('Formatted Date:', formattedDate);

      const data = {
        productDetail: newarr,
        shipping_address: user.address,
        location: user.address?.location,
        total: stripePaymentResult.total || totalFinal,
        totalTax: stripePaymentResult.tax || 0,
        subtotal: stripePaymentResult.subtotal || totaloff,
        Deliverytip: deliveryTip || 0,
        deliveryfee: deliveryFees || 0,
        discount: couponDiscount || 0,
        discountCode: couponCode || '',
        user: user._id,
        Email: user.email,
        paymentmode: 'online',
        isOrderPickup: isOrderPickup,
        isDriveUp: isDriveUp,
        isLocalDelivery: isLocalDelivery,
        isShipmentDelivery: isShipmentDelivery,
        dateOfDelivery: formattedDate,
        isOnce,
        ussageType: 'once',
        paymentId: stripePaymentResult.paymentId || stripePaymentResult.id,
        paymentIntentId: stripePaymentResult.paymentIntentId,
        paymentStatus: 'completed',
        paymentAmount: stripePaymentResult.total,
        paymentCurrency: stripePaymentResult.currency || 'usd',
        paymentTimestamp: new Date().toISOString(),
        stripeSessionId: stripePaymentResult.sessionId,
        autoTaxCalculated: true,

        ...(isShipmentDelivery || isLocalDelivery
          ? {
            Local_address: {
              address: user.address ?? '',
              ...localDeliveryAddress,
              name: user?.username,
              phoneNumber: user?.number,
              email: user?.email,
              lastname: user?.lastname,
              ApartmentNo: user?.ApartmentNo,
              SecurityGateCode: user?.SecurityGateCode,
              BusinessAddress: user?.BusinessAddress,
              dateOfDelivery: formattedDate,
              location: {
                type: 'Point',
                coordinates: Array.isArray(user?.location?.coordinates)
                  ? [
                    user.location.coordinates[0] ?? null,
                    user.location.coordinates[1] ?? null,
                  ]
                  : [null, null],
              },
            },
          }
          : {}),
      };

      if (user?._id) {
        data.user = user._id;
        data.Email = user?.email;
      }

      console.log('Submitting order with Stripe auto-calculated tax:', {
        paymentId: data.paymentId,
        total: data.total,
        tax: data.totalTax,
        paymentStatus: data.paymentStatus,
      });

      console.log('Order data:', data);

      const response = await Post('createProductRquest', data, {});
      setLoading(false);
      if (!response.status) {
        Toast.show({
          type: 'error',
          text1: 'Some thing went wrong.',
          text2: ' Please contact support',
        })
        return
      }

      console.log('Order created successfully:', response);

      setLoading(false);
      setTimeout(() => {
        setModalView(true);
      }, 500);

      // Clear cart and reset state
      AsyncStorage.removeItem('cartdata');
      AsyncStorage.removeItem('pickupType');
      AsyncStorage.removeItem('pickupDate');
      setcartdetail([]);
      setPickupType(null);
      setPickupDate(null);
      setDeliveryTip(0);
      setCoupon(false);
      setCouponDiscount(0);
      setOpen(false);
      setCouponCode('');
      setDiscountCode('');
      setBusinessAddress({
        businessAddress: user?.BusinessAddress || '',
      });
      setLocalDeliveryAddress({
        ApartmentNo: user?.ApartmentNo || '',
        SecurityGateCode: user?.SecurityGateCode || '',
        zipcode: user?.zipcode || '',
      });
      setDeliveryFees(0);
      setTotalFinal(0);
      setTotalTax(0);
    } catch (error) {
      console.warn('Error submitting order:', error);
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: t('Failed to complete order. Please try again.'),
      });
    }
  };

  useEffect(() => {
    setCouponCode('');
  }, [open]);

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.toppart}>
          {/* <BackIcon color={Constants.white}/> */}
          <Text style={styles.carttxt}>
            {t('Cart')} ({cartdetail.length})
          </Text>
          {cartdetail && cartdetail.length > 0 && (
            <Text style={styles.addbtn} onPress={() => setModalVisible(true)}>
              {t('Empty Cart')}
            </Text>
          )}
        </View>
        {cartdetail && cartdetail.length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ backgroundColor: Constants.white }}>
              {cartdetail.map((item, i) => (
                <View style={[styles.box, { borderBottomWidth: 1 }]} key={i}>
                  <View style={styles.firstpart}>
                    <View style={styles.firstleftpart}>
                      <Pressable onPress={() => navigate('Preview', item.slug)}>
                        <Image source={{ uri: item?.image }} style={styles.cardimg} />
                      </Pressable>
                      <View>
                        <Text style={styles.productname}>
                          {i18n.language === 'fr' ? (item?.frenchName || item?.productname) : item?.productname}
                          {/* {item?.productname} */}
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                          }}>
                          <View
                            style={{
                              flexDirection: 'column',
                              alignItems: 'left',
                              gap: 5,
                            }}>
                            <Text style={styles.maintxt}>
                              {' '}
                              {Currency} {item?.offer}
                            </Text>
                            {/* <Text style={styles.disctxt}> {Currency} {item?.price}</Text> */}
                            <Text style={styles.qty}>
                              {item?.price_slot?.value} {item?.price_slot?.unit}
                            </Text>
                          </View>
                          <View style={styles.addcov}>
                            <TouchableOpacity
                              style={styles.plus}
                              onPress={async () => {
                                const updatedCart = cartdetail.map(cartItem => {
                                  if (
                                    cartItem.productid === item?.productid &&
                                    cartItem.price_slot?.value ===
                                    item?.price_slot?.value
                                  ) {
                                    if (cartItem.qty > 1) {
                                      return {
                                        ...cartItem,
                                        qty: cartItem.qty - 1,
                                      };
                                    }
                                  }
                                  return cartItem;
                                });

                                setcartdetail(updatedCart);
                                await AsyncStorage.setItem(
                                  'cartdata',
                                  JSON.stringify(updatedCart),
                                );
                                setCoupon(false);
                                setCouponDiscount(0);
                              }}>
                              <MinusIcon
                                color={Constants.white}
                                height={20}
                                width={20}
                              />
                            </TouchableOpacity>
                            <Text style={styles.plus2}>{item?.qty}</Text>
                            <TouchableOpacity
                              style={styles.plus3}
                              onPress={async () => {
                                const updatedCart = cartdetail.map(cartItem => {
                                  if (
                                    cartItem.productid === item?.productid &&
                                    cartItem.price_slot?.value ===
                                    item?.price_slot?.value
                                  ) {
                                    return {
                                      ...cartItem,
                                      qty: cartItem.qty + 1,
                                    };
                                  }
                                  return cartItem;
                                });

                                setcartdetail(updatedCart);
                                await AsyncStorage.setItem(
                                  'cartdata',
                                  JSON.stringify(updatedCart),
                                );
                                setCoupon(false);
                                setCouponDiscount(0);
                              }}>
                              <Plus2Icon
                                color={Constants.white}
                                height={20}
                                width={20}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                    <CrossIcon
                      onPress={async () => {
                        shaloowarray.splice(i, 1),
                          await AsyncStorage.setItem(
                            'cartdata',
                            JSON.stringify(shaloowarray),
                          );
                        JSON.stringify(shaloowarray);

                        setcartdetail(shaloowarray);
                        setCoupon(false);
                        setCouponDiscount(0);
                        // if (shaloowarray.length === 0) {
                        //   setCoupon(false);
                        //   setCouponDiscount(0);
                        // }
                      }}
                      style={{ marginTop: 10, marginRight: 10 }}
                    />
                  </View>
                  {/* inavailibility message */}
                  {PickupType === 'shipping' &&
                    (item.isShipmentAvailable ? (
                      <Text
                        style={{
                          color: Constants.green,
                          fontSize: 14,
                          marginTop: 5,
                        }}>
                        {t('Product is available for Shipment Delivery')}
                      </Text>
                    ) : (
                      <Text
                        style={{
                          color: Constants.red,
                          fontSize: 14,
                          marginTop: 5,
                        }}>
                        {t('Product is Not available for Shipment Delivery')}
                      </Text>
                    ))}
                  {PickupType === 'orderPickup' &&
                    (item.isInStoreAvailable ? (
                      <Text
                        style={{
                          color: Constants.green,
                          fontSize: 14,
                          marginTop: 5,
                        }}>
                        {t('Product is available for In Store Pickup')}
                      </Text>
                    ) : (
                      <Text
                        style={{
                          color: Constants.red,
                          fontSize: 14,
                          marginTop: 5,
                        }}>
                        {t('Product is Not available for In Store Pickup')}
                      </Text>
                    ))}
                  {PickupType === 'driveUp' &&
                    (item.isCurbSidePickupAvailable ? (
                      <Text
                        style={{
                          color: Constants.green,
                          fontSize: 14,
                          marginTop: 5,
                        }}>
                        {t('Product is available for Curbside Pickup')}
                      </Text>
                    ) : (
                      <Text
                        style={{
                          color: Constants.red,
                          fontSize: 14,
                          marginTop: 5,
                        }}>
                        {t('Product is Not available for Curbside Pickup')}
                      </Text>
                    ))}
                  {PickupType === 'localDelivery' &&
                    (item.isNextDayDeliveryAvailable ? (
                      <Text
                        style={{
                          color: Constants.green,
                          fontSize: 14,
                          marginTop: 5,
                        }}>
                        {t('Product is available for Next Day Local Delivery')}
                      </Text>
                    ) : (
                      <Text
                        style={{
                          color: Constants.red,
                          fontSize: 14,
                          marginTop: 5,
                        }}>
                        {t(
                          'Product is Not available for Next Day Local Delivery',
                        )}
                      </Text>
                    ))}
                </View>
              ))}
            </View>
            <View style={[styles.btombg, { marginHorizontal: 10 }]}>
              {/* <Text style={styles.deliveloctxt}>{'Payment Options'}</Text> */}
              <RadioButton.Group
                onValueChange={type => {
                  setPickupType(type);
                  setPickupDate(null);
                }}
                value={PickupType}>
                {pickupOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.radioView,
                      { flexDirection: 'row-reverse', alignItems: 'flex-start' },
                    ]}
                    onPress={() => {
                      setPickupType(option.value);
                      setPickupDate(null);
                      setDeliveryTip(0);
                      setLocalDeliveryAddress({
                        ApartmentNo: user?.ApartmentNo || '',
                        SecurityGateCode: user?.SecurityGateCode || '',
                        zipcode: user?.zipcode || '',
                      });
                    }}>
                    <RadioButton.Android
                      value={option.value}
                      status={
                        PickupType === option.value ? 'checked' : 'unchecked'
                      }
                      color={Constants.pink}
                      uncheckedColor={Constants.black}
                    />
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text
                        style={{
                          color:
                            PickupType === option.value
                              ? Constants.pink
                              : Constants.black,
                          fontSize: 16,
                          fontWeight: '700',
                        }}>
                        {t(option.label)}
                      </Text>
                      <Text
                        style={{
                          color: Constants.customgrey2,
                          fontSize: 14,
                          marginTop: 2,
                        }}>
                        {t(option.description)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </RadioButton.Group>

              {PickupType === 'orderPickup' && (
                <View style={styles.totalcov}>
                  <Text
                    style={[
                      styles.boxtxt,
                      { marginBottom: 10, fontSize: 16, fontWeight: '900' },
                    ]}>
                    {t('Pick up in 2 Hours')}
                  </Text>
                  <Pressable
                    onPress={handleDatePickerOpen}
                    style={{
                      borderWidth: 1,
                      borderColor: Constants.customgrey2,
                      borderRadius: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 10,
                    }}>
                    <Text
                      style={{
                        // flex: 1,
                        height: 40,
                        color: pickupDate
                          ? Constants.black
                          : Constants.customgrey,
                        fontSize: 16,
                        fontFamily: FONTS.Regular,
                        paddingTop: 10,
                      }}>
                      {pickupDate
                        ? moment(pickupDate).format('MM/DD/YYYY')
                        : t('Select Delivery Date')}
                    </Text>
                    {/* <TextInput
                    value={
                      pickupDate ? moment(pickupDate).format('MM/DD/YYYY') : ''
                    }
                    onFocus={handleDatePickerOpen}
                    placeholder={t('Select Pickup Dates')}
                    placeholderTextColor={Constants.customgrey}
                    editable={false}
                    style={{
                      flex: 1,
                      height: 40,
                      color: Constants.black,
                      fontSize: 16,
                      fontFamily: FONTS.Regular,
                    }}
                  /> */}
                    <Calendar color="black" />
                  </Pressable>
                  <Text
                    style={[
                      styles.boxtxt,
                      {
                        fontFamily: FONTS.Regular,
                        marginBottom: 5,
                        marginTop: 5,
                        fontSize: 14,
                        color: Constants.customgrey,
                        flexDirection: 'column',
                      },
                    ]}>
                    {t(
                      '*Note: Bach Hoa Houston will hold your order until close of the next business day if your order isn’t picked up within your scheduled pick up date, after that your order will be cancelled and refunded less 5% restocking fee.',
                    )}
                  </Text>
                  <Text
                    style={[
                      styles.boxtxt,
                      {
                        fontFamily: FONTS.Regular,
                        marginBottom: 10,
                        marginTop: 5,
                        fontSize: 14,
                        color: Constants.customgrey,
                        flexDirection: 'column',
                      },
                    ]}>
                    {t(
                      '*Note: Orders placed before 2 PM are eligible for same-day pickup. Orders placed after 2 PM will be available for pickup the next day.',
                    )}
                  </Text>
                  {/* <DatePicker
                  modal
                  mode="datetime"
                  open={openDatePicker}
                  date={pickupDate || new Date()}
                  onConfirm={date => {
                    setPickupDate(date);
                    handleDatePickerClose();
                  }}
                  onCancel={handleDatePickerClose}
                  textColor={Constants.black}
                  title={t('Select Pickup Date')}
                  confirmText={t('Confirm')}
                  cancelText={t('Cancel')}
                  theme="light"
                /> */}
                  {/* <DateTimePickerModal
                  isVisible={openDatePicker}
                  mode="date"
                  minimumDate={minDate}
                  date={new Date()}
                  locale="en_GB"
                  display="spinner"
                  onConfirm={date => {
                    setPickupDate(date);
                    handleDatePickerClose();
                  }}
                  onCancel={() => handleDatePickerClose()}
                  themeVariant="ligt"

                /> */}
                </View>
              )}

              {PickupType === 'driveUp' && (
                <View style={styles.totalcov}>
                  <Text
                    style={[
                      styles.boxtxt,
                      { marginBottom: 10, fontSize: 16, fontWeight: '900' },
                    ]}>
                    {t('Pick up in 2 Hours')}
                  </Text>
                  <Pressable
                    onPress={handleDatePickerOpen}
                    style={{
                      borderWidth: 1,
                      borderColor: Constants.customgrey2,
                      borderRadius: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 10,
                    }}>
                    <Text
                      style={{
                        // flex: 1,
                        height: 40,
                        color: pickupDate
                          ? Constants.black
                          : Constants.customgrey,
                        fontSize: 16,
                        fontFamily: FONTS.Regular,
                        paddingTop: 10,
                      }}>
                      {pickupDate
                        ? moment(pickupDate).format('MM/DD/YYYY')
                        : t('Select Delivery Date')}
                    </Text>
                    {/* <TextInput
                    value={
                      pickupDate ? moment(pickupDate).format('MM/DD/YYYY') : ''
                    }
                    onFocus={handleDatePickerOpen}
                    placeholder={t('Select Pickup Date')}
                    placeholderTextColor={Constants.customgrey}
                    editable={false}
                    style={{
                      flex: 1,
                      height: 40,
                      color: Constants.black,
                      fontSize: 16,
                      fontFamily: FONTS.Regular,
                    }}
                  /> */}
                    <Calendar color="black" />
                  </Pressable>
                  <Text
                    style={[
                      styles.boxtxt,
                      {
                        fontFamily: FONTS.Regular,
                        marginBottom: 5,
                        marginTop: 5,
                        fontSize: 14,
                        color: Constants.customgrey,
                      },
                    ]}>
                    {t(
                      '*Note: Bach Hoa Houston will hold your order until close of the next business day if your order isn’t picked up within your scheduled pick up date, after that your order will be cancelled and refunded less 5% restocking fee.',
                    )}
                  </Text>
                  <Text
                    style={[
                      styles.boxtxt,
                      {
                        fontFamily: FONTS.Regular,
                        marginBottom: 10,
                        marginTop: 5,
                        fontSize: 14,
                        color: Constants.customgrey,
                        flexDirection: 'column',
                      },
                    ]}>
                    {t(
                      '*Note: Orders placed before 2 PM are eligible for same-day pickup. Orders placed after 2 PM will be available for pickup the next day.',
                    )}
                  </Text>
                  {/* <DateTimePickerModal
                  isVisible={openDatePicker}
                  mode="date"
                  minimumDate={minDate}
                  date={new Date()}
                  locale="en_GB"
                  display="spinner"
                  onConfirm={date => {
                    setPickupDate(date);
                    handleDatePickerClose();
                  }}
                  onCancel={() => handleDatePickerClose()}
                  themeVariant="light"
                /> */}
                </View>
              )}

              {PickupType === 'localDelivery' && (
                <View style={styles.totalcov}>
                  {/* <Text
                  style={[
                    styles.boxtxt,
                    {marginBottom: 10, fontSize: 16, fontWeight: '900'},
                  ]}>
                  {t('Pick up in 2 Hours')}
                </Text> */}
                  <View style={styles.paycovtxt}>
                    {user?.address ? (
                      <Text style={styles.locationtxt} numberOfLines={1}>
                        {user?.ApartmentNo
                          ? `${user?.ApartmentNo}, ${user?.address}`
                          : user?.address}
                      </Text>
                    ) : (
                      <Text style={styles.locationtxt} numberOfLines={1}>
                        {locationadd}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', width: '40%' }}
                      onPress={() => navigate('Shipping')}>
                      <LocationIcon
                        height={20}
                        width={20}
                        color={Constants.pink}
                      />
                      <Text style={styles.changadd}>{t('CHANGE ADDRESS')}</Text>
                    </TouchableOpacity>
                  </View>
                  {/* <TextInput
                  value={localDeliveryAddress.ApartmentNo}
                  onChangeText={text =>
                    setLocalDeliveryAddress({
                      ...localDeliveryAddress,
                      ApartmentNo: text,
                    })
                  }
                  placeholder={t('Apartment No.')}
                  placeholderTextColor={Constants.customgrey}
                  style={{
                    flex: 1,
                    height: 40,
                    color: Constants.black,
                    fontSize: 16,
                    fontFamily: FONTS.Regular,
                    borderWidth: 1,
                    borderColor: Constants.customgrey2,
                    borderRadius: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 10,
                    marginBottom: 10,
                  }}
                /> */}
                  {/* <TextInput
                  value={localDeliveryAddress.securityNo}
                  onChangeText={text =>
                    setLocalDeliveryAddress({
                      ...localDeliveryAddress,
                      securityNo: text,
                    })
                  }
                  placeholder={t('Security Gate No.')}
                  placeholderTextColor={Constants.customgrey}
                  style={{
                    flex: 1,
                    height: 40,
                    color: Constants.black,
                    fontSize: 16,
                    fontFamily: FONTS.Regular,
                    borderWidth: 1,
                    borderColor: Constants.customgrey2,
                    borderRadius: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 10,
                    marginBottom: 10,
                  }}
                /> */}
                  <Pressable
                    onPress={handleDatePickerOpen}
                    style={{
                      borderWidth: 1,
                      borderColor: Constants.customgrey2,
                      borderRadius: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 10,
                    }}>
                    <Text
                      style={{
                        // flex: 1,
                        height: 40,
                        color: pickupDate
                          ? Constants.black
                          : Constants.customgrey,
                        fontSize: 16,
                        fontFamily: FONTS.Regular,
                        paddingTop: 10,
                      }}>
                      {pickupDate
                        ? moment(pickupDate).format('MM/DD/YYYY')
                        : t('Select Delivery Date')}
                    </Text>
                    {/* <TextInput
                    value={
                      pickupDate ? moment(pickupDate).format('MM/DD/YYYY') : ''
                    }
                    onFocus={handleDatePickerOpen}
                    placeholder={t('Select Delivery Date')}
                    placeholderTextColor={Constants.customgrey}
                    editable={false}
                    style={{
                      // flex: 1,
                      height: 40,
                      color: Constants.black,
                      fontSize: 16,
                      fontFamily: FONTS.Regular,
                    }}
                  /> */}
                    <Calendar color="black" />
                  </Pressable>

                  {/* <TextInput
                  value={localDeliveryAddress?.zipcode}
                  onChangeText={text =>
                    setLocalDeliveryAddress(prev => ({
                      ...prev,
                      zipcode: text,
                    }))
                  }
                  placeholder={t('Enter Zip / Post Code')}
                  placeholderTextColor={Constants.customgrey}
                  style={{
                    flex: 1,
                    height: 40,
                    color: Constants.black,
                    fontSize: 16,
                    fontFamily: FONTS.Regular,
                    borderWidth: 1,
                    borderColor: Constants.customgrey2,
                    borderRadius: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 10,
                    marginTop: 10,
                  }}
                /> */}
                  <Dropdown
                    data={[
                      ...(!availableZipCodes.some(
                        zip =>
                          String(zip.pincode) ===
                          String(localDeliveryAddress.zipcode),
                      ) && localDeliveryAddress.zipcode
                        ? [
                          {
                            label: String(localDeliveryAddress.zipcode),
                            value: String(localDeliveryAddress.zipcode),
                            isTemporary: true,
                          },
                        ]
                        : []),
                      ...availableZipCodes.map(zip => ({
                        label: String(zip.pincode),
                        value: String(zip.pincode),
                      })),
                    ]}
                    value={String(localDeliveryAddress?.zipcode)}
                    onChange={item => {
                      setLocalDeliveryAddress({
                        ...localDeliveryAddress,
                        zipcode: String(item.value),
                      });
                    }}
                    placeholder={t('Select Zip Code')}
                    placeholderStyle={{ color: Constants.customgrey }}
                    selectedTextStyle={{ color: Constants.black }}
                    maxHeight={200}
                    labelField="label"
                    valueField="value"
                    renderItem={item => {
                      if (item?.isTemporary) return null;
                      return (
                        <Text style={{ padding: 10, color: Constants.black }}>
                          {item.label}
                        </Text>
                      );
                    }}
                    style={{
                      flex: 1,
                      height: 40,
                      color: Constants.black,
                      fontSize: 16,
                      fontFamily: FONTS.Regular,
                      borderWidth: 1,
                      borderColor: Constants.customgrey2,
                      borderRadius: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 10,
                      marginTop: 10,
                    }}
                  />

                  {localDeliveryAddress?.zipcode &&
                    availableZipCodes.length > 0 &&
                    !availableZipCodes.some(
                      zip => zip.pincode === localDeliveryAddress?.zipcode,
                    ) && (
                      <Text
                        style={{
                          color: Constants.red,
                          fontSize: 14,
                          marginTop: 5,
                        }}>
                        {t(
                          'Selected Zip Code is not available for delivery. Please select a valid Zip Code.',
                        )}
                      </Text>
                    )}
                  {/* <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 10,
                  }}>
                  <Checkbox
                    status={isBusiness ? 'checked' : 'unchecked'}
                    onPress={() => setIsBusiness(!isBusiness)}
                    color={Constants.saffron}
                    uncheckedColor={Constants.customgrey}
                  />
                  <Text>{t('Is this your business address?')}</Text>
                </View>
                {isBusiness && (
                  <TextInput
                    value={businessAddress.businessAddress}
                    onChangeText={text =>
                      setBusinessAddress({
                        ...businessAddress,
                        businessAddress: text,
                      })
                    }
                    placeholder={t('Business Name')}
                    placeholderTextColor={Constants.customgrey}
                    style={{
                      flex: 1,
                      height: 40,
                      color: Constants.black,
                      fontSize: 16,
                      fontFamily: FONTS.Regular,
                      borderWidth: 1,
                      borderColor: Constants.customgrey2,
                      borderRadius: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 10,
                      marginTop: 10,
                    }}
                  />
                )} */}
                  <Text
                    style={[
                      styles.boxtxt,
                      {
                        fontFamily: FONTS.Regular,
                        marginBottom: 10,
                        marginTop: 5,
                        fontSize: 14,
                        color: Constants.customgrey,
                      },
                    ]}>
                    {t(
                      'Note: We currently deliver only to selected ZIP codes. Orders placed before 8 pm are eligible for next day delivery. Orders placed after 8pm will be available for delivery in 2 days.',
                    )}
                  </Text>
                </View>
              )}

              {PickupType === 'shipping' && (
                <View style={styles.totalcov}>
                  {/* <Text
                  style={[
                    styles.boxtxt,
                    {marginBottom: 10, fontSize: 16, fontWeight: '900'},
                  ]}>
                  {t('Pick up in 2 Hours')}
                </Text> */}
                  <View style={styles.paycovtxt}>
                    {user?.address ? (
                      <Text style={styles.locationtxt} numberOfLines={1}>
                        {user?.ApartmentNo
                          ? `${user?.ApartmentNo}, ${user?.address}`
                          : user?.address}
                      </Text>
                    ) : (
                      <Text style={styles.locationtxt} numberOfLines={1}>
                        {locationadd}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', width: '40%' }}
                      onPress={() => navigate('Shipping')}>
                      <LocationIcon
                        height={20}
                        width={20}
                        color={Constants.pink}
                      />
                      <Text style={styles.changadd}>{t('CHANGE ADDRESS')}</Text>
                    </TouchableOpacity>
                  </View>
                  {/* <TextInput
                  value={localDeliveryAddress.ApartmentNo}
                  onChangeText={text =>
                    setLocalDeliveryAddress({
                      ...localDeliveryAddress,
                      ApartmentNo: text,
                    })
                  }
                  placeholder={t('Apartment No.')}
                  placeholderTextColor={Constants.customgrey}
                  style={{
                    flex: 1,
                    height: 40,
                    color: Constants.black,
                    fontSize: 16,
                    fontFamily: FONTS.Regular,
                    borderWidth: 1,
                    borderColor: Constants.customgrey2,
                    borderRadius: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 10,
                    marginBottom: 10,
                  }}
                /> */}
                  {/* <TextInput
                  value={localDeliveryAddress.securityNo}
                  onChangeText={text =>
                    setLocalDeliveryAddress({
                      ...localDeliveryAddress,
                      securityNo: text,
                    })
                  }
                  placeholder={t('Security Gate No.')}
                  placeholderTextColor={Constants.customgrey}
                  style={{
                    flex: 1,
                    height: 40,
                    color: Constants.black,
                    fontSize: 16,
                    fontFamily: FONTS.Regular,
                    borderWidth: 1,
                    borderColor: Constants.customgrey2,
                    borderRadius: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 10,
                    marginBottom: 10,
                  }}
                /> */}
                  {/* <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Checkbox
                    status={isBusiness ? 'checked' : 'unchecked'}
                    onPress={() => setIsBusiness(!isBusiness)}
                    color={Constants.saffron}
                    uncheckedColor={Constants.customgrey}
                  />
                  <Text>{t('Is this your business address?')}</Text>
                </View>
                {isBusiness && (
                  <TextInput
                    value={businessAddress.businessAddress}
                    onChangeText={text =>
                      setBusinessAddress({
                        ...businessAddress,
                        businessAddress: text,
                      })
                    }
                    placeholder="Business Name"
                    placeholderTextColor={Constants.customgrey}
                    style={{
                      flex: 1,
                      height: 40,
                      color: Constants.black,
                      fontSize: 16,
                      fontFamily: FONTS.Regular,
                      borderWidth: 1,
                      borderColor: Constants.customgrey2,
                      borderRadius: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 10,
                      marginTop: 10,
                    }}
                  />
                )} */}
                  <Text
                    style={[
                      styles.boxtxt,
                      {
                        fontFamily: FONTS.Regular,
                        marginBottom: 10,
                        marginTop: 5,
                        fontSize: 14,
                        color: Constants.customgrey,
                      },
                    ]}>
                    {t(
                      'Note: We currently deliver to 49/50 U.S. states. Unfortunately, we do not deliver to Hawaii at this time.',
                    )}
                  </Text>
                </View>
              )}

              <View style={styles.totalcov}>
                <Text style={styles.boxtxtlg}>{t('Cart Summary')}</Text>
                {/* Sub Total */}
                <View style={styles.total}>
                  <Text style={styles.boxtxt}>{t('Subtotal')}</Text>
                  <View style={styles.amount}>
                    {/* <Text style={[styles.boxtxt2, { fontFamily: FONTS.Medium }]}>
                    {Currency}
                    {(Number(totalsum) || 0).toFixed(2)}
                  </Text> */}
                    <Text style={[styles.boxtxt, { fontFamily: FONTS.Medium }]}>
                      {Currency}
                      {Number(totaloff).toFixed(2)}
                    </Text>
                  </View>
                </View>
                {/* Coupon */}
                <View style={styles.total}>
                  <Text style={styles.boxtxt}>{t('Coupon Discount')}</Text>
                  {coupon && couponDiscount > 0 ? (
                    <Pressable
                      onPress={() => {
                        setCoupon(false);
                        setCouponDiscount(0);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}>
                      <Text style={[styles.boxtxt, { fontFamily: FONTS.Medium }]}>
                        - {Currency}
                        {(Number(couponDiscount) || 0).toFixed(2)}
                      </Text>
                      <CrossIcon height={10} width={10} />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => setOpen(true)}
                      style={styles.amount}>
                      <Text style={[styles.boxtxt, { color: Constants.green }]}>
                        {t('Apply Coupon')}
                      </Text>
                    </Pressable>
                  )}
                </View>
                {/* Delivery Tip */}
                {PickupType === 'localDelivery' && (
                  <View style={styles.total}>
                    <Text style={styles.boxtxt}>{t('Delivery Partner Tip')}</Text>
                    {deliveryTip === 0 ? (
                      <Dropdown
                        style={{
                          height: 20,
                          borderRadius: 5,
                          width: 80,
                        }}
                        containerStyle={{
                          width: 100,
                          marginTop: 5,
                          marginLeft: -20,
                          borderRadius: 5,
                        }}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        inputSearchStyle={styles.inputSearchStyle}
                        iconStyle={styles.iconStyle}
                        data={[
                          {
                            label: t('Tip $0'),
                            value: 0,
                          },
                          {
                            label: t('Tip $2'),
                            value: 2,
                          },
                          {
                            label: t('Tip $5'),
                            value: 5,
                          },
                          {
                            label: t('Tip $8'),
                            value: 8,
                          },
                        ]}
                        maxHeight={180}
                        labelField="label"
                        valueField="value"
                        placeholder={t('Select Tip')}
                        value={deliveryTip}
                        onChange={item => {
                          setDeliveryTip(item.value);
                        }}
                        search={false}
                        renderItem={item => (
                          <Text style={styles.itemText}>
                            {item.label} ({Currency}
                            {item.value})
                          </Text>
                        )}
                      />
                    ) : (
                      <Pressable
                        onPress={() => {
                          setDeliveryTip(0);
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                        }}>
                        <Text style={[styles.boxtxt, { fontFamily: FONTS.Medium }]}>
                          {Currency}
                          {(Number(deliveryTip) || 0).toFixed(2)}
                        </Text>
                        <CrossIcon height={12} width={12} color={Constants.red} />
                      </Pressable>
                    )}
                  </View>
                )}
                {/* Delivery Fees */}
                {PickupType === 'localDelivery' ? (
                  <View>
                    {totaloff < 35 ? (
                      <View style={styles.total}>
                        <Text style={[styles.boxtxt]}>{t('Delivery Fee')}</Text>
                        <View style={styles.amount}>
                          {/* <Text style={styles.boxtxt2}>{Currency}{shippingFee}</Text> */}
                          <Text
                            style={[styles.boxtxt, { fontFamily: FONTS.Medium }]}>
                            {Currency}
                            {Number(localDeliveryCost).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.total}>
                        <Text style={[styles.boxtxt]}>
                          {t('Delivery Fee')} ({Currency}
                          {Number(localDeliveryCost).toFixed(2)} {t('Saved')})
                        </Text>
                        <View style={styles.amount}>
                          <Text
                            style={[styles.boxtxt2, { fontFamily: FONTS.Medium }]}>
                            {Currency}
                            {Number(localDeliveryCost).toFixed(2)}
                          </Text>
                          <Text
                            style={[styles.boxtxt, { fontFamily: FONTS.Medium }]}>
                            {Currency}0.00
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                ) : PickupType === 'shipping' ? (
                  <View>
                    {totaloff < 200 ? (
                      <View style={styles.total}>
                        <Text style={[styles.boxtxt]}>{t('Delivery Fee')}</Text>
                        <View style={styles.amount}>
                          {/* <Text style={styles.boxtxt2}>{Currency}{shippingFee}</Text> */}
                          <Text
                            style={[styles.boxtxt, { fontFamily: FONTS.Medium }]}>
                            {Currency}
                            {Number(shippingDeliveryCost).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.total}>
                        <Text style={[styles.boxtxt]}>
                          {t('Delivery Fee')} ({Currency}
                          {Number(shippingDeliveryCost).toFixed(2)} {t('Saved')})
                        </Text>
                        <View style={styles.amount}>
                          <Text
                            style={[styles.boxtxt2, { fontFamily: FONTS.Medium }]}>
                            {Currency}
                            {Number(shippingDeliveryCost).toFixed(2)}
                          </Text>
                          <Text
                            style={[styles.boxtxt, { fontFamily: FONTS.Medium }]}>
                            {Currency}0.00
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                ) : null}
                {/* Tax Amount */}
                {/* <View style={styles.total}>
                <Text style={styles.boxtxt}>{t('Tax')}</Text>
                <View style={styles.amount}>
                  <Text style={[styles.boxtxt, {fontFamily: FONTS.Medium}]}>
                    {Currency}
                    {(Number(totalTax) || 0).toFixed(2)}
                  </Text>
                </View>
              </View> */}

                <View style={styles.line} />
                <View style={styles.total}>
                  <Text style={[styles.boxtxt, { fontFamily: FONTS.Medium }]}>
                    {t('Total Payable')}
                  </Text>
                  <Text style={[styles.boxtxt, { fontFamily: FONTS.Medium }]}>
                    {Currency}
                    {(Number(totalFinal) || 0).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.paycov}>
                  {/* <View style={styles.paycovtxt}>
                {user?.address ? (
                  <Text style={styles.locationtxt} numberOfLines={1}>
                    {user?.ApartmentNo}, {user?.address}
                  </Text>
                ) : (
                  <Text style={styles.locationtxt} numberOfLines={1}>
                    {locationadd}
                  </Text>
                )}
                <TouchableOpacity
                  style={{flexDirection: 'row', width: '40%'}}
                  onPress={() => navigate('Shipping')}>
                  <LocationIcon height={20} width={20} color={Constants.pink} />
                  <Text style={styles.changadd}>{t('CHANGE ADDRESS')}</Text>
                </TouchableOpacity>
              </View> */}
                  <TouchableOpacity
                    style={styles.cartbtn}
                    onPress={() => {
                      if (PickupType === null) {
                        Toast.show({
                          type: 'error',
                          text1: t('Please select a pickup type'),
                        });
                        return;
                      }
                      if (PickupType === 'orderPickup') {
                        if (!pickupDate) {
                          Toast.show({
                            type: 'error',
                            text1: t('Please select a pickup date'),
                          });
                          return;
                        }
                      }
                      if (PickupType === 'driveUp') {
                        if (!pickupDate) {
                          Toast.show({
                            type: 'error',
                            text1: t('Please select a pickup date'),
                          });
                          return;
                        }
                      }
                      if (PickupType === 'localDelivery' && !pickupDate) {
                        Toast.show({
                          type: 'error',
                          text1: t('Please select a delivery date'),
                        });
                        return;
                      }

                      console.log(user);

                      // Check if user is properly authenticated
                      if (!user || !user._id) {
                        Toast.show({
                          type: 'error',
                          text1: t('Please login to continue'),
                        });
                        navigate('Auth');
                        return;
                      }

                      initiatePurchase();
                      // const checkoutData = {
                      //   cartdetail,
                      //   PickupType,
                      //   pickupDate: pickupDate
                      //     ? moment(pickupDate).format('DD/MM/YYYY')
                      //     : null,
                      //   localDeliveryAddress,
                      //   businessAddress,
                      //   isBusiness,
                      //   deliveryFees,
                      //   totalFinal,
                      //   totaloff,
                      //   couponDiscount,
                      // };

                      // user?.address
                      //   ? navigate('Checkout', {checkoutData})
                      //   : navigate('Shipping', {type: 'checkout'});
                    }}>
                    <Text style={styles.buttontxt}>
                      {t('CONTINUE TO PAY')} {Currency}
                      {totalFinal}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              height: Dimensions.get('window').height - 200,
            }}>
            {/* <BucketIcon color={Constants.black} height={100} width={100} /> */}
            <Image
              source={require('../../Assets/Images/empty.png')}
              style={{ height: 100, width: 100 }}
            />
            <Text style={styles.carttxt2}>{t('Your Cart is empty')}</Text>
            <Text style={styles.browsprod} onPress={() => navigate('Categories')}>
              {t('Browse Products')}
            </Text>
          </View>
        )}
        <Modal
          animationType="none"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            // Alert.alert('Modal has been closed.');
            setModalVisible(!modalVisible);
          }}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View
                style={{
                  backgroundColor: 'white',
                  alignItems: 'center',
                  paddingHorizontal: 30,
                }}>
                <Text style={styles.textStyle}>
                  {t('Are you sure of clearing your cart?')}
                </Text>
                <View style={styles.cancelAndLogoutButtonWrapStyle}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setModalVisible(!modalVisible)}
                    style={styles.cancelButtonStyle}>
                    <Text style={[styles.modalText, { color: Constants.pink }]}>
                      {t('No')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.logOutButtonStyle}
                    onPress={async () => {
                      await AsyncStorage.removeItem('cartdata');
                      setcartdetail([]);
                      setModalVisible(false);
                      setPickupDate(null);
                      setPickupType(null);
                    }}>
                    <Text style={styles.modalText}>{t('Yes, Clear')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          animationType="none"
          transparent={true}
          visible={open}
          onRequestClose={() => {
            setOpen(false);
          }}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View
                style={{
                  alignItems: 'center',
                  paddingHorizontal: 30,
                }}>
                <Text style={styles.modalText2}>{t('Enter Coupon Code')}</Text>
                <TextInput
                  value={couponCode}
                  onChangeText={text => setCouponCode(text)}
                  placeholder={t('Coupon Code')}
                  placeholderTextColor={Constants.customgrey}
                  style={styles.input2}
                />
                <View style={styles.cancelAndLogoutButtonWrapStyle}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setOpen(false)}
                    style={styles.cancelButtonStyle}>
                    <Text style={[styles.modalText, { color: Constants.pink }]}>
                      {t('No')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.logOutButtonStyle}
                    onPress={async () => {
                      if (couponCode.trim() === '') {
                        Toast.show({
                          type: 'error',
                          text1: t('Please enter a coupon code'),
                        });
                        return;
                      }

                      if (!user._id) {
                        Toast.show({
                          type: "error",
                          text1: t("Please log in first"),
                        });
                      }
                      // setLoading(true);
                      try {
                        const response = await Post(
                          `ValidateCouponforUser`,
                          {
                            code: couponCode,
                            cartValue: totaloff,
                            userId: user._id,
                          },
                          {},
                        );
                        // setLoading(false);
                        if (response.status) {
                          setCoupon(true);
                          setOpen(false);
                          setCouponDiscount(response.data.discount);
                          setDiscountCode(couponCode);
                          Toast.show({
                            type: 'success',
                            text1: t('Coupon applied successfully'),
                          });
                        } else {
                          Toast.show({
                            type: 'error',
                            text1:
                              response.message || t('Failed to apply coupon'),
                          });

                          setOpen(false);
                        }
                      } catch (error) {
                        // setLoading(false);
                        console.warn(error);
                        Toast.show({
                          type: 'error',
                          text1: t('Failed to apply coupon'),
                        });
                      }
                    }}>
                    <Text style={styles.modalText}>{t('Yes, Apply')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          animationType="none"
          transparent={true}
          visible={modalView}
          onRequestClose={() => {
            // Alert.alert('Modal has been closed.');
            setModalView(false);
            navigate('App');
          }}>
          <View style={styles.centeredView}>
            <View style={styles.modalView2}>
              <View style={{ backgroundColor: 'white', alignItems: 'center' }}>
                <Text style={styles.txt}>{t('Your Order is Confirmed.')}</Text>
                <Text style={styles.txt2}>{t('Thanks for your Order')}</Text>
                <View style={styles.cancelAndLogoutButtonWrapStyle2}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={async () => {
                      setModalView(!modalView);
                      navigate('App');
                    }}
                    style={styles.logOutButtonStyle2}>
                    <Text style={styles.modalText}>{t('OK')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* <StripePayment
        visible={showStripePayment}
        onClose={() => setShowStripePayment(false)}
        amount={totalFinal}
        currency="usd"
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        customerData={{
          name: user?.username || '',
          email: user?.email || '',
          userId: user?._id || '',
          address: {
            line1: user?.address || '',
            line2: user?.ApartmentNo || '',
            city: user?.city || '',
            state: user?.state || '',
            postal_code:
              localDeliveryAddress?.zipcode || user?.zipcode || '',
            country: 'US',
          },
        }}
        orderData={{
          orderId: `ORDER_${Date.now()}`,
          items: cartdetail?.length || 0,
          pickupType: PickupType,
          deliveryDate: pickupDate,
        }}
      /> */}
        <StripeCheckoutButton
          customerData={{
            name: user?.username || '',
            email: user?.email || '',
            userId: user?._id || '',
            address: {
              line1: user?.address || '',
              line2: user?.ApartmentNo || '',
              city: user?.city || '',
              state: user?.state || '',
              postal_code: localDeliveryAddress?.zipcode || user?.zipcode || '',
              country: 'US',
            },
          }}
          pickupType={PickupType}
          cartData={cartdetail.map(item => ({
            productid: item.productid,
            productname: item.productname,
            offer: item.offer,
            price: parseFloat(item.offer),
            qty: item.qty,
            quantity: item.qty,
            tax_code: item.tax_code || 'txcd_10000000',
          }))}
          orderData={{
            pickupType: PickupType,
            deliveryDate: pickupDate,
            deliveryAddress:
              ((PickupType === 'localDelivery' || PickupType === 'shipping') && {
                ...localDeliveryAddress,
                address: user?.address,
                name: user?.username,
                phoneNumber: user?.number,
                email: user?.email,
              }) ||
              null,
            deliveryFee: deliveryFees,
            deliveryTip: deliveryTip,
            couponDiscount: couponDiscount,
            couponCode: couponCode,
            discountCode: discountCode,
            subtotal: totaloff,
          }}
          triggerCheckout={showStripePayment}
          onPaymentSuccess={paymentResult => {
            console.log('Payment succeeded with auto tax:', paymentResult);
            setShowStripePayment(false);
            submitCheckoutWithStripeData(paymentResult);
          }}
          onPaymentError={error => {
            console.warn('Stripe checkout failed:', error);
            setShowStripePayment(false);
            handlePaymentError(error);
          }}
          onPaymentCancel={() => {
            console.log('User cancelled Stripe checkout');
            setShowStripePayment(false); // Reset trigger
            setLoading(false);
            setCoupon(false);
            setCouponDiscount(0);
          }}
        />

      </SafeAreaView>
      <DateTimePickerModal
        isVisible={openDatePicker}

        mode="date"
        // locale="en_GB"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        minimumDate={minDate}
        date={new Date(pickupDate)}
        onConfirm={date => {
          // date.setHours(0, 0, 0, 0);
          console.log('Selected:', date);
          setPickupDate(new Date(date));
          AsyncStorage.setItem(
            'pickupDate',
            moment(new Date(date)).format('YYYY-MM-DD'),
          ).then(() =>
            console.log('Stored date:', moment(new Date(date)).format('YYYY-MM-DD')),
          );
          handleDatePickerClose();
        }}
        onCancel={handleDatePickerClose}
        themeVariant="dark"
        textColor={Constants.green}
      />
    </>
  );
};

export default Cart;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
  },
  toppart: {
    backgroundColor: Constants.saffron,
    paddingTop: 10,
    // paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // padding: 10,
    paddingBottom: 10,
  },
  addbtn: {
    backgroundColor: Constants.pink,
    color: Constants.white,
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: FONTS.Bold,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Constants.white,
  },
  box: {
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 10,
    // borderBottomWidth: 1,
    borderColor: Constants.customgrey3,
    marginHorizontal: 10,
  },
  firstpart: {
    flexDirection: 'row',
    // alignItems: 'center',
    justifyContent: 'space-between',
  },
  firstleftpart: {
    flexDirection: 'row',
    // alignItems: 'center',
    gap: 10,
  },
  carttxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Bold,
    marginLeft: 10,
  },
  cardimg: {
    height: 75,
    width: 75,
    // resizeMode: 'stretch',,
  },
  disctxt: {
    fontSize: 12,
    color: Constants.pink,
    fontFamily: FONTS.Medium,
    textDecorationLine: 'line-through',
  },
  productname: {
    fontSize: 16,
    color: Constants.black,
    fontFamily: FONTS.Medium,
    marginBottom: 5,
    width: Dimensions.get('window').width - 150,
  },
  qty: {
    fontSize: 14,
    color: Constants.customgrey,
    fontFamily: FONTS.Bold,
    // marginBottom: 5,
  },
  maintxt: {
    fontSize: 15,
    color: Constants.black,
    fontFamily: FONTS.Bold,
  },
  addcov: {
    flexDirection: 'row',
    width: 120,
    height: 40,
    alignSelf: 'flex-end',
    // borderRadius:10
  },
  plus: {
    backgroundColor: Constants.saffron,
    // color: Constants.white,
    flex: 1,
    textAlign: 'center',
    height: '100%',
    // paddingVertical: '5%',
    // fontSize: 30,
    alignSelf: 'center',
    // fontFamily: FONTS.Bold,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plus2: {
    backgroundColor: '#F3F3F3',
    color: Constants.black,
    flex: 1,
    textAlign: 'center',
    height: '100%',
    paddingVertical: '5%',
    fontSize: 20,
    alignSelf: 'center',
    fontFamily: FONTS.Black,
  },
  plus3: {
    backgroundColor: Constants.saffron,
    color: Constants.white,
    flex: 1,
    textAlign: 'center',
    height: '100%',
    // paddingVertical: '2%',
    // fontSize: 30,
    alignSelf: 'center',
    // fontFamily: FONTS.Bold,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btombg: {
    backgroundColor: Constants.white,
    // flex: 1,
    paddingBottom: 70,
  },
  totalcov: {
    backgroundColor: Constants.white,
    // marginVertical: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  paycov: {
    backgroundColor: Constants.white,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  boxtxtlg: {
    color: Constants.black,
    fontSize: 18,
    // fontWeight: '500',
    fontFamily: FONTS.Medium,
    marginBottom: 10,
  },
  boxtxt: {
    color: Constants.black,
    fontSize: 15,
    // fontWeight: '500',
    fontFamily: FONTS.Regular,
  },
  boxtxt2: {
    color: Constants.customgrey,
    fontSize: 15,
    // fontWeight: '500',
    fontFamily: FONTS.Medium,
    textDecorationLine: 'line-through',
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  amount: {
    flexDirection: 'row',
    gap: 10,
  },
  line: {
    height: 1,
    backgroundColor: Constants.customgrey + '50',
    marginVertical: 5,
  },
  buttontxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
  cartbtn: {
    height: 60,
    // width: 370,
    borderRadius: 10,
    backgroundColor: Constants.saffron,
    // marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // width: '90%',
    // alignSelf: 'center',
    paddingHorizontal: 20,
  },
  locationtxt: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS.Regular,
    marginRight: 5,
    width: '55%',
  },
  changadd: {
    fontSize: 14,
    color: Constants.pink,
    fontFamily: FONTS.Medium,
  },
  paycovtxt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  //////model///
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: 22,
    backgroundColor: '#rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    width: '90%',
  },
  modalView2: {
    margin: 20,
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

  textStyle: {
    color: Constants.black,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 16,
    margin: 20,
    marginBottom: 10,
  },
  cancelAndLogoutButtonWrapStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 3,
  },
  modalText: {
    color: Constants.white,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Black,
    fontSize: 14,
  },
  modalText2: {
    color: Constants.black,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 18,
    marginBottom: 10,
  },
  input2: {
    width: Dimensions.get('window').width - 60,
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
  },
  cancelButtonStyle: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginRight: 10,
    borderColor: Constants.pink,
    borderWidth: 1,
    borderRadius: 10,
  },
  logOutButtonStyle: {
    flex: 0.5,
    backgroundColor: Constants.pink,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  ////model end/////
  carttxt2: {
    color: Constants.black,
    fontSize: 18,
    // fontWeight: '500',
    marginVertical: 10,
    fontFamily: FONTS.Bold,
  },
  browsprod: {
    // flex: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderColor: Constants.pink,
    borderWidth: 1.5,
    borderRadius: 10,
    color: Constants.pink,
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
  radioView: {
    marginVertical: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: Constants.white,
    borderWidth: 1,
    borderColor: Constants.customgrey3,
  },
  itemText: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS.Regular,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Constants.customgrey3,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Black background with 50% opacity
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // modalText: {
  //   color: '#fff',
  //   fontSize: 18,
  //   marginBottom: 20,
  // },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  applyButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6,
    marginBottom: 15,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: '#ccc',
    fontSize: 14,
  },
  txt: {
    color: Constants.black,
    fontSize: 20,
    marginVertical: 10,
    fontFamily: FONTS.Medium,
  },
  txt2: {
    color: Constants.black,
    fontSize: 16,
    marginBottom: 10,
    fontFamily: FONTS.Medium,
  },
  cancelAndLogoutButtonWrapStyle2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 5,
  },
  logOutButtonStyle2: {
    flex: 0.5,
    backgroundColor: Constants.saffron,
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
  },
});
