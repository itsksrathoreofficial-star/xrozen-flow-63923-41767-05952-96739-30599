import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { amount, planId } = await req.json();

    // Get Razorpay config
    const { data: config } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'razorpay_config')
      .single();

    if (!config || !(config.value as any).key_id || !(config.value as any).key_secret) {
      throw new Error('Razorpay not configured');
    }

    const razorpayKeyId = (config.value as any).key_id;
    const razorpayKeySecret = (config.value as any).key_secret;

    // Create Razorpay order
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        notes: {
          plan_id: planId
        }
      })
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json();
      throw new Error(`Razorpay API error: ${JSON.stringify(error)}`);
    }

    const order = await orderResponse.json();

    return new Response(
      JSON.stringify(order),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
