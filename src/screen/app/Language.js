import { View, Text, TouchableOpacity } from 'react-native';
import React, { useRef, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ActionSheet from 'react-native-actions-sheet';
import { useTranslation } from 'react-i18next';

import { Downarrow, RadioonIcon, RadiooffIcon, CrossIcon } from '../../../Theme';
import Constants from '../../Assets/Helpers/constant';

export default function Language() {
  const [selectLanguage, setSelectLanguage] = useState('English');
  const { t, i18n } = useTranslation();
  const langRef = useRef();

  useEffect(() => {
    checkLng();
  }, []);

  const checkLng = async () => {
    const x = await AsyncStorage.getItem('LANG');
    if (x === 'vi') setSelectLanguage('Vietnames');
    else setSelectLanguage('English');
  };

  const changeLanguage = async (code, label) => {
    await AsyncStorage.setItem('LANG', code);
    i18n.changeLanguage(code);
    setSelectLanguage(label);
    langRef.current?.hide();
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', marginTop: 40}}>
      <TouchableOpacity
        style={styles.langView}
        onPress={() => langRef.current?.show()}
        testID="language-button"
        accessibilityLabel="language-button"
        activeOpacity={0.8}
      >
        <Text style={styles.lang}>{selectLanguage}</Text>
        <Downarrow height={15} width={15} color={Constants.black} />
      </TouchableOpacity>

      <ActionSheet ref={langRef} containerStyle={{ backgroundColor: Constants.white }}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <Text style={styles.heading}>Select Language</Text>
            <TouchableOpacity onPress={() => langRef.current?.hide()}>
              <CrossIcon height={14} width={14} color={Constants.black} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.item,
              { borderColor: selectLanguage === 'English' ? Constants.saffron : Constants.black },
            ]}
            onPress={() => changeLanguage('en', 'English')}
          >
            {selectLanguage === 'English' ? (
              <RadioonIcon color={Constants.saffron} height={24} width={24} />
            ) : (
              <RadiooffIcon color={Constants.black} height={24} width={24} />
            )}
            <Text style={styles.itemText}>English</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.item,
              { borderColor: selectLanguage === 'Vietnames' ? Constants.saffron : Constants.black },
            ]}
            onPress={() => changeLanguage('vi', 'Vietnames')}
          >
            {selectLanguage === 'Vietnames' ? (
              <RadioonIcon color={Constants.saffron} height={24} width={24} />
            ) : (
              <RadiooffIcon color={Constants.black} height={24} width={24} />
            )}
            <Text style={styles.itemText}>Vietnamese</Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>
    </View>
  );
}

const styles = {
  langView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
    padding: 10,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: Constants.black,
    borderRadius: 8,
  },
  lang: {
    fontSize: 16,
    color: Constants.black,
  },
  sheetContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Constants.black,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
    marginLeft: 12,
    color: Constants.black,
  },
};
