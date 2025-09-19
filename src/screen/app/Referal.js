import {
  Alert,
  // Clipboard,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext } from 'react';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import { UserContext } from '../../../App';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { navigate } from '../../../navigationRef';
import { useTranslation } from 'react-i18next';

const Referal = () => {
  const { t } = useTranslation();
  const [user, setuser] = useContext(UserContext);
  console.log(user);
  const onShare = async () => {
    try {
      const result = await Share.share({
        message:
          'Marketplace Refer Test',
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert(error.message);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item={t('Refer a friend')} />
      {user.email ? <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}><View style={styles.fullpart}>
        <View style={styles.giftcov}>
          <Image source={require('../../Assets/Images/gift.png')} />
        </View>
        <Text style={styles.infotxt}>{t('Refer a friend to earn points.')}</Text>
        <Text style={styles.refercode}
        // onPress={()=> Clipboard.setString(user?.referal)}
        >{user?.referal}</Text>
        <TouchableOpacity style={styles.cartbtn} onPress={onShare}>
          <Text style={styles.buttontxt}>{t('Send invite')}</Text>
        </TouchableOpacity>
        <Text style={styles.refercode2}>
          {t('Current Points')} : {user?.referalpoints}
        </Text>
      </View></ScrollView> : <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: Dimensions.get('window').height - 200,
        }}>
        <Text
          style={styles.logincovtxt}>
          {t('Please login to access all the features')}
        </Text>
        <Text style={styles.redeembtn} onPress={() => navigate('Auth')}>
          {t('Login Now')}
        </Text>
      </View>}
    </SafeAreaView>
  );
};

export default Referal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.lightpink,
  },
  toppart: {
    backgroundColor: Constants.saffron,
    paddingTop: 5,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  carttxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Bold,
    marginLeft: 10,
  },
  fullpart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftcov: {
    backgroundColor: Constants.saffron,
    marginTop: 20,
    height: 100,
    width: 100,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infotxt: {
    color: Constants.black,
    fontFamily: FONTS.Bold,
    fontSize: 18,
    marginVertical: 15,
  },
  refercode: {
    color: Constants.pink,
    fontFamily: FONTS.Bold,
    fontSize: 18,
    marginVertical: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: Constants.pink,
    borderRadius: 15,
  },
  refercode2: {
    color: Constants.pink,
    fontFamily: FONTS.Medium,
    fontSize: 16,
    marginTop: 75,
    marginBottom: 75,
    // padding:15,
    borderWidth: 1,
    borderColor: Constants.pink,
    borderRadius: 15,
    width: '90%',
    paddingVertical: 15,
    textAlign: 'center',
  },
  buttontxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
  cartbtn: {
    height: 60,
    // width: 370,
    borderRadius: 10,
    backgroundColor: Constants.pink,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  redeembtn: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Medium,
    backgroundColor: Constants.saffron,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginVertical: 20,
  },
  logincovtxt: {
    color: Constants.black,
    fontSize: 18,
    fontFamily: FONTS.Medium,
    textAlign: 'center',
    paddingHorizontal: 20
  }
});
