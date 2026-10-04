/**
 * Module 2: Multi-Tenant & Offline-Safe Order Controller
 */
import { getCurrentShop } from './auth.js';

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} shop_id
 * @property {string} merchant_name
 * @property {string} phone
 * @property {string} zone
 * @property {string} item_details
 * @property {number} amount
 * @property {string} payment_status
 * @property {string} delivery_status
 * @property {string} created_at
 */

const STORAGE_KEY = 'garowe_express_all_orders';

export function saveNewOrder(formData) {
    const currentShopId = getCurrentShop();
    
    /** @type {Order} */
    const newOrder = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        shop_id: currentShopId,
        merchant_name: formData.merchant_name,
        phone: formData.phone,
        zone: formData.zone,
        item_details: formData.item_details,
        amount: parseFloat(formData.amount) || 0,
        payment_status: formData.payment_status || 'Unpaid',
        delivery_status: 'Pending',
        created_at: new Date().toISOString()
    };

    const rawData = localStorage.getItem(STORAGE_KEY);
    /** @type {Order[]} */
    const allOrders = rawData ? JSON.parse(rawData) : [];
    
    allOrders.push(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allOrders));
    return newOrder;
}

export function getMerchantOrders() {
    const currentShopId = getCurrentShop();
    const rawData = localStorage.getItem(STORAGE_KEY);
    /** @type {Order[]} */
    const allOrders = rawData ? JSON.parse(rawData) : [];
    
    return allOrders.filter(order => order.shop_id === currentShopId);
}
