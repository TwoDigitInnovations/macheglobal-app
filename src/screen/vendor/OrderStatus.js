import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { CheckboxactiveIcon, CheckboxIcon } from '../../../Theme';
import moment from 'moment';
import { GetApi, Post } from '../../Assets/Helpers/Service';
import { LoadContext, ToastContext } from '../../../App';
import { goBack } from '../../../navigationRef';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
import LabelWithColon from '../../Assets/Helpers/LabelWithColon';

const OrderStatus = props => {
  const data = props.route.params;
  const { t } = useTranslation();
  const [selectprod, setselectprod] = useState([]);
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
    GetApi(`orders/details/${data}`, {}).then(
      async res => {
        setLoading(false);
        console.log('Order details:', res);
        if (res.success && res.data) {
          setorderdata(res.data);
        } else {
          console.error('Failed to fetch order details');
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
      <DriverHeader item={t('Order Detail')} showback={true} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.box}>
          <View style={{ flexDirection: 'row' }}>
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
                {moment(orderdata?.createdAt).format('DD-MM-YYYY ')}
              </Text>
            </View>
          </View>
          <Text style={styles.timeslotxt}>
            {orderdata?.timeslot}
          </Text>
          <View style={styles.secendpart}>
            <LabelWithColon labelKey="Location" textStyle={styles.secendboldtxt} />
            <Text style={styles.secendtxt2}>
              {orderdata?.shipping_address?.address}
            </Text>
          </View>
          <View style={styles.txtcol}>
            {/* <View style={{}}> */}
            <View style={styles.secendpart}>
              <LabelWithColon labelKey="Qty" textStyle={styles.secendboldtxt} />
              <Text style={styles.secendtxt}>
                {orderdata?.productDetail?.length}
              </Text>
            </View>
            {/* <View style={styles.secendpart}>
                  <Text style={styles.secendboldtxt}>QTY : </Text>
                  <Text style={styles.secendtxt}>12</Text>
                </View> */}
            {/* </View> */}
            {/* <Text style={styles.amount}>{Currency}{orderdata?.total}</Text> */}
          </View>
          <View style={styles.statuscov}>
            {orderdata?.status === 'Pending' ? (
              <Text style={styles.status}>{t('Pending')}</Text>
            ) : orderdata?.status === 'Packed' ? (
              <Text style={styles.status}>{t('Packed')}</Text>
            ) : orderdata?.status === 'Driverassigned' ? (
              <Text style={styles.status}>{t('Driver Assigned')}</Text>
            ) : (
              <Text></Text>
            )}
            <Text style={styles.amount}>
              {Currency}
              {orderdata?.total}
            </Text>
          </View>
        </TouchableOpacity>
        {orderdata?.productDetail &&
          orderdata?.productDetail.length > 0 &&
          orderdata.productDetail.map((item, index) => (
            <TouchableOpacity style={[styles.inputbox]} key={index}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row' }}>
                  {item?.image && item.image.length > 0 && (
                    <Image
                      // source={require('../../Assets/Images/cement.png')}
                      source={{ uri: `${item.image[0]}` }}
                      style={styles.hi2}
                    />
                  )}
                  <View>
                    <Text style={[styles.name]}>{item?.product?.name}</Text>
                    <Text style={styles.qty}>
                      {item?.price_slot?.value} {item?.price_slot?.unit}
                    </Text>
                  </View>
                </View>
                <CheckboxactiveIcon
                  height={25}
                  width={25}
                  color={Constants.saffron}
                />
              </View>
              <View style={styles.txtcol}>
                <View style={{}}>
                  <View style={[styles.secendpart, { marginVertical: 20 }]}>
                    <LabelWithColon labelKey="Qty" textStyle={styles.secendboldtxt} />
                    <Text style={[styles.secendtxt]}>{item.qty}</Text>
                  </View>
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

export default OrderStatus;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.custom_black,
  },
  box: {
    backgroundColor: Constants.white,
    marginVertical: 10,
    padding: 20,
  },
  hi: {
    marginRight: 10,
    height: 50,
    width: 50,
    borderRadius: 50,
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
  txtcol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // flex: 1,
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
  amount: {
    color: Constants.saffron,
    fontSize: 24,
    fontFamily: FONTS.Bold,
    alignSelf: 'flex-end',
  },
  box2: {
    backgroundColor: '#E9FFF5',
    marginVertical: 10,
    padding: 20,
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
    // borderRadius: 50,
  },
  name: {
    color: Constants.black,
    fontFamily: FONTS.Bold,
    fontSize: 16,
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
    fontFamily: FONTS.Regular,
  },
  secendtxt2: {
    color: Constants.black,
    fontSize: 15,
    textAlign: 'left',
    flex: 1,
    fontFamily: FONTS.Regular,
  },

  inputbox: {
    backgroundColor: Constants.lightpink,
    color: Constants.custom_black,
    borderRadius: 15,
    marginVertical: 20,
    // width: '90%',
    // alignSelf: 'center',
    padding: 15,
  },
  shadowProp: {
    boxShadow: '0 0 8 0.05 grey',
  },
  shadowProp2: {
    boxShadow: 'inset 0 0 8 8 #1b1e22',
  },
  donebtn: {
    backgroundColor: Constants.pink,
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Bold,
    width: '35%',
    textAlign: 'center',
    paddingVertical: 10,
    borderRadius: 15,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 30,
  },
  qty: {
    fontSize: 14,
    color: Constants.customgrey,
    fontFamily: FONTS.Bold,
    // marginBottom: 5,
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
    marginVertical: 5
    // alignSelf:'center'
  },
});
