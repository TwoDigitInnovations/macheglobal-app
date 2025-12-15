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
  ActivityIndicator,
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
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [isLoadingFlashSale, setIsLoadingFlashSale] = useState(false);
  const [exploreProducts, setExploreProducts] = useState([]);
const [isLoadingExplore, setIsLoadingExplore] = useState(false);

const getExploreProducts = async () => {
  try {
    setIsLoadingExplore(true);
    const url = `product/getProduct?page=1&limit=4`;
    const res = await GetApi(url, {});
    console.log('explore',res)
    setIsLoadingExplore(false);
    
    if (res && res.status) {
      setExploreProducts(res.data);
    }
  } catch (err) {
    setIsLoadingExplore(false);
    console.error('Error fetching explore products:', err);
  }
};
  const CountdownTimer = ({ endDate }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
    useEffect(() => {
      const calculateTimeLeft = () => {
        const difference = new Date(endDate) - new Date();
        if (difference > 0) {
          return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      };
  
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);
  
      return () => clearInterval(timer);
    }, [endDate]);
  
    return (
      <Text style={styles.endsInText}>
        {t('Ends in')}: <Text style={styles.endsInTime}>
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </Text>
      </Text>
    );
  };
  
  // 2. Flash Sale section ko replace karo (line 547 se 625 tak)
  {/* Flash Sale Section */}
<View style={styles.flashSaleSection}>
  <View style={styles.flashSaleHeader}>
    <View style={styles.flashSaleTitleContainer}>
      <Text style={styles.flashSaleTitle}>⚡ Flash Sale</Text>
      <Text style={styles.flashSaleSubtitle}>Limited time offers</Text>
    </View>
  </View>
  
  {isLoadingFlashSale ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Constants.saffron} />
    </View>
  ) : flashSaleProducts.length > 0 ? (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={flashSaleProducts}
      keyExtractor={(item, index) => `flash-sale-${item._id || index}`}
      contentContainerStyle={styles.flashSaleList}
      renderItem={({ item, index }) => {
        // Prices
        const salePrice = item.price || 0; // 50
        const originalPrice = item.originalPrice || 0; // 199
        const discountPercent = originalPrice > salePrice 
          ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) 
          : 0;
        
        console.log('Item prices:', {
          itemPrice: item.price,
          itemOriginal: item.originalPrice,
          salePrice,
          originalPrice,
          discountPercent
        });
        
        return (
          <TouchableOpacity 
          style={styles.flashSaleCard}
          onPress={() => {
            console.log('🔥 Navigating with params:', {
              slug: item.product?.slug,
              flashSalePrice: item.price,
              originalPrice: item.originalPrice,
              discount: discountPercent
            });
            
            navigate('Preview', {
              slug: item.product?.slug || item.product?._id,
              flashSalePrice: item.price,
              originalPrice: item.originalPrice,
              discount: discountPercent,
              flashSaleId: item._id,
              endDateTime: item.endDateTime
            });
          }}
        >
            {/* Discount Badge */}
            {discountPercent > 0 && (
              <View style={styles.saleBadge}>
                <Text style={styles.saleBadgeText}>{discountPercent}% OFF</Text>
              </View>
            )}
      
            {/* Product Number */}
            <View style={styles.productNumber}>
              <Text style={styles.productNumberText}>#{index + 1}</Text>
            </View>
      
            {/* Image */}
            <View style={styles.flashImageContainer}>
              <Image 
                source={{ uri: item.variant?.image?.[0] }} 
                style={styles.flashImage}
                resizeMode="cover"
              />
            </View>
      
            {/* Details */}
            <View style={styles.flashDetails}>
              <Text style={styles.flashProductName} numberOfLines={2}>
                {item.product?.name}
              </Text>
              
              {/* Price Display */}
              <View style={styles.flashPriceRow}>
                <Text style={styles.flashOfferPrice}>
                  {Currency} {salePrice}
                </Text>
                {originalPrice > salePrice && (
                  <Text style={styles.flashOriginalPrice}>
                    {Currency} {originalPrice}
                  </Text>
                )}
              </View>
              
              {/* Timer below price */}
              <CountdownTimer endDate={item.endDateTime} />
            </View>
          </TouchableOpacity>
        );
      }}
    />
  ) : (
    <View style={styles.noFlashSale}>
      <Text style={styles.noFlashSaleText}>🔥 No active flash sales</Text>
      <Text style={styles.noFlashSaleSubtext}>Check back soon for amazing deals!</Text>
    </View>
  )}
