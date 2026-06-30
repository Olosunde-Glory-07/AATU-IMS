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

    if (role === 'student') {
      return new Response(JSON.stringify({ error: 'Students must self-register through the registration page.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Step 1: Create the user with email_confirm: false ─────────────────
    // This creates the account in a LOCKED/unconfirmed state.
    // Supabase does NOT automatically send an email for admin.createUser,
    // so we trigger the OTP email ourselves in Step 2 below.
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false,   // locked until they verify with OTP
      user_metadata: { full_name, role },
    })

    if (createError) {
      if (createError.message?.toLowerCase().includes('already been registered')) {
        return new Response(JSON.stringify({
          error: `An account with ${email} already exists.`
        }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({ error: createError.message }), {
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
        must_change_password: true,
      })

    if (profileError) {
      console.error('Profile upsert error:', profileError.message)
    }

    // ── Step 3: Trigger the OTP email ──────────────────────────────────────
    // Using the public anon client to call signInWithOtp/resend triggers
    // Supabase's normal "Confirm Signup" email template, which contains
    // the {{ .Token }} 6-digit OTP code (if you set up the template that way).
    const publicClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    const { error: otpError } = await publicClient.auth.resend({
      type:  'signup',
      email,
    })

    if (otpError) {
      console.warn('Failed to send OTP email:', otpError.message)
    }

    // ── Step 4: Notify admin ────────────────────────────────────────────────
    await adminClient.from('notifications').insert({
      user_id: caller.id,
      type:    'Memo',
      title:   `Account created: ${full_name}`,
      body:    `A ${role} account has been created for ${email}. A 6-digit verification code has been sent to their email. They must enter it to verify their account, then set a new password.`,
      read:    false,
    })

    return new Response(JSON.stringify({
      success: true,
      user:    newUser.user,
      message: `Account created. A verification code has been sent to ${email}.`,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('create-user error:', err)
    return new Response(JSON.stringify({ error: err.message ?? 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})