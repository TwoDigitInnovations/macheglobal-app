import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BackIcon } from '../../../Theme';
import { GetApi } from '../../Assets/Helpers/Service';

export default function CategoriesScreen() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([{ _id: 'all', name: 'All' }]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  
  useEffect(() => {
    fetchCategories();
  }, []);

  
  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      fetchSubcategories(selectedCategory);
    }
  }, [selectedCategory, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await GetApi('category/getCategories', {});
      if (response.status) {
        setCategories([{ _id: 'all', name: 'All' }, ...response.data]);
        
        // Keep 'all' as the selected category by default
        if (response.data.length > 0) {
          // Set subcategories for 'all' category by combining all subcategories
          const allSubcategories = response.data.flatMap(cat => cat.Subcategory || []);
          setSubcategories(allSubcategories);
        }
        setSelectedCategory('all');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Set 'all' as the selected category by default
  useEffect(() => {
    setSelectedCategory('all');
  }, []);

  const fetchSubcategories = (categoryId) => {
    if (categoryId === 'all') {
      const allSubcategories = categories
        .filter(cat => cat._id !== 'all')
        .flatMap(cat => cat.Subcategory || []);
      setSubcategories(allSubcategories);
      return;
    }

    const selectedCat = categories.find(cat => cat._id === categoryId);
    if (selectedCat) {
      setSubcategories(selectedCat.Subcategory || []);
    }
  };

  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleSubcategoryPress = (subcategory) => {
    navigation.navigate('SubcategoryProducts', {
      item: subcategory._id,
      name: subcategory.name
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon height={20} width={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.content}>
        {/* Left Side - Categories List */}
        <View style={styles.categoriesSection}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category._id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category._id && styles.categoryItemActive,
                ]}
                onPress={() => handleCategoryPress(category._id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category._id && styles.categoryTextActive,
                    { textAlign: 'center' }
                  ]}
                  numberOfLines={2}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Right Side - Subcategories Grid (3 columns) */}
        <View style={styles.subcategoriesSection}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {loading ? (
                <ActivityIndicator size="large" color="#2B3E50" style={{ flex: 1, marginTop: 50 }} />
              ) : subcategories.length > 0 ? (
                subcategories.map((subcategory) => (
                  <TouchableOpacity
                    key={subcategory._id}
                    style={styles.subcategoryCard}
                    onPress={() => handleSubcategoryPress(subcategory)}
                  >
                    <View style={[styles.imageContainer, { backgroundColor: subcategory.bgColor || '#F5D5A8' }]}>
                      {subcategory.image?.url ? (
                        <Image
                          source={{ uri: subcategory.image.url }}
                          style={styles.subcategoryImage}
                          resizeMode="cover"
                          defaultSource={{ uri: 'https://via.placeholder.com/300' }}
                        />
                      ) : (
                        <View style={[styles.subcategoryImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={{ fontSize: 12, color: '#999' }}>No Image</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.subcategoryTitle} numberOfLines={1}>
                      {subcategory.name || 'Sub-Category'}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
                  <Text>No subcategories found</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FF7000',
    paddingTop: 50,
    paddingBottom: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  categoriesSection: {
    width: 110,
    backgroundColor: '#F3F3F3',
  },
  categoryItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: '#F3F3F3',
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
  categoryItemActive: {
    backgroundColor: '#FF700040',
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 16,
  },
  categoryTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  subcategoriesSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingTop: 4,
  },
  subcategoryCard: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 15,
    marginHorizontal: '1%',
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  subcategoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  subcategoryTitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#000000',
    fontFamily: 'Roboto-Medium',
    lineHeight: 15,
    height: 30,
    width: 70,
    overflow: 'hidden',
  },
});