import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  CheckBox,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

export const ProductForm = ({ props }) => {
  return (
    <Text>Hi</Text>
  );
}
// export const ProductForm = () => {
//   const router = useRouter();
//   console.log(router);
//   console.log(router?.query?.id);

//   const f = useRef(null);

//   const unitData = [
//     { name: "Lb", value: "lb" },
//     { name: "Litre", value: "litre" },
//     { name: "Each", value: "each" },
//     { name: "Piece", value: "piece" },
//     { name: "Pack", value: "pack" },
//   ];

//   const [addProductsData, setAddProductsData] = useState({
//     name: "",
//     category: [],
//     disclaimer: "",
//     origin: "",
//     ReturnPolicy: "",
//     Warning: "",
//     Quantity: "",
//     Allergens: "",
//     unit: "",
//     other_price: "",
//     our_price: "",
//     selflife: "",
//     expirydate: "",
//     manufacturername: "",
//     manufactureradd: "",
//     short_description: "",
//     tax: "",
//     long_description: "",
//     price_slot: [
//       {
//         value: 0,
//         price: 0,
//       },
//     ],
//     isShipmentAvailable: "",
//     isNextDayDeliveryAvailable: "",
//     isInStoreAvailable: "",
//     isReturnAvailable: "",
//     isCurbSidePickupAvailable: "",
//   });

//   const [categoryData, setCategoryData] = useState([]);
//   const [user, setUser] = useContext(userContext);

//   const [varients, setvarients] = useState([
//     {
//       color: "",
//       image: [],
//       BarCode: "",
//       selected: [],
//     },
//   ]);

//   const [openPopup, setOpenPopup] = useState(false);
//   const [color, setColor] = useColor("#000000");
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [singleImg, setSingleImg] = useState("");
//   const [isFocused, setIsFocused] = useState(false);

//   const handleClose = () => {
//     setOpenPopup(false);
//   };

//   useEffect(() => {
//     getCategory();
//   }, []);

//   useEffect(() => {
//     if (router?.query?.id) {
//       getProductById();
//     }
//   }, []);

//   const formatDate = (date) => {
//     if (!date) return "";
//     const d = new Date(date);
//     return d.toISOString().split("T")[0]; // Format as YYYY-MM-DD
//   };

//   const getProductById = async (id) => {
//     props.loader(true);
//     Api("get", `getProductById/${router?.query?.id}`, "", router).then(
//       (res) => {
//         props.loader(false);
//         console.log("res================>", res);
//         if (res?.status) {
//           setAddProductsData({
//             name: res?.data?.name,
//             disclaimer: res?.data?.disclaimer,
//             category: res?.data?.category?._id || "",
//             Warning: res?.data?.Warning,
//             categoryName: res?.data?.category?.name || "",
//             ReturnPolicy: res?.data?.ReturnPolicy,
//             short_description: res?.data?.short_description,
//             long_description: res?.data?.long_description,
//             Allergens: res?.data?.Allergens,
//             Quantity: res?.data?.Quantity,
//             price_slot: res?.data?.price_slot,
//             ...res.data,
//             attributes: res?.data?.attributes,
//             tax: res?.data?.tax,
//             manufactureradd: res?.data?.manufactureradd,
//             manufacturername: res?.data?.manufacturername,
//             expirydate: formatDate(res?.data?.expirydate),
//             other_price: res?.data?.other_price,
//             our_price: res?.data?.our_price,
//             unit: res?.data?.price_slot[0]?.unit,
//             isShipmentAvailable: res?.data?.isShipmentAvailable,
//             isReturnAvailable: res?.data?.isReturnAvailable,
//             isNextDayDeliveryAvailable: res?.data?.isNextDayDeliveryAvailable,
//             isInStoreAvailable: res?.data?.isInStoreAvailable,
//             isCurbSidePickupAvailable: res?.data?.isCurbSidePickupAvailable,
//           });
//           setvarients(res?.data?.varients);
//           setBarcodeValue(res?.data?.BarCode)
//           setInputValue(res?.data?.BarCode)
          
