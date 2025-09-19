/* eslint-disable react-native/no-inline-styles */
import { View, Text, TouchableOpacity } from 'react-native';
import React, { use, useCallback, useContext, useEffect, useState } from 'react';
import { RightarrowIcon } from '../../../Theme';
import Constants, { FONTS } from '../Helpers/constant';
import { navigate } from '../../../navigationRef';
import { useTranslation } from 'react-i18next';
import { GetApi } from '../Helpers/Service';
import { FlatList } from 'react-native';
import ProductCard from '../../screen/app/ProductCard';
import { CartContext, ToastContext } from '../../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast } from 'toastify-react-native';
import { useFocusEffect } from '@react-navigation/native';

const Sale = ({ setIsSale }) => {
  const { t } = useTranslation();
  const [saleData, setSaleData] = useState([]);
  const [countdown, setCountdown] = useState([]);
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [toast, setToast] = useContext(ToastContext);

  const fetchSaleData = () => {
    GetApi(`getActiveFlashSales`, {}).then(
      async res => {
        if (res.status) {
          setSaleData(res.data);
          console.log(res.data, 'Sale Data');
        }
      },
      err => {
        console.log(err);
      },
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchSaleData();

      return () => { }; // cleanup if needed
    }, [])
  );

  // React.useEffect(() => {
  //   fetchSaleData();
  // }, []);

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date().getTime();
      const newCountdown = {};

      saleData.forEach(sale => {
        const startDate = new Date(sale.startDateTime).getTime();
        const endDate = new Date(sale.endDateTime).getTime();

        if (now < startDate) {
          const distance = startDate - now;
          newCountdown[sale._id] = {
            ...calculateTimeLeft(distance),
            status: 'upcoming',
            message: 'Sale starts in',
          };
        } else if (now >= startDate && now < endDate) {
          const distance = endDate - now;
          newCountdown[sale._id] = {
            ...calculateTimeLeft(distance),
            status: 'active',
            message: 'Sale ends in',
          };
        } else {
          newCountdown[sale._id] = {
            status: 'expired',
            message: 'Sale has ended',
          };
        }
      });

      setCountdown(newCountdown);
    };

    const calculateTimeLeft = distance => {
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    if (saleData.length > 0) {
      calculateCountdown();
      const interval = setInterval(calculateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [saleData]);

  const cartdata = async (productdata, items) => {
    const existingCart = Array.isArray(cartdetail) ? cartdetail : [];

    const existingProduct = existingCart.find(
      f =>
        f.productid === productdata._id &&
        f.price_slot?.value === productdata?.price_slot[0]?.value,
    );

    console.log('Existing Product:', items);

    if (!existingProduct) {
      const newProduct = {
        productid: productdata._id,
        productname: productdata.name,
        vietnamiesName: productdata?.vietnamiesName,
        price: items?.price_slot?.our_price,
        offer: items?.price,
        image: productdata.varients[0].image[0],
        price_slot: items?.price_slot,
        qty: 1,
        seller_id: productdata.userid,
        isShipmentAvailable: productdata.isShipmentAvailable,
        isInStoreAvailable: productdata.isInStoreAvailable,
        isCurbSidePickupAvailable: productdata.isCurbSidePickupAvailable,
        isNextDayDeliveryAvailable: productdata.isNextDayDeliveryAvailable,
        slug: productdata.slug,
        tax_code: productdata.tax_code,
        tax: productdata.tax,
      };

      const updatedCart = [...existingCart, newProduct];
      setcartdetail(updatedCart);
      await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
      console.log('Product added to cart:', newProduct);
    } else {
      console.log(
        'Product already in cart with this price slot:',
        existingProduct,
      );
      let stringdata = cartdetail.map(_i => {
        if (_i?.productid == productdata._id) {
          console.log('enter');
          return { ..._i, qty: _i?.qty + 1 };
        } else {
          return _i;
        }
      });
      console.log(stringdata);
      setcartdetail(stringdata);
      await AsyncStorage.setItem('cartdata', JSON.stringify(stringdata));
    }
    // navigate('Cart');
    setToast(t('Successfully added to cart.'));
  };

  const renderTimeBlock = (label, value) => (
    <View style={styles.timeBlock}>
      <Text style={styles.timeValue}>{value < 10 ? `0${value}` : value}</Text>
      <Text style={styles.timeLabel}>{t(label)}</Text>
    </View>
  );

  useEffect(() => {
    if (saleData?.length > 0) {
      setIsSale(true);
    }
  }, [saleData]);

  return (
    <>
      {/* {sellProduct?.length > 0 && ( */}
      <View style={{ marginBottom: 5, marginHorizontal: 15 }}>
        <View style={styles.covline}>
          {/* Left: Offer of the week Title + Status */}
          <View style={styles.titleRow}>
            <Text style={styles.categorytxt}>{t('Offer of the week')}</Text>
            <View style={styles.liveStatus}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                {countdown[0]?.status || t('Sale is live')}
              </Text>
            </View>
          </View>
        </View>

        {saleData.map((item, i) => {
          const cartItem = Array.isArray(cartdetail)
            ? cartdetail.find(it => it?.productid === item?.product?._id)
            : undefined;
          const itemQuantity = cartItem ? cartItem.qty : 0;
          const currentSale = countdown[item._id];
          const isActive = currentSale?.status === 'active';
          const isUpcoming = currentSale?.status === 'upcoming';

          return (
            <View style={{ marginBottom: 10 }} key={i}>
              <ProductCard
                item={item.product}
                cartItem={cartItem}
                cartdata={(e) => { cartdata(e, item) }}
                setcartdetail={setcartdetail}
                cartdetail={cartdetail}
                salePrice={item.price}
                currentSale={currentSale}
                saleVarient={item.price_slot}
              />
            </View>
          );
        })}
      </View>
      {/* // )} */}
    </>
  );
};

const styles = {
  covline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginBottom: 10,
    alignItems: 'center',
    // backgroundColor:Constants.red
  },
  categorytxt: {
    fontSize: 20,
    color: Constants.black,
    fontFamily: FONTS.Bold,
  },
  seealltxt: {
    fontSize: 18,
    color: Constants.pink,
    fontFamily: FONTS.Bold,
    marginHorizontal: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f3f3',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // elevation: 2,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  header: {
    backgroundColor: 'rgba(243, 133, 41, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(243, 133, 41, 0.2)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#F38529',
    marginRight: 8,
  },
  statusText: {
    color: '#F38529',
    fontSize: 14,
    fontWeight: '500',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  timeBlock: {
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F38529',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
  },
  endedContainer: {
    padding: 16,
  },
  endedDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginRight: 8,
  },
  endedText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'red',
  },
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F38529',
  },

  liveText: {
    fontSize: 13,
    color: '#F38529',
    fontWeight: '500',
  },
};

export default Sale;
