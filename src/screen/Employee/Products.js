/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import React, {useContext, useEffect, useState, useCallback} from 'react';
import Constants, {Currency, FONTS} from '../../Assets/Helpers/constant';
import {navigate} from '../../../navigationRef';
import {useIsFocused} from '@react-navigation/native';
import {LoadContext, ToastContext} from '../../../App';
import {Delete, GetApi, Post} from '../../Assets/Helpers/Service';
import {
  DeleteIcon,
  EditIcon,
  StatusIcon,
  ThreedotIcon,
  ViewIcon,
} from '../../../Theme';
import {useTranslation} from 'react-i18next';
import LabelWithColon from '../../Assets/Helpers/LabelWithColon';
import EmployeeHeader from '../../Assets/Component/EmployeeHeader';
import OrderReady from '../../Assets/Component/OrderReady';

const Products = () => {
  const {t} = useTranslation();
  const IsFocused = useIsFocused();
  const [, setToast] = useContext(ToastContext);
  const [, setLoading] = useContext(LoadContext);
  const [productlist, setproductlist] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [assignmodel, setassignmodel] = useState(false);
  const [orderid, setorderid] = useState('');

  useEffect(() => {
    if (IsFocused) {
      setproductlist([]);
      getProducts();
    }
  }, [IsFocused, getProducts]);

  const getProducts = useCallback(
    tab => {
      // setPage(p);
      // let url;
      // if (tab==='pending') {
      //   url=`getOrderBySeller`
      // } else {
      //   url=`getAssignedOrder`

      // }
      setLoading(true);
      GetApi('getProduct', {}).then(
        async res => {
          setLoading(false);
          console.log(res);
          console.log(res.data);

          setproductlist(res.data);
        },
        err => {
          setLoading(false);
          setproductlist([]);
          console.log('errrrrrr===>', err);
        },
      );
    },
    [setLoading],
  );

  const assigdriver = id => {
    const body = {
      id: id,
      status: 'Driverassigned',
    };
    setLoading(true);
    Post('changeorderstatus', body).then(
      async res => {
        setLoading(false);
        console.log(res);
        getProducts('pending');
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <EmployeeHeader item={t('My Products')} />
      <FlatList
        data={productlist}
        style={{marginBottom: 70}}
        showsVerticalScrollIndicator={false}
        renderItem={({item}, index) => (
          <View key={index} style={styles.box}>
            <View style={{flexDirection: 'row', marginBottom: 5, width: '90%'}}>
              <Image
                source={
                  item?.varients && item?.varients[0]?.image
                    ? {
                        uri: item?.varients[0]?.image[0],
                      }
                    : require('../../Assets/Images/veg.png')
                }
                style={styles.cartimg}
                resizeMode="contain"
              />
              <View style={{width: '80%'}}>
                <Text style={styles.boxtxt}>{item?.name}</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Text style={[styles.boxtxt3, {color: Constants.saffron}]}>
                    {item?.category?.name}
                  </Text>
                </View>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                  <Text style={styles.boxtxt3}>
                    {Currency}
                    {Number(item?.price_slot[0]?.our_price ?? 0).toFixed(2)}
                  </Text>
                  <View
                    style={{
                      backgroundColor: Constants.customgrey2,
                      height: 5,
                      width: 5,
                      borderRadius: '50%',
                    }}
                  />
                  <Text style={styles.boxtxt3}>{item?.Quantity} pcs. left</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(item._id);
                  console.log(item._id);
                }}
                style={{height: 30, width: 30, alignItems: 'flex-end'}}>
                <ThreedotIcon />
              </TouchableOpacity>
            </View>
            {modalVisible === item._id && (
              <TouchableOpacity
                style={styles.backdrop}
                onPress={() => setModalVisible(null)}>
                <View style={styles.centeredView}>
                  <View style={styles.modalView}>
                    {/* <TouchableOpacity
                                  onPress={() => {
                                    navigate('AddProduct', item);
                                    setModalVisible(null);
                                  }}>
                                  <View style={styles.popuplistcov2}>
                                    <EditIcon />
                                    <Text style={styles.popuptxt}>{t('Update')}</Text>
                                  </View>
                                </TouchableOpacity> */}
                    <TouchableOpacity
                      onPress={() => {
                        Delete(`deleteProduct/${item._id}`, {id: item._id})
                          .then(res => {
                            console.log(res);
                            getProducts();
                            setModalVisible(null);
                          })
                          .catch(err => {
                            console.log(err);
                          });
                      }}>
                      <View style={styles.popuplistcov2}>
                        <DeleteIcon />
                        <Text style={styles.popuptxt}>{t('Delete')}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
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
                fontFamily: FONTS.Bold,
              }}>
              {t('No Product Available')}
            </Text>
          </View>
        )}
      />
      {/* </View> */}
      <Modal
        animationType="none"
        transparent={true}
        visible={assignmodel}
        onRequestClose={() => {
          setassignmodel(!assignmodel);
        }}>
        <View style={styles.centeredView2}>
          <View style={styles.modalView2}>
            <View
              style={{
                backgroundColor: 'white',
                alignItems: 'center',
                paddingHorizontal: 30,
              }}>
              <Text style={styles.textStyle}>
                {t('Are you sure you want to assign driver !')}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setassignmodel(!assignmodel)}
                  style={styles.cancelButtonStyle}>
                  <Text style={[styles.modalText, {color: Constants.saffron}]}>
                    {t('No')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => {
                    assigdriver(orderid);
                    setassignmodel(false);
                  }}>
                  <Text style={styles.modalText}>{t('Yes')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Products;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.lightgrey,
  },
  box: {
    backgroundColor: Constants.white,
    marginVertical: 10,
    padding: 10,
  },
  hi: {
    marginRight: 10,
    height: 40,
    width: 40,
    borderRadius: 50,
    backgroundColor: Constants.lightgrey,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeembtn: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Medium,
    backgroundColor: Constants.saffron,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginVertical: 7,
    borderRadius: 8,
  },
  name: {
    color: Constants.black,
    fontFamily: FONTS.Bold,
    fontSize: 14,
  },
  secendpart: {
    flexDirection: 'row',
    marginHorizontal: 5,
    marginVertical: 5,
  },
  secendboldtxt: {
    color: Constants.black,
    fontSize: 15,
    fontFamily: FONTS.Bold,
    alignSelf: 'center',
  },
  secendtxt: {
    color: Constants.black,
    fontSize: 15,
    textAlign: 'left',
  },
  secendtxt2: {
    color: Constants.black,
    fontSize: 15,
    textAlign: 'left',
    flex: 1,
  },
  txtcol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    color: Constants.saffron,
    fontSize: 16,
    fontFamily: FONTS.Bold,
    alignSelf: 'flex-end',
  },
  centeredView: {
    position: 'absolute',
    right: 0,
    top: 40,
    zIndex: 9999,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  popuplistcov: {
    borderBottomWidth: 1,
    borderColor: Constants.customgrey,
  },
  popuplistcov2: {
    flexDirection: 'row',
    gap: 10,
    margin: 10,
    minWidth: 150,
    alignItems: 'center',
  },
  backdrop: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 9999,
  },
  popuptxt: {
    fontSize: 16,
    fontFamily: FONTS.Regular,
    color: Constants.black,
    paddingRight: 5,
  },

  centeredView2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#rgba(0, 0, 0, 0.5)',
  },
  modalView2: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    width: '90%',
  },
  boxtxt3: {
    color: Constants.black,
    fontSize: 15,
  },
  textStyle: {
    color: Constants.black,
    textAlign: 'center',
    fontFamily: FONTS.Medium,
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
  alrt: {
    color: Constants.black,
    fontSize: 18,
    fontFamily: FONTS.Bold,
    // backgroundColor: 'red',
    width: '100%',
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: Constants.customgrey2,
    paddingBottom: 20,
  },
  cancelButtonStyle: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginRight: 10,
    borderColor: Constants.saffron,
    borderWidth: 1,
    borderRadius: 10,
  },
  logOutButtonStyle: {
    flex: 0.5,
    backgroundColor: Constants.saffron,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  status: {
    color: Constants.saffron,
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
  statuscov: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  modalText: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Bold,
  },
  timeslotxt: {
    color: Constants.saffron,
    fontSize: 14,
    fontFamily: FONTS.Medium,
    // alignSelf:'center'
  },
  cartimg: {
    height: 60,
    width: 60,
    marginRight: 10,
    // resizeMode: 'contain',
  },
  boxtxt: {
    color: Constants.black,
    fontSize: 15,
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
});
