import axios from 'axios';

const GOOGLE_API_KEY = 'AIzaSyCre5Sym7PzqWQjHoNz7A3Z335oqtkUa9k';

const GetLatLongFromAddress = async address => {
  try {
    const res = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address,
          key: GOOGLE_API_KEY,
        },
      },
    );

    if (res.data.status === 'OK') {
      const location = res.data.results[0].geometry.location;
      const addressComponents = res.data.results[0].address_components;

      // Debug: Log available address components
      console.log('Available address components:', addressComponents.map(comp => ({
        name: comp.long_name,
        types: comp.types,
      })));

      const state = addressComponents.find(comp =>
        comp.types.includes('administrative_area_level_1'),
      )?.long_name;

      const country = addressComponents.find(comp =>
        comp.types.includes('administrative_area_level_2'),
      )?.long_name;

      const city =
        addressComponents.find(comp => comp.types.includes('locality'))
          ?.long_name ||
        addressComponents.find(comp => comp.types.includes('postal_town'))
          ?.long_name ||
        addressComponents.find(comp =>
          comp.types.includes('administrative_area_level_3'),
        )?.long_name ||
        addressComponents.find(comp =>
          comp.types.includes('administrative_area_level_2'),
        )?.long_name ||
        addressComponents.find(comp =>
          comp.types.includes('sublocality_level_1'),
        )?.long_name ||
        addressComponents.find(comp =>
          comp.types.includes('sublocality'),
        )?.long_name ||
        addressComponents.find(comp =>
          comp.types.includes('neighborhood'),
        )?.long_name;

      console.log('Extracted location data:', {
        latitude: location.lat,
        longitude: location.lng,
        state,
        country,
        city,
      });

      return {
        latitude: location.lat,
        longitude: location.lng,
        state,
        country,
        city,
      };
    } else {
      console.warn('Geocoding failed:', res.data.status);
      return null;
    }
  } catch (err) {
    console.error('Error in GetLatLongFromAddress:', err);
    return null;
  }
};

export default GetLatLongFromAddress;
