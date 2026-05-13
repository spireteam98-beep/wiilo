import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://dwmcqtqqyoziezjynxta.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bWNxdHFxeW96aWV6anlueHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTY5OTYsImV4cCI6MjA5MDA5Mjk5Nn0.IxCeWQIyi3uyA_pqknqjc1Us2wBczezOnYdZeVv582E"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