//         }
//       },
//       (err) => {
//         props.loader(false);
//         console.log(err);
//         props.toaster({ type: "error", message: err?.message });
//       }
//     );
//   };

//   console.log("Add Products Data ::", addProductsData);

//   const getCategory = async () => {
//     props.loader(true);
//     Api("get", "getCategory", "", router).then(
//       (res) => {
//         props.loader(false);
//         console.log("res================>", res);
//         res.data.forEach((element, i) => {
//           element.value = element._id;
//           element.label = element.name;

//           if (res.data.length === i + 1) {
//             setCategoryData(res?.data);
//             console.log("categorydata ::", res?.data);
//           }
//         });
//       },
//       (err) => {
//         props.loader(false);
//         console.log(err);
//         props.toaster({ type: "error", message: err?.message });
//       }
//     );
//   };

//   const createProduct = async (e) => {
//     e.preventDefault();

//     const data = {
//       ...addProductsData,
//       userid: user?._id,
//       BarCode: inputValue,
//       varients,
//     };
//     console.log("data", data);
//     console.log("addProductsdata", addProductsData);

//     props.loader(true);
//     Api("post", "createProduct", data, router).then(
//       (res) => {
//         props.loader(false);
//         console.log("res================> careate Product :: ", res);
//         if (res.status) {
//           setAddProductsData({
//             name: "",
//             category: [],
//             unit: "",
//             our_price: "",
//             other_price: "",
//             tax: "",
//             origin: "",
//             selflife: "",
//             expirydate: "",
//             manufacturername: "",
//             manufactureradd: "",
//             short_description: "",
//             long_description: "",
//             price_slot: [
//               {
//                 value: 0,
//                 price: 0,
//               },
//             ],
//           });
//           setvarients([
//             {
//               color: "",
//               image: [],
//               BarCode: "",
//               selected: [],
//             },
//           ]);
//           router.push("/inventory");
//           props.toaster({ type: "success", message: res.data?.message });
//         } else {
//           props.toaster({ type: "error", message: res?.data?.message });
//         }
//       },
//       (err) => {
//         props.loader(false);
//         console.log(err);
//         props.toaster({ type: "error", message: err?.message });
//       }
//     );
//   };

//   const updateProduct = async (e) => {
//     e.preventDefault();

//     const data = {
//       ...addProductsData,
//       userid: user?._id,
//       varients,
//       BarCode: inputValue,
//       id: router?.query?.id,
//     };

//     console.log(data);
//     console.log(addProductsData);

//     props.loader(true);
//     Api("post", "updateProduct", data, router).then(
//       (res) => {
//         props.loader(false);
//         console.log("res================>", res);
//         if (res.status) {
//           setAddProductsData({
//             name: "",
//             category: [],
//             unit: "",
//             our_price: "",
//             other_price: "",
//             tax: "",
//             origin: "",
//             selflife: "",
//             expirydate: "",
//             manufacturername: "",
//             manufactureradd: "",
//             short_description: "",
//             // gender: "",
//             long_description: "",
//             price_slot: [
//               {
//                 value: 0,
//                 price: 0,
//               },
//             ],
//           });
//           setvarients([
//             {
//               color: "",
//               image: [],
//               selected: [],
//             },
//           ]);
//           router.push("/inventory");
//           props.toaster({ type: "success", message: res.data?.message });
//         } else {
//           props.toaster({ type: "error", message: res?.data?.message });
//         }
//       },
//       (err) => {
//         props.loader(false);
//         console.log(err);
//         props.toaster({ type: "error", message: err?.message });
//       }
//     );
//   };

