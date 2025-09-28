import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2.38.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Cache configuration for different endpoints
const cacheConfig = {
  // Dashboard statistics - 5 minute cache
  "dashboard_stats": {
    ttl: 300, // 5 minutes in seconds
    vary: ["user_role", "department"]
  },
  // Complaint lists - 2 minute cache
  "complaints_list": {
    ttl: 120, // 2 minutes in seconds
    vary: ["user_id", "department", "status"]
  },
  // Suggestions - 5 minute cache
  "suggestions_list": {
    ttl: 300, // 5 minutes in seconds
    vary: []
  },
  // Reports - 10 minute cache
  "reports": {
    ttl: 600, // 10 minutes in seconds
    vary: ["period", "department", "category"]
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { action, key, data } = await req.json()
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables")
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Handle different cache actions
    switch (action) {
      case "get_config":
        // Return cache configuration for a specific endpoint
        const endpoint = key as keyof typeof cacheConfig
        if (!cacheConfig[endpoint]) {
          throw new Error(`Cache configuration not found for endpoint: ${endpoint}`)
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            config: cacheConfig[endpoint]
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        )
        
      case "get":
        // Get cached data
        const { data: cachedData, error: getError } = await supabase
          .from("cache")
          .select("data, created_at")
          .eq("key", key)
          .single()
          
        if (getError && getError.code !== "PGRST116") { // Not found error is acceptable
          throw getError
        }
        
        // Check if cache is valid
        let isCacheValid = false
        if (cachedData) {
          const endpoint = key.split(":")[0] as keyof typeof cacheConfig
          const ttl = cacheConfig[endpoint]?.ttl || 300
          const createdAt = new Date(cachedData.created_at)
          const now = new Date()
          const ageInSeconds = (now.getTime() - createdAt.getTime()) / 1000
          
          isCacheValid = ageInSeconds < ttl
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: isCacheValid ? cachedData?.data : null,
            cached: isCacheValid
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        )
        
      case "set":
        // Set cached data
        if (!key || !data) {
          throw new Error("Key and data are required for cache set operation")
        }
        
        // Upsert cache entry
        const { error: setError } = await supabase
          .from("cache")
          .upsert({
            key,
            data,
            created_at: new Date().toISOString()
          }, {
            onConflict: "key"
          })
          
        if (setError) {
          throw setError
        }
        
        return new Response(
          JSON.stringify({ 
            success: true
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        )
        
      case "invalidate":
        // Invalidate cache
        const { error: deleteError } = await supabase
          .from("cache")
          .delete()
          .eq("key", key)
          
        if (deleteError) {
          throw deleteError
        }
        
        return new Response(
          JSON.stringify({ 
            success: true
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        )
        
      default:
        throw new Error(`Unknown cache action: ${action}`)
    }

  } catch (error) {
    console.error("Cache error:", error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Cache operation failed" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    )
  }
})