import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // Get Razorpay config
    const { data: config } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'razorpay_config')
      .single();

    if (!config || !(config.value as any).key_secret) {
      throw new Error('Razorpay not configured');
    }

    const razorpayKeySecret = (config.value as any).key_secret;

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = createHmac('sha256', razorpayKeySecret)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      throw new Error('Payment signature verification failed');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Record payment transaction
    await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        amount: 0, // You'd get this from the order
        status: 'completed',
        razorpay_payment_id,
        razorpay_order_id,
        payment_method: 'razorpay',
        currency: 'INR'
      });

    console.log('Payment verified successfully:', razorpay_payment_id);

    return new Response(
      JSON.stringify({ success: true, message: 'Payment verified' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
