import React, { useCallback, useRef } from 'react';
import { Animated, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HistoryIcon, ProductsIcon, WorkIcon } from '../../Theme';
import Constants, { FONTS } from '../Assets/Helpers/constant';
import Work from '../screen/vendor/Work';
import Products from '../screen/vendor/Products';
import History from '../screen/vendor/History';
import { useTranslation } from 'react-i18next';



const Tab = createBottomTabNavigator();

export const Vendortab = () => {
  const { t } = useTranslation();
  const TabArr = [
    {
      iconActive: <WorkIcon color={Constants.linearcolor} height={35} width={35} />,
      iconInActive: <WorkIcon color={Constants.tabgrey} height={35} width={35} />,
      component: Work,
      routeName: 'Work',
      name: 'Work Orders',
    },
    {
      iconActive: <ProductsIcon color={Constants.linearcolor} height={35} width={35} />,
      iconInActive: <ProductsIcon color={Constants.tabgrey} height={35} width={35} />,
      component: Products,
      routeName: 'Products',
      name: 'Products',
    },
    {
      iconActive: <HistoryIcon color={Constants.linearcolor} height={35} width={35} />,
      iconInActive: <HistoryIcon color={Constants.tabgrey} height={35} width={35} />,
      component: History,
      routeName: 'History',
      name: 'History',
    },
  ];

  const TabButton = useCallback(
    ({ accessibilityState, onPress, onclick, item, index }) => {
      const isSelected = accessibilityState?.selected;
      return (
        <View style={styles.tabBtnView}>

          <TouchableOpacity
            onPress={onclick ? onclick : onPress}
            style={[
              styles.tabBtn,
              // isSelected ? styles.tabBtnActive : styles.tabBtnInActive,
            ]}>
            {isSelected ? item.iconActive : item.iconInActive}

          </TouchableOpacity>
          <Text style={[styles.tabtxt, { color: isSelected ? Constants.linearcolor : Constants.black }]}>{t(item.name)}</Text>
        </View>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (

    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          width: '100%',
          height: Platform?.OS === 'android' ? 70 : 90,
          backgroundColor: Constants.white,
          borderTopRightRadius: 15,
          borderTopLeftRadius: 15,
          borderTopWidth: 0,
          //   paddingTop: Platform.OS === 'ios' ? 10 : 0,
        },
      }}>
      {TabArr.map((item, index) => {
        return (
          <Tab.Screen
            key={index}
            name={item.routeName}
            component={item.component}

            options={{
              tabBarShowLabel: false,
              tabBarButton: props => (
                <TabButton {...props} item={item} index={index} />
              ),
            }}
          />
        );
      })}
    </Tab.Navigator>

  );

}

const styles = StyleSheet.create({
  tabBtnView: {
    // backgroundColor: isSelected ? 'blue' : '#FFFF',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtn: {
    height: 40,
    width: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: Constants.white,
  },
  tabBtnInActive: {
    backgroundColor: 'white',
  },
  tabtxt: {
    color: Constants.black,
    // fontWeight:'400',
    fontFamily: FONTS.Medium,
  }
});
