import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Post } from '../../Assets/Helpers/Service';
import { LoadContext, ToastContext } from '../../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useContext(LoadContext);
  const [toast, setToast] = useContext(ToastContext);

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleLogin = async () => {
    console.log('Login button pressed');
    // Basic validation
    if (!formData.email || !formData.password) {
      console.log('Validation failed: Email or password missing');
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Calling login API...');
      const response = await Post('auth/login', formData);
      
      console.log('API Response received:', JSON.stringify(response, null, 2));
      
      if (!response) {
        console.error('No response from server');
        throw new Error('No response from server');
      }

      // Handle error responses (like invalid credentials)
      if (response.status === 'error' || response.message) {
        console.log('Server responded with message:', response.message);
        // We'll still continue if it's a pending seller account
        if (response.status === 'pending') {
          console.log('Pending seller account detected, proceeding with login...');
        } else {
          throw new Error(response.message || 'Login failed');
        }
      }

      // Extract token from response (it could be in different places)
      const token = response.token || (response.data && response.data.token);
      if (!token) {
        console.error('No token in response:', response);
        throw new Error('Authentication failed: No token received');
      }

     
      
      // Extract user data from the response (handle both direct and nested user data)
      const userData = {
        token: token,
        user: response.user || response.data?.user || { email: formData.email },
        ...(response.user || response.data?.user || {}) // Spread user details if they exist
      };

      // If we have a status in the response, include it
      if (response.status) {
        userData.user = userData.user || {};
        userData.user.status = response.status;
      }

    
      
      // Save user data to AsyncStorage
      try {
        await AsyncStorage.setItem('userDetail', JSON.stringify(userData));
        console.log('User data saved to AsyncStorage');
      } catch (storageError) {
        console.error('Error saving to AsyncStorage:', storageError);
        throw storageError;
      }
      
      // Show success message (or info message for pending accounts)
      const toastMessage = response.message || 'Login successful!';
      setToast({
        visible: true,
        message: toastMessage,
        type: response.status === 'pending' ? 'info' : 'success',
      });
      
      console.log('Toast message set');
      
      // Safely extract user data with defaults
      const responseUserData = userData?.user || userData || {};
      const userRole = String(responseUserData?.role || '').toLowerCase();
      // Handle both string and boolean status values
      const userStatus = responseUserData?.status;
      const statusString = userStatus === true ? 'verified' : 
                         userStatus === false ? 'pending' : 
                         String(userStatus || 'pending').toLowerCase();
      
      console.log('Extracted user data:', { userRole, userStatus, responseUserData });
      
      try {
        // Handle navigation based on user role and status
        if (userRole === 'seller') {
          console.log('Seller login detected', { userRole, userStatus });
          
          // Use the normalized status
          console.log('Normalized status:', statusString);
          
          if (statusString === 'verified') {
            console.log('Verified seller, attempting to navigate to SellerTabs');
            console.log('Navigation object:', navigation);
            console.log('Available routes:', navigation.getState()?.routes?.map(r => r.name));
            
            try {
              navigation.reset({
                index: 0,
                routes: [{ name: 'SellerTabs' }],
              });
              console.log('Navigation to SellerTabs successful');
            } catch (navError) {
              console.error('Error navigating to SellerTabs:', navError);
              navigation.replace('App');
            }
          } else if (statusString === 'pending') {
            console.log('Pending seller, navigating to SellerStore');
            navigation.reset({
              index: 0,
              routes: [{ name: 'SellerStore' }],
            });
          } else {
            console.log('Invalid seller status, navigating to App');
            navigation.replace('App');
          }
        } else {
          console.log(`Navigating to App (${userRole || 'default'})`);
          navigation.replace('App');
        }
      } catch (navError) {
        console.error('Navigation error:', navError);
        navigation.replace('App'); 
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message || 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>
          Macheglobal
        </Text>

        {/* Sign UP and Login Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={styles.signUpButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.signUpText}>Sign UP</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.loginToggleButton}
            onPress={() => {}} // Optional: Add any login-specific logic here
          >
            <Text style={styles.loginToggleText}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            secureTextEntry={true}
            autoCapitalize="none"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
          />
        </View>

        {/* Forgot Password */}
        <TouchableOpacity 
          style={styles.forgotPasswordContainer}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password ?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>
              Login
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider with "Or login using" */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine}></View>
          <Text style={styles.dividerText}>Or login using</Text>
          <View style={styles.dividerLine}></View>
        </View>

        {/* Social Login Icons */}
        {/* <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <View style={styles.googleIcon}>
              <Image 
                source={require('../../Assets/Images/google.png')} 
                style={styles.googleImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <View style={styles.appleIcon}>
              <Image 
                source={require('../../Assets/Images/apple.png')} 
                style={styles.appleImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View> */}

        {/* Bottom Text */}
        <View style={styles.bottomContainer}>
          <View style={styles.bottomTextContainer}>
            <Text style={styles.bottomText}>Have an account ? </Text>
            <TouchableOpacity>
              <Text style={styles.bottomLinkText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Don't have an account? Sign up */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor:'#f3f4f6',
    marginHorizontal: 20, 
   paddingLeft:20,
   paddingRight:20,
   shadowColor: '#000',
   shadowOffset: {
     width: 0,
     height: 2,
   },
   shadowOpacity: 0.25,
   shadowRadius: 3.84,
   elevation: 5,
  },
  title: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 48,
    paddingTop: 32,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 48,
    justifyContent: 'center', 
  },
  signUpButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginRight: 12,
  },
  signUpText: {
    color: 'black',
    fontWeight: '500',
  },
  loginToggleButton: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 8,
  },
  loginToggleText: {
    color: 'black',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#374151',
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 20,
    padding: 8,
  },
  forgotPasswordText: {
    color: '#f97316',
    fontWeight: '600',
    fontSize: 14,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 48,
  },
  socialButton: {
    width: 48,
    height: 48,
  
  
 
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  googleImage: {
    width: 36,
    height: 36,
  },
  appleIcon: {
    width: 24,
    height: 24,
   
   
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  appleImage: {
    width: 36,
    height: 36,
    
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  bottomTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bottomText: {
    color: '#6b7280',
    fontSize: 14,
  },
  bottomLinkText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  signupText: {
    color: '#6b7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;