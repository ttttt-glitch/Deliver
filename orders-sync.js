/**
 * Module 2: Cloud Sync Engine (Supabase + Offline Fallback)
 */
import { supabase } from './supabase-config.js';
import { getCurrentShop } from './auth.js';

const OFFLINE_QUEUE_KEY = 'garowe_express_offline_queue';

export async function saveOrderToCloud(formData) {
    const currentShopId = getCurrentShop();
    
    const orderRecord = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
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

    try {
        const { error } = await supabase
            .from('deliveries')
            .insert([orderRecord]);

        if (error) throw error;
        return orderRecord;
    } catch (err) {
        console.warn("Cloud write failed. Storing offline...", err.message);
        orderRecord.synced = false;
        
        const rawQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
        const queue = rawQueue ? JSON.parse(rawQueue) : [];
        queue.push(orderRecord);
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        
        console.log("Saved offline successfully");
        return orderRecord;
    }
}

export async function fetchTenantOrdersCloud(shopId) {
    try {
        const { data, error } = await supabase
            .from('deliveries')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Merge any un-synced offline local items for this tenant
        const rawQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
        const queue = rawQueue ? JSON.parse(rawQueue) : [];
        const localTenantOrders = queue.filter(o => o.shop_id === shopId);

        // Combine cloud data with local un-synced orders (deduplicated by ID)
        const cloudIds = new Set(data.map(d => d.id));
        const uniqueLocal = localTenantOrders.filter(lo => !cloudIds.has(lo.id));

        return [...uniqueLocal, ...data];
    } catch (err) {
        console.warn("Network offline. Falling back to local storage...", err.message);
        const rawQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
        const queue = rawQueue ? JSON.parse(rawQueue) : [];
        return queue.filter(o => o.shop_id === shopId);
    }
}

export async function syncOfflineOrders() {
    const rawQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!rawQueue) return;

    let queue = JSON.parse(rawQueue);
    if (queue.length === 0) return;

    const remainingQueue = [];

    for (const order of queue) {
        try {
            order.synced = true;
            const { error } = await supabase
                .from('deliveries')
                .insert([order]);

            if (error) {
                order.synced = false;
                remainingQueue.push(order);
            }
        } catch (err) {
            order.synced = false;
            remainingQueue.push(order);
        }
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
}