</View>
  const getFlashSaleProducts = async () => {
    try {
      setIsLoadingFlashSale(true);
      const user = await AsyncStorage.getItem('userDetail');
      const userDetail = JSON.parse(user);
      
      const response = await GetApi('sale/getActiveFlashSales');
      console.log('Flash Sale API Response:', response);
      
      if (response && response.status) {
        if (Array.isArray(response.data) && response.data.length > 0) {
          // YAHAN BAS DIRECT DATA SET KARO - KUCH TRANSFORM NAHI
          setFlashSaleProducts(response.data);
          
          // Console check karo
          console.log('First flash sale item:', {
            price: response.data[0].price,
            originalPrice: response.data[0].originalPrice,
            productName: response.data[0].product?.name
          });
        } else {
          setFlashSaleProducts([]);
        }
      } else {
        setFlashSaleProducts([]);
      }
    } catch (error) {
      console.error('Error fetching flash sale products:', error);
      setFlashSaleProducts([]);
    } finally {
      setIsLoadingFlashSale(false);
    }
  };

  useEffect(() => {
    getCategory();
    getTopSoldProduct();
    getSetting();
    getFlashSaleProducts();
    getExploreProducts();
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
      // Check if user is logged in
      const checkUserAndLoadData = async () => {
        const userDetail = await AsyncStorage.getItem('userDetail');
        if (!userDetail) {
          // User not logged in, don't load data
          console.log('No user found in Home screen');
          return;
        }
        
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
      };
      
      checkUserAndLoadData();

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
        frenchName: productdata?.frenchName,
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
              navigate('Products', { name: t('All Products') });
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
            onPress={() => {
              setActiveTab('Manufacturer');
              navigate('ManufacturerProducts');
            }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: FONTS.Bold,
                color: Constants.white,
                textDecorationLine: activeTab === 'Manufacturer' ? 'underline' : 'none',
                textDecorationColor: Constants.white,
              }}>
              {t('Manufacturer')}
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
         <View style={styles.flashSaleSection}>
  <View style={styles.flashSaleHeader}>
    <View style={styles.flashSaleTitleContainer}>
      <Text style={styles.flashSaleTitle}>⚡ {t('Flash Sale')}</Text>
      <Text style={styles.flashSaleSubtitle}>{t('Limited time offers')}</Text>
    </View>
  </View>
  
  {isLoadingFlashSale ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Constants.saffron} />
    </View>
  ) : flashSaleProducts.length > 0 ? (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={flashSaleProducts}
      keyExtractor={(item, index) => `flash-sale-${item._id || index}`}
      contentContainerStyle={styles.flashSaleList}
      renderItem={({ item, index }) => {
        // Prices
        const salePrice = item.price || 0; // 50
        const originalPrice = item.originalPrice || 0; // 199
        const discountPercent = originalPrice > salePrice 
          ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) 
          : 0;
        
        console.log('Item prices:', {
          itemPrice: item.price,
          itemOriginal: item.originalPrice,
          salePrice,
          originalPrice,
          discountPercent
        });
        
        return (
          <TouchableOpacity 
  style={styles.flashSaleCard}
  onPress={() => {
    console.log('🔥 Navigating with params:', {
      slug: item.product?.slug,
      flashSalePrice: item.price,
      originalPrice: item.originalPrice,
      discount: discountPercent
    });
    
    navigate('Preview', {
      slug: item.product?.slug || item.product?._id,
      flashSalePrice: item.price,
      originalPrice: item.originalPrice,
      discount: discountPercent,
      flashSaleId: item._id,
      endDateTime: item.endDateTime
    });
  }}
>
            {/* Discount Badge */}
            {discountPercent > 0 && (
              <View style={styles.saleBadge}>
                <Text style={styles.saleBadgeText}>{discountPercent}% OFF</Text>
              </View>
            )}
      
            {/* Product Number */}
            <View style={styles.productNumber}>
              <Text style={styles.productNumberText}>#{index + 1}</Text>
            </View>
      
            {/* Image */}
            <View style={styles.flashImageContainer}>
              <Image 
                source={{ uri: item.variant?.image?.[0] }} 
                style={styles.flashImage}
                resizeMode="cover"
              />
            </View>
      
            {/* Details */}
            <View style={styles.flashDetails}>
              <Text style={styles.flashProductName} numberOfLines={2}>
                {item.product?.name}
              </Text>
              
              {/* Price Display */}
              <View style={styles.flashPriceRow}>
                <Text style={styles.flashOfferPrice}>
                  {Currency} {salePrice}
                </Text>
                {originalPrice > salePrice && (
                  <Text style={styles.flashOriginalPrice}>
                    {Currency} {originalPrice}
                  </Text>
                )}
              </View>
              
              {/* Timer below price */}
              <CountdownTimer endDate={item.endDateTime} />
            </View>
          </TouchableOpacity>
        );
      }}
    />
  ) : (
    <View style={styles.noFlashSale}>
      <Text style={styles.noFlashSaleText}>🔥 {t('No active flash sales')}</Text>
      <Text style={styles.noFlashSaleSubtext}>{t('Check back soon for amazing deals!')}</Text>
    </View>
  )}
