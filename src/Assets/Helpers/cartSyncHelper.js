import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post } from './Service';

/**
 * Cart Sync Helper - Uses batch API for efficient syncing
 * Single API call for all products
 */

export const syncCartWithLatestData = async () => {
  try {
    console.log('🔄 Starting cart sync with batch API...');
    
    const cartData = await AsyncStorage.getItem('cartdata');
    if (!cartData) {
      console.log('📦 Cart is empty');
      return { updatedCart: [], changes: [] };
    }

    const cart = JSON.parse(cartData);
    console.log('📦 Current cart items:', cart.length);
    
    if (!Array.isArray(cart) || cart.length === 0) {
      return { updatedCart: [], changes: [] };
    }

    // Prepare batch request
    const productsToSync = cart.map(item => ({
      productId: item.productid,
      variantAttributes: item.selectedAttributes || null
    }));

    console.log('📡 Calling sync API with products:', productsToSync.length);

    // Single API call for all products
    const response = await Post('cart/sync', { products: productsToSync });

    console.log('📡 API Response:', {
      status: response?.status,
      dataLength: response?.data?.length,
      fullResponse: JSON.stringify(response).substring(0, 200)
    });

    if (!response || !response.status || !response.data) {
      console.error('❌ Cart sync API failed - keeping original cart');
      return { updatedCart: cart, changes: [] };
    }

    const syncedData = response.data;
    const updatedCart = [];
    const changes = [];

    console.log('🔍 Processing synced data...');

    // Process synced data
    cart.forEach((cartItem, index) => {
      const syncResult = syncedData[index];

      console.log(`Item ${index}:`, {
        productName: cartItem.productname,
        syncStatus: syncResult?.status,
        hasData: !!syncResult?.data
      });

      if (!syncResult) {
        console.log(`⚠️ No sync result for item ${index} - keeping original`);
        updatedCart.push(cartItem);
        return;
      }

      if (syncResult.status === 'DELETED') {
        console.log(`🗑️ Product deleted: ${cartItem.productname}`);
        changes.push({
          type: 'PRODUCT_DELETED',
          productName: cartItem.productname,
          message: `${cartItem.productname} removed (no longer available)`
        });
        return; // Don't add to cart
      }

      if (syncResult.status === 'VARIANT_DELETED') {
        console.log(`🗑️ Variant deleted: ${cartItem.productname}`);
        changes.push({
          type: 'VARIANT_DELETED',
          productName: cartItem.productname,
          message: `${cartItem.productname} variant removed`
        });
        return; // Don't add to cart
      }

      if (syncResult.status === 'SUCCESS' && syncResult.data) {
        const latest = syncResult.data;
        const availableStock = parseInt(latest.stock) || 0;

        console.log(`✅ Success for ${cartItem.productname}:`, {
          oldPrice: cartItem.offer,
          newPrice: latest.offerPrice,
          stock: availableStock
        });

        // Adjust quantity if needed
        let adjustedQty = cartItem.qty;
        let isOutOfStock = false;

        if (availableStock <= 0) {
          isOutOfStock = true;
          console.log(`⚠️ Out of stock: ${cartItem.productname}`);
          changes.push({
            type: 'OUT_OF_STOCK',
            productName: cartItem.productname,
            message: `${cartItem.productname} is out of stock`
          });
        } else if (cartItem.qty > availableStock) {
          adjustedQty = availableStock;
          console.log(`📉 Quantity adjusted: ${cartItem.qty} → ${adjustedQty}`);
          changes.push({
            type: 'QUANTITY_ADJUSTED',
            productName: cartItem.productname,
            oldQty: cartItem.qty,
            newQty: adjustedQty,
            message: `${cartItem.productname} quantity adjusted`
          });
        }

        // Check price changes
        const latestOfferPrice = parseFloat(latest.offerPrice) || parseFloat(latest.price) || 0;
        if (cartItem.offer !== latestOfferPrice) {
          console.log(`💰 Price changed: ${cartItem.offer} → ${latestOfferPrice}`);
          changes.push({
            type: 'PRICE_CHANGED',
            productName: cartItem.productname,
            oldPrice: cartItem.offer,
            newPrice: latestOfferPrice,
            message: `${cartItem.productname} price updated`
          });
        }

        // Update cart item
        updatedCart.push({
          ...cartItem,
          productname: latest.name,
          price: parseFloat(latest.price) || 0,
          offer: latestOfferPrice,
          image: latest.images?.[0] || cartItem.image,
          qty: adjustedQty,
          total: latestOfferPrice * adjustedQty,
          isOutOfStock: isOutOfStock,
          availableStock: availableStock,
          slug: latest.slug
        });
      } else {
        console.log(`⚠️ Unknown status for item ${index} - keeping original`);
        updatedCart.push(cartItem);
      }
    });

    await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
    
    console.log('✅ Cart sync complete:', {
      original: cart.length,
      updated: updatedCart.length,
      removed: cart.length - updatedCart.length,
      changes: changes.length
    });

    return { updatedCart, changes };
  } catch (error) {
    console.error('❌ Cart sync error:', error);
    console.error('Error details:', error.message, error.stack);
    // Return original cart on error
    const cartData = await AsyncStorage.getItem('cartdata');
    const cart = cartData ? JSON.parse(cartData) : [];
    return { updatedCart: cart, changes: [], error: error.message };
  }
};

