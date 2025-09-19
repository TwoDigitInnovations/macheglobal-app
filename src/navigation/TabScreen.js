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
} from '../../Theme';
import Constants, { FONTS } from '../Assets/Helpers/constant';
import Home from '../screen/app/Home';
import Categories from '../screen/app/Categories';
import Referal from '../screen/app/Referal';
import Cart from '../screen/app/Cart';
import { useTranslation } from 'react-i18next';
import Myorder from '../screen/app/Myorder';
import Products from '../screen/app/Products';
import { createStackNavigator } from '@react-navigation/stack';
import { CartContext } from '../../App';

const Tab = createBottomTabNavigator();

const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeScreen" component={Home} />
    <Stack.Screen name="Products" component={Products} />
  </Stack.Navigator>
);

const CategoriesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CategoriesTab" component={Categories} />
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
    <Stack.Screen name="CartTab" component={Cart} />
  </Stack.Navigator>
);

export const TabNav = () => {
  const { t } = useTranslation();
  const [cartdetail, setcartdetail] = useContext(CartContext);

  const TabArr = [
    {
      iconActive: <HomeIcon color={Constants.white} height={24} />,
      iconInActive: (
        <HomeFilledIcon color={Constants.customgrey3} height={24} />
      ),
      component: HomeStack,
      routeName: 'Home',
      name: 'Home',
    },
    {
      iconActive: <CategoriesFilledIcon color={Constants.white} height={25} />,
      iconInActive: (
        <CategoriesIcon color={Constants.customgrey3} height={24} />
      ),
      component: CategoriesStack,
      routeName: 'Categories',
      name: 'Categories',
    },
    {
      iconActive: <OrdersIconFilled color={Constants.white} height={33} />,
      iconInActive: (
        <OrdersIconNone color={Constants.customgrey3} height={30} />
      ),
      component: OrdersStack,
      routeName: 'Orders',
      name: 'Orders',
    },
    {
      iconActive: <CartFilledIcon color={Constants.white} height={26} />,
      iconInActive: <CartIcon color={Constants.customgrey3} height={26} />,
      component: CartStack,
      routeName: 'Cart',
      name: 'Cart',
    },
  ];

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
                // isSelected ? styles.tabBtnActive : styles.tabBtnInActive,
              ]}>
              {isSelected ? item.iconActive : item.iconInActive}
            </TouchableOpacity>
            {isCartTab && cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabtxt,
              { color: isSelected ? Constants.white : Constants.customgrey3 },
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
          backgroundColor: Constants.saffron,
          borderTopRightRadius: 15,
          borderTopLeftRadius: 15,
          borderTopWidth: 0,
          paddingTop: 20,

          //   paddingTop: Platform.OS === 'ios' ? 10 : 0,
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
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: Constants.white,
  },
  tabBtnInActive: {
    backgroundColor: 'white',
  },
  tabtxt: {
    color: Constants.black,
    // fontWeight:'400',
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
