import React, { useContext } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home as HomeIcon, ChartBarStacked, MessagesSquare, ShoppingCart, User } from 'lucide-react-native';
import Account from '../screen/app/Account';
import Constants, { FONTS } from '../Assets/Helpers/constant';
import Home from '../screen/app/Home';
import Categories from '../screen/app/Categories';
import NewCart from '../screen/app/NewCart';
import { useTranslation } from 'react-i18next';
import Products from '../screen/app/Products';
import SubcategoryProducts from '../screen/app/SubcategoryProducts';
import { createStackNavigator } from '@react-navigation/stack';
import { CartContext } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator();

const Stack = createStackNavigator();

import Preview from '../screen/app/Preview';
import MessagesList from '../screen/app/MessagesList';
import ChatRoom from '../screen/app/ChatRoom';
import ManufacturerProducts from '../screen/app/ManufacturerProducts';
import Coupons from '../screen/app/Coupons';
import ManufacturerProductDetail from '../screen/app/ManufacturerProductDetail';

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeScreen" component={Home} />
    <Stack.Screen name="Products" component={Products} />
    <Stack.Screen name="SubcategoryProducts" component={SubcategoryProducts} />
    <Stack.Screen name="Preview" component={Preview} />
    <Stack.Screen name="ChatRoom" component={ChatRoom} />
    <Stack.Screen name="ManufacturerProducts" component={ManufacturerProducts} />
    <Stack.Screen name="ManufacturerProductDetail" component={ManufacturerProductDetail} />
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

const MessagesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MessagesTab" component={MessagesList} />
    <Stack.Screen name="ChatRoom" component={ChatRoom} />
  </Stack.Navigator>
);

const CartStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CartTab" component={NewCart} />
  </Stack.Navigator>
);

const AccountStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
    }}
  >
    <Stack.Screen name="AccountTab" component={Account} />
    <Stack.Screen 
      name="Favorites" 
      component={Favorites}
    />
    <Stack.Screen name="Coupons" component={Coupons} />
  </Stack.Navigator>
);

const allTabs = [
  {
    icon: HomeIcon,
    component: HomeStack,
    routeName: 'Home',
    name: 'Home',
  },
  {
    icon: ChartBarStacked,
    component: CategoriesStack,
    routeName: 'Categories',
    name: 'Categories',
  },
  {
    icon: MessagesSquare,
    component: MessagesStack,
    routeName: 'Messages',
    name: 'Messages',
  },
  {
    icon: ShoppingCart,
    component: CartStack,
    routeName: 'Cart',
    name: 'Cart',
  },
  {
    icon: User,
    component: AccountStack,
    routeName: 'Account',
    name: 'Account',
    hideForGuest: true,
  },
];

export const TabNav = () => {
  const { t } = useTranslation();
  const [cartdetail] = useContext(CartContext);
  const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(0);

  // Fetch unread messages count
  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const userDetail = await AsyncStorage.getItem('userDetail');
      if (!userDetail) return;
      
      const user = JSON.parse(userDetail);
      const { GetApi } = require('../Assets/Helpers/Service');
      const response = await GetApi(`chat/conversations/${user._id}`);
      
      if (response && response.status && response.data) {
        const unreadCount = response.data.reduce((total, conv) => {
          return total + (conv.unreadCount || 0);
        }, 0);
        setUnreadMessagesCount(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  }, []);

  React.useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // Reduced to 10 seconds for faster updates
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const renderTabButton = (props) => {
    const { accessibilityState, onPress, item, isFocused } = props;
    const isSelected = isFocused || accessibilityState?.selected;
    const isCartTab = item.routeName === 'Cart';
    const isMessagesTab = item.routeName === 'Messages';
    const cartCount = cartdetail?.length || 0;
    
    const IconComponent = item.icon;
    const iconColor = isSelected ? '#FF7000' : '#000000';
    const iconStrokeWidth = isSelected ? 2.5 : 2;

    console.log(`Tab ${item.routeName}: isSelected=${isSelected}, isFocused=${isFocused}, color=${iconColor}`);

    return (
      <View style={styles.tabBtnView}>
        <View style={styles.iconContainer}>
          <TouchableOpacity
            onPress={onPress}
            style={[
              styles.tabBtn,
              isSelected ? styles.tabBtnActive : styles.tabBtnInActive,
            ]}>
            <IconComponent 
              size={24} 
              color={iconColor}
              stroke={iconColor}
              strokeWidth={iconStrokeWidth} 
            />
          </TouchableOpacity>
          {isCartTab && cartCount > 0 && (
            <View style={[styles.badge, { backgroundColor: '#FF7000' }]}>
              <Text style={styles.badgeText}>
                {cartCount > 99 ? '99+' : cartCount}
              </Text>
            </View>
          )}
          {isMessagesTab && unreadMessagesCount > 0 && (
            <View style={[styles.badge, { backgroundColor: '#FF0000' }]}>
              <Text style={styles.badgeText}>
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabtxt,
            { color: isSelected ? '#FF7000' : '#000000' },
          ]}>
          {t(item.name)}
        </Text>
      </View>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          width: '100%',
          height: Platform?.OS === 'android' ? 68 : 88,
          backgroundColor: 'white',
          borderTopRightRadius: 15,
          borderTopLeftRadius: 15,
          borderTopWidth: 0,
          paddingTop: 15,
          paddingBottom: 8,
          elevation: 10, 
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
        },
      }}>
      {allTabs.map((item, index) => {
        return (
          <Tab.Screen
            key={index}
            name={item.routeName}
            component={item.component}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                // Refresh unread count when Messages tab is pressed
                if (item.routeName === 'Messages') {
                  fetchUnreadCount();
                }
                // Reset stack to initial screen when tab is pressed
                navigation.navigate(item.routeName, {
                  screen: item.routeName === 'Home' ? 'HomeScreen' :
                         item.routeName === 'Categories' ? 'CategoriesTab' :
                         item.routeName === 'Messages' ? 'MessagesTab' :
                         item.routeName === 'Cart' ? 'CartTab' :
                         item.routeName === 'Account' ? 'AccountTab' : undefined
                });
              },
            })}
            options={({ route, navigation }) => ({
              tabBarShowLabel: false,
              tabBarButton: props => {
                const isFocused = navigation.isFocused();
                return renderTabButton({ ...props, item, isFocused });
              },
            })}
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
    paddingVertical: 0,
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
    marginTop: -8,
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
