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
import {Post} from '../../Assets/Helpers/Service';
import {StatusIcon, ThreedotIcon, ViewIcon} from '../../../Theme';
import {useTranslation} from 'react-i18next';
import LabelWithColon from '../../Assets/Helpers/LabelWithColon';
import EmployeeHeader from '../../Assets/Component/EmployeeHeader';
import OrderReady from '../../Assets/Component/OrderReady';
import moment from 'moment';

const Orders = () => {
  const {t} = useTranslation();
  const IsFocused = useIsFocused();
  const [, setToast] = useContext(ToastContext);
  const [, setLoading] = useContext(LoadContext);
  const [productlist, setproductlist] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [assignmodel, setassignmodel] = useState(false);
  const [orderid, setorderid] = useState('');
  const [filterType, setFilterType] = useState({
    orderType: null,
    date: null,
  });

  useEffect(() => {
    if (IsFocused) {
      setproductlist([]);
      getProducts();
    }
  }, [IsFocused]);

  const getProducts = filters => {
    const params = {
    orderType: filters?.orderType ?? '', 
    date: filters?.date ?? '',
  };
    setLoading(true);
    Post(
      `getPendingOrdersByAdmin?filter=${encodeURIComponent(
        JSON.stringify(params),
      )}`,
      {},
    ).then(
      async res => {
        setLoading(false);
        setproductlist(res.data);
      },
      err => {
        setLoading(false);
        setproductlist([]);
        console.log('errrrrrr===>', err);
      },
    );
  };

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
        getProducts();
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <EmployeeHeader
        filter={true}
        item={t('My orders')}
        filterType={filterType}
        setFilterType={setFilterType}
       onApplyFilter={filters => {
    getProducts(filters);
  }}
      />
      <FlatList
        data={productlist}
        style={{marginBottom: 70}}
        showsVerticalScrollIndicator={false}
        renderItem={({item}, index) => (
          <View key={index}>
            <TouchableOpacity style={[styles.box]}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}>
                <View style={{flexDirection: 'row'}}>
                  <Image
                    source={
                      item?.user?.img
                        ? {
                            uri: `${item?.user?.img}`,
                          }
                        : require('../../Assets/Images/profile.png')
                    }
                    style={styles.hi}
                    // onPress={()=>navigate('Account')}
                  />
                  <View>
                    <Text style={styles.name}>{item?.user?.username}</Text>
                    {/* <Text style={styles.redeembtn}>
                      {moment(item?.createdAt).format('DD-MM-YYYY ')}
                    </Text> */}
                    <Text style={styles.timeslotxt}>
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
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.status}>{item?.status}</Text>
                  {/* <TouchableOpacity
                    onPress={() => {
                      setModalVisible(item._id);
                      console.log(item._id);
                    }}
                    style={{height: 30, width: 30, alignItems: 'flex-end'}}>
                    <ThreedotIcon />
                  </TouchableOpacity> */}
                </View>
              </View>
              <View style={styles.secendpart}>
                <LabelWithColon
                  labelKey="Order ID"
                  textStyle={styles.secendboldtxt}
                />
                <Text style={styles.secendtxt2}>
                  {item?.orderId ? item?.orderId : item?._id}
                </Text>
              </View>
              {item?.dateOfDelivery && (
                <View style={styles.secendpart}>
                  <LabelWithColon
                    labelKey="Delivery Date"
                    textStyle={styles.secendboldtxt}
                  />
                  <Text style={styles.secendtxt2}>
                    {moment(item?.dateOfDelivery).format('MM-DD-YYYY')}
                  </Text>
                </View>
              )}
              <View style={styles.secendpart}>
                <LabelWithColon
                  labelKey="Order Date"
                  textStyle={styles.secendboldtxt}
                />
                <Text style={styles.secendtxt2}>
                  {moment(item?.createdAt).format('MM-DD-YYYY')}
                </Text>
              </View>
              {item?.Local_address && (
                <View style={styles.secendpart}>
                  <LabelWithColon
                    labelKey="Location"
                    textStyle={styles.secendboldtxt}
                  />
                  <Text style={styles.secendtxt2}>
                    {item?.Local_address?.address}
                  </Text>
                </View>
              )}
              <View style={styles.secendpart}>
                <View style={{flexDirection: 'column', width: '90%', gap: 10}}>
                  {item?.productDetail.map((prod, prodIndex) => (
                    <View key={prodIndex}>
                      <View
                        style={{
                          flexDirection: 'row',
                          marginBottom: 5,
                          width: '100%',
                        }}>
                        <Image
                          source={
                            prod?.image
                              ? {
                                  uri: `${prod.image}`,
                                }
                              : require('../../Assets/Images/veg.png')
                          }
                          style={styles.cartimg}
                          resizeMode="contain"
                        />
                        <View style={{width: '100%'}}>
                          <Text style={styles.boxtxt}>
                            {prod?.product?.name}
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'start',
                              // marginVertical: 10,
                            }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}>
                              <Text style={{fontWeight: FONTS.Bold}}>
                                {t('Qty')}
                              </Text>
                              <Text style={{fontWeight: FONTS.Medium}}>
                                :- {prod?.qty}
                              </Text>
                            </View>
                            <Text style={{fontWeight: FONTS.Bold}}>
                              {Currency} {Number(prod?.price ?? 0).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.txtcol}>
                <View style={{}}>
                  <View style={styles.secendpart}>
                    <LabelWithColon
                      labelKey="Qty"
                      textStyle={styles.secendboldtxt}
                    />
                    <Text style={styles.secendtxt}>
                      {item?.productDetail?.length}
                    </Text>
                  </View>
                  <Text style={styles.amount}>
                    {Currency}
                    {item?.total}
                  </Text>
                </View>
                <OrderReady
                  row={item}
                  props={{
                    loader: setLoading,
                  }}
                  getProducts={getProducts}
                />
                {/* <Text style={styles.amount}>
                  {Currency}
                  {item?.total}
                </Text> */}
              </View>
            </TouchableOpacity>

            {modalVisible === item._id && (
              <TouchableOpacity
                style={styles.backdrop}
                onPress={() => setModalVisible(null)}>
                <View style={styles.centeredView}>
                  <View style={styles.modalView}>
                    {/* {item.status === 'Pending' && (
                      <TouchableOpacity
                        style={styles.popuplistcov}
                        onPress={() => {
                          navigate('OrderDetail', item);
                          setModalVisible(null);
                        }}>
                        <View style={styles.popuplistcov2}>
                          <ViewIcon />
                          <Text>{t('View Order Details')}</Text>
                        </View>
                      </TouchableOpacity>
                    )} */}
                    {item.status === 'Packed' && (
                      <TouchableOpacity
                        style={styles.popuplistcov}
                        onPress={() => {
                          setassignmodel(true);
                          setModalVisible(null);
                          setorderid(item._id);
                        }}>
                        <View style={styles.popuplistcov2}>
                          <ViewIcon />
                          <Text style={styles.popuptxt}>
                            {t('Assign Driver')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      // style={styles.popuplistcov}
                      onPress={() => {
                        navigate('EmployeeOrderStatus', item);
                        setModalVisible(null);
                      }}>
                      <View style={styles.popuplistcov2}>
                        <StatusIcon />
                        <Text style={styles.popuptxt}>{t('Status')}</Text>
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
              {t('No Order Available')}
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
          // Alert.alert('Modal has been closed.');
          setassignmodel(!assignmodel);
        }}>
        <View style={styles.centeredView2}>
          <View style={styles.modalView2}>
            {/* <Text style={styles.alrt}>Alert !</Text> */}
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

export default Orders;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.lightgrey,
  },
  box: {
    backgroundColor: Constants.white,
    marginVertical: 10,
    padding: 20,
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
    right: 20,
    top: 60,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 5,
    boxShadow: '0 0 8 0.05 grey',
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
    backgroundColor: Constants.saffron + 20,
    fontSize: 14,
    color: Constants.saffron,
    height: 20,
    paddingHorizontal: 10,
    borderRadius: 10,
    fontFamily: FONTS.Regular,
    marginBottom: 5,
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
    height: 50,
    width: 50,
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
});
