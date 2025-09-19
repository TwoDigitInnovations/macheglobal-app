/* eslint-disable prettier/prettier */
import Geolocation from 'react-native-geolocation-service';

const CuurentLocation = async getLocation => {
    try {
        return Geolocation.getCurrentPosition(location => {
            getLocation(location);
        });

        // return location;
    } catch (error) {
        const { code, message } = error;
        console.warn(code, message);
    }
};

export default CuurentLocation;
