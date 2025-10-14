import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SellerAccount = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Account Screen</Text>
      {/* Add your account components here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default SellerAccount;
