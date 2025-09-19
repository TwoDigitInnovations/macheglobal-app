import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { createRef, useContext, useEffect, useRef, useState } from 'react';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import DriverHeader from '../../Assets/Component/DriverHeader';
import CameraGalleryPeacker from '../../Assets/Component/CameraGalleryPeacker';
import { LoadContext, ToastContext, UserContext } from '../../../App';
import { ApiFormData, Delete, GetApi, Post } from '../../Assets/Helpers/Service';
import CoustomDropdown from '../../Assets/Component/CoustomDropdown';
import { useIsFocused } from '@react-navigation/native';
import { CrossIcon, DeleteIcon, EditIcon, UploadIcon } from '../../../Theme';
import moment from 'moment';
// import DatePicker from 'react-native-date-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Dropdown } from 'react-native-element-dropdown';
import { useTranslation } from 'react-i18next';
import LabelWithColon from '../../Assets/Helpers/LabelWithColon';

const Products = () => {
  const { t } = useTranslation();
  const cameraRef = createRef();
  const dropdownRef = useRef();
  const dropdownRef2 = useRef();
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [user, setuser] = useContext(UserContext);
  const [submitted, setSubmitted] = useState(false);
  const [showform, setshowform] = useState(false);
  const [images, setImages] = useState([]);
  const [productlist, setproductlist] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [stockstatus, setstockstatus] = useState('');
  const [showcatdrop, setshowcatdrop] = useState(false);
  const [categorylist, setcategorylist] = useState();
  const [page, setPage] = useState(1);
  const [curentData, setCurrentData] = useState([]);
  const [productid, setproductid] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [userDetail, setUserDetail] = useState({
    name: '',
    category: '',
    categoryName: '',
    // price: '',
    // offer: '',
    // selflife: '',
    origin: '',
    expirydate: new Date(),
    manufacturername: '',
    manufactureradd: '',
    short_description: '',
    long_description: '',
    price_slot: [
      {
        value: 0,
        price: 0,
      },
    ],
    // image: [],
  });
  const unitData = [
    { name: 'Kg', value: 'kg' },
    { name: 'Gms', value: 'gm' },
    { name: 'Litre', value: 'litre' },
    { name: 'Ml', value: 'ml' },
    { name: 'Piece', value: 'piece' },
    { name: 'Pack', value: 'pack' },
  ];

  const weightlist = ['Grams', 'Kilograms', 'Liter', 'Milliliter'];

  //   const getDropValue = res => {
  //     setShowDrop(false);
  //     console.log('===>', res);
  //     setUserDetail({...userDetail, unit: res});
  //   };
  const getcatDropValue = res => {
    setShowDrop(false);
    console.log('===>', res);
    setUserDetail({ ...userDetail, category: res?._id, categoryName: res?.name });
    setshowcatdrop(false);
  };

  const IsFocused = useIsFocused();
  useEffect(() => {
    if (IsFocused) {
      getProducts(1);
      getCategory();
    } else setSubmitted(false), setshowform(false);
  }, [IsFocused]);

  // useEffect(() => {
  //   getOrders();
  // }, []);
  const getProducts = p => {
    setPage(p);
    setLoading(true);
    GetApi(`getProductforseller?page=${p}`, {}).then(
      async res => {
        setLoading(false);
        console.log(res);
        setCurrentData(res.data);
        if (p === 1) {
          setproductlist(res.data);
        } else {
          setproductlist([...productlist, ...res.data]);
        }
        // setproductlist(res?.data);
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  const getCategory = () => {
    setLoading(true);
    GetApi(`getCategory`, {}).then(
      async res => {
        setLoading(false);
        console.log(res);
        setcategorylist(res.data);
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  const getImageValue = async img => {
    // const imagedata = {
    //   name: img.assets[0].fileName,
    //   type: img.assets[0].type,
    //   uri: img.assets[0].uri,
    // };
    // console.log(imagedata);
    // if (images && images.length > 0) {
    //   setImages(prevImages => [...prevImages, imagedata]);
    // } else {
    //   setImages([imagedata]);
    // }
    // if (images && images.length > 0) {
    //   setImages(prevImages => [...prevImages, img.assets[0].uri]);
    // } else {
    //   setImages([img.assets[0].uri]);
    // }
    console.log(images);
    ApiFormData(img.assets[0]).then(
      res => {
        console.log(res);

        if (res.status) {
          if (images && images.length > 0) {
            setImages(prevImages => [...prevImages, res.data.file]);
          } else {
            setImages([res.data.file]);
          }
        }
      },
      err => {
        setEdit(false);
        console.log(err);
      },
    );
  };
  const cancel = () => {
    // setEdit(false);
  };
  const submit = async id => {
    console.log(userDetail);

    if (
      userDetail.name === '' ||
      userDetail.category === '' ||
      // userDetail.price === '' ||
      // userDetail.offer === '' ||
      userDetail.origin === '' ||
      // userDetail.selflife === '' ||
      userDetail.manufacturername === '' ||
      userDetail.manufactureradd === '' ||
      userDetail.short_description === '' ||
      userDetail.long_description === '' ||
      images.length <= 0
    ) {
      setSubmitted(true);
      return;
    }
    if (
      userDetail?.price_slot?.length < 1 ||
      !userDetail?.price_slot[0]?.value ||
      !userDetail?.price_slot[0]?.unit ||
      !userDetail?.price_slot[0]?.our_price ||
      !userDetail?.price_slot[0]?.other_price ||
      userDetail?.price_slot[0]?.value === '' ||
      userDetail?.price_slot[0]?.unit === '' ||
      userDetail?.price_slot[0]?.our_price === '' ||
      userDetail?.price_slot[0]?.other_price === ''
    ) {
      setToast('Please fill all field in slot');
      return;
    }
    userDetail.varients = [{ image: images }];
    userDetail.userid = user._id;
    console.log(images);
    console.log(userDetail);

    let url;
    if (id) {
      url = `updateProduct`;
      userDetail.id = id;
    } else {
      url = `createProduct`;
    }
    console.log(url);
    setLoading(true);
    Post(url, userDetail, {}).then(
      async res => {
        setLoading(false);
        console.log(res);

        if (res.status) {
          setToast(res?.data?.message);

          setUserDetail({
            name: '',
            category: '',
            categoryName: '',
            // price: '',
            // offer: '',
            origin: '',
            unit: '',
            // selflife: '',
            expirydate: new Date(),
            manufacturername: '',
            manufactureradd: '',
            short_description: '',
            long_description: '',
            price_slot: [
              {
                value: 0,
                price: 0,
              },
            ],
            // image: [],
          });

          setImages([]);
          setshowform(false);
          getProducts(1);
        } else {
        }
      },
      err => {
        setLoading(false);
        console.log(err);
        setToast(res?.message);
      },
    );
  };
  const fetchNextPage = () => {
    if (curentData.length === 20) {
      getProducts(page + 1);
      // setPage(page + 1);
    }
  };

  const deleteproduct = id => {
    setLoading(true);
    Delete(`deleteProduct/${id}`).then(async res => {
      setLoading(false);
      console.log(res);
      if (res.status) {
        getProducts(1);
      }
    });
  };
  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item={t('Products')} />
      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        {!showform && (
          <Text
            style={styles.productbtn}
            onPress={() => {
              setshowform(true),
                setImages([]),
                setUserDetail({
                  name: '',
                  category: '',
                  // price: '',
                  // offer: '',
                  origin: '',
                  // selflife: '',
                  expirydate: new Date(),
                  manufacturername: '',
                  manufactureradd: '',
                  short_description: '',
                  long_description: '',
                  price_slot: [
                    {
                      value: 0,
                      price: 0,
                    },
                  ],
                  // image: [],
                });
            }}>
            {t('Add Product')}
          </Text>
        )}
        {showform && (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* <TouchableOpacity
                style={[
                  styles.textInput2,
                  {height: selectcat.length > 0 ? null : 60},
                ]}
                >
                <Text style={styles.input2}>
                  {selectcat && selectcat.length > 0
                    ? selectcat.map(item => `${item.name},`)
                    : 'Select Category'}
                </Text>
                <View style={[styles.mylivejobtitle]}>
                  <Text style={styles.jobtitle}>Select Category</Text>
                </View>
              </TouchableOpacity>
              {submitted && selectcat?.length === 0 && (
                <Text style={styles.require}>Category is required</Text>
              )} */}
            <View
              style={styles.textInput2}
            // onPress={() => setshowcatdrop(true)}
            >
              {/* <TextInput
                  style={styles.input}
                  editable={false}
                  placeholder="Enter Category"
                  placeholderTextColor={Constants.customgrey}
                  value={categorylist.find(
                    (f) => f._id === userDetail?.category
                  )}
                //   onChangeText={category => setUserDetail({...userDetail, category})}
                /> */}
              {/* <Text style={styles.input2}>
                {userDetail?.categoryName
                  ? userDetail?.categoryName
                  : 'Select Category'}
              </Text> */}
              <Dropdown
                ref={dropdownRef}
                data={categorylist}
                labelField="name"
                valueField="_id"
                placeholder={t("Select Category")}
                value={userDetail?.category}
                onChange={item => { }}
                renderItem={(item) => (
                  <TouchableOpacity
                    style={styles.itemContainer}
                    onPress={() => {
                      setUserDetail({ ...userDetail, category: item?._id, categoryName: item?.name });
                      dropdownRef.current?.close();
                    }}
                  >
                    <Text style={styles.itemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                style={styles.dropdown}
                // containerStyle={styles.dropdownContainer}
                placeholderStyle={styles.placeholder}
                selectedTextStyle={styles.selectedText}
              // selectedStyle={styles.selectedStyle}
              // itemTextStyle={styles.itemText}
              // itemContainerStyle={styles.itemContainerStyle}
              />
              <View style={[styles.mylivejobtitle]}>
                <Text style={styles.jobtitle}>{t('Category')}</Text>
              </View>
            </View>
            {submitted && userDetail.category === '' && (
              <Text style={styles.require}>{t('Category is required')}</Text>
            )}
            <View style={styles.textInput}>
              <TextInput
                style={styles.input}
                placeholder={t("Enter Name")}
                placeholderTextColor={Constants.customgrey}
                value={userDetail.name}
                onChangeText={name => setUserDetail({ ...userDetail, name })}
              />
              <View style={[styles.mylivejobtitle]}>
                <Text style={styles.jobtitle}>{t('Name')}</Text>
              </View>
            </View>
            {submitted && userDetail.name === '' && (
              <Text style={styles.require}>{t('Name is required')}</Text>
            )}

            {/* <View style={styles.textInput}>
              <TextInput
                style={styles.input}
                placeholder="Enter Price"
                keyboardType="number-pad"
                placeholderTextColor={Constants.customgrey}
                value={userDetail.price}
                onChangeText={price => setUserDetail({...userDetail, price})}
              />
              <View style={[styles.mylivejobtitle]}>
                <Text style={styles.jobtitle}>Price</Text>
              </View>
            </View>
            {submitted && userDetail.price === '' && (
              <Text style={styles.require}>Price is required</Text>
            )}
            <View style={styles.textInput}>
              <TextInput
                style={styles.input}
                placeholder="Enter Offer price"
                keyboardType="number-pad"
                placeholderTextColor={Constants.customgrey}
                value={userDetail.offer}
                onChangeText={offer => setUserDetail({...userDetail, offer})}
              />
              <View style={[styles.mylivejobtitle]}>
                <Text style={styles.jobtitle}>Offer price</Text>
              </View>
            </View>
            {submitted && userDetail.offer === '' && (
              <Text style={styles.require}>Offer price is required</Text>
            )} */}

            <View style={styles.textInput}>
              <TextInput
                style={styles.input}
                placeholder={t("Enter Short Description")}
                placeholderTextColor={Constants.customgrey}
                value={userDetail.short_description}
                onChangeText={short_description =>
                  setUserDetail({ ...userDetail, short_description })
                }
              />
              <View style={[styles.mylivejobtitle]}>
                <Text style={styles.jobtitle}>{t('Short Description')}</Text>
              </View>
            </View>
            {submitted && userDetail.short_description === '' && (
              <Text style={styles.require}>{t('Short Description is required')}</Text>
            )}
            <View style={styles.textInput}>
              <TextInput
                style={styles.input}
                placeholder={t("Enter Long Description")}
                placeholderTextColor={Constants.customgrey}
                value={userDetail.long_description}
                onChangeText={long_description =>
                  setUserDetail({ ...userDetail, long_description })
                }
              />
              <View style={[styles.mylivejobtitle]}>
                <Text style={styles.jobtitle}>{t('Long Description')}</Text>
              </View>
            </View>
            {submitted && userDetail.long_description === '' && (
              <Text style={styles.require}>{t('Long Description is required')}</Text>
            )}
            {/* <View style={styles.textInput}>
              <TextInput
                style={styles.input}
                placeholder="Enter Self Life"
                placeholderTextColor={Constants.customgrey}
                value={userDetail.selflife}
                onChangeText={selflife =>
                  setUserDetail({...userDetail, selflife})
                }
              />
              <View style={[styles.mylivejobtitle]}>
                <Text style={styles.jobtitle}>Self Life</Text>
              </View>
            </View>
            {submitted && userDetail.selflife === '' && (
              <Text style={styles.require}>Self Life is required</Text>
            )} */}
            <View style={styles.textInput}>
              <TextInput
                style={styles.input}
                placeholder={t("Enter Country of Origin")}
                placeholderTextColor={Constants.customgrey}
                value={userDetail.origin}
                onChangeText={origin => setUserDetail({ ...userDetail, origin })}
              />
              <View style={[styles.mylivejobtitle]}>
                <Text style={styles.jobtitle}>{t('Country of Origin')}</Text>
              </View>
            </View>
            {submitted && userDetail.origin === '' && (
              <Text style={styles.require}>{t('Country of Origin is required')}</Text>
            )}
            <TouchableOpacity
              style={styles.textInput}
              onPress={() => setOpen(true)}>
              <TextInput
                style={styles.input}
                placeholder={t("Enter Expiry Date")}
                placeholderTextColor={Constants.customgrey}
                value={moment(userDetail.expirydate).format('DD/MM/YYYY')}
                editable={false}
              />
              <View style={[styles.mylivejobtitle]}>
                <Text style={styles.jobtitle}>{t('Expiry Date')}</Text>
              </View>
            </TouchableOpacity>
            {submitted && userDetail.expirydate === '' && (
              <Text style={styles.require}>{t('Expiry Date is required')}</Text>
            )}
            {/* <DatePicker
              // style={{zIndex: '50'}}
              modal
              open={open}
              minimumDate={new Date()}
              // maximumDate={maxDate}
              // androidVariant="nativeAndroid"
              date={new Date(userDetail.expirydate)}
              onConfirm={date => {
                setOpen(false);
                setUserDetail({...userDetail, expirydate: date});
              }}
              onCancel={() => {
                setOpen(false);
              }}
            /> */}
            <DateTimePickerModal
              isVisible={open}
              mode="date"
              minimumDate={new Date()}
              // maximumDate={moment().add(3, 'months').toDate()}
              date={new Date(userDetail?.expirydate)}
              onConfirm={date => {
                setOpen(false);
                setUserDetail({ ...userDetail, expirydate: date });
              }}
              onCancel={() => setOpen(false)}
            />
            <View style={styles.textInput}>
              <TextInput
                style={styles.input}
                placeholder={t("Enter Manufacturername")}
                placeholderTextColor={Constants.customgrey}
                value={userDetail.manufacturername}
                onChangeText={manufacturername =>
                  setUserDetail({ ...userDetail, manufacturername })
                }
              />
              <View style={[styles.mylivejobtitle]}>
                <Text style={styles.jobtitle}>{t('Manufacturer Name')}</Text>
              </View>
            </View>
            {submitted && userDetail.manufacturername === '' && (
              <Text style={styles.require}>{t('Manufacturer Name is required')}</Text>
            )}
            <View style={styles.textInput}>
              <TextInput
                style={styles.input}
                placeholder={t("Enter Manufactureradd")}
                placeholderTextColor={Constants.customgrey}
                value={userDetail.manufactureradd}
                onChangeText={manufactureradd =>
                  setUserDetail({ ...userDetail, manufactureradd })
                }
              />
              <View style={[styles.mylivejobtitle]}>
                <Text style={styles.jobtitle}>{t('Manufacturer Add')}</Text>
              </View>
            </View>
            {submitted && userDetail.manufactureradd === '' && (
              <Text style={styles.require}>{t('Manufacturer Add is required')}</Text>
            )}

            <TouchableOpacity
              style={styles.addbtn}
              onPress={() => {
                setUserDetail({
                  ...userDetail,
                  price_slot: [
                    ...userDetail.price_slot,
                    {
                      value: 0,
                      price: 0,
                    },
                  ],
                });
              }}>
              <Text
                style={{
                  fontSize: 16,
                  color: Constants.white,
                  fontFamily: FONTS.Medium,
                }}>
                {t('Add More')}
              </Text>
            </TouchableOpacity>
            {userDetail.price_slot.map((item, i) => (
              <View style={styles.box} key={i}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={styles.jobtitle}>
                    {i + 1} {':-'} {t('Slot')}
                  </Text>
                  <CrossIcon
                    style={styles.cros}
                    onPress={() => {
                      const slotdata = userDetail.price_slot;
                      slotdata.splice(i, 1),
                        setUserDetail({ ...userDetail, price_slot: slotdata });
                      console.log('pressed');
                    }}
                  />
                </View>
                <View style={styles.textInput}>
                  <TextInput
                    style={styles.input}
                    placeholder={t("Enter Qty")}
                    keyboardType="number-pad"
                    placeholderTextColor={Constants.customgrey}
                    value={item.value}
                    onChangeText={value => {
                      item.value = value;
                      setUserDetail({
                        ...userDetail,
                      });
                    }}
                  />
                  <View style={[styles.mylivejobtitle]}>
                    <Text style={styles.jobtitle}>{t('Qty')}</Text>
                  </View>
                </View>
                {/* <View style={styles.textInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Price"
                    placeholderTextColor={Constants.customgrey}
                    value={item.price}
                    onChangeText={price => {
                      item.price = price;
                      setUserDetail({
                        ...userDetail,
                      });
                    }}
                  />
                  <View style={[styles.mylivejobtitle]}>
                    <Text style={styles.jobtitle}>Price</Text>
                  </View>
                </View> */}
                {/* <TouchableOpacity
                  style={styles.textInput}
                  onPress={() => setShowDrop(true)}>
                  <Text style={styles.input2}>
                    {item?.unit ? item?.unit : 'Select Unit'}
                  </Text>
                  <View style={[styles.mylivejobtitle]}>
                    <Text style={styles.jobtitle}>Unit</Text>
                  </View>
                </TouchableOpacity> */}
                <View style={styles.textInput2}>
                  <Dropdown
                    ref={dropdownRef2}
                    data={unitData}
                    labelField="name"
                    valueField="value"
                    placeholder={t("Select Unit")}
                    value={item.unit}
                    onChange={item => {
                    }}
                    renderItem={(item) => (
                      <TouchableOpacity
                        style={styles.itemContainer}
                        onPress={() => {
                          const updatedProducts = [...userDetail.price_slot];
                          updatedProducts[i].unit = item.value;
                          setUserDetail({
                            ...userDetail,
                            price_slot: updatedProducts,
                          });
                          dropdownRef2.current?.close();
                        }}
                      >
                        <Text style={styles.itemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                    style={styles.dropdown}
                    containerStyle={styles.dropdownContainer}
                    placeholderStyle={styles.placeholder}
                    selectedTextStyle={styles.selectedText}
                    itemTextStyle={styles.itemText}
                    itemContainerStyle={styles.itemContainerStyle}
                    selectedItemStyle={styles.selectedStyle}
                  />
                  <View style={[styles.mylivejobtitle]}>
                    <Text style={styles.jobtitle}>{t('Unit')}</Text>
                  </View>
                </View>

                {/* <CoustomDropdown
                  visible={showDrop}
                  setVisible={setShowDrop}
                  onClose={() => {
                    setShowDrop(!showDrop);
                  }}
                  getDropValue={(res) => {
                    setShowDrop(false);
                    console.log('===>', res);
                    item.unit = res.value;
                    setUserDetail({...userDetail});
                    // setselectedunit(res?.name)
                  }}
                  data={unitData}
                /> */}
                <View style={styles.textInput}>
                  <TextInput
                    style={styles.input}
                    placeholder={t("Enter Discounted Price")}
                    keyboardType="number-pad"
                    placeholderTextColor={Constants.customgrey}
                    value={item.our_price}
                    onChangeText={our_price => {
                      item.our_price = our_price;
                      setUserDetail({
                        ...userDetail,
                      });
                    }}
                  />
                  <View style={[styles.mylivejobtitle]}>
                    <Text style={styles.jobtitle}>{t('Offer Price')}</Text>
                  </View>
                </View>
                <View style={styles.textInput}>
                  <TextInput
                    style={styles.input}
                    placeholder={t("Enter Price")}
                    keyboardType="number-pad"
                    placeholderTextColor={Constants.customgrey}
                    value={item.other_price}
                    onChangeText={other_price => {
                      item.other_price = other_price;
                      setUserDetail({
                        ...userDetail,
                      });
                    }}
                  />
                  <View style={[styles.mylivejobtitle]}>
                    <Text style={styles.jobtitle}>{t('Price')}</Text>
                  </View>
                </View>
              </View>
            ))}
            <View style={{ flexDirection: 'row', height: 150, marginTop: 20 }}>
              <TouchableOpacity
                style={styles.uploadbox}
                onPress={() => cameraRef.current.show()}>
                {/* <Image
                    source={require('../../Assets/Images/upload.png')}
                    style={styles.imgstyle}
                  /> */}
                <UploadIcon
                  color={Constants.saffron}
                  height={'100%'}
                  width={'100%'}
                />
                <Text style={styles.uploadtxt}>{t('Upload Product Images')}</Text>
              </TouchableOpacity>
              {/* <View style={styles.uploadimgbox}>
              <Image
                source={require('../../Assets/Images/loginlogo.png')}
                style={styles.imgstyle2}
              />
            </View> */}
            </View>
            <ScrollView
              style={{ flexDirection: 'row', gap: 20, marginTop: 30 }}
              horizontal={true}
              showsHorizontalScrollIndicator={false}>
              {images &&
                images.length > 0 &&
                images.map((item, i) => (
                  <Image
                    source={{
                      uri: `${item.uri ? item.uri : item}`,
                    }}
                    style={{
                      height: 50,
                      width: 50,
                      marginVertical: 5,
                      marginHorizontal: 10,
                      resizeMode: 'contain',
                    }}
                    key={i}
                  />
                ))}
            </ScrollView>
            {submitted && images.length <= 0 && (
              <Text style={styles.require}>{t('Image is required')}</Text>
            )}
            <View style={styles.btncov}>
              <TouchableOpacity
                style={styles.signInbtn}
                onPress={() => {
                  setshowform(false),
                    setImages([]),
                    setUserDetail({
                      name: '',
                      category: '',
                      // price: '',
                      // offer: '',
                      origin: '',
                      // selflife: '',
                      expirydate: new Date(),
                      manufacturername: '',
                      manufactureradd: '',
                      short_description: '',
                      long_description: '',
                      price_slot: [
                        {
                          value: 0,
                          price: 0,
                        },
                      ],
                      // image: [],
                    });
                }}>
                <Text style={styles.buttontxt}>{t('Close')}</Text>
              </TouchableOpacity>
              {userDetail._id ? (
                <TouchableOpacity
                  style={styles.signInbtn}
                  onPress={() => submit(productid)}>
                  <Text style={styles.buttontxt}>{t('Update')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.signInbtn}
                  onPress={() => submit()}>
                  <Text style={styles.buttontxt}>{t('Submit')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {!showform && (
        <View style={{ flex: 1, marginBottom: 70 }}>
          <FlatList
            data={productlist}
            style={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
            // ListHeaderComponent={() => (

            // )}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.box2}>
                <View style={{ flexDirection: 'row' }}>
                  <Image
                    // source={require('../../Assets/Images/salt.png')}
                    source={{
                      uri: `${item?.varients[0].image[0]}`,
                    }}
                    style={styles.hi2}
                    resizeMode="contain"
                  />
                  <View style={{ width: '80%' }}>
                    <Text style={styles.name}>{item.name}</Text>
                  </View>
                </View>
                <View style={{}}>
                  <View style={[styles.secendpart, { marginVertical: 20 }]}>

                    <LabelWithColon labelKey="Category Name" textStyle={styles.secendboldtxt} />
                    <Text style={styles.secendtxt}>{item.categoryName}</Text>
                  </View>
                </View>
                <View style={styles.txtcol}>
                  {item?.price_slot && item?.price_slot?.length > 0 && (
                    <Text style={styles.amount}>
                      {Currency}
                      {item?.price_slot[0]?.our_price}
                    </Text>
                  )}
                  <View style={{ gap: 20, flexDirection: 'row' }}>
                    <EditIcon
                      color={Constants.black}
                      onPress={() => {
                        setshowform(true), console.log(item);
                        setImages(item.varients[0].image || []),
                          setproductid(item._id),
                          setUserDetail({
                            name: item?.name || '',
                            category: item?.category || '',
                            categoryName: item?.categoryName || '',
                            price: item?.price?.toString() || '',
                            offer: item?.offer?.toString() || '',
                            origin: item?.origin || '',
                            // unit: item?.unit || '',
                            // selflife: item?.selflife || '',
                            expirydate: item?.expirydate || new Date(),
                            manufacturername: item?.manufacturername || '',
                            manufactureradd: item?.manufactureradd || '',
                            short_description: item?.short_description || '',
                            long_description: item?.long_description || '',
                            price_slot: item?.price_slot,
                            // image: item.varients[0].image || [],
                            _id: item?._id,
                          });
                      }}
                    />
                    <DeleteIcon
                      color={Constants.red}
                      onPress={() => {
                        setModalVisible(true), setproductid(item._id);
                      }}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: Dimensions.get('window').height - 200,
                }}>
                <Text
                  style={{
                    color: Constants.black,
                    fontSize: 20,
                    fontFamily: FONTS.Bold,
                  }}>
                  {t('No Products Available')}
                </Text>
              </View>
            )}
            onEndReached={() => {
              if (productlist && productlist.length > 0) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.05}
          />
        </View>
      )}
      <CameraGalleryPeacker
        refs={cameraRef}
        getImageValue={getImageValue}
        base64={false}
        cancel={cancel}
      />

      {/* <CoustomDropdown
        visible={showcatdrop}
        setVisible={setshowcatdrop}
        onClose={() => {
          setshowcatdrop(!showcatdrop);
        }}
        getDropValue={getcatDropValue}
        data={categorylist}
      /> */}

      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          // Alert.alert('Modal has been closed.');
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.alrt}>{t('Alert !')}</Text>
            <View
              style={{
                backgroundColor: 'white',
                alignItems: 'center',
                paddingHorizontal: 30,
              }}>
              <Text style={styles.textStyle}>
                {t('Are you sure you want to Delete this product !')}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setModalVisible(!modalVisible)}
                  style={styles.cancelButtonStyle}>
                  <Text style={[styles.modalText, { color: Constants.saffron }]}>
                    {t('No')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => {
                    deleteproduct(productid), setModalVisible(false);
                  }}>
                  <Text style={styles.modalText}>{t('Yes')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Products;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
  },
  textInput: {
    borderColor: Constants.customgrey,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    // width: 370,
    height: 60,
    marginTop: 40,
    flexDirection: 'row',
    flex: 1,
  },
  textInput2: {
    borderColor: Constants.customgrey,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    // width: 370,
    // minHeight: 60,
    marginTop: 40,
    // flexDirection: 'row',
    flex: 1,
  },
  input: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FONTS.Medium,
    color: Constants.black,
    flex: 1,
    textAlign: 'left'
  },
  input2: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FONTS.Medium,
    color: Constants.black,
    flex: 1,
    alignSelf: 'center',
    paddingVertical: 5,
    //   backgroundColor:'red'
  },
  add: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FONTS.Medium,
    color: Constants.black,
    alignSelf: 'center',
    flex: 1,
    // backgroundColor:Constants.red
  },
  mylivejobtitle: {
    position: 'absolute',
    backgroundColor: Constants.white,
    paddingHorizontal: 5,
    top: -10,
    left: 30,
  },
  jobtitle: {
    color: Constants.black,
    fontSize: 13,
    fontFamily: FONTS.Bold,
    textAlign: 'center',
  },
  require: {
    color: Constants.red,
    fontFamily: FONTS.Medium,
    marginLeft: 10,
    fontSize: 14,
    marginTop: 10,
  },
  imgstyle: {
    height: '80%',
    width: '80%',
    // flex:1,
    resizeMode: 'contain',
  },
  imgstyle2: {
    height: '100%',
    width: '100%',
    // flex:1,
    resizeMode: 'contain',
  },
  uploadbox: {
    flex: 1,
    alignItems: 'center',
    // backgroundColor:Constants.red
  },
  uploadimgbox: {
    flex: 1,
    alignItems: 'center',
    // backgroundColor:Constants.red
  },
  uploadtxt: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS.Bold,
    textAlign: 'center',
  },
  signInbtn: {
    height: 60,
    // width: 370,
    borderRadius: 10,
    backgroundColor: Constants.saffron,
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 120,
    flex: 1,
    marginHorizontal: 10,
  },
  buttontxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
  box2: {
    backgroundColor: '#E9FFF5',
    marginVertical: 10,
    padding: 20,
  },
  hi2: {
    marginRight: 10,
    height: 50,
    width: 50,
    // borderRadius: 50,
  },
  name: {
    color: Constants.black,
    fontFamily: FONTS.Bold,
    fontSize: 16,
  },
  secendpart: {
    flexDirection: 'row',
    flex: 1,
    // justifyContent: 'space-between',
    marginLeft: 10,
    marginVertical: 5,
  },
  secendboldtxt: {
    color: Constants.black,
    fontSize: 15,
    fontFamily: FONTS.Regular,
    alignSelf: 'center',
  },
  secendtxt: {
    color: Constants.black,
    fontSize: 15,
    textAlign: 'left',
    fontFamily: FONTS.Bold,
    flex: 1,
  },
  txtcol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // flex: 1,
  },
  amount: {
    color: Constants.saffron,
    fontSize: 24,
    fontFamily: FONTS.Bold,
    alignSelf: 'flex-end',
  },
  productbtn: {
    backgroundColor: Constants.saffron,
    color: Constants.white,
    fontFamily: FONTS.Bold,
    fontSize: 20,
    borderRadius: 10,
    width: 150,
    paddingVertical: 10,
    textAlign: 'center',
    marginTop: 10,
    // marginRight:10,
    alignSelf: 'flex-end',
    // marginBottom: -10,
  },
  btncov: {
    flexDirection: 'row',
  },
  ////model end ///
  ///delete model ////
  modalText: {
    color: Constants.white,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 14,
  },
  cancelAndLogoutButtonWrapStyle2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 3,
  },
  cancelButtonStyle: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginRight: 10,
    borderColor: Constants.saffron,
    borderWidth: 1,
    borderRadius: 10,
  },
  logOutButtonStyle: {
    flex: 0.5,
    backgroundColor: Constants.red,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  //////Model////////
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: 22,
    backgroundColor: '#rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    width: '90%',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 4,
    // elevation: 5,
    // position: 'relative',
  },

  textStyle: {
    color: Constants.black,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Medium,
    fontSize: 16,
    margin: 20,
    marginBottom: 10,
  },
  cancelAndLogoutButtonWrapStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 3,
  },
  alrt: {
    color: Constants.black,
    fontSize: 18,
    fontFamily: FONTS.Bold,
    // backgroundColor: 'red',
    width: '100%',
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: Constants.customgrey2,
    paddingBottom: 20,
  },
  box: {
    borderWidth: 1,
    borderColor: Constants.saffron,
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderRadius: 10,
    marginVertical: 20,
  },
  addbtn: {
    borderRadius: 10,
    backgroundColor: Constants.saffron,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 20,
  },
  dropdown: {
    // marginVertical: 10,
    // borderWidth: 1,
    // borderRadius: 5,
    // paddingHorizontal: 10,
    // backgroundColor:'red',
    height: 60,
  },
  dropdownContainer: {
    borderRadius: 8,
    backgroundColor: Constants.saffron,
  },
  placeholder: {
    color: Constants.customgrey,
    fontSize: 14,
    fontFamily: FONTS.Medium,
    paddingVertical: 12
  },
  selectedText: {
    color: Constants.black,
    fontSize: 14,
    fontFamily: FONTS.Medium,
    paddingVertical: 12,
  },
  selectedStyle: {
    backgroundColor: Constants.saffron
  },
  itemText: {
    fontSize: 14,
    color: Constants.white,
    fontFamily: FONTS.Medium,
    // lineHeight: 15,
    // backgroundColor:'red'
  },
  itemContainerStyle: {
    borderBottomWidth: 1,
    borderColor: Constants.customgrey,
    backgroundColor: Constants.saffron
  },
  itemContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    // width: '100%',
    backgroundColor: Constants.saffron
  },
});
