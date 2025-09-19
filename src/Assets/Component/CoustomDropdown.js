/* eslint-disable react-native/no-inline-styles */
// import {View, Text} from 'react-native';
import {
  View,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Text,
  Dimensions,
} from 'react-native';
import React from 'react';
import Constants from '../Helpers/constant';

const width = Dimensions.get('screen').width;
const CoustomDropdown = props => {
  console.log(props);
  return (
    <Modal
      transparent={true}
      animationType={'none'}
      visible={props.visible}
      style={{zIndex: 1100}}
      onRequestClose={() => {}}>
      <View style={Styles.modalBackground}>
        <View style={Styles.activityIndicatorWrapper}>
          <View
            style={{
              borderColor: Constants.white,
              borderWidth: 2,
              borderRadius: 10,
              padding: 20,
              width: width * 0.8,
              backgroundColor: Constants.white,
            }}>
            {!!props.title && (
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 20,
                  color: Constants.white,
                  marginBottom: 18,
                  fontFamily: 'Helvetica',
                }}>
                {props.title}
              </Text>
            )}
            {props.data !== undefined &&
              props.data.map((item, index) => (
                <Text
                  key={index}
                  style={{
                    color: Constants.lightblue,
                    fontSize: 16,
                    lineHeight: 25,
                    fontWeight: '700',
                    borderBottomColor: Constants.lightgrey,
                    borderBottomWidth: 1,
                    paddingBottom: 5,
                  }}
                  onPress={() => props.getDropValue(item)}>
                  {item.name}
                </Text>
              ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const Styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    // height:'80%',
    // width:'80%',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
    backgroundColor: '#rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  activityIndicatorWrapper: {
    flex: 1,
    height: 100,
    width: 100,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    marginTop: 210,
    // justifyContent: 'space-around',
  },
});

export default React.memo(CoustomDropdown);
