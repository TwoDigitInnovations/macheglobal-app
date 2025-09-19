import React from 'react'
import { View, Modal,ActivityIndicator ,StyleSheet} from 'react-native'

const Spinner = (spinnerProp) => {
    return (
        <Modal
            transparent={true}
            animationType={'none'}
            visible={spinnerProp.visible}
            style={{ zIndex: 1100 }}
            onRequestClose={() => { }}>
            <View style={Styles.modalBackground}>
                <View style={Styles.activityIndicatorWrapper}>
                    <ActivityIndicator color={spinnerProp.color} size="large" />
                </View>
            </View>
        </Modal>
    )
}

const Styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        // height:'80%',
        // width:'80%',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'space-around',
        backgroundColor: '#rgba(0, 0, 0, 0.5)',
        zIndex: 9999
    },
    activityIndicatorWrapper: {
        flex: 1,
        height: 100,
        width: 100,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around'
    }
})


export default Spinner

