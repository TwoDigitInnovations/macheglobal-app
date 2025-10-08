import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const OrderSuccess = ({ route }) => {
  const navigation = useNavigation();
  const { orderNumber, totalAmount } = route?.params || {};
  
  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const handleContinueShopping = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#24a8af" barStyle="light-content" />
      
      <View style={styles.contentContainer}>
        {/* Large Animation */}
        <View style={styles.animationWrapper}>
          <LottieView
            source={require('../Assets/animations/Success.json')}
            autoPlay
            loop={false}
            style={styles.animation}
          />
        </View>
        
        {/* Success Text */}
        <Text style={styles.successTitle}>Order Placed Successfully!</Text>
        
        {/* Total Amount - Orange Color */}
        <Text style={styles.totalAmount}>Total Amount: ${totalAmount?.toFixed(2) || '0.00'}</Text>
        
        {/* Thank you message */}
        <Text style={styles.thankYouText}>Thank you for shopping with us!</Text>
        
        {/* Continue Shopping Button */}
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={handleContinueShopping}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
        
        {/* Redirect Text */}
        <Text style={styles.redirectText}>
          You will be redirected to home screen in 5 seconds...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#24a8af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#24a8af',
  },
  animationWrapper: {
    width: width * 0.85,
    height: width * 0.85,
    marginBottom: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF7000',
    marginBottom: 15,
    textAlign: 'center',
  },
  thankYouText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#FF7000',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 15,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  redirectText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 5,
  },
});

export default OrderSuccess;