//   const handleImageChange = (event, i) => {
//     const file = event.target.files[0];
//     if (!file) return;
//     const fileSizeInMb = file.size / (1024 * 1024);
//     if (fileSizeInMb > 1) {
//       props.toaster({ type: "error", message: "Too large file. Please upload a smaller image" });
//       return;
//     } else {
//       new Compressor(file, {
//         quality: 0.6,
//         success: (compressedResult) => {
//           console.log(compressedResult)
//           const data = new FormData()
//           data.append('file', compressedResult)
//           props.loader(true);
//           ApiFormData("post", "user/fileupload", data, router).then(
//             (res) => {
//               props.loader(false);
//               console.log("res================>", res);
//               if (res.status) {
//                 setvarients(
//                   produce((draft) => {
//                     draft[i].image.push(res.data.file);
//                   })
//                 );
//                 setSingleImg(res.data.file)
//                 props.toaster({ type: "success", message: res.data.message });
//               }
//             },
//             (err) => {
//               props.loader(false);
//               console.log(err);
//               props.toaster({ type: "error", message: err?.message });
//             }
//           );
//           // compressedResult has the compressed file.
//           // Use the compressed file to upload the images to your server.        
//           //   setCompressedFile(res)
//         },
//       });
//     }
//     const reader = new FileReader();
//   };


//   const closeIcon = (item, inx, imagesArr, i) => {
//     const nextState = produce(imagesArr, draftState => {
//       if (inx !== -1) {
//         draftState.splice(inx, 1);
//       }
//     })
//     setvarients(
//       produce((draft) => {
//         // console.log(draft)
//         draft[i].image = nextState
//       })
//     );
//   }


//   const priceSlotsCloseIcon = (item, i) => {
//     console.log(item, i);
//     let data = addProductsData.price_slot;
//     if (i > -1) {
//       data.splice(i, 1);
//     }
//     console.log(data);
//     setAddProductsData({ ...addProductsData, price_slot: data });
//   };

//   const [inputValue, setInputValue] = useState("");
//   const [barcodeValue, setBarcodeValue] = useState("");

//   const handleGenerate = () => {
//     if (inputValue.trim() !== "") {
//       setBarcodeValue(inputValue);
//     }
//   };
//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       {/* Product Name */}
//       <FormField
//         label="Product Name"
//         value={addProductsData.name}
//         onChangeText={(text) => setAddProductsData({ ...addProductsData, name: text })}
//         placeholder="Product Name"
//         icon={require("../../Assets/Icon/product.svg")}
//       />

//       {/* Category Dropdown */}
//       <Text style={styles.label}>Category</Text>
//       <View style={styles.pickerWrapper}>
//         <Picker
//           selectedValue={addProductsData.category?._id}
//           style={styles.picker}
//           onValueChange={(itemValue) => {
//             const cat = categoryData.find((f) => f._id === itemValue);
//             setAddProductsData({
//               ...addProductsData,
//               category: itemValue,
//               categoryName: cat.name,
//               attributes: cat.attributes,
//             });
//           }}
//         >
//           <Picker.Item label="Category" value="" />
//           {categoryData.map((item, i) => (
//             <Picker.Item key={i} label={item.name} value={item._id} />
//           ))}
//         </Picker>
//       </View>

//       {/* Other Inputs */}
//       <FormField
//         label="Country of Origin"
//         value={addProductsData.origin}
//         onChangeText={(text) => setAddProductsData({ ...addProductsData, origin: text })}
//         placeholder="Country of Origin"
//         icon={require("../../Assets/Icon/product.svg")}
//       />

//       <FormField
//         label="Tax %"
//         value={addProductsData.tax}
//         onChangeText={(text) => setAddProductsData({ ...addProductsData, tax: text })}
//         placeholder="Tax %"
//         icon={require("../../Assets/Icon/product.svg")}
//         keyboardType="numeric"
//       />

