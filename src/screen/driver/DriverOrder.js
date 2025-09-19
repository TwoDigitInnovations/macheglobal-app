import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import Constants, {Currency, FONTS} from '../../Assets/Helpers/constant';
import {navigate} from '../../../navigationRef';
import Header from '../../Assets/Component/Header';
import {
  CheckboxactiveIcon,
  ThreedotIcon,
  TickboxIcon,
  TickIcon,
} from '../../../Theme';
import {LoadContext, ToastContext} from '../../../App';
import {GetApi} from '../../Assets/Helpers/Service';
import moment from 'moment';
import DriverHeader from '../../Assets/Component/DriverHeader';
import {useTranslation} from 'react-i18next';
import LabelWithColon from '../../Assets/Helpers/LabelWithColon';

const DriverOrder = props => {
  const data = props?.route?.params;
  const {t} = useTranslation();
  console.log(data);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [orderdata, setorderdata] = useState();

  useEffect(() => {
    {
      data && getOrderById();
    }
  }, [data]);
  const getOrderById = () => {
    setLoading(true);
    GetApi(`getProductRequest/${data}`, {}).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res.status) {
          setorderdata(res.data);
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
      <DriverHeader item={t('Orders')} showback={true} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.box,
            {
              backgroundColor:
                orderdata?.status === 'Pending'
                  ? Constants.white
                  : orderdata?.status === 'Driverassigned'
                  ? '#E9FFE9'
                  : '#FFF6D8',
            },
          ]}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View style={{flexDirection: 'row'}}>
              <Image
                // source={require('../../Assets/Images/profile.png')}
                source={
                  orderdata?.user?.img
                    ? {
                        uri: `${orderdata?.user?.img}`,
                      }
                    : require('../../Assets/Images/profile.png')
                }
                style={styles.hi}
                // onPress={()=>navigate('Account')}
              />
              <View>
                <Text style={styles.name}>{orderdata?.user?.username}</Text>
                <Text style={styles.redeembtn}>
                  {/* {moment(item?.created_at).format('DD-MM-YYYY')} */}
                  {orderdata?.orderId}
                </Text>
              </View>
            </View>
          </View>
          {/* <Text style={styles.timeslotxt}>{orderdata?.timeslot}</Text> */}
          <View style={styles.secendpart}>
            <LabelWithColon
              labelKey="Location"
              textStyle={styles.secendboldtxt}
            />
            <Text style={styles.secendtxt2}>
              {orderdata?.Local_address?.address?.address ||
                orderdata?.Local_address?.address}
            </Text>
          </View>
          <View style={styles.txtcol}>
            <View style={{}}>
              <View style={styles.secendpart}>
                <LabelWithColon
                  labelKey="Qty"
                  textStyle={styles.secendboldtxt}
                />
                <Text style={styles.secendtxt}>
                  {orderdata?.productDetail.length}
                </Text>
              </View>
              {/* <View style={styles.secendpart}>
                <Text style={styles.secendboldtxt}>QTY : </Text>
                <Text style={styles.secendtxt}>12</Text>
              </View> */}
              <View style={styles.statuscov}>
                {orderdata?.status === 'Driverassigned' ? (
                  <Text style={styles.status}>{t('Driver Assigned')}</Text>
                ) : orderdata?.status === 'Delivered' ? (
                  <Text style={styles.status}>{t('Delivered')}</Text>
                ) : (
                  <Text></Text>
                )}
                <Text style={styles.amount}>
                  {Currency}
                  {orderdata?.total}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {orderdata?.seller_id && (
          <View style={[styles.box]}>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View style={{flexDirection: 'row'}}>
                <Image
                  // source={require('../../Assets/Images/profile.png')}
                  source={
                    orderdata?.seller_id?.img
                      ? {
                          uri: `${orderdata?.seller_id?.img}`,
                        }
                      : require('../../Assets/Images/profile.png')
                  }
                  style={styles.hi}
                  // onPress={()=>navigate('Account')}
                />
                <View>
                  <Text style={styles.name}>{t('Seller Details')}</Text>
                  <Text style={styles.name3}>
                    {orderdata?.seller_id?.username}
                  </Text>
                </View>
              </View>
              {/* <Text style={styles.deliveredbtn}>{orderdata?.status}</Text> */}
            </View>
            <View style={styles.secendpart}>
              <LabelWithColon
                labelKey="Location"
                textStyle={styles.secendboldtxt}
              />
              <Text style={styles.secendtxt2}>
                {orderdata?.seller_id?.address}
              </Text>
            </View>
            <View style={styles.txtcol}>
              <View style={{alignItems: 'flex-end', width: '100%'}}>
                <Text style={styles.amount}>
                  {Currency}
                  {orderdata?.total}
                </Text>
              </View>
            </View>
          </View>
        )}
        {orderdata?.productDetail &&
          orderdata?.productDetail.length > 0 &&
          orderdata.productDetail.map((item, index) => (
            <TouchableOpacity
              style={[
                styles.inputbox,
                {
                  marginBottom:
                    index + 1 === orderdata.productDetail.length &&
                    orderdata?.status != 'Delivered'
                      ? 60
                      : 10,
                },
              ]}
              key={index}>
              <View style={{flexDirection: 'row'}}>
                <View style={{flexDirection: 'row', width: '90%'}}>
                  {item?.image && item.image.length > 0 && (
                    <Image
                      source={{uri: `${item.image[0]}`}}
                      style={styles.hi2}
                    />
                  )}
                  <Text style={styles.name2}>{item?.product?.name}</Text>
                </View>
                {/* <CheckboxactiveIcon style={{}} height={20} width={20} /> */}
              </View>
              <View style={[styles.txtcol, {marginVertical: 10}]}>
                <View style={styles.secendpart}>
                  <LabelWithColon
                    labelKey="Qty"
                    textStyle={[
                      styles.secendboldtxt,
                      {color: Constants.saffron},
                    ]}
                  />
                  <Text style={[styles.secendtxt]}>{item?.qty}</Text>
                </View>
                <Text style={styles.amount}>
                  {Currency}
                  {item?.price}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverOrder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
  },
  box: {
    backgroundColor: Constants.white,
    marginVertical: 10,
    padding: 20,
    marginBottom: 20,
  },

  hi: {
    marginRight: 10,
    height: 50,
    width: 50,
    borderRadius: 50,
  },
  hi2: {
    marginRight: 10,
    height: 50,
    width: 50,
  },
  redeembtn: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    color: Constants.saffron,
  },
  deliveredbtn: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Medium,
    backgroundColor: '#17AD53',
    paddingHorizontal: 10,
    paddingVertical: 5,
    // marginVertical: 7,
    height: 35,
    borderRadius: 8,
  },
  name: {
    color: Constants.black,
    fontFamily: FONTS.Bold,
    fontSize: 14,
  },
  name3: {
    color: Constants.black,
    fontFamily: FONTS.Bold,
    fontSize: 16,
  },
  name2: {
    color: Constants.black,
    fontFamily: FONTS.Bold,
    fontSize: 14,
    alignSelf: 'center',
    width: '90%',
    textAlign: 'left',
  },
  secendpart: {
    flexDirection: 'row',
    // flex: 1,
    // justifyContent: 'space-between',
    marginLeft: 10,
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
    // flex: 1,
  },
  amount: {
    color: Constants.saffron,
    fontSize: 24,
    fontFamily: FONTS.Bold,
    alignSelf: 'flex-end',
  },
  box2: {
    backgroundColor: Constants.custom_black,
    borderRadius: 15,
    marginVertical: 10,
    padding: 7,
    height: 150,
  },
  shadowProp: {
    boxShadow: '0 0 8 0.05 grey',
  },
  shadowProp2: {
    boxShadow: 'inset 0 0 8 5 #1b1e22',
  },
  inrshabox: {
    flex: 1,
    borderRadius: 15,
    backgroundColor: Constants.light_black,
    // justifyContent: 'space-evenly',
    // alignItems: 'center',
    padding: 20,
    // justifyContent:'space-between'
  },
  status: {
    color: Constants.saffron,
    fontSize: 18,
    fontFamily: FONTS.Bold,
    // alignSelf: 'flex-end',
  },
  statuscov: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  inputbox: {
    backgroundColor: Constants.lightpink,
    color: Constants.custom_black,
    borderRadius: 15,
    marginVertical: 5,
    padding: 15,
  },
  qty: {
    fontSize: 14,
    color: Constants.customgrey,
    fontFamily: FONTS.Bold,
    marginTop: 5,
  },
  timeslotxt: {
    color: Constants.saffron,
    fontSize: 16,
    fontFamily: FONTS.Medium,
    borderWidth: 1,
    borderColor: Constants.saffron,
    borderRadius: 5,
    width: '50%',
    textAlign: 'center',
    marginVertical: 5,
    // alignSelf:'center'
  },
});
