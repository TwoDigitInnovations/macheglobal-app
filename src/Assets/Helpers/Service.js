import axios from 'axios';
import Constants from './constant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConnectionCheck from './ConnectionCheck';
import RNFetchBlob from 'react-native-blob-util';
import { reset } from '../../../navigationRef';
import { Platform } from 'react-native';
// import RNFetchBlob from 'rn-fetch-blob';

const GetApi = async (url, props, data) => {
  return new Promise(function (resolve, reject) {
    ConnectionCheck.isConnected().then(
      async connected => {
        console.log(connected);
        if (connected) {
          const user = await AsyncStorage.getItem('userDetail');
          let userDetail = JSON.parse(user);
          console.log(Constants.baseUrl + url);
          console.log(`jwt ${userDetail?.token}`);
          axios
            .get(Constants.baseUrl + url, {
              headers: {
                Authorization: `jwt ${userDetail?.token}`,
              },
              params: {
                id: data
              }
            })
            .then(res => {
              // console.log(res.data);
              resolve(res.data);
            })
            .catch(async err => {
              if (err.response) {
                console.log(err.response.status);
                if (err?.response?.status === 401) {
                  await AsyncStorage.removeItem('userDetail');
                  reset('Auth')
                  reject(err.response);
                }
                resolve(err.response.data);
              } else {
                reject(err);
              }
            });
        } else {
          reject('No internet connection');
        }
      },
      err => {
        reject(err);
      },
    );
  });
};
const GetApi2 = async (url, props, data) => {
  return new Promise(function (resolve, reject) {
    ConnectionCheck.isConnected().then(
      async connected => {
        console.log(connected);
        if (connected) {
          const user = await AsyncStorage.getItem('userDetail');
          let userDetail = JSON.parse(user);
          console.log(Constants.baseUrl + url);
          console.log(`jwt ${userDetail?.token}`);

          axios
            .get(Constants.baseUrl + url, {
              headers: {
                Authorization: `jwt ${userDetail?.token}`,
              },
              params: {
                keyword: data
              }
            })
            .then(res => {
              // console.log(res.data);
              resolve(res.data);
            })
            .catch(async err => {
              if (err.response) {
                console.log(err.response.status);
                if (err?.response?.status === 401) {
                  await AsyncStorage.removeItem('userDetail');
                  reset('Auth')
                  reject(err.response);
                }
                resolve(err.response.data);
              } else {
                reject(err);
              }
            });
        } else {
          reject('No internet connection');
        }
      },
      err => {
        reject(err);
      },
    );
  });
};

const Post = async (url, data, props = {}) => {
  return new Promise(function (resolve, reject) {
    ConnectionCheck.isConnected().then(
      async connected => {
        console.log(connected);
        if (connected) {
          const user = await AsyncStorage.getItem('userDetail');
          let userDetail = user ? JSON.parse(user) : {};
          console.log('url===>', Constants.baseUrl + url);
          console.log('token===>', `jwt ${userDetail?.token}`);
          console.log('data=====>', data);

          // Prepare headers
          const headers = {
            'Content-Type': 'application/json',
            ...(userDetail?.token && { Authorization: `jwt ${userDetail.token}` }),
            ...(props.headers || {})
          };

          // If it's FormData, let the browser set the Content-Type with boundary
          if (data instanceof FormData) {
            delete headers['Content-Type'];
          }

          axios
            .post(Constants.baseUrl + url, data, { headers })
            .then(res => {
              // console.log(res.data);
              resolve(res.data);
            })
            .catch(async err => {
              if (err.response) {
                console.log(err.response.status);
                if (err?.response?.status === 401) {
                  await AsyncStorage.removeItem('userDetail');
                  reset('Auth')
                }
                resolve(err.response.data);
              } else {
                reject(err);
              }
            });
        } else {
          reject('No internet connection');
        }
      },
      err => {
        reject(err);
      },
    );
  });
};

