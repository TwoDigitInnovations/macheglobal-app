import React, { useCallback, useContext, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import {
  CartFilledIcon,
  CartIcon,
  CategoriesFilledIcon,
  CategoriesIcon,
  HomeFilledIcon,
  HomeIcon,
  OrdersFilledIcon,
  OrdersIcon,
  OrdersIconFilled,
  OrdersIconNone,
  ReferalIcon,
  AccountIcon,
  AccountFilledIcon,
} from '../../Theme';
import Account from '../screen/app/Account';
import Constants, { FONTS } from '../Assets/Helpers/constant';
import Home from '../screen/app/Home';
import Categories from '../screen/app/Categories';
import Referal from '../screen/app/Referal';
import NewCart from '../screen/app/NewCart';
import { useTranslation } from 'react-i18next';
import Myorder from '../screen/app/Myorder';
import Products from '../screen/app/Products';
import SubcategoryProducts from '../screen/app/SubcategoryProducts';
import { createStackNavigator } from '@react-navigation/stack';
import { CartContext } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator();

const Stack = createStackNavigator();

import Preview from '../screen/app/Preview';

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeScreen" component={Home} />
    <Stack.Screen name="Products" component={Products} />
    <Stack.Screen name="SubcategoryProducts" component={SubcategoryProducts} />
    <Stack.Screen name="Preview" component={Preview} />
  </Stack.Navigator>
);

import CategorySubCat from '../screen/app/CategorySubCat';
import Favorites from '../screen/app/Favorites';

const CategoriesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CategoriesTab" component={CategorySubCat} />
    <Stack.Screen name="CategoriesList" component={Categories} />
    <Stack.Screen name="Products" component={Products} />
  </Stack.Navigator>
);

const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OrdersTab" component={Myorder} />
  </Stack.Navigator>
);

const CartStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CartTab" component={NewCart} />
  </Stack.Navigator>
);

export const TabNav = () => {
  const { t } = useTranslation();
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [isGuestUser, setIsGuestUser] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Check guest status on mount and periodically
  React.useEffect(() => {
    const checkGuestStatus = async () => {
      const guestStatus = await AsyncStorage.getItem('isGuestUser');
      const userDetail = await AsyncStorage.getItem('userDetail');
      console.log('Guest status check:', guestStatus, 'User detail exists:', !!userDetail);
      
      // If user is logged in (has userDetail), they are NOT a guest
      if (userDetail) {
        setIsGuestUser(false);
      } else {
        setIsGuestUser(guestStatus === 'true');
      }
    };
    
    checkGuestStatus();
    
    // Check every 1 second for changes
    const interval = setInterval(checkGuestStatus, 1000);
    
    return () => clearInterval(interval);
  }, [refreshKey]);

const AccountStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AccountTab" component={Account} />
    <Stack.Screen name="Favorites" component={Favorites} />
  </Stack.Navigator>
);

const allTabs = [
    {
      iconActive: <HomeIcon color={Constants.saffron} height={24} />,
      iconInActive: (
        <HomeFilledIcon color={Constants.black} height={24} />
      ),
      component: HomeStack,
      routeName: 'Home',
      name: 'Home',
    },
    {
      iconActive: <CategoriesFilledIcon color={Constants.saffron} height={25} />,
      iconInActive: (
        <CategoriesIcon color={Constants.black} height={24} />
      ),
      component: CategoriesStack,
      routeName: 'Categories',
      name: 'Categories',
    },
    {
      iconActive: <OrdersIconFilled color={Constants.saffron} height={33} />,
      iconInActive: (
        <OrdersIconNone color={Constants.black} height={30} />
      ),
      component: OrdersStack,
      routeName: 'Orders',
      name: 'Orders',
    },
    {
      iconActive: <CartFilledIcon color={Constants.saffron} height={26} />,
      iconInActive: <CartIcon color={Constants.black} height={26} />,
      component: CartStack,
      routeName: 'Cart',
      name: 'Cart',
    },
    {
      iconActive: <AccountFilledIcon color={Constants.saffron} height={26} />,
      iconInActive: <AccountIcon color={Constants.black} height={26} />,
      component: AccountStack,
      routeName: 'Account',
      name: 'Account',
      hideForGuest: true,
    },
  ];

  // Always show all tabs
  const TabArr = allTabs;

  console.log('TabNav render - isGuestUser:', isGuestUser, 'TabArr length:', TabArr.length);

  const TabButton = useCallback(
    ({ accessibilityState, onPress, onclick, item, index }) => {
      const isSelected = accessibilityState?.selected;
      const isCartTab = item.routeName === 'Cart';
      const cartCount = cartdetail?.length || 0;

      return (
        <View style={styles.tabBtnView}>
          <View style={styles.iconContainer}>
            <TouchableOpacity
              onPress={onclick ? onclick : onPress}
              style={[
                styles.tabBtn,
                isSelected ? styles.tabBtnActive : styles.tabBtnInActive,
              ]}>
              {isSelected ? item.iconActive : item.iconInActive}
            </TouchableOpacity>
            {isCartTab && cartCount > 0 && (
              <View style={[styles.badge, { backgroundColor: '#FF7000' }]}>
                <Text style={styles.badgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabtxt,
              { color: isSelected ? Constants.saffron : Constants.black },
            ]}>
            {t(item.name)}
          </Text>
        </View>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartdetail],
  );

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          width: '100%',
          minHeight: Platform?.OS === 'android' ? 70 : 90,
          backgroundColor: 'white',
          borderTopRightRadius: 15,
          borderTopLeftRadius: 15,
          borderTopWidth: 0,
          paddingTop: 20,
          elevation: 10, 
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
        },
      }}>
      {TabArr.map((item, index) => {
        return (
          <Tab.Screen
            key={index}
            name={item.routeName}
            component={item.component}
            options={{
              tabBarShowLabel: false,
              tabBarButton: props => (
                <TabButton {...props} item={item} index={index} />
              ),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBtnView: {
    // backgroundColor: isSelected ? 'blue' : '#FFFF',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
  },
  tabBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'transparent',
  },
  tabBtnInActive: {
    backgroundColor: 'transparent',
  },
  tabtxt: {
    color: Constants.black,
    fontSize: 12,
    marginTop: 4,
    fontFamily: FONTS.Medium,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
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
