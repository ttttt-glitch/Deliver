/**
 * Module 1: Supabase Initialization & Database Schema
 * Load client via CDN in HTML: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 */

const SUPABASE_URL = "https://caxcppreyuyyobhjciy.supabase.co";
const SUPABASE_ANON_KEY = "Sb_publishable_x3q2HIrBuWLv-AlGQ5LUgQ_uHolKke_";

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/*
====================================================================
SUPABASE SQL DDL STATEMENT (Execute in Supabase SQL Editor):
================================================================----

CREATE TABLE deliveries (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    merchant_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    zone TEXT NOT NULL,
    item_details TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_status TEXT NOT NULL,
    delivery_status TEXT NOT NULL,
    synced BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) if needed for strict multi-tenancy:
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

====================================================================
*/
