import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Allowed roles for admin-created accounts.
// "hod" and "dean" share the same requester portal but are still distinct
// role values in profiles.role — students no longer exist in this app.
const ALLOWED_ROLES = ['staff', 'technician', 'hod', 'dean', 'admin']

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

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

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
      return new Response(JSON.stringify({ error: 'Only admins can create users.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { email, password, full_name, role, department, specialty } = await req.json()

    if (!email || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: 'email, password, full_name and role are required.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(', ')}.` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Step 1: Create the auth user ──────────────────────────────────────
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name, role },
    })

    if (createError || !newUser?.user) {
      return new Response(JSON.stringify({ error: createError?.message ?? 'Failed to create user.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const newUserId = newUser.user.id

    // ── Step 1.5: Trigger the OTP verification email ──────────────────────
    // admin.createUser() does NOT send a confirmation email on its own —
    // we have to explicitly ask Supabase to (re)send the "signup" OTP.
    const { error: resendError } = await adminClient.auth.resend({
      type: 'signup',
      email,
    })

    if (resendError) {
      console.error('Failed to send OTP email:', resendError.message)
      // Don't fail the whole request — the account was still created successfully.
      // Staff/HOD/Dean/Technician can use "Resend code" on the login OTP modal if this happens.
    }

    // ── Step 2: Upsert the profile row ────────────────────────────────────
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id:                   newUserId,
        full_name,
        role,
        department:           department ?? null,
        specialty:            specialty  ?? null,
        status:               'Active',
        must_change_password: true,
      })

    if (profileError) {
      console.error('Profile upsert error:', profileError.message)
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Step 3: Notify admin (non-blocking — wrapped in try/catch) ─────────
    try {
      await adminClient.from('notifications').insert({
        user_id: caller.id,
        type:    'Memo',
        title:   `Account created: ${full_name}`,
        body:    `A ${role} account has been created for ${email}. When they log in for the first time, they will receive an OTP to confirm their email, then be prompted to change their password.`,
        read:    false,
      })
    } catch (notifErr) {
      console.warn('Notification insert failed (non-fatal):', notifErr)
    }

    // ── Step 4: Return the full user object so frontend can read user.id ───
    return new Response(JSON.stringify({
      success: true,
      user:    newUser.user,
      message: `Account created for ${email}. They will receive an OTP on first login.`,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('create-user error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})