</View>
            {/* Categories Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, {marginLeft: 4, marginTop: -15}]}>{t('Categories')}</Text>
                <TouchableOpacity
                  style={styles.seeAllButton}
                  onPress={() => navigate('CategorySubCat')}>
                  <Text style={styles.seeAllText}>{t('See all')}</Text>
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
                      onPress={() => navigate('CategorySubCat', { selectedCategoryId: item._id })}
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
    <Text style={styles.sectionTitle}>{t('Local Industries')}</Text>
    
  </View>
  <TouchableOpacity 
    style={styles.discoverHeading}
    
  >
    <Text style={styles.discoverHeadingText}>{t('Discover the products and craftsmanship of our regions')}</Text>
  </TouchableOpacity>

  {/* Local Industries Card */}
  {/* <TouchableOpacity 
    style={styles.localIndustryCard}
    onPress={() => navigate('LocalIndustryDetail', { type: 'haiti-crafts' })}>
  <ImageBackground
    source={require('../../Assets/Images/box.png')} 
    style={styles.localIndustryBg}
    imageStyle={styles.localIndustryBgImage}>
    <View style={styles.localIndustryOverlay}>
     
    </View>
  </ImageBackground>
</TouchableOpacity> */}
</View>

{/* Flash Sale Section */}

<View style={styles.flashSaleSection}>
  <View style={styles.flashSaleHeader}>
    <View style={styles.flashSaleTitleContainer}>
      <Text style={styles.flashSaleTitle}>🛍️ {t('Explore Our Products')}</Text>
      <Text style={styles.flashSaleSubtitle}>{t('Discover amazing items')}</Text>
    </View>
    <TouchableOpacity
      style={styles.seeAllButton}
      onPress={() => navigate('Products', { name: t('All Products') })}>
      <Text style={styles.seeAllText}>{t('See all')}</Text>
      <View style={{marginTop: -10}}>
        <RightarrowIcon height={14} width={14} color="#1F2937" />
      </View>
    </TouchableOpacity>
  </View>
  
  {isLoadingExplore ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Constants.saffron} />
    </View>
  ) : exploreProducts.length > 0 ? (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={exploreProducts}
      keyExtractor={(item, index) => `explore-${item._id || index}`}
      contentContainerStyle={styles.flashSaleList}
      renderItem={({ item, index }) => {
        const cartItem = Array.isArray(cartdetail)
          ? cartdetail.find(it => it?.productid === item?._id)
          : undefined;
        
        // Price logic - varients se price nikalna
        const offerPrice = item?.varients?.[0]?.selected?.[0]?.offerprice || 
                          item?.price_slot?.[0]?.our_price || 0;
        const originalPrice = item?.varients?.[0]?.selected?.[0]?.price || 
                             item?.price_slot?.[0]?.other_price || 0;
        
        return (
          <TouchableOpacity 
            style={styles.flashSaleCard}
            onPress={() => navigate('Preview', item?.slug || item?._id)}
          >
            {/* Discount Badge - agar discount hai to show karo */}
            {originalPrice > offerPrice && (
              <View style={styles.saleBadge}>
                <Text style={styles.saleBadgeText}>
                  {Math.round(((originalPrice - offerPrice) / originalPrice) * 100)}% OFF
                </Text>
              </View>
            )}

            {/* Product Number */}
            <View style={styles.productNumber}>
              <Text style={styles.productNumberText}>#{index + 1}</Text>
            </View>

            {/* Product Image */}
            <View style={styles.flashImageContainer}>
              <Image 
                source={{ uri: item.varients?.[0]?.image?.[0] || 'https://via.placeholder.com/150' }} 
                style={styles.flashImage}
                resizeMode="cover"
              />
            </View>

            {/* Product Details */}
            <View style={styles.flashDetails}>
              <Text style={styles.flashProductName} numberOfLines={2}>
                {item?.name || 'Product'}
              </Text>
              
              {/* Price Row */}
              <View style={styles.flashPriceRow}>
                <Text style={styles.flashOfferPrice}>
                  {Currency} {offerPrice}
                </Text>
                {originalPrice > offerPrice && (
                  <Text style={styles.flashOriginalPrice}>
                    {Currency} {originalPrice}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  ) : (
    <View style={styles.noFlashSale}>
      <Text style={styles.noFlashSaleText}>📦 {t('No products available')}</Text>
      <Text style={styles.noFlashSaleSubtext}>{t('Check back soon for amazing deals!')}</Text>
    </View>
  )}
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
  // Flash Sale Styles
  flashSaleList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  exploreWeight: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#666',
    marginTop: 4,
  },
  
  flashSaleSection: {
    marginTop: -15,
    marginBottom: 20,
  },
  flashSaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  flashSaleTitleContainer: {
    flex: 1,
  },
  flashSaleTitle: {
    fontSize: 22,
    fontFamily: FONTS.extrabold,
    color: Constants.black,
    marginBottom: 4,
  },
  flashSaleSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#666',
  },
  flashSaleCard: {
    width: 164,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  saleBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Constants.saffron,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 10,
  },
  saleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  productNumber: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  productNumberText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  flashImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#f9f9f9',
  },
  flashImage: {
    width: '100%',
    height: '100%',
  },
  flashDetails: {
    padding: 10,
    paddingBottom: 12,
  },
  flashProductName: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: '#333',
    marginBottom: 6,
  },
  flashPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  flashOfferPrice: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: Constants.saffron,
    marginRight: 6,
  },
  flashOriginalPrice: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  endsInText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#666',
    marginTop: 4,
  },
  endsInTime: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: '#FF6B00',
  },
  addToCartBtn: {
    backgroundColor: Constants.saffron,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartBtnActive: {
    backgroundColor: '#10B981',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  noFlashSale: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noFlashSaleText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#666',
    marginBottom: 6,
  },
  noFlashSaleSubtext: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#999',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  flashSaleImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  flashSaleImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Constants.primaryColor,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  flashSaleDetails: {
    padding: 10,
  },
  flashSaleName: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#333',
    marginBottom: 4,
  },
  flashSaleWeight: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  flashSalePrice: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: Constants.primaryColor,
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  timerContainer: {
    backgroundColor: '#FFF5F5',
    padding: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  timerText: {
    fontSize: 10,
    color: '#E53E3E',
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  noFlashSaleContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Constants.saffron,
  },
  inpcov: {
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
    marginVertical: 20,
  },
  box: {
    marginVertical: 5,
    marginHorizontal: 15,
  },
  cardimg: {
    height: 130,
    width: '100%',
    resizeMode: 'contain',
    alignSelf: 'center',
    borderRadius: 10,
  },
  cardimg2: {
    height: 50,
    width: 50,
    position: 'absolute',
    right: -14,
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  sectionContainer: {
    marginTop: -10,  
    paddingHorizontal: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10, 
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
    paddingVertical: 5,  
    marginTop: -5,  
  },
  seeAllText: {
    color: 'black', 
    marginRight: 5,
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginTop: -10,
    lineHeight: 20,
  },
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

