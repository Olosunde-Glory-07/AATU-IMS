import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Admin client ──────────────────────────────────────────────────────
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Verify the caller is an admin ─────────────────────────────────────
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller } } = await userClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can delete users.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Parse target user id ──────────────────────────────────────────────
    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Look up the target user's profile ─────────────────────────────────
    const { data: targetProfile } = await adminClient
      .from('profiles')
      .select('role, full_name')
      .eq('id', user_id)
      .single()

    if (!targetProfile) {
      return new Response(JSON.stringify({ error: 'User not found.' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const isSelf = user_id === caller.id

    // ── Admins can delete their OWN account, but never another admin's ────
    if (targetProfile.role === 'admin' && !isSelf) {
      return new Response(JSON.stringify({ error: 'You cannot delete another admin. Admins may only delete their own account.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Delete the profile row first (FK cascade will handle related data) ─
    const { error: profileErr } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', user_id)

    if (profileErr) {
      return new Response(JSON.stringify({ error: `Failed to delete profile: ${profileErr.message}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Delete from auth.users (requires service role) ────────────────────
    const { error: authErr } = await adminClient.auth.admin.deleteUser(user_id)

    if (authErr) {
      return new Response(JSON.stringify({ error: `Failed to delete auth user: ${authErr.message}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      selfDeleted: isSelf,
      message: isSelf
        ? 'Your account has been permanently deleted.'
        : `User ${targetProfile.full_name} has been permanently deleted.`,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('delete-user error:', err)
    return new Response(JSON.stringify({ error: err.message ?? 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})