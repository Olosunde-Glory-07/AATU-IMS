import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
  "SUPABASE_SERVICE_ROLE_KEY"
);
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

// Validate environment variables
if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY ||
  !VAPID_PUBLIC_KEY ||
  !VAPID_PRIVATE_KEY
) {
  throw new Error("Missing required environment variables.");
}

// Create Supabase client
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// Configure Web Push
webpush.setVapidDetails(
  "mailto:admin@aatuims.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const {
      userId,
      title,
      body,
      icon = "/logo.png",
      url = "/",
    } = await req.json();

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "userId, title and body are required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get user's subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, subscription")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No push subscription found for this user.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let successCount = 0;

    for (const item of subscriptions) {
      try {
        await webpush.sendNotification(
          item.subscription,
          JSON.stringify({
            title,
            body,
            icon,
            url,
          })
        );

        successCount++;
      } catch (err: any) {
        console.error("Notification failed:", err);

        // Remove expired subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log("Deleting expired subscription...");

          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", item.endpoint);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: successCount,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error(err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});