const Put = async (url, data, props) => {
  return new Promise(function (resolve, reject) {
    ConnectionCheck.isConnected().then(
      async connected => {
        console.log(connected);
        if (connected) {
          const user = await AsyncStorage.getItem('userDetail');
          let userDetail = JSON.parse(user);
          console.log(Constants.baseUrl + url);
          console.log(`jwt ${userDetail?.token}`);
          axios
            .put(Constants.baseUrl + url, data, {
              headers: {
                Authorization: `jwt ${userDetail?.token}`,
              },
            })
            .then(res => {
              console.log(res.data);
              resolve(res.data);
            })
            .catch(async err => {
              if (err.response) {
                if (err?.response?.status === 401) {
                  await AsyncStorage.removeItem('userDetail');
                  reset('Auth')
                }
                resolve(err.response.data);
              } else {
                reject(err);
              }
            });
        } else {
          reject('No internet connection');
        }
      },
      err => {
        reject(err);
      },
    );
  });
};
const Patch = async (url, data, props) => {
  return new Promise(function (resolve, reject) {
    ConnectionCheck.isConnected().then(
      async connected => {
        console.log(connected);
        if (connected) {
          const user = await AsyncStorage.getItem('userDetail');
          let userDetail = JSON.parse(user);
          console.log(Constants.baseUrl + url);
          console.log(`jwt ${userDetail?.token}`);
          axios
            .patch(Constants.baseUrl + url, data, {
              headers: {
                Authorization: `jwt ${userDetail?.token}`,
              },
            })
            .then(res => {
              console.log(res.data);
              resolve(res.data);
            })
            .catch(async err => {
              if (err.response) {
                if (err?.response?.status === 401) {
                  await AsyncStorage.removeItem('userDetail');
                  reset('Auth')
                }
                resolve(err.response.data);
              } else {
                reject(err);
              }
            });
        } else {
          reject('No internet connection');
        }
      },
      err => {
        reject(err);
      },
    );
  });
};

const Delete = async (url, data, props) => {
  return new Promise(function (resolve, reject) {
    ConnectionCheck.isConnected().then(
      async connected => {
        console.log(connected);
        if (connected) {
          const user = await AsyncStorage.getItem('userDetail');
          let userDetail = JSON.parse(user);
          console.log(Constants.baseUrl + url);
          console.log(`jwt ${userDetail?.token}`);
          axios
            .delete(Constants.baseUrl + url, {
              headers: {
                Authorization: `jwt ${userDetail?.token}`,
              },
            })
            .then(res => {
              console.log(res.data);
              resolve(res.data);
            })
            .catch(async err => {
              if (err.response) {
                if (err?.response?.status === 401) {
                  await AsyncStorage.removeItem('userDetail');
                  reset('Auth')
                }
                resolve(err.response.data);
              } else {
                reject(err);
              }
            });
        } else {
          reject('No internet connection');
        }
      },
      err => {
        reject(err);
      },
    );
  });
};


const ApiFormData = async (img) => {
  console.log('Starting file upload:', img);
  const user = await AsyncStorage.getItem('userDetail');
  let userDetail = JSON.parse(user);

  return new Promise((resolve, reject) => {
    try {
      // Validate input
      if (!img || !img.uri) {
        reject(new Error('Invalid image data provided'));
        return;
      }

      // Check if file exists and is accessible
      const fileUri = Platform.OS === 'android' ? img.uri : img.uri.replace('file:///', '');
      console.log('File URI to upload:', fileUri);

      const uploadPromise = RNFetchBlob.fetch(
        'POST',
        `${Constants.baseUrl}user/fileupload`,
        {
          'Content-Type': 'multipart/form-data',
          // Authorization: `jwt ${userDetail.token}`,
        },
        [
          {
            name: 'file',
            filename: img.fileName || 'image.jpg',
            type: img.type || 'image/jpeg',
            data: RNFetchBlob.wrap(fileUri),
          },
        ],
      );

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, timeoutReject) => {
        setTimeout(() => {
          timeoutReject(new Error('Upload timeout after 30 seconds'));
        }, 30000); // 30 second timeout
      });

      Promise.race([uploadPromise, timeoutPromise])
        .then(resp => {
          console.log('Upload response received:', resp.data);
          try {
            const responseData = JSON.parse(resp.data);
            resolve(responseData);
          } catch (parseError) {
            console.log('Failed to parse response:', parseError);
            reject(new Error('Invalid server response'));
          }
        })
        .catch(err => {
          console.log('Upload error:', err);

          // Handle specific error types
          if (err.message && err.message.includes('timeout')) {
            reject(new Error('Upload timeout. Please try again.'));
          } else if (err.message && err.message.includes('end of stream')) {
            reject(new Error('Network connection interrupted. Please check your internet connection.'));
          } else if (err.message && err.message.includes('ENOENT')) {
            reject(new Error('File not found. Please try taking the photo again.'));
          } else {
            reject(err);
          }
        });
    } catch (err) {
      console.log('Error in ApiFormData:', err);
      reject(err);
    }
  });
};
// const ApiFormData = async (url, data) => {
//   // console.log(img);
//   const user = await AsyncStorage.getItem('userDetail');
//   let userDetail = JSON.parse(user);
//   return new Promise((resolve, reject) => {
//     try {
//       RNFetchBlob.fetch(
//         'POST',
//         `${Constants.baseUrl}${url}`,
//         {
//           'Content-Type': 'multipart/form-data',
//           Authorization: `jwt ${userDetail.token}`,
//         },
//         data,

