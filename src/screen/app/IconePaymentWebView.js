import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Text
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { Post } from '../../Assets/Helpers/Service';

const IconePaymentWebView = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { paymentUrl, orderId, amount, directBuy, previousCart } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef(null);

  const handleNavigationStateChange = (navState) => {
    const { url, canGoBack } = navState;
    setCanGoBack(canGoBack);
    
    console.log('WebView navigation:', url);
    if (url.includes('/payment/icone/success') || url.includes('payment/success')) {
      console.log('Payment successful, checking status...');
      handlePaymentSuccess();
      return true; 
    }
    
    
    if (url.includes('/payment/icone/cancel') || url.includes('payment/cancelled')) {
      console.log('Payment cancelled');
      handlePaymentCancel();
      return true; 
    }
    
   
    if (url.includes('payment/failed')) {
      console.log('Payment failed');
      handlePaymentFailed();
      return true; 
    }
    
    return true; 
  };

  const handlePaymentSuccess = async () => {
    try {
      // Clear cart on payment success
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // If this was a direct buy, restore previous cart
      if (directBuy && previousCart) {
        await AsyncStorage.setItem('cartdata', previousCart);
        console.log('✅ Previous cart restored after direct buy payment');
      } else {
        // Normal checkout - clear cart
        await AsyncStorage.setItem('cartdata', JSON.stringify([]));
        console.log('✅ Cart cleared on payment success');
      }
      
      const statusResponse = await Post(`payment/icone/status/${orderId}`);
      
      if (statusResponse.success && statusResponse.data.isPaid) {
        navigation.replace('OrderSuccess', {
          orderNumber: orderId,
          totalAmount: amount
        });
      } else {
       
        setTimeout(async () => {
          const retryResponse = await Post(`payment/icone/status/${orderId}`);
          if (retryResponse.success && retryResponse.data.isPaid) {
            navigation.replace('OrderSuccess', {
              orderNumber: orderId,
              totalAmount: amount
            });
          } else {
            Alert.alert(
              t('Payment Processing'),
              t('Your payment is being processed. Please check your orders.'),
              [
                {
                  text: t('OK'),
                  onPress: () => navigation.navigate('Myorder')
                }
              ]
            );
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      Alert.alert(
        t('Payment Status Unknown'),
        t('Please check your orders to confirm payment status.'),
        [
          {
            text: t('OK'),
            onPress: () => navigation.navigate('Myorder')
          }
        ]
      );
    }
  };

  const handlePaymentCancel = async () => {
    // Restore previous cart if this was a direct buy
    if (directBuy && previousCart) {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('cartdata', previousCart);
      console.log('✅ Previous cart restored after payment cancellation');
    }
    
    Alert.alert(
      t('Payment Cancelled'),
      t('Your payment was cancelled. The order has been cancelled and items have been restored to stock.'),
      [
        {
          text: t('OK'),
          onPress: () => navigation.navigate('App', { screen: 'Home' })
        }
      ]
    );
  };

  const handlePaymentFailed = async () => {
    // Restore previous cart if this was a direct buy
    if (directBuy && previousCart) {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('cartdata', previousCart);
      console.log('✅ Previous cart restored after payment failure');
    }
    
    Alert.alert(
      t('Payment Failed'),
      t('Your payment could not be processed. Please try again.'),
      [
        {
          text: t('Try Again'),
          onPress: () => navigation.goBack()
        },
        {
          text: t('Cancel'),
          style: 'cancel',
          onPress: () => navigation.navigate('App', { screen: 'Home' })
        }
      ]
    );
  };

  const handleBackPress = async () => {
  
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return;
    }
    
   
    Alert.alert(
      t('Cancel Payment?'),
      t('Are you sure you want to cancel this payment? The order will be cancelled.'),
      [
        {
          text: t('No'),
          style: 'cancel'
        },
        {
          text: t('Yes, Cancel'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Call cancel endpoint to mark order as cancelled and restore stock
              await Post(`payment/icone/cancel-order/${orderId}`);
              
              // Restore previous cart if this was a direct buy
              if (directBuy && previousCart) {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.setItem('cartdata', previousCart);
                console.log('✅ Previous cart restored after manual cancellation');
              }
            } catch (error) {
              console.error('Error cancelling order:', error);
            }
            navigation.navigate('App', { screen: 'Home' });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF7000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Icon name="arrow-back" size={24} color="#FF7000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Complete Payment')}</Text>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={(request) => {
          const { url } = request;
          
          
          if (url.includes('/payment/icone/cancel') || url.includes('payment/cancelled')) {
            handlePaymentCancel();
            return false; 
          }
          
          if (url.includes('/payment/icone/success') || url.includes('payment/success')) {
            handlePaymentSuccess();
            return false; 
          }
          
          if (url.includes('payment/failed')) {
            handlePaymentFailed();
            return false; 
          }
          
          return true; 
        }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          Alert.alert(
            t('Error'),
            t('Failed to load payment page. Please try again.'),
            [
              {
                text: t('OK'),
                onPress: () => navigation.goBack()
              }
            ]
          );
        }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="always"
        allowsBackForwardNavigationGestures={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
      />

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7000" />
          <Text style={styles.loadingText}>{t('Loading payment page...')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FF7000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    backgroundColor: 'white',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'left',
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default IconePaymentWebView;
