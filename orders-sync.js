export async function syncOfflineOrders() {
    const rawQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!rawQueue) {
        console.log("No offline orders to sync.");
        return { synced: 0, failed: 0 };
    }

    let queue;
    try {
        queue = JSON.parse(rawQueue);
    } catch (parseErr) {
        console.error("Corrupted offline queue — clearing:", parseErr);
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
        return { synced: 0, failed: 0, error: 'corrupted queue' };
    }

    if (!Array.isArray(queue) || queue.length === 0) {
        return { synced: 0, failed: 0 };
    }

    const remainingQueue = [];
    let syncedCount = 0;

    for (const order of queue) {
        try {
            const cleanOrder = { ...order };
            delete cleanOrder.synced;
            delete cleanOrder.id;

            const { error } = await supabase
                .from('deliveries')
                .insert([cleanOrder]);

            if (error) {
                console.error("Insert failed for order:", order, error);
                remainingQueue.push(order);
            } else {
                syncedCount++;
            }
        } catch (err) {
            console.error("Exception syncing order:", err);
            remainingQueue.push(order);
        }
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    
    // ✅ FIX: Return a result so callers can log it
    return { 
        synced: syncedCount, 
        failed: remainingQueue.length,
        total: queue.length 
    };
}
