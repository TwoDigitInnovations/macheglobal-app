/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import { BackIcon } from '../../../Theme';
import { goBack } from '../../../navigationRef';
import { GetApi } from '../../Assets/Helpers/Service';
import { LoadContext } from '../../../App';
import { useTranslation } from 'react-i18next';
import ManufacturerProductCard from './ManufacturerProductCard';

const ManufacturerProducts = ({ route }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useContext(LoadContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    getCategories();
    getManufacturerProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setProducts([]);
      setPage(1);
      setHasMore(true);
      getManufacturerProducts(1, selectedCategory);
    }
  }, [selectedCategory]);

  const getCategories = async () => {
    try {
      const res = await GetApi('category/getCategories', {});
      if (res?.status) {
        setCategories(res.data || []);
      }
    } catch (err) {
      console.log('Error fetching categories:', err);
    }
  };

  const getManufacturerProducts = async (pageNum = 1, category = selectedCategory) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let url = `product/getManufacturerProducts?page=${pageNum}&limit=10`;
      
      if (category && category !== 'all') {
        // Get category name from categories array
        const selectedCat = categories.find(cat => cat._id === category);
        if (selectedCat) {
          url += `&Category=${encodeURIComponent(selectedCat.name)}`;
        }
      }

      console.log('Fetching manufacturer products:', url);
      const res = await GetApi(url, {});
      
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }

      console.log('Manufacturer products response:', res);

      if (res?.status) {
        const newProducts = res.data || [];
        
        if (pageNum === 1) {
          setProducts(newProducts);
        } else {
          setProducts(prev => [...prev, ...newProducts]);
        }

        setHasMore(newProducts.length === 10);
      }
    } catch (err) {
      setLoading(false);
      setLoadingMore(false);
      console.log('Error fetching manufacturer products:', err);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      getManufacturerProducts(nextPage);
    }
  };

  const renderProduct = ({ item }) => {
    return <ManufacturerProductCard item={item} />;
  };

  const renderCategory = ({ item }) => {
    const isSelected = selectedCategory === item._id;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
        onPress={() => setSelectedCategory(item._id)}>
        <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
          <BackIcon height={24} width={24} color={Constants.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Manufacturer Products')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Category Filter */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ _id: 'all', name: t('All') }, ...categories]}
          keyExtractor={(item) => item._id}
          renderItem={renderCategory}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Products Grid */}
      <FlatList
        data={products}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.productList}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('No manufacturer products found')}</Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={Constants.saffron} />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default ManufacturerProducts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  header: {
    backgroundColor: Constants.saffron,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.Bold,
    color: Constants.white,
  },
  filterSection: {
    backgroundColor: Constants.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  categoryList: {
    paddingHorizontal: 15,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F3F3',
    marginRight: 10,
  },
  categoryChipSelected: {
    backgroundColor: Constants.saffron,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    color: Constants.black,
  },
  categoryChipTextSelected: {
    color: Constants.white,
    fontFamily: FONTS.Bold,
  },
  productList: {
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    color: '#999',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
