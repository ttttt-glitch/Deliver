/**
 * Module 2: Multi-Tenant & Offline-Safe Order Controller
 */
import { supabase } from './supabase-config.js';
import { getCurrentShop } from './auth.js';

const STORAGE_KEY = 'garowe_express_all_orders';

export async function saveNewOrder(formData) {
    const currentShopId = getCurrentShop();
    
    const newOrder = {
        shop_id: currentShopId,
        merchant_name: formData.merchant_name,
        phone: formData.phone,
        zone: formData.zone,
        item_details: formData.item_details,
        amount: parseFloat(formData.amount) || 0,
        payment_status: formData.payment_status || 'Unpaid',
        delivery_status: 'Pending',
        synced: true,
        created_at: new Date().toISOString()
    };

    // 1. Save to localStorage (offline-safe backup)
    const rawData = localStorage.getItem(STORAGE_KEY);
    const allOrders = rawData ? JSON.parse(rawData) : [];
    allOrders.push({ ...newOrder, id: 'ORD-' + Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allOrders));

    // 2. Push to Supabase (so drivers see it)
    try {
        const { data, error } = await supabase
            .from('deliveries')
            .insert([newOrder])
            .select();

        if (error) throw error;
        console.log("✅ Order pushed to Supabase:", data);
        return data[0];
    } catch (err) {
        console.warn("⚠️ Cloud save failed (saved locally):", err.message);
        return newOrder;
    }
}

export function getMerchantOrders() {
    const currentShopId = getCurrentShop();
    const rawData = localStorage.getItem(STORAGE_KEY);
    const allOrders = rawData ? JSON.parse(rawData) : [];
    return allOrders.filter(order => order.shop_id === currentShopId);
}
