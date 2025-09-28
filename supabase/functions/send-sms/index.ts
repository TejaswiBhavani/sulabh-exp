import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Twilio } from "npm:twilio@4.19.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface SMSRequest {
  to: string
  body: string
  complaintId?: string
  userId?: string
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
    const { to, body, complaintId, userId }: SMSRequest = await req.json()

    // Validate phone number format
    if (!to || !validatePhoneNumber(to)) {
      throw new Error("Invalid phone number format")
    }

    // Validate message body
    if (!body || body.trim().length === 0) {
      throw new Error("Message body cannot be empty")
    }

    // Get Twilio credentials from environment variables
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER")

    if (!accountSid || !authToken || !twilioPhone) {
      throw new Error("Twilio credentials not configured")
    }

    // Initialize Twilio client
    const client = new Twilio(accountSid, authToken)

    // Send SMS
    const message = await client.messages.create({
      body: body,
      from: twilioPhone,
      to: to
    })

    // Log SMS delivery in database if needed
    if (complaintId || userId) {
      await logSmsDelivery(req, {
        to,
        body,
        complaintId,
        userId,
        messageId: message.sid,
        status: message.status
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: message.sid,
        status: message.status
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )

  } catch (error) {
    console.error("Error sending SMS:", error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send SMS" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    )
  }
})

// Validate phone number format
function validatePhoneNumber(phone: string): boolean {
  // Basic validation for international format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/\s+/g, ""))
}

// Log SMS delivery to database
async function logSmsDelivery(req: Request, data: any) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables")
      return
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    
    await supabaseClient
      .from("sms_logs")
      .insert({
        phone_number: data.to,
        message: data.body,
        complaint_id: data.complaintId,
        user_id: data.userId,
        message_id: data.messageId,
        status: data.status,
        sent_at: new Date().toISOString()
      })
      
  } catch (error) {
    console.error("Error logging SMS delivery:", error)
  }
}

// Helper function to create Supabase client
function createClient(supabaseUrl: string, supabaseKey: string) {
  return {
    from: (table: string) => ({
      insert: (data: any) => {
        return fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`
          },
          body: JSON.stringify(data)
        })
      }
    })
  }
}