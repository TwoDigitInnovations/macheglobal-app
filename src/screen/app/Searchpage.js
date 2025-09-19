/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react-native/no-inline-styles */
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { createRef, useContext, useEffect, useRef, useState } from 'react';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import {
  BackIcon,
  CartFilledIcon,
  CrossIcon,
  MinusIcon,
  Plus2Icon,
  PlusIcon,
  SearchIcon,
  SortIcon,
} from '../../../Theme';
import {
  CartContext,
  LoadContext,
  ToastContext,
  UserContext,
} from '../../../App';
import { GetApi, Post } from '../../Assets/Helpers/Service';
import { goBack, navigate } from '../../../navigationRef';
// import RenderHtml from 'react-native-render-html';
import ActionSheet from 'react-native-actions-sheet';
import { RadioButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import ProductCard from './ProductCard';
import { Toast } from 'toastify-react-native';
import { useNavigation } from '@react-navigation/native';

const Searchpage = () => {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [user, setuser] = useContext(UserContext);
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [productlist, setproductlist] = useState([]);
  const [searchkey, setsearchkey] = useState('');
  const [jobtype, setjobtype] = useState('');
  const [page, setPage] = useState(1);
  const [curentData, setCurrentData] = useState([]);
  const sortRef = createRef();
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 200);
  }, []);

  const getsearchproducts = (p, text, sort) => {
    setPage(p);
    // setLoading(true);
    console.log(p);
    GetApi(`productSearch?page=${p}&key=${text}`).then(
      async res => {
        // setLoading(false);
        console.log(res);
        // setproductlist(res);
        setCurrentData(res.data);
        if (p === 1) {
          setproductlist(res.data);
        } else {
          setproductlist([...productlist, ...res.data]);
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

  const mixedStyle = {
    body: {
      whiteSpace: 'normal',
      color: '#000000',
      fontSize: '14px',
      fontWeight: 'bold',
    },
    p: {
      color: '#000000',
      fontSize: '14px',
      fontWeight: 'bold',
      whiteSpace: 'normal',
      fontFamily: FONTS.Bold,
    },
  };
  const fetchNextPage = () => {
    if (curentData.length === 20) {
      // if (jobtype) {
      //   getsearchproducts(page + 1, searchkey,jobtype);
      // } else {
      getsearchproducts(page + 1, searchkey);
      // }
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchcov}>
        <BackIcon
          color={Constants.white}
          width={30}
          height={20}
          style={{ alignSelf: 'center' }}
          onPress={() => goBack()}
        />
        <View style={[styles.inpcov]}>
          <SearchIcon height={20} width={20} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={t('What are u looking for ?')}
            placeholderTextColor={Constants.light_black}
            onChangeText={name => {
              getsearchproducts(1, name), setsearchkey(name);
            }}></TextInput>
        </View>
        <Pressable
          onPress={() =>
            navigation.navigate('App', {
              screen: 'Cart',
            })
          }>
          <CartFilledIcon
            height={30}
            width={30}
            style={{ alignSelf: 'center' }}
          />
          {cartdetail && cartdetail.length > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {cartdetail.length > 99 ? '99+' : cartdetail.length}
              </Text>
            </View>
          ) : null}
        </Pressable>
        {/* <SortIcon
                  height={30}
                  width={30}
                  onPress={() => sortRef.current.show()}
                  style={{alignSelf:'center'}}
                  color={Constants.white}
                /> */}
      </View>
      {/* <View style={{paddingHorizontal: 15, flex: 1}}> */}
      <FlatList
        data={productlist}
        // numColumns={Dimensions.get('window').width < 600 ? 2 : 3}
        numColumns={1}
        // style={{paddingRight: 20, marginLeft: 5, paddingTop: 10, flex: 1}}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
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
        // style={{gap:'2%'}}
        renderItem={({ item }, i) => {
          const cartItem = Array.isArray(cartdetail)
            ? cartdetail.find(it => it?.productid === item?._id)
            : undefined;

          return (
            <View
              key={i}
              style={[
                styles.box,
                // {marginRight: productlist.length === i + 1 ? 20 : 10}
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
        onEndReached={() => {
          if (productlist && productlist.length > 0) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.05}
      />
      {/* </View> */}
      {/* <ActionSheet
        ref={sortRef}
        closeOnTouchBackdrop={true}
      >
        <View style={{margin: 10}}>
          <View
            style={{
              flexDirection: 'row',
              margin: 10,
              justifyContent: 'space-between',
            }}>
            <Text style={styles.toptxt}>Sort by</Text>
            <CrossIcon
              height={15}
              width={15}
              style={{alignSelf: 'center'}}
              onPress={() => sortRef.current.hide()}
            />
          </View>
          <RadioButton.Group
            onValueChange={type => {
              setjobtype(type);
              getsearchproducts(1,searchkey,type);
              sortRef.current.hide();
            }}
            value={jobtype}>
            <View style={{}}>
            
              <RadioButton.Item
                mode="android"
                // style={{fontSize: 12}}
                label="Price -- Low to High" //Individual
                value="price_asc"
                position="trailing"
                color={Constants.custom_green}
                uncheckedColor={Constants.black}
                labelStyle={{
                  color:
                    jobtype === 'price'
                      ? Constants.custom_green
                      : Constants.black,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              />
              <RadioButton.Item
                mode="android"
                // style={{fontSize: 12}}
                label="Price -- High to Low" //Individual
                value="price_desc"
                position="trailing"
                color={Constants.custom_green}
                uncheckedColor={Constants.black}
                labelStyle={{
                  color:
                    jobtype === 'price'
                      ? Constants.custom_green
                      : Constants.black,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              />
             
            </View>
          </RadioButton.Group>
        </View>
      </ActionSheet> */}
    </SafeAreaView>
  );
};

export default Searchpage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
    // padding: 20,
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
    flex: 1,
  },
  input: {
    flex: 1,
    color: Constants.black,
    fontFamily: FONTS.Regular,
    fontSize: 16,
    marginLeft: 10,
    textAlign: 'left',
    minHeight: 45,
    // backgroundColor:Constants.red
  },
  searchcov: {
    backgroundColor: Constants.saffron,
    padding: 20,
    flexDirection: 'row',
  },
  box: {
    // width:
    //   Dimensions.get('window').width < 600
    //     ? Dimensions.get('window').width / 2 - 20
    //     : Dimensions.get('window').width / 3 - 20,
    // width: Dimensions.get('window').width < 600 ? '48%' : '31%',
    marginVertical: 10,
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
    height: 65,
    width: 65,
    position: 'absolute',
    right: -14,
    top: -20,
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
    fontSize: 17,
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
  offtxt: {
    fontSize: 12,
    color: Constants.white,
    fontFamily: FONTS.Black,
    marginLeft: 7,
  },
  pluscov: {
    // backgroundColor:Constants.blue,
    width: 40,
    height: 40,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 0 6 0 grey',
    borderRadius: 10,
    // marginRight:20
  },
  weight: {
    fontSize: 16,
    color: Constants.customgrey,
    fontFamily: FONTS.Regular,
    marginLeft: 10,
    marginTop: 5,
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
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Constants.green,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
