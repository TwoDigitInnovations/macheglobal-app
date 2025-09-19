import React from 'react';
import { View, Button, Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

const InvoiceGenerator = () => {
  const requestAndroidPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        // For Android 10 (API 29) and below
        const writeGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to save PDF',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        // For Android 11 (API 30) and above
        const readGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to save PDF',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        return (
          writeGranted === PermissionsAndroid.RESULTS.GRANTED &&
          readGranted === PermissionsAndroid.RESULTS.GRANTED
        );
      }
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const generatePDF = async () => {
    try {
      const hasPermission = await requestAndroidPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Cannot save PDF without storage permission. Please grant permission in app settings.',
          [
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // Rest of your PDF generation code...
      const html = `
        <div style="padding: 24px; font-family: Helvetica;">
          <h1 style="text-align: center;">Invoice</h1>
          <p><strong>Customer:</strong> John Doe</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th>Item</th><th>Quantity</th><th>Price</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Widget A</td><td>2</td><td>$10</td><td>$20</td>
              </tr>
              <tr>
                <td>Widget B</td><td>1</td><td>$15</td><td>$15</td>
              </tr>
            </tbody>
          </table>
          <h3 style="text-align: right; margin-top: 16px;">Total: $35</h3>
        </div>
      `;

      const options = {
        html,
        fileName: 'invoice_sample',
        directory: Platform.OS === 'android' ? 'Downloads' : 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);
      Alert.alert('PDF Generated', `Saved at: ${file.filePath}`);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Could not generate PDF.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Generate Invoice PDF" onPress={generatePDF} />
    </View>
  );
};

export default InvoiceGenerator;