//       <FormField
//         label="Manufacturer Name"
//         value={addProductsData.manufacturername}
//         onChangeText={(text) =>
//           setAddProductsData({ ...addProductsData, manufacturername: text })
//         }
//         placeholder="Manufacturer Name"
//         icon={require("../../Assets/Icon/product.svg")}
//       />

//       <FormField
//         label="Short Description"
//         value={addProductsData.short_description}
//         onChangeText={(text) =>
//           setAddProductsData({ ...addProductsData, short_description: text })
//         }
//         placeholder="Short Description"
//         icon={require("../../Assets/Icon/product.svg")}
//       />

//       <FormField
//         label="Allergens"
//         value={addProductsData.Allergens}
//         onChangeText={(text) => setAddProductsData({ ...addProductsData, Allergens: text })}
//         placeholder="Allergens"
//         icon={require("../../Assets/Icon/product.svg")}
//       />

//       <FormField
//         label="Quantity"
//         value={addProductsData.Quantity}
//         onChangeText={(text) => setAddProductsData({ ...addProductsData, Quantity: text })}
//         placeholder="Quantity"
//         icon={require("../../Assets/Icon/product.svg")}
//         keyboardType="numeric"
//       />

//       {/* Shipment Availability */}
//       <CheckboxGroup
//         label="Is Shipment Available"
//         options={[
//           { label: "Yes, shipment is available", value: true },
//           { label: "No, shipment is not available", value: false },
//         ]}
//         selected={addProductsData.isShipmentAvailable}
//         onSelect={(value) =>
//           setAddProductsData({ ...addProductsData, isShipmentAvailable: value })
//         }
//       />

//       {/* Return Availability */}
//       <CheckboxGroup
//         label="Is Product Available for Return / Exchange"
//         options={[
//           { label: "Yes, Return / Exchange is available", value: true },
//           { label: "No, Return / Exchange Not available", value: false },
//         ]}
//         selected={addProductsData.isReturnAvailable}
//         onSelect={(value) =>
//           setAddProductsData({ ...addProductsData, isReturnAvailable: value })
//         }
//       />

//       <CheckboxGroup
//   label="Is Next Day Delivery Available"
//   options={[
//     { label: "Yes, Next Day Delivery is available", value: true },
//     { label: "No, Next Day Delivery is Not available", value: false },
//   ]}
//   selected={addProductsData.isNextDayDeliveryAvailable}
//   onSelect={(value) =>
//     setAddProductsData({ ...addProductsData, isNextDayDeliveryAvailable: value })
//   }
// />

// {/* In-Store Pickup Availability */}
// <CheckboxGroup
//   label="Is Product Available for In-Store Pickup"
//   options={[
//     { label: "Yes, Store Pickup is available", value: true },
//     { label: "No, Store Pickup is not available", value: false },
//   ]}
//   selected={addProductsData.isInStoreAvailable}
//   onSelect={(value) =>
//     setAddProductsData({ ...addProductsData, isInStoreAvailable: value })
//   }
// />
// <CheckboxGroup
//   label="Is Product Available for In-Store Pickup"
//   options={[
//     { label: "Yes, Store Pickup is available", value: true },
//     { label: "No, Store Pickup is Not available", value: false },
//   ]}
//   selected={addProductsData.isInStoreAvailable}
//   onSelect={(value) =>
//     setAddProductsData({ ...addProductsData, isInStoreAvailable: value })
//   }
// />

// {/* CurbSide Pickup */}
// <CheckboxGroup
//   label="Is Product Available for CurbSide Pickup"
//   options={[
//     { label: "Yes, CurbSide Pickup is available", value: true },
//     { label: "No, CurbSide Pickup is Not available", value: false },
//   ]}
//   selected={addProductsData.isCurbSidePickupAvailable}
//   onSelect={(value) =>
//     setAddProductsData({ ...addProductsData, isCurbSidePickupAvailable: value })
//   }
// />

