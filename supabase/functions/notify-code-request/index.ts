import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, email, whatsapp, message } = body;

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Since this is the sandbox, we MUST send from onboarding@resend.dev to woorkify@gmail.com
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'woorkify@gmail.com',
        subject: `[Swipess] New Access Code Request: ${name}`,
        html: `
          <div style="font-family: sans-serif; max-w-lg mx-auto p-6 border rounded-lg">
            <h2 style="color: #333;">New Access Code Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>WhatsApp:</strong> ${whatsapp || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background: #f4f4f4; padding: 10px; border-left: 4px solid #ccc;">
              ${message || 'No message provided'}
            </blockquote>
          </div>
        `,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      const errorText = await res.text();
      return new Response(JSON.stringify({ error: errorText }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
