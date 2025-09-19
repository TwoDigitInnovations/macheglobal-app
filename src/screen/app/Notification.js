import {
  Dimensions,
  FlatList,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { GetApi } from '../../Assets/Helpers/Service';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import {
  BackIcon,
  ChatIcon,
  NotificationIcon,
} from '../../../Theme';
import moment from 'moment';
import { LoadContext, ToastContext } from '../../../App';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';


const Notification = props => {
  console.log(props)
  console.log(props.navigation.canGoBack())
  const { t } = useTranslation();
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [notification, setnotification] = useState([]);

  useEffect(() => {
    const willFocusSubscription = props.navigation.addListener(
      'focus',
      async () => {
        getNotification();
      },
    );
    return () => {
      willFocusSubscription();
    };
  }, []);
  const getNotification = async () => {
    setLoading(true);
    GetApi(`getnotification`, '').then(
      async res => {
        setLoading(false);
        console.log(res);
        setnotification(res.data);
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  return (
    <SafeAreaView style={[styles.container]}>

      <View style={{}}>
        <DriverHeader showback={true} item={t("My Notification")} />
      </View>
      {/* <Text style={styles.titleTxt}>My Notification</Text> */}
      <View style={{ marginBottom: 50, marginTop: 20, paddingHorizontal: 20 }}>
        <FlatList
          data={notification}
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
                {t('No Notification')}
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.box]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.editiconcov]}>
                  <NotificationIcon height={25} color={Constants.saffron} />
                </View>
                <View style={styles.notitxt}>
                  <Text style={[styles.txtm]}>{item.title}</Text>
                  <Text style={[styles.txtm2]}>{item.message}</Text>
                </View>
              </View>
              <Text style={styles.date}>
                {moment(item.createdAt).format('DD MMM, hh:mm A')}
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
    // padding: 20,
  },
  image: {
    height: 100,
    width: 100,
    position: 'absolute',
    opacity: 0.1,
    display: 'flex',
    alignSelf: 'center',
    top: (Dimensions.get('screen').height / 2) - 50
  },
  rootView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // width: wp(90),
    alignSelf: 'center',
    width: '100%',
    marginBottom: 20,
  },
  box: {
    // height: 80,
    backgroundColor: Constants.saffron,
    borderRadius: 20,
    // flexDirection: 'row',
    // alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Constants.saffron,
  },
  editiconcov: {
    height: 30,
    width: 30,
    borderRadius: 25,
    backgroundColor: Constants.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txtm: {
    fontWeight: '500',
    // marginVertical:10,
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Medium,
  },
  txtm2: {
    // fontWeight:'500',
    // marginVertical:10,
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Regular,
  },
  notitxt: {
    marginLeft: 20,
    marginRight: 10,
    paddingTop: 10,
    // backgroundColor:Constants.red
  },
  backcov: {
    width: 30,
    height: 25,
  },
  titleTxt: {
    color: Constants.black,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  date: {
    color: Constants.white,
    fontSize: 12,
    // fontWeight: '500',
    fontFamily: FONTS.Medium,
    alignSelf: 'flex-end',
    marginBottom: 5
  },
});
