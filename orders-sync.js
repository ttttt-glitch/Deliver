/**
 * Module 2: Cloud Sync Engine (Supabase + REST/Client Integration)
 */
import { supabase } from './supabase-config.js';
import { getCurrentShop } from './auth.js';

const OFFLINE_QUEUE_KEY = 'garowe_express_offline_queue';

export async function saveOrderToCloud(formData) {
    const currentShopId = getCurrentShop();
    
    // Let Supabase auto-generate the UUID id to prevent type mismatch errors
    const orderRecord = {
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

        if (error) {
            console.error("Supabase insert error details:", error);
            throw error;
        }
        
        console.log("Order successfully saved to Supabase cloud!");
        return orderRecord;
    } catch (err) {
        console.warn("Cloud write failed. Storing offline...", err.message);
        orderRecord.synced = false;
        
        const rawQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
        const queue = rawQueue ? JSON.parse(rawQueue) : [];
        queue.push(orderRecord);
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        
        alert("Cloud write warning: Saved offline locally. Check your internet/keys.");
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
        return data || [];
    } catch (err) {
        console.warn("Falling back to local storage...", err.message);
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
            // Remove local fallback markers before pushing up
            const cleanOrder = { ...order };
            delete cleanOrder.synced;
            delete cleanOrder.id; // Let database assign safe UUID

            const { error } = await supabase
                .from('deliveries')
                .insert([cleanOrder]);

            if (error) {
                remainingQueue.push(order);
            }
        } catch (err) {
            remainingQueue.push(order);
        }
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
}

export function subscribeToDeliveries(onUpdateCallback) {
    return supabase
        .channel('public:deliveries')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, (payload) => {
            onUpdateCallback(payload);
        })
        .subscribe();
}

export async function updateDeliveryStatus(orderId, newStatus, driverName = 'Driver Garowe') {
    try {
        const { data, error } = await supabase
            .from('deliveries')
            .update({ 
                delivery_status: newStatus, 
                driver_name: driverName 
            })
            .eq('id', orderId)
            .select();

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error('Error updating order status in cloud:', err.message);
        return { success: false, error: err.message };
    }
}
