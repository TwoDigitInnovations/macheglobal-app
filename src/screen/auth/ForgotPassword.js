import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import SuccessModal from './SuccessModal';
import Icon from 'react-native-vector-icons/Feather';
import { Post } from '../../Assets/Helpers/Service';
import styles from './styles';
import { useNavigation } from '@react-navigation/native';

const ForgotPassword = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); 
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');

  const handleSendOTP = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await Post('auth/forgot-password', { email });
      
      if (response && response.success) {
        // Save the verification token from the response
        if (response.data?.token) {
          setVerificationToken(response.data.token);
          console.log('Received verification token in response.data.token');
        } else if (response.token) {
          // Handle case where token is at the root level
          setVerificationToken(response.token);
          console.log('Received verification token in response.token');
        } else {
          console.error('No token found in response:', response);
          setError('Failed to get verification token. Please try again.');
          return;
        }
        
        setCurrentStep(2);
        setError('');
      } else {
        setError(response?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    
    if (!verificationToken) {
      setError('Verification token not found. Please request a new OTP.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Verifying OTP with token:', verificationToken);
      
      // Verify the OTP with the backend
      const response = await Post('auth/verifyOTP', { 
        otp: otp.trim(),
        token: verificationToken.trim()
      });
      
      console.log('OTP verification response:', response);
      
      if (response && (response.status === true || response.success === true)) {
        // Update the verification token with the one from the response
        if (response.data?.token) {
          setVerificationToken(response.data.token);
        } else if (response.token) {
          // Handle case where token is at the root level
          setVerificationToken(response.token);
        } else {
          console.error('No token found in verify OTP response:', response);
          setError('Verification failed. Please try again.');
          return;
        }
        setCurrentStep(3);
        setError('');
      } else {
        // If there's a specific error message, show it
        const errorMessage = response?.message || 'Invalid OTP. Please try again.';
        console.error('OTP verification failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError(error.response?.data?.message || 'An error occurred while verifying OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!verificationToken) {
      setError('Verification token not found. Please start the password reset process again.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Resetting password with token:', verificationToken);
      
      const response = await Post('auth/reset-password', {
        otp: otp.trim(),
        newPassword,
        token: verificationToken
      });
      
      console.log('Password reset response:', response);
      
      if (response && (response.status === true || response.success === true)) {
        // Show success popup
        setShowSuccessPopup(true);
      } else {
        const errorMessage = response?.message || 'Failed to reset password. Please try again.';
        console.error('Password reset failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle success popup close
  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
    navigation.navigate('SignIn');
  };

  return (
    <SafeAreaView style={styles.container}>
      <SuccessModal 
        visible={showSuccessPopup}
        onClose={handleCloseSuccessPopup}
        title="Success!"
        message="Your password has been reset successfully. Please login with your new password."
        buttonText="OK"
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.forgotPasswordTitle}>Reset Password</Text>
          
          {/* Progress Steps */}
          <View style={styles.stepsContainer}>
            <View style={[styles.step, currentStep >= 1 && styles.activeStep]}>
              <Text style={[styles.stepText, currentStep >= 1 && styles.activeStepText]}>1</Text>
            </View>
            <View style={[styles.step, currentStep >= 2 && styles.activeStep]}>
              <Text style={[styles.stepText, currentStep >= 2 && styles.activeStepText]}>2</Text>
            </View>
            <View style={[styles.step, currentStep >= 3 && styles.activeStep]}>
              <Text style={[styles.stepText, currentStep >= 3 && styles.activeStepText]}>3</Text>
            </View>
          </View>
          
          {/* Error Message */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Step 1: Email Input */}
          {currentStep === 1 && (
            <View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={styles.inputLabel}>Email</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleSendOTP}
              >
                <Text style={styles.primaryButtonText}>Send OTP</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.secondaryButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === 2 && (
            <View>
              <Text style={styles.infoText}>
                We've sent a 6-digit verification code to {email}
              </Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  placeholderTextColor="#9ca3af"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={styles.inputLabel}>Verification Code</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleVerifyOTP}
              >
                <Text style={styles.primaryButtonText}>Verify OTP</Text>
              </TouchableOpacity>
              
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code? </Text>
                <TouchableOpacity onPress={handleSendOTP}>
                  <Text style={styles.resendLink}>Resend</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => setCurrentStep(1)}
              >
                <Text style={styles.secondaryButtonText}>Change Email</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: New Password */}
          {currentStep === 3 && (
            <View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <Text style={styles.inputLabel}>New Password</Text>
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon 
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={22}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.inputContainer, {marginBottom: 24}]}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon 
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={22}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleResetPassword}
              >
                <Text style={styles.primaryButtonText}>Reset Password</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.secondaryButton, {marginTop: 8}]}
                onPress={() => setCurrentStep(2)}
              >
                <Text style={styles.secondaryButtonText}>Back to OTP</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// All styles should be defined in styles.js file
// Make sure to add these styles to your styles.js file

// You can now use this component in your navigation stack
// Example: <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

export default ForgotPassword;