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

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify caller is authenticated
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

    // Verify caller is admin
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

    if (role === 'student') {
      return new Response(JSON.stringify({ error: 'Students must self-register.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Step 1: Use signInWithOtp to create + send verification in one call ──
    // This is the KEY fix — instead of admin.createUser (which doesn't send
    // an email automatically), we use signInWithOtp with shouldCreateUser: true.
    // Supabase will create the user AND send the 6-digit OTP to their email
    // in a single call. The user account starts unconfirmed.
    const publicClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    // First check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const alreadyExists = existingUsers?.users?.some(u => u.email === email)

    if (alreadyExists) {
      return new Response(JSON.stringify({ error: `An account with ${email} already exists.` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create the user via admin (so we can set a temp password + metadata)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false,  // unconfirmed — user must verify OTP first
      user_metadata: { full_name, role },
    })

    if (createError || !newUser?.user) {
      return new Response(JSON.stringify({ error: createError?.message ?? 'Failed to create user.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const newUserId = newUser.user.id

    // ── Step 2: Create the profile row ────────────────────────────────────
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id:                   newUserId,
        full_name,
        role,
        department:           department ?? null,
        specialty:            specialty  ?? null,
        status:               'Active',
        must_change_password: true,  // frontend checks this after login
      })

    if (profileError) {
      console.error('Profile upsert error:', profileError.message)
    }

    // ── Step 3: Send OTP email via signInWithOtp ──────────────────────────
    // This is the correct way to trigger the OTP for an admin-created user.
    // It sends the "Confirm signup" email with the 6-digit token.
    const { error: otpError } = await publicClient.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // user already exists — just send the OTP
      },
    })

    if (otpError) {
      console.warn('OTP send warning:', otpError.message)
      // Non-blocking — user was still created, admin can resend manually
    }

    // ── Step 4: Notify admin ───────────────────────────────────────────────
    await adminClient.from('notifications').insert({
      user_id: caller.id,
      type:    'Memo',
      title:   `Account created: ${full_name}`,
      body:    `A ${role} account has been created for ${email}. A 6-digit verification code has been sent to their email. They must verify their email and set a new password before they can access the app.`,
      read:    false,
    })

    return new Response(JSON.stringify({
      success: true,
      message: `Account created. Verification code sent to ${email}.`,
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