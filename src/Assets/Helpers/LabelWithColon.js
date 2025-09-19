import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

const LabelWithColon = ({ labelKey, textStyle }) => {
  const { t } = useTranslation();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={textStyle}>{t(labelKey)}</Text>
      <Text style={textStyle}> : </Text>
    </View>
  );
};

export default LabelWithColon;
