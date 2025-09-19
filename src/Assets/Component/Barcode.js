import React from 'react';
import { Image, View } from 'react-native';

const Barcode = ({ value = '123456789' }) => {
  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${value}&code=Code128&translate-esc=false`;

  return (
    <View>
      <Image
        source={{ uri: barcodeUrl }}
        style={{ width: 300, height: 100 }}
        resizeMode="contain"
      />
    </View>
  );
};

export default Barcode;
