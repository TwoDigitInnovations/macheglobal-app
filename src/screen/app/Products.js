/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { MinusIcon, Plus2Icon, PlusIcon } from '../../../Theme';
import { CartContext, LoadContext, ToastContext } from '../../../App';
import { GetApi, Post } from '../../Assets/Helpers/Service';
import { navigate } from '../../../navigationRef';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../Assets/Component/Header';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
import ProductCard from './ProductCard';

const Products = props => {
  const { t } = useTranslation();
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [productlist, setproductlist] = useState([]);
  const [page, setPage] = useState(1);
  const [curentData, setCurrentData] = useState([]);
  const [user, setuser] = useState();
  const IsFocused = useIsFocused();
  const data = props?.route?.params.item;
  const catname = props?.route?.params.name;
  const topsell = props?.route?.params.type;
  useEffect(() => {
    {
      data && getproduct(1);
    }
    {
      topsell === 'topselling' && getTopSoldProduct(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (IsFocused) {
      setInitialRoute();
    }
  }, [IsFocused]);

  const setInitialRoute = async () => {
    const user = await AsyncStorage.getItem('userDetail');
    setuser(JSON.parse(user));
  };

  const getproduct = p => {
    setPage(p);
    setLoading(true);
    GetApi(`getProductbycategory/${data}?page=${p}`, {}).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res.status) {
          setCurrentData(res.data);
          if (p === 1) {
            setproductlist(res.data);
          } else {
            setproductlist([...productlist, ...res.data]);
          }
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  const getTopSoldProduct = p => {
    setPage(p);
    setLoading(true);
    GetApi(`getTopSoldProduct?page=${p}`).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res.status) {
          setCurrentData(res.data);
          if (p === 1) {
            setproductlist(res.data);
          } else {
            setproductlist([...productlist, ...res.data]);
          }
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  const cartdata = async productdata => {
    const existingCart = Array.isArray(cartdetail) ? cartdetail : [];

    const existingProduct = existingCart.find(
      f =>
        f.productid === productdata._id &&
        f.price_slot?.value === productdata?.price_slot[0]?.value,
    );

    if (!existingProduct) {
      const newProduct = {
        productid: productdata._id,
        productname: productdata.name,
        vietnamiesName: productdata?.vietnamiesName,
        price: productdata?.price_slot[0]?.other_price,
        offer: productdata?.price_slot[0]?.our_price,
        image: productdata.varients[0].image[0],
        price_slot: productdata?.price_slot[0],
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
      let stringdata = cartdetail.map(_i => {
        if (_i?.productid == productdata._id) {
          console.log('enter');
          return { ..._i, qty: _i?.qty + 1 };
        } else {
          return _i;
        }
      });
      setcartdetail(stringdata);
      await AsyncStorage.setItem('cartdata', JSON.stringify(stringdata));
    }
    // navigate('Cart');
    setToast(t('Successfully added to cart.'));
  };
  const fetchNextPage = () => {
    console.log('enter', curentData.length);
    if (curentData.length === 20) {
      console.log('enter1', topsell);
      if (topsell === 'topselling') {
        console.log('enter2');
        getTopSoldProduct(page + 1);
      } else {
        getproduct(page + 1);
      }
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item={t('Products')} showback={true} />
      <Text style={styles.headtxt}>{catname}</Text>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 10 }}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, width: '100%' }}>
        {productlist && productlist.length > 0 ? (
          productlist.map((item, i) => {
            const cartItem = Array.isArray(cartdetail)
              ? cartdetail.find(it => it?.productid === item?._id)
              : undefined;
            return (
              <View key={item._id || i.toString()} style={[styles.box, { marginBottom: productlist.length === i + 1 ? 100 : 10 }]}>
                <ProductCard
                  item={item}
                  cartItem={cartItem}
                  cartdata={cartdata}
                  setcartdetail={setcartdetail}
                  cartdetail={cartdetail}
                />
              </View>
            );
          })
        ) : (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              height: Dimensions.get('window').height - 200,
            }}>
            <Text
              style={{
                color: Constants.black,
                fontSize: 20,
                fontFamily: FONTS.Medium,
              }}>
              {t('No Products')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Products;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
    paddingBottom: 70,
  },

  headtxt: {
    color: Constants.black,
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: FONTS.Bold,
    // marginVertical:10
  },
  box: {
    // width:
    //   Dimensions.get('window').width < 600
    //     ? Dimensions.get('window').width / 2 - 20
    //     : Dimensions.get('window').width / 3 - 20,
    // width: Dimensions.get('window').width < 600 ? '48%' : '31%',
    // marginVertical: 10,
  },
  cardimg: {
    height: 95,
    width: '90%',
    resizeMode: 'contain',
    alignSelf: 'center',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    // backgroundColor:'red'
  },
  cardimg2: {
    height: 50,
    width: 50,
    position: 'absolute',
    right: -14,
    top: -17,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor:Constants.red,
  },
  disctxt: {
    fontSize: 18,
    color: Constants.black,
    fontFamily: FONTS.Bold,
  },
  maintxt: {
    fontSize: 16,
    color: Constants.customgrey,
    fontFamily: FONTS.Medium,
    textDecorationLine: 'line-through',
  },
  proname: {
    fontSize: 16,
    color: Constants.black,
    fontFamily: FONTS.Bold,
    marginTop: 10,
    marginHorizontal: 10,
  },
  weight: {
    fontSize: 16,
    color: Constants.customgrey,
    fontFamily: FONTS.Regular,
    marginLeft: 10,
    marginTop: 5,
  },
  offtxt: {
    fontSize: 12,
    color: Constants.white,
    fontFamily: FONTS.Black,
    marginLeft: 7,
  },
  pluscov: {
    // backgroundColor:Constants.blue,
    height: 40,
    alignSelf: 'flex-end',
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 0 6 0 grey',
    borderRadius: 10,
    // marginRight:20
  },
  addcov: {
    flexDirection: 'row',
    height: 40,
    width: 105,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-end',
  },

  minus: {
    backgroundColor: Constants.pink,
    width: 35,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },

  qtyText: {
    backgroundColor: '#F3F3F3',
    width: 35,
    height: '100%',
    textAlign: 'center',
    textAlignVertical: 'center', // Android vertical alignment
    fontSize: 18,
    color: Constants.black,
    fontFamily: FONTS.Black,
    justifyContent: 'center',
    alignItems: 'center',
    lineHeight: 40, // iOS vertical centering (if Text only)
  },

  plus3: {
    backgroundColor: Constants.pink,
    width: 35,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
});
