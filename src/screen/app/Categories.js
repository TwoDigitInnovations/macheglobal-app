/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable quotes */
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import {
  DiscountIcon,
  DownarrIcon,
  LocationIcon,
  PlusIcon,
  ProfileIcon,
  RightarrowIcon,
  SearchIcon,
} from '../../../Theme';
// import LinearGradient from 'react-native-linear-gradient';
// import { navigate } from '../../../navigationRef';
import { GetApi } from '../../Assets/Helpers/Service';
import { LoadContext, ToastContext } from '../../../App';
import Header from '../../Assets/Component/Header';
import { useTranslation } from 'react-i18next';

const Categories = ({ navigation }) => {
  console.log('Categories component mounted');
  const { t } = useTranslation();
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [categorylist, setcategorylist] = useState();
  
  useEffect(() => {
    console.log('useEffect running, calling getCategory');
    getCategory();
  }, []);
  
  useEffect(() => {
    console.log('categorylist updated:', categorylist);
  }, [categorylist]);

  const getCategory = () => {
    console.log('getCategory called');
    setLoading(true);
    GetApi(`getCategory`, {}).then(
      async res => {
        console.log('API Response:', res);
        setLoading(false);
        if (res.status) {
          console.log('Setting category list with data:', res.data);
          setcategorylist(res.data);
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {/* <TouchableOpacity
          style={[styles.inpcov]}
        >
          <SearchIcon height={20} width={20} />
          <TextInput
            style={styles.input}
            editable={false}
            placeholder="Search"
            placeholderTextColor={Constants.light_black}></TextInput>
        </TouchableOpacity> */}
      <ScrollView style={{ marginBottom: 70, }}>
        {/* <LinearGradient
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          colors={[Constants.yellow, '#ffffff', Constants.saffron]}
          style={styles.btn}>
          <Text style={styles.btntxt}>
            {t('Quality You Can Trust, Convenience At Your Door Step')}
          </Text>
        </LinearGradient> */}
        {/* <View style={styles.covline}>
        <Text style={styles.categorytxt}>Explore By Categories</Text>
        <View style={{flexDirection: 'row'}}>
          <Text style={styles.seealltxt}>See all</Text>
          <RightarrowIcon
            height={20}
            width={20}
            style={{alignSelf: 'center'}}
          />
        </View>
      </View> */}
        <FlatList
          data={categorylist}
          scrollEnabled={false}
          numColumns={4}
          style={{ width: '100%', gap: 5, marginVertical: 10 }}
          renderItem={({ item }) => {
            const hasSubcategory = item.Subcategory && Array.isArray(item.Subcategory) && item.Subcategory.length > 0;
            console.log('Category:', item.name, 'hasSubcategory:', hasSubcategory, 'Subcategory:', item.Subcategory);
            
            return (
              <TouchableOpacity
                style={{ flex: 1, marginVertical: 10 }}
                onPress={() => {
                  if (hasSubcategory) {
                    navigation.navigate('CategorySubCat', { 
                      categoryId: item._id, 
                      categoryName: item.name,
                      categoryImage: item.image
                    });
                  } else {
                    navigation.navigate('SubcategoryProducts', {
                      item: item._id,
                      name: item.name
                    });
                  }
                }}>
                <View style={styles.categorycircle}>
                  <Image
                    source={
                      item?.image
                        ? {
                          uri: `${item?.image}`,
                        }
                        : require('../../Assets/Images/veg.png')
                    }
                    style={styles.categoryimg}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.categorytxt2}>{item.name}</Text>
                  {!hasSubcategory && (
                    <Text style={styles.viewProductsTxt}>{t('View Products')}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
        {/* <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        colors={['#D7176C', '#95267C']}
        style={styles.btn2}>
          <DiscountIcon />
        <Text style={styles.btntxt2}>
        Get 10% Off on adding items worth ₹999 to cart! 
        </Text>
      </LinearGradient> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Categories;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
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
    width: 180,
    height: 250,
    // borderWidth: 1,
    // borderColor: Constants.customgrey2,
    marginVertical: 20,
    paddingTop: 30,
    paddingBottom: 10,
    borderRadius: 20,
    marginHorizontal: 10,
    // width:'50%',
    // boxShadow:'3 2 2 0.5 grey',
    // boxShadow:'0 0 16 10 grey',
    // boxShadow:'rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 56px',
    boxShadow: '0 0 6 0.5 grey',
    // boxShadow: 'inset 0 0 8 0.5 grey',
  },
  cardimg: {
    height: 75,
    width: 75,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  cardimg2: {
    height: 65,
    width: 65,
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
  disctxt: {
    fontSize: 18,
    color: Constants.linearcolor,
    fontFamily: FONTS.Bold,
  },
  maintxt: {
    fontSize: 17,
    color: Constants.black,
    fontFamily: FONTS.Medium,
    textDecorationLine: 'line-through',
  },
  covline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 10,
    // backgroundColor:Constants.red
  },
  proname: {
    fontSize: 16,
    color: Constants.black,
    fontFamily: FONTS.Bold,
    marginLeft: 20,
    marginTop: 10,
  },
  weight: {
    fontSize: 16,
    color: Constants.customgrey,
    fontFamily: FONTS.Regular,
    marginLeft: 20,
    marginTop: 10,
  },
  offtxt: {
    fontSize: 16,
    color: Constants.white,
    fontFamily: FONTS.Black,
    marginLeft: 7,
  },
  pluscov: {
    // backgroundColor:Constants.blue,
    width: 45,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 0 6 0 grey',
    borderRadius: 10,
    // marginRight:20
  },
  star: {
    height: 30,
    width: 30,
    position: 'absolute',
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
    fontFamily: FONTS.Regular,
    fontWeight: '500',
    textAlign: 'center',
    marginVertical: 5,
    // flex:1,
    // height:100,
    // width:'100%',
    // backgroundColor: Constants.lightblue,
  },
  viewProductsTxt: {
    fontSize: 10,
    color: Constants.pink,
    fontFamily: FONTS.Medium,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
  },
});
