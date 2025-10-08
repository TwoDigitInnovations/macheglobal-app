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
  const [activeTab, setActiveTab] = useState('Products');
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
    GetApi(`category/getCategories`, {}).then(
      async res => {
        console.log('categorylist', res);
        setLoading(false);
      
        if (res.status) {
          // Log the first category to see its structure
          if (res.data && res.data.length > 0) {
            console.log('First category item:', JSON.stringify(res.data[0], null, 2));
          }
          setcategorylist(res.data);
        }
      },
      err => {
        setLoading(false);
        console.log('Category API Error:', err);
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
    GetApi(`user/getsetting`, {}).then(
      async res => {
        console.log('getsetting', res);
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
      <View style={{ backgroundColor: Constants.saffron, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 }}>
        <View style={{ flexDirection: 'row', gap: 15 }}>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('Products');
              navigate('Products', { name: 'All Products' });
            }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: FONTS.Bold,
                color: Constants.white,
                textDecorationLine: activeTab === 'Products' ? 'underline' : 'none',
                textDecorationColor: Constants.white,
              }}>
              {t('Products')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('Manufacturers')}>
            <Text
              style={{
                fontSize: 17,
                fontFamily: FONTS.Bold,
                color: Constants.white,
                textDecorationLine: activeTab === 'Manufacturers' ? 'underline' : 'none',
                textDecorationColor: Constants.white,
              }}>
              {t('Manufacturers')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={{ backgroundColor: Constants.saffron, paddingBottom: 15 }}
        onPress={() => navigate('Searchpage')}
      >
        <View
          style={[styles.inpcov, { height: 50 }]}
        >
          {/* <SearchIcon height={20} width={20} /> */}
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
          backgroundColor: '#F3F3F3'
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

            <View style={{ position: 'relative' }}>
              {/* Orange background - absolute positioned */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 120,
                  backgroundColor: Constants.saffron,
                  zIndex: -1
                }}
              />
              {/* Carousel on top */}
              <View style={{ marginTop: 10, marginBottom: 20 }}>
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
                          navigate('posterDetail', item.product_id);
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
            </View>

            {/* Top Selling Header */}
            <View style={{ paddingTop: 20, }}>
              {/* <Sale setIsSale={setIsSale} /> */}

              {/* <View style={styles.covline}>
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
                    color="#1F2937"
                  />
                </TouchableOpacity>
              </View> */}
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
          <View >
            {/* Categories Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, {marginLeft: 4, marginTop: -15}]}>Categories</Text>
                <TouchableOpacity
                  style={styles.seeAllButton}
                  onPress={() => navigate('CategorySubCat')}>
                  <Text style={styles.seeAllText}>See all</Text>
                  <View style={{marginTop: -10}}>
                    <RightarrowIcon
                      height={14}
                      width={14}
                      color="#1F2937"
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Categories Grid - Show only 4 categories */}
              <View style={styles.categoriesGrid}>
                {categorylist?.slice(0, 4).map((item) => {
                  const imageUrl = item?.image?.url || item?.image;
                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.categoryItem}
                      onPress={() => navigate('CategoryFilter', { item: item._id, name: item.name })}
                    >
                      <View style={styles.categoryCircle}>
                        <Image
                          source={imageUrl ? { uri: imageUrl } : require('../../Assets/Images/veg.png')}
                          style={styles.categoryImage}
                          resizeMode="cover"
                          onError={(e) => console.log('Image load error')}
                        />
                      </View>
                      <Text style={styles.categoryName} numberOfLines={2}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.sectionContainer}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Local Industries</Text>
    
  </View>
  <TouchableOpacity 
    style={styles.discoverHeading}
    
  >
    <Text style={styles.discoverHeadingText}>Discover the products and craftsmanship of our regions</Text>
  </TouchableOpacity>

  {/* Local Industries Card */}
  <TouchableOpacity 
    style={styles.localIndustryCard}
    onPress={() => navigate('LocalIndustryDetail', { type: 'haiti-crafts' })}>
  <ImageBackground
    source={require('../../Assets/Images/box.png')} 
    style={styles.localIndustryBg}
    imageStyle={styles.localIndustryBgImage}>
    <View style={styles.localIndustryOverlay}>
     
    </View>
  </ImageBackground>
</TouchableOpacity>
</View>
            </View>

          </View>
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
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginHorizontal: 20,
  },
  localIndustryCard: {
    height: 180,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  localIndustryBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localIndustryBgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 16,
  },
  localIndustryOverlay: {
    flex: 1,
   
 
    justifyContent: 'space-between',
  },
  localIndustryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  discoverHeading: {
    marginTop: 8,
    marginBottom: 16,
  },
  discoverHeadingText: {
    fontSize: 14,
    color: Constants.black,
    fontFamily: FONTS.Medium,
    lineHeight: 20,
  },
  localIndustryTitle: {
    fontSize: 24,
    fontFamily: FONTS.Black,
    color: Constants.white,
    marginBottom: 5,
  },
  localIndustrySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    color: Constants.white,
    opacity: 0.9,
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
    fontFamily: FONTS.extrabold,
  },
  covline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 10,
    // backgroundColor:Constants.red
    // marginTop:80
  },
  // Categories Section Styles
  sectionContainer: {
    marginTop: -20,  // Reduced from -2 to -20 to move content up
    paddingHorizontal: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,  // Added margin to compensate for the upward movement
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Black',
    color: Constants.black,
    fontWeight: '900',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,  // Keep padding for touch area
    marginTop: -5,  // Slight adjustment for vertical alignment
  },
  seeAllText: {
    color: 'black', // gray-800
    marginRight: 5,
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginTop: -10,  // Move only the text up
    lineHeight: 20,  // Ensure consistent line height
  },
  // Categories Grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 1,
  },
  categoryCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF700080', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
    color: Constants.black,
    fontFamily: FONTS.medium,
  },
  categorytxt2: {
    fontSize: 12,
    color: Constants.black,
    fontFamily: FONTS.Medium,
    textAlign: 'center',
    marginTop: 5,
    width: 90,
    height: 30,
    lineHeight: 15,
    overflow: 'hidden',
  },
});