//       )
//         .then(resp => {
//           // console.log('res============>', resp);
//           resolve(JSON.parse(resp.data));
//         })
//         .catch(err => {
//           console.log(err);
//           reject(err);
//         });
//     } catch (err) {
//       console.log(err);
//       reject(err);
//     }
//   });
// };
// function getDefaultOffDays(year){ 
//   let offdays=new Array();
//  let i=0;
//   for(month=0;month<12;month++) { 
//      let tdays=new Date(year, month, 0).getDate(); 
//       for(date=1;date<=tdays;date++)     {
//           smonth=(month<9)?"0"+(month+1):(month+1);
//           sdate=(date<10)?"0"+date:date;
//           dd=year+"-"+smonth+"-"+sdate;
//           var day=new Date(year,month,date);
//           if(day.getDay() == 0 )              {
//               offdays[i++]=dd;
//           }
//         }
//       }
//       return offdays; 
//     }

// const Api = async (method, url, data) => {
//   return new Promise(function (resolve, reject) {
//     ConnectionCheck.isConnected().then(async connected => {
//       console.log(connected);
//       if (connected) {
//         const user = await AsyncStorage.getItem('userDetail');
//         let userDetail = JSON.parse(user);
//         axios({
//           method,
//           url: Constants.baseUrl + url,
//           data,
//           headers: {Authorization: `jwt ${userDetail?.token}`},
//         }).then(
//           res => {
//             resolve(res);
//           },
//           err => {
//             if (err.response) {
//               resolve(err.response.data);
//             } else {
//               resolve(err);
//             }
//           },
//         );
//       } else {
//         reject('No internet connection');
//       }
//     });
//   });
// };

// const Services = async (url, method, props, data) => {
//   return new Promise(function (resolve, reject) {
//     ConnectionCheck.isConnected().then(async connected => {
//       console.log(connected);
//       if (connected) {
//         const user = await AsyncStorage.getItem('userDetail');
//         let userDetail = JSON.parse(user);
//         console.log(Constants.baseUrl + url);
//         console.log(`jwt ${userDetail?.token}`);
//         axios[method](Constants.baseUrl + url, data, {
//           headers: {
//             Authorization: `jwt ${userDetail?.token}`,
//           },
//         })
//           .then(res => {
//             console.log(res.data);
//             resolve(res.data);
//           })
//           .catch(err => {
//             if (err.response) {
//               console.log(err.response.status);
//               if (err?.response?.status === 401) {
//                 props.setInitial('Signin');
//                 props?.navigation?.navigate('Signin');
//               }
//               resolve(err.response.data);
//             } else {
//               reject(err);
//             }
//           });
//       } else {
//         reject('No internet connection');

// Order related API functions
export const createOrder = (orderData) => Post('orders', orderData);

export const getOrderDetails = (orderId) => GetApi(`orders/${orderId}`);

export const getMyOrders = () => GetApi('orders/myorders');

export const updateOrderToPaid = (orderId, paymentResult) => Put(`orders/${orderId}/pay`, paymentResult);

export { GetApi, GetApi2, Post, Put, Patch, Delete, ApiFormData };
