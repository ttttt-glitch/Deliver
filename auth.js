/**
 * Module 1: Multi-Tenant Session Handler
 */

const SESSION_KEY = 'garowe_express_active_shop';

export function setCurrentShop(shopId) {
    if (!shopId || typeof shopId !== 'string') return;
    localStorage.setItem(SESSION_KEY, shopId.trim());
}

export function getCurrentShop() {
    const shopId = localStorage.getItem(SESSION_KEY);
    return shopId ? shopId : 'tenant_demo';
}

export function logoutCurrentShop() {
    localStorage.removeItem(SESSION_KEY);
}
