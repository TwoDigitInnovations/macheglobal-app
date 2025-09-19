/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable quotes */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react-native/no-inline-styles */
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import {
  DiscountIcon,
  DownarrIcon,
  LocationIcon,
  MinusIcon,
  Plus2Icon,
  PlusIcon,
  ProfileIcon,
  RightarrowIcon,
  SearchIcon,
} from '../../../Theme';
// import LinearGradient from 'react-native-linear-gradient';
import { navigate } from '../../../navigationRef';
import { GetApi } from '../../Assets/Helpers/Service';
import { CartContext, LoadContext, ToastContext } from '../../../App';
import Header from '../../Assets/Component/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SwiperFlatList from 'react-native-swiper-flatlist';
import { useTranslation } from 'react-i18next';
import ProductCard from './ProductCard';
import Sale from '../../Assets/Component/Sale';
import { useFocusEffect } from '@react-navigation/native';

const { width: windowWidth } = Dimensions.get('window');

const Home = () => {
  const { t } = useTranslation();
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [categorylist, setcategorylist] = useState();
  const [topsellinglist, settopsellinglist] = useState([]);
  const [carosalimg, setcarosalimg] = useState([]);
  const [isSale, setIsSale] = useState(false);
  // const dumydata = [
  //   {
  //     name: 'Tata Salt',
  //     weight: '500g',
  //     off: '5',
  //     mainprice: 25,
  //     price: 24,
  //   },
  //   {
  //     name: 'Kurkure Yummy Puffcorn Yumm...',
  //     weight: '50g',
  //     price: 22,
  //   },
  //   {
  //     name: 'The Whole Truth Mini Proteine B...',
  //     weight: '27g',
  //     price: 44,
  //     off: '20',
  //     mainprice: 55,
  //   },
  // ];
  // const dumydata2 = [
  //   {img: require('../../Assets/Images/veg.png'), name: 'Fruits & Vegetables'},
  //   {
  //     img: require('../../Assets/Images/oil.png'),
  //     name: 'Atta, Rice, Oil & Dals',
  //   },
  //   {
  //     img: require('../../Assets/Images/dairy.png'),
  //     name: 'Dairy, Bread & Eggs',
  //   },
  //   {
  //     img: require('../../Assets/Images/cold.png'),
  //     name: 'Cold Drinks & Juices',
  //   },
  // ];
  useEffect(() => {
    getCategory();
    getTopSoldProduct();
    getSetting();
    console.log('cartdetail', cartdetail);
    AsyncStorage.getItem('cartdata').then(res => {
      console.log('cartdata', res);
      if (res) {
        let data = JSON.parse(res);
        setcartdetail(data);
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      getCategory();
      getTopSoldProduct();
      getSetting();
      console.log('cartdetail', cartdetail);

      AsyncStorage.getItem('cartdata').then(res => {
        console.log('cartdata', res);
        if (res) {
          let data = JSON.parse(res);
          setcartdetail(data);
        }
      });

      return () => { }; // cleanup if needed
    }, [])
  );


  const getCategory = () => {
    setLoading(true);
    const limit = Dimensions.get('window').width < 500 ? 8 : 12;
    GetApi(`getCategory?limit=${limit}`, {}).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res.status) {
          setcategorylist(res.data);
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  const getTopSoldProduct = () => {
    setLoading(true);
    GetApi(`getTopSoldProduct?limit=5`, {}).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res.status) {
          settopsellinglist(res.data);
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  const getSetting = () => {
    setLoading(true);
    GetApi(`getsetting`, {}).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res.success) {
          console.log('setting', res?.setting[0].carousel);
          setcarosalimg(res?.setting[0].carousel);
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
  const width = Dimensions.get('window').width;
  const width2 = Dimensions.get('window').width - 30;
  return (
    <>
      <Header />
      <TouchableOpacity style={{ backgroundColor: Constants.saffron, paddingBottom: 15 }}
        onPress={() => navigate('Searchpage')}
      >
        <View
          style={[styles.inpcov, { height: 45 }]}
        >
          <SearchIcon height={20} width={20} />
          <Text style={{ color: Constants.light_black, marginLeft: 10, fontSize: 18 }}>{t('Search')}</Text>
          {/* <TextInput
            style={styles.input}
            editable={false}
            placeholder={t('Search')}
            placeholderTextColor={Constants.light_black}></TextInput> */}
        </View>
      </TouchableOpacity>
      <FlatList
        data={topsellinglist}
        keyExtractor={(item, index) => item._id || index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'android' ? 70 : 40,
          backgroundColor: Constants.white
        }}
        ListHeaderComponent={
          <>
            {/* Header Banner */}
            {/*<LinearGradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              colors={[Constants.yellow, '#ffffff', Constants.saffron]}
              style={styles.btn}>
              <Text style={styles.btntxt}>
                {t('Quality You Can Trust, Convenience At Your Door Step')}
              </Text>
            </LinearGradient> */}

            {/* Carousel */}
            <View style={{ marginVertical: 20 }}>
              <SwiperFlatList
                autoplay
                autoplayDelay={2}
                autoplayLoop
                data={carosalimg || []}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={{ width: width, alignItems: 'center' }}
                    onPress={() => {
                      item.product_id &&
                        navigate(
                          'posterDetail',
                          item.product_id
                        );
                    }}>
                    <Image
                      source={{ uri: item.image }}
                      style={{
                        height: 180,
                        width: width2,
                        borderRadius: 20,
                        alignSelf: 'center',
                      }}
                      resizeMode="stretch"
                      key={index}
                    />
                  </TouchableOpacity>
                )}
              />
            </View>

            <Sale setIsSale={setIsSale} />

            {/* Top Selling Header */}
            <View style={styles.covline}>
              <Text style={styles.categorytxt}>{t('Top Selling Items')}</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row' }}
                onPress={() =>
                  navigate('Products', {
                    name: 'Top Selling Items',
                    type: 'topselling',
                  })
                }>
                <Text style={styles.seealltxt}>{t('See all')}</Text>
                <RightarrowIcon
                  height={17}
                  width={17}
                  style={{ alignSelf: 'center' }}
                  color={Constants.pink}
                />
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item, index }) => {
          const cartItem = Array.isArray(cartdetail)
            ? cartdetail.find(it => it?.productid === item?._id)
            : undefined;

          return (
            <View
              key={item._id || index.toString()}
              style={[
                styles.box,
                // {
                //   marginRight:
                //     topsellinglist.length === index + 1 ? 20 : 10,
                // },
              ]}>
              <ProductCard
                item={item}
                cartItem={cartItem}
                cartdata={cartdata}
                setcartdetail={setcartdetail}
                cartdetail={cartdetail}
              />
            </View>
          );
        }}
        ListFooterComponent={
          <>
            {/* Explore Categories Header */}
            <View style={styles.covline}>
              <Text style={styles.categorytxt}>
                {t('Explore By Categories')}
              </Text>
              <TouchableOpacity
                style={{ flexDirection: 'row' }}
                onPress={() => navigate('CategoryFilter', { item: 'All', name: 'All Categories' })}>
                <Text style={styles.seealltxt}>{t('See all')}</Text>
                <RightarrowIcon
                  height={17}
                  width={17}
                  style={{ alignSelf: 'center' }}
                  color={Constants.pink}
                />
              </TouchableOpacity>
            </View>

            {/* Category Grid */}
            <FlatList
              data={categorylist}
              scrollEnabled={false}
              numColumns={Dimensions.get('window').width < 500 ? 4 : 6}
              keyExtractor={(item, index) => item._id || index.toString()}
              style={{ width: '100%', gap: 5, marginVertical: 10, marginBottom: 100 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ flex: 1, marginVertical: 10 }}
                  onPress={() =>
                    navigate('CategoryFilter', { item: item._id, name: item.name })
                  }>
                  <View style={styles.categorycircle}>
                    <Image
                      source={
                        item?.image
                          ? { uri: item?.image }
                          : require('../../Assets/Images/veg.png')
                      }
                      style={styles.categoryimg}
                    />
                    <View>
                      <Text style={styles.categorytxt2}>{item.name}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        }
      />
    </>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.saffron,
  },
  inpcov: {
    // borderWidth: 1,
    borderColor: Constants.customgrey,
    backgroundColor: Constants.white,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginHorizontal: 20,
  },
  input: {
    flex: 1,
    color: Constants.black,
    fontFamily: FONTS.Medium,
    fontSize: 16,
    textAlign: 'left',
    minHeight: 45,
    // backgroundColor:Constants.red
  },
  btn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn2: {
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 30,
    marginHorizontal: 10,
  },
  btntxt: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS.Black,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  btntxt2: {
    color: Constants.white,
    fontSize: 14,
    fontFamily: FONTS.Bold,
    marginLeft: 10,
  },
  caroimg: {
    width: '100%',
    // resizeMode:'contain',
    // backgroundColor:'red',
    marginVertical: 20,
  },
  box: {
    // width: 180,
    marginVertical: 5,
    marginHorizontal: 15,
    // boxShadow: '0 0 6 0.5 grey',
  },
  cardimg: {
    height: 130,
    width: '100%',
    resizeMode: 'contain',
    alignSelf: 'center',
    borderRadius: 10,
    // backgroundColor:'red'
  },
  cardimg2: {
    height: 50,
    width: 50,
    position: 'absolute',
    right: -14,
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor:Constants.red
  },
  seealltxt: {
    fontSize: 18,
    color: Constants.pink,
    fontFamily: FONTS.Bold,
    marginHorizontal: 10,
  },
  categorytxt: {
    fontSize: 20,
    color: Constants.black,
    fontFamily: FONTS.Bold,
  },
  covline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 10,
    // backgroundColor:Constants.red
  },
  categorycircle: {
    // height: Dimensions.get('window').width < 500 ? 120 : 150,
    // width: Dimensions.get('window').width < 500 ? 120 : 150,
    // borderWidth: 0.5,
    // borderColor: Constants.customgrey3,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  categoryimg: {
    height: Dimensions.get('window').width < 500 ? 80 : 100,
    width: Dimensions.get('window').width < 500 ? 80 : 100,
    borderRadius: 5,
  },
  categorytxt2: {
    fontSize: 14,
    color: Constants.black,
    fontFamily: FONTS.Medium,
    textAlign: 'center',
    marginVertical: 5,
    width: Dimensions.get('window').width < 500 ? 120 : 150,
    // textTransform: 'capitalize',
    paddingHorizontal: 2,
  },
});
