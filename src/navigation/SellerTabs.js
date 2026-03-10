import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import SellerOrders from '../screen/seller/SellerOrders';
import SellerProducts from '../screen/seller/SellerProducts';
import SellerWallet from '../screen/seller/SellerWallet';
import SellerAccount from '../screen/seller/SellerAccount';
import TransactionHistory from '../screen/seller/TransactionHistory';
import OrderDetails from '../screen/seller/OrderDetails';
import MessagesList from '../screen/app/MessagesList';
import ChatRoom from '../screen/app/ChatRoom';
import ProductDetails from '../screen/seller/ProductDetails';

const Tab = createBottomTabNavigator();

// Create a stack navigator for Products
const ProductsStack = createStackNavigator();

const ProductsStackScreen = () => (
  <ProductsStack.Navigator screenOptions={{ headerShown: false }}>
    <ProductsStack.Screen name="SellerProducts" component={SellerProducts} />
    <ProductsStack.Screen name="ProductDetails" component={ProductDetails} />
  </ProductsStack.Navigator>
);

// Create a stack navigator for orders
const OrdersStack = createStackNavigator();

const OrdersStackScreen = () => {
  console.log('OrdersStackScreen rendered');
  return (
    <OrdersStack.Navigator 
      initialRouteName="SellerOrders"
      screenOptions={{
        headerShown: false
      }}
    >
      <OrdersStack.Screen 
        name="SellerOrders" 
        component={SellerOrders} 
        options={{ headerShown: false }}
      />
      <OrdersStack.Screen 
        name="OrderDetails" 
        component={OrderDetails}
        options={{
          headerShown: false
        }}
      />
    </OrdersStack.Navigator>
  );
};

// Create a stack navigator for Wallet
const WalletStack = createStackNavigator();

const WalletStackScreen = () => (
  <WalletStack.Navigator screenOptions={{ headerShown: false }}>
    <WalletStack.Screen name="WalletMain" component={SellerWallet} />
    <WalletStack.Screen 
      name="TransactionHistory" 
      component={TransactionHistory}
      options={{
        headerShown: false
      }}
    />
  </WalletStack.Navigator>
);

// Create a stack navigator for Messages
const MessagesStack = createStackNavigator();

const MessagesStackScreen = () => (
  <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
    <MessagesStack.Screen name="MessagesList" component={MessagesList} />
    <MessagesStack.Screen name="ChatRoom" component={ChatRoom} />
  </MessagesStack.Navigator>
);

const SellerTabs = () => {
  const { t } = useTranslation();
  const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(0);
  const socketRef = React.useRef(null);
  const navigation = require('@react-navigation/native').useNavigation();

  // Handle Android back button
  React.useEffect(() => {
    const { BackHandler, Alert } = require('react-native');
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    
    const backAction = () => {
      Alert.alert(
        t('Logout Required'),
        t('To access the user app, you need to logout from your seller account and login with a user account.'),
        [
          {
            text: t('Cancel'),
            style: 'cancel',
            onPress: () => null,
          },
          {
            text: t('Logout'),
            style: 'destructive',
            onPress: async () => {
              try {
                // Clear user data
                await AsyncStorage.removeItem('userDetail');
                await AsyncStorage.removeItem('userData');
                
                // Navigate to login screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Auth' }],
                });
              } catch (error) {
                console.error('Error logging out:', error);
              }
            },
          },
        ]
      );
      return true; // Prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation, t]);

  // Fetch unread messages count
  React.useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const userDetail = await AsyncStorage.getItem('userDetail');
        if (!userDetail) return;
        
        const user = JSON.parse(userDetail);
        const { GetApi } = require('../Assets/Helpers/Service');
        const response = await GetApi(`chat/conversations/${user._id}`);
        
        if (response && response.status && response.data) {
          // Count unread messages
          const unreadCount = response.data.reduce((total, conv) => {
            return total + (conv.unreadCount || 0);
          }, 0);
          setUnreadMessagesCount(unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };
    
    fetchUnreadCount();
    
    // Refresh every 5 seconds for faster updates
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time badge updates via socket
  React.useEffect(() => {
    const setupSocketListener = async () => {
      try {
        const io = require('socket.io-client');
        const { getSocketUrl } = require('../Assets/Helpers/Service');
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        
        const userDetail = await AsyncStorage.getItem('userDetail');
        if (!userDetail) return;
        
        const user = JSON.parse(userDetail);
        const socketUrl = getSocketUrl();
        
        const socket = io(socketUrl, {
          transports: ['websocket'],
          query: { userId: user._id },
        });

        socket.on('connect', () => {
          console.log('✅ [SELLER_TABS] Socket connected for badge updates');
        });

        socket.on('badgeUpdate', ({ unreadCount }) => {
          console.log('🔔 [SELLER_TABS] Badge update received:', unreadCount);
          setUnreadMessagesCount(unreadCount);
        });

        socket.on('newMessageNotification', () => {
          console.log('🔔 [SELLER_TABS] New message notification received');
          // Refresh unread count
          fetchUnreadCount();
        });

        socketRef.current = socket;
      } catch (error) {
        console.error('Error setting up socket listener:', error);
      }
    };

    setupSocketListener();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
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
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF7000',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 75,
          paddingBottom: 15,
          paddingTop: 15,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2,
          marginBottom: 2,
        },
        tabBarBadgeStyle: {
          backgroundColor: '#FF0000',
          color: '#fff',
          fontSize: 10,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          lineHeight: 18,
        },
      })}
    >
      <Tab.Screen 
        name="Products" 
        component={ProductsStackScreen}
        options={{ title: t('Products') }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersStackScreen}
        options={{ title: t('Orders') }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesStackScreen}
        options={{
          title: t('Messages'),
          tabBarBadge: unreadMessagesCount > 0 ? (unreadMessagesCount > 99 ? '99+' : unreadMessagesCount) : undefined,
        }}
      />
      <Tab.Screen 
        name="Wallet" 
        component={WalletStackScreen}
        options={{ title: t('Wallet') }}
      />
      <Tab.Screen 
        name="Account" 
        component={SellerAccount} 
        options={{ 
          headerShown: false,
          title: t('Account')
        }} 
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#FF7000',
  },
});


export { SellerTabs };
export default SellerTabs;
