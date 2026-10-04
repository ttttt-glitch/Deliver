/**
 * Module 3: Admin Global View Controller
 */

const STORAGE_KEY = 'garowe_express_all_orders';

export function getGlobalAdminMetrics() {
    const rawData = localStorage.getItem(STORAGE_KEY);
    const allOrders = rawData ? JSON.parse(rawData) : [];

    let totalPlatformRevenue = 0;
    const uniqueTenants = new Set();

    allOrders.forEach(order => {
        totalPlatformRevenue += Number(order.amount) || 0;
        if (order.shop_id) {
            uniqueTenants.add(order.shop_id);
        }
    });

    return {
        totalPlatformRevenue: parseFloat(totalPlatformRevenue.toFixed(2)),
        totalPlatformDeliveries: allOrders.length,
        activeTenantsCount: uniqueTenants.size
    };
}
