import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get the caller's JWT
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('No authorization header')

        // Get user info from JWT
        const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (userError || !user) throw new Error('Unauthorized')

        const { other_user_id, listing_id, initial_message } = await req.json()

        if (!other_user_id) throw new Error('other_user_id is required')

        // 1. Check token balance
        const { data: tokenData, error: tokenError } = await supabase
            .from('tokens')
            .select('amount')
            .eq('user_id', user.id)
            .single()

        if (tokenError || !tokenData || tokenData.amount < 1) {
            return new Response(
                JSON.stringify({ error: 'INSUFFICIENT_TOKENS', message: 'You need at least 1 token to start a conversation.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Deduct 1 token
        const { error: deductError } = await supabase
            .from('tokens')
            .update({ amount: tokenData.amount - 1 })
            .eq('user_id', user.id)

        if (deductError) throw deductError

        // 3. Determine roles (Client vs Owner)
        // We check if the caller has a listing or not to guess roles, or check user_roles table
        const [{ data: callerRole }, { data: otherRole }] = await Promise.all([
            supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
            supabase.from('user_roles').select('role').eq('user_id', other_user_id).maybeSingle()
        ])

        const myRole = callerRole?.role || 'client'
        const clientId = myRole === 'client' ? user.id : other_user_id
        const ownerId = myRole === 'owner' ? user.id : other_user_id

        // 4. Create Match (force active status since someone paid)
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .upsert({
                user_id: clientId, // user_id in matches table seems to be client_id
                owner_id: ownerId,
                listing_id: listing_id || '00000000-0000-0000-0000-000000000000',
            }, { onConflict: 'user_id, owner_id, listing_id' })
            .select()
            .single()

        if (matchError) throw matchError

        // 5. Create or Get Conversation
        const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .or(`and(client_id.eq.${clientId},owner_id.eq.${ownerId}),and(client_id.eq.${ownerId},owner_id.eq.${clientId})`)
            .maybeSingle()

        let conversationId = existingConv?.id

        if (!conversationId) {
            const { data: newConv, error: convError } = await supabase
                .from('conversations')
                .insert({
                    client_id: clientId,
                    owner_id: ownerId,
                    listing_id: listing_id,
                    match_id: match.id,
                    status: 'active'
                })
                .select()
                .single()

            if (convError) throw convError
            conversationId = newConv.id
        }

        // 6. Send initial message if provided
        if (initial_message) {
            const { error: msgError } = await supabase
                .from('conversation_messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content: initial_message,
                    message_text: initial_message,
                    message_type: 'text'
                })

            if (msgError) throw msgError
        }

        return new Response(
            JSON.stringify({ success: true, conversation_id: conversationId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('initialize-conversation error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
