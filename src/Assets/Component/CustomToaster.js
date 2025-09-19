/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prettier/prettier */
/* eslint-disable react-native/no-inline-styles */
import { View, Text, StyleSheet, Modal } from 'react-native';
import React, { useEffect, useState } from 'react';
import Constants from '../Helpers/constant';

const CustomToaster = props => {
  useEffect(() => {
    if (props.toast) {
      setTimeout(() => {
        props.setToast('');
      }, props.timeout);
    }
  }, [props.toast]);

  return (
    <Modal
      transparent={true}
      animationType={'none'}
      visible={!!props.toast}
      style={{ zIndex: 1100 }}
      onRequestClose={() => { }}>
      <View style={Styles.modalBackground}>
        <View style={Styles.activityIndicatorWrapper}>
          <Text
            style={{
              // backgroundColor: '#1A1A1A',
              backgroundColor: props.backgroundColor,
              padding: 15,
              borderRadius: 10,
              color: props.color,
              // textAlign: 'center',
              position: 'absolute',
              bottom: 100,
              fontFamily: 'Helvetica',
              fontWeight: '500',
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: Constants.white
            }}>
            {props.toast}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const Styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    flexDirection: 'column',
    zIndex: 9999,
    position: 'relative',
  },
  activityIndicatorWrapper: {
    flex: 1,

    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});

export default CustomToaster;