/**
 * Sync wishlist using batch API
 */
export const syncWishlistWithLatestData = async () => {
  try {
    const wishlistData = await AsyncStorage.getItem('variantWishlist');
    if (!wishlistData) {
      return { updatedWishlist: [], changes: [] };
    }

    const wishlist = JSON.parse(wishlistData);
    if (!Array.isArray(wishlist) || wishlist.length === 0) {
      return { updatedWishlist: [], changes: [] };
    }

    // Prepare batch request
    const productsToSync = wishlist.map(item => ({
      productId: item.productId,
      variantAttributes: item.attributes || null
    }));

    const response = await Post('wishlist/sync', { products: productsToSync });

    if (!response || !response.status || !response.data) {
      return { updatedWishlist: wishlist, changes: [] };
    }

    const syncedData = response.data;
    const updatedWishlist = [];
    const changes = [];

    wishlist.forEach((item, index) => {
      const syncResult = syncedData[index];

      if (!syncResult || syncResult.status === 'DELETED' || syncResult.status === 'VARIANT_DELETED') {
        changes.push({
          type: 'PRODUCT_DELETED',
          productName: item.productName,
          message: `${item.productName} removed from wishlist`
        });
        return;
      }

      if (syncResult.status === 'SUCCESS' && syncResult.data) {
        const latest = syncResult.data;
        const latestOfferPrice = parseFloat(latest.offerPrice) || parseFloat(latest.price) || 0;

        if (item.offerPrice !== latestOfferPrice) {
          changes.push({
            type: 'PRICE_CHANGED',
            productName: item.productName,
            oldPrice: item.offerPrice,
            newPrice: latestOfferPrice
          });
        }

        updatedWishlist.push({
          ...item,
          productName: latest.name,
          price: parseFloat(latest.price) || 0,
          offerPrice: latestOfferPrice,
          stock: latest.stock,
          image: latest.images?.[0] || item.image,
          slug: latest.slug
        });
      } else {
        updatedWishlist.push(item);
      }
    });

    await AsyncStorage.setItem('variantWishlist', JSON.stringify(updatedWishlist));
    
    return { updatedWishlist, changes };
  } catch (error) {
    console.error('❌ Wishlist sync error:', error);
    const wishlistData = await AsyncStorage.getItem('variantWishlist');
    const wishlist = wishlistData ? JSON.parse(wishlistData) : [];
    return { updatedWishlist: wishlist, changes: [], error: error.message };
  }
};
