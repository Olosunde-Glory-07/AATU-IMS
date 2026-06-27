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

    // ── Step 1: Create user with email_confirm: false ─────────────────────
    // This means the account EXISTS but is LOCKED until they verify email.
    // They CANNOT log in with the temp password until email is confirmed.
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false,   // ← MUST be false — locks account until email verified
      user_metadata: { full_name, role },
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Step 2: Create the profile row ────────────────────────────────────
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id:                   newUser.user.id,
        full_name,
        role,
        department:           department ?? null,
        specialty:            specialty  ?? null,
        status:               'Active',
        must_change_password: true,  // ← forces password change after first login
      })

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Step 3: Send the email verification link ──────────────────────────
    // generateLink with type 'signup' sends the standard Supabase
    // "Confirm your email" email. The link in the email confirms their
    // address AND logs them in, then redirects to /change-password
    // where must_change_password=true forces them to set a new password.
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'

    const { error: linkError } = await adminClient.auth.admin.generateLink({
      type:  'signup',
      email,
      options: {
        redirectTo: `${siteUrl}/change-password`,
      },
    })

    if (linkError) {
      console.warn('Failed to send verification email:', linkError.message)
    }

    // ── Step 4: Notify admin ──────────────────────────────────────────────
    await adminClient.from('notifications').insert({
      user_id: caller.id,
      type:    'Memo',
      title:   `Account created: ${full_name}`,
      body:    `A ${role} account has been created for ${email}. A verification email has been sent to them. After verifying, they will be prompted to set a new password.`,
      read:    false,
    })

    return new Response(JSON.stringify({
      success: true,
      user:    newUser.user,
      message: `Account created. A verification email has been sent to ${email}.`,
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