// <FormField
//   label="Long Description"
//   value={addProductsData.long_description}
//   onChangeText={(text) =>
//     setAddProductsData({ ...addProductsData, long_description: text })
//   }
//   placeholder="Long Description"
//   icon={require("./assets/box-add.png")}
//   multiline
//   numberOfLines={4}
// />
// <ScrollView style={styles.container}>
//     <Text style={styles.sectionTitle}>Upload Image</Text>

//     {varients.map((item, vi) => (
//       <View key={vi} style={styles.variantCard}>
//         <TouchableOpacity onPress={() => pickImage(vi)} style={styles.uploadBox}>
//           <Text style={styles.uploadText}>+ Add Image</Text>
//         </TouchableOpacity>

//         <View style={styles.imagePreviewContainer}>
//           {item.image.map((uri, ii) => (
//             <View key={ii} style={styles.imageWrapper}>
//               <Image source={{ uri }} style={styles.imagePreview} />
//               <TouchableOpacity
//                 style={styles.removeIcon}
//                 onPress={() => removeVariantImage(vi, ii)}>
//                 <Text style={styles.removeText}>❌</Text>
//               </TouchableOpacity>
//             </View>
//           ))}
//         </View>

//         {addProductsData.attributes?.map((attr, ai) =>
//           attr.name === 'size' ? (
//             <View key={ai}>
//               <Text style={styles.label}>Size</Text>
//               <MultiSelect
//                 items={size}
//                 uniqueKey="id"
//                 onSelectedItemsChange={(sel) => updateVariantSize(vi, sel)}
//                 selectedItems={item.selected}
//                 selectText="Select Sizes"
//                 searchInputPlaceholderText="Search Sizes…"
//                 tagRemoveIconColor="#CCC"
//                 tagBorderColor="#CCC"
//                 tagTextColor="#333"
//                 selectedItemTextColor="#000"
//                 selectedItemIconColor="#000"
//                 itemTextColor="#000"
//                 displayKey="name"
//                 searchInputStyle={{ color: '#000' }}
//                 submitButtonColor="#F38529"
//                 submitButtonText="Done"
//               />
//             </View>
//           ) : null
//         )}
//       </View>
//     ))}

//     <Text style={styles.sectionTitle}>CurbSide Pickup</Text>
//     {['isInStoreAvailable', 'isCurbSidePickupAvailable'].map((field) => (
//       <View key={field} style={styles.checkboxGroup}>
//         <Text style={styles.label}>
//           {field === 'isInStoreAvailable'
//             ? 'Store Pickup'
//             : 'CurbSide Pickup'}
//         </Text>
//         {[true, false].map((val) => (
//           <View key={val.toString()} style={styles.checkboxRow}>
//             <TouchableOpacity
//               style={styles.radioCircle}
//               onPress={() =>
//                 setAddProductsData({ ...addProductsData, [field]: val })
//               }>
//               {addProductsData[field] === val && <View style={styles.selectedRb} />}
//             </TouchableOpacity>
//             <Text style={styles.checkboxLabel}>
//               {val
//                 ? `Yes, ${{ isInStoreAvailable: 'Store', isCurbSidePickupAvailable: 'CurbSide' }[field]
//                     } Pickup is available`
//                 : `No, ${{ isInStoreAvailable: 'Store', isCurbSidePickupAvailable: 'CurbSide' }[field]
//                     } Pickup Not available`}
//             </Text>
//           </View>
//         ))}
//       </View>
//     ))}

//     <Text style={styles.sectionTitle}>Long Description</Text>
//     <TextInput
//       style={[styles.textArea, { height: 100 }]}
//       multiline
//       value={addProductsData.long_description}
//       onChangeText={(t) =>
//         setAddProductsData({ ...addProductsData, long_description: t })
//       }
//       placeholder="Long Description"
//     />

