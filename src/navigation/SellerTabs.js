import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SellerOrders from '../screen/seller/SellerOrders';
import SellerProducts from '../screen/seller/SellerProducts';
import SellerWallet from '../screen/seller/SellerWallet';
import SellerAccount from '../screen/seller/SellerAccount';
import TransactionHistory from '../screen/seller/TransactionHistory';
import OrderDetails from '../screen/seller/OrderDetails';
import MessagesList from '../screen/app/MessagesList';
import ChatRoom from '../screen/app/ChatRoom';

const Tab = createBottomTabNavigator();

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
        headerShown: true,
        title: 'Withdrawal History',
        headerBackTitle: 'Back'
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
  const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(0);

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
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
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
      <Tab.Screen name="Products" component={SellerProducts} />
      <Tab.Screen name="Orders" component={OrdersStackScreen} />
      <Tab.Screen 
        name="Messages" 
        component={MessagesStackScreen}
        options={{
          tabBarBadge: unreadMessagesCount > 0 ? (unreadMessagesCount > 99 ? '99+' : unreadMessagesCount) : undefined,
        }}
      />
      <Tab.Screen name="Wallet" component={WalletStackScreen} />
      <Tab.Screen name="Account" component={SellerAccount} options={{ headerShown: false }} />
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
