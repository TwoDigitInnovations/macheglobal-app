import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

const OrderSuccessScreen = ({ route, navigation }) => {
  const { orderNumber, totalAmount } = route.params || {};
  const animationRef = useRef(null);

  useEffect(() => {
    // Play animation
    if (animationRef.current) {
      animationRef.current.play();
    }

   
    const timer = setTimeout(() => {
      navigation.navigate('App', { screen: 'Home' });
    }, 7000);

    return () => clearTimeout(timer);
  }, [navigation]);

  // Disable back button
  React.useEffect(() => {
    const backAction = () => {
      navigation.navigate('App', { screen: 'Home' });
      return true;
    };

    const backHandler = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      backAction();
    });

    return () => backHandler();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar backgroundColor="#24a8af" barStyle="light-content" />
      
     
      
      <View style={styles.container}>
        <View style={styles.animationContainer}>
          {/* Large Lottie Animation */}
          <LottieView
            ref={animationRef}
            source={require('../../../src/Assets/animations/Success.json')}
            autoPlay
            loop={false}
            style={styles.lottieAnimation}
            onAnimationFinish={() => console.log('Animation Finished')}
          />

          <Text style={styles.successText}>Order Placed Successfully!</Text>
          
          {/* Only showing Total Amount */}
          {totalAmount && (
            <Text style={styles.amountText}>
              Total Amount: ${totalAmount.toFixed(2)}
            </Text>
          )}

          <Text style={styles.thankYouText}>
            Thank you for shopping with us!
          </Text>

          <Text style={styles.noteText}>
            You will be redirected to home screen in 5 seconds...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#24a8af',
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#24a8af',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButton: {
    backgroundColor: 'white',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#24a8af',
    paddingHorizontal: 20,
  },
  animationContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#24a8af',
  },
  lottieAnimation: {
    width: width * 0.75,
    height: width * 0.75,
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  successText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  thankYouText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  noteText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default OrderSuccessScreen;