//     <Text style={styles.sectionTitle}>Barcode Generator</Text>
//     <View style={styles.barcodeRow}>
//       <TextInput
//         style={styles.barcodeInput}
//         keyboardType="numeric"
//         value={inputValue}
//         onChangeText={setInputValue}
//         placeholder="Enter barcode value"
//       />
//       <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
//         <Text style={styles.generateText}>Generate</Text>
//       </TouchableOpacity>
//     </View>
//     {barcodeValue ? (
//       <View style={styles.generatedBarcodeContainer}>
//         <Barcode value={barcodeValue} format="CODE128" />
//         <TouchableOpacity onPress={() => setBarcodeValue('')}>
//           <Text style={styles.removeText}>❌</Text>
//         </TouchableOpacity>
//       </View>
//     ) : null}

//     <Text style={styles.sectionTitle}>Pricing</Text>
//     {addProductsData.price_slot.map((slot, si) => (
//       <View key={si} style={styles.priceSlotCard}>
//         <Text style={styles.slotTitle}>Slot {si + 1}</Text>
//         <TextInput
//           style={styles.input}
//           keyboardType="numeric"
//           value={slot.value.toString()}
//           placeholder="Qty"
//           onChangeText={(t) => updatePriceSlot(si, 'value', t)}
//         />
//         <Picker
//           style={styles.picker}
//           selectedValue={slot.unit}
//           onValueChange={(v) => updatePriceSlot(si, 'unit', v)}>
//           <Picker.Item label="Select Unit" value="" />
//           {unitData.map((u) => (
//             <Picker.Item key={u.value} label={u.name} value={u.value} />
//           ))}
//         </Picker>
//         <TextInput
//           style={styles.input}
//           keyboardType="numeric"
//           value={slot.our_price.toString()}
//           placeholder="Offer Price"
//           onChangeText={(t) => updatePriceSlot(si, 'our_price', t)}
//         />
//         <TextInput
//           style={styles.input}
//           keyboardType="numeric"
//           value={slot.other_price.toString()}
//           placeholder="Price"
//           onChangeText={(t) => updatePriceSlot(si, 'other_price', t)}
//         />
//         <TouchableOpacity onPress={() => removeSlot(si)}>
//           <Text style={styles.removeText}>❌ Remove</Text>
//         </TouchableOpacity>
//       </View>
//     ))}

//     <TouchableOpacity onPress={addSlot}>
//       <Text style={styles.addSlotText}>+ Add More</Text>
//     </TouchableOpacity>

//     <TouchableOpacity
//       style={styles.submitButton}
//       onPress={router?.query?.id ? updateProduct : createProduct}>
//       <Text style={styles.submitText}>
//         {router?.query?.id ? 'Update' : 'Submit'}
//       </Text>
//     </TouchableOpacity>
//   </ScrollView>

//       <TouchableOpacity style={styles.button} onPress={handleSubmit}>
//         <Text style={styles.buttonText}>{isEditing ? "Update Product" : "Create Product"}</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// };

// Reusable Input Field Component
const FormField = ({ label, value, onChangeText, placeholder, icon, keyboardType }) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Image source={icon} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={styles.input}
        keyboardType={keyboardType || "default"}
      />
    </View>
  </View>
);

// Checkbox Group Component
const CheckboxGroup = ({ label, options, selected, onSelect }) => (
  <View style={styles.checkboxGroup}>
    <Text style={styles.label}>{label}</Text>
    {options.map((opt, idx) => (
      <View key={idx} style={styles.checkboxRow}>
        <CheckBox
          value={selected === opt.value}
          onValueChange={() => onSelect(opt.value)}
        />
        <Text style={styles.checkboxLabel}>{opt.label}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
  },
  fieldWrapper: {
    marginBottom: 15,
  },
  label: {
    color: "#000",
    fontSize: 16,
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 10,
    paddingLeft: 12,
    height: 46,
  },
  icon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 10,
    marginBottom: 15,
  },
  picker: {
    height: Platform.OS === "ios" ? 200 : 50,
    color: "#000",
  },
  checkboxGroup: {
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
