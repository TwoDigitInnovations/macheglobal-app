import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { navigate } from '../../../navigationRef';
import { LoadContext, ToastContext } from '../../../App';
import { GetApi } from '../../Assets/Helpers/Service';
import moment from 'moment';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
import LabelWithColon from '../../Assets/Helpers/LabelWithColon';

const History = () => {
  const { t } = useTranslation();
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [orderlist, setorderlist] = useState([]);
  const [curentData, setCurrentData] = useState([]);
  const [page, setPage] = useState(1);
  // const IsFocused = useIsFocused();
  useEffect(() => {
    // if (IsFocused) {
    getorderhistory(1);
    // }
  }, []);

  const getorderhistory = (p) => {
    setPage(p);
    setLoading(true);
    GetApi(`orderhistoryforvendor?page=${p}`, {}).then(
      async res => {
        setLoading(false);
        console.log('$%#@^&**', res);
        setCurrentData(res.data);
        if (p === 1) {
          setorderlist(res.data);
        } else {
          setorderlist([...orderlist, ...res.data]);
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  const fetchNextPage = () => {
    if (curentData.length === 20) {
      getorderhistory(page + 1);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item={t('History')} />
      <View style={{ flex: 1, paddingBottom: 70 }}>
        <FlatList
          data={orderlist}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.box}
              onPress={() => {
                navigate('OrderStatus', item._id);
              }}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row' }}>
                  <Image
                    source={
                      item?.user?.img
                        ? {
                          uri: `${item?.user?.img}`,
                        }
                        : require('../../Assets/Images/profile.png')
                    }
                    style={styles.hi}
                  />
                  <View>
                    <Text style={styles.name}>{item?.user?.username}</Text>
                    <Text style={styles.redeembtn}>
                      {moment(item?.created_at).format('DD-MM-YYYY')}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.secendpart}>
                <LabelWithColon labelKey="Location" textStyle={styles.secendboldtxt} />
                <Text style={styles.secendtxt2}>
                  {item?.shipping_address?.address}
                </Text>
              </View>
              <View style={styles.txtcol}>
                <View style={{}}>
                  <View style={styles.secendpart}>

                    <LabelWithColon labelKey="Qty" textStyle={styles.secendboldtxt} />
                    <Text style={styles.secendtxt}>
                      {item?.productDetail?.length}
                    </Text>
                  </View>
                </View>
                <Text style={styles.amount}>{Currency}{item?.total}</Text>
              </View>
            </TouchableOpacity>
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
                {t('No History Available')}
              </Text>
            </View>
          )}
          onEndReached={() => {
            if (orderlist && orderlist.length > 0) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.05}
        />
      </View>
    </SafeAreaView>
  );
};

export default History;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'f2f2f2',
  },
  box: {
    backgroundColor: Constants.white,
    marginVertical: 5,
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
    alignItems: 'center',
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
});
