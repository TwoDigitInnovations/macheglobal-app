import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SellerOrders from '../screen/seller/SellerOrders';
import SellerProducts from '../screen/seller/SellerProducts';
import SellerWallet from '../screen/seller/SellerWallet';
import Account from '../screen/app/Account';
import TransactionHistory from '../screen/seller/TransactionHistory';
import OrderDetails from '../screen/seller/OrderDetails';

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
          headerShown: true,
          title: 'Order Details',
          headerBackTitle: 'Back',
          headerBackTitleVisible: true
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

const SellerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'document-text' : 'document-text-outline';
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
      })}
    >
      <Tab.Screen name="Products" component={SellerProducts} />
      <Tab.Screen name="Orders" component={OrdersStackScreen} />
      <Tab.Screen name="Wallet" component={WalletStackScreen} />
      <Tab.Screen name="Account" component={Account} options={{ headerShown: false }} />
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
