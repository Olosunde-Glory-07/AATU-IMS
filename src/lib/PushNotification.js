import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Convert Base64 VAPID Key
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Register Service Worker
 */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Workers are not supported.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");

    console.log("✅ Service Worker Registered");

    return registration;
  } catch (err) {
    console.error("Service Worker Registration Failed:", err);
    return null;
  }
}

/**
 * Enable Push Notifications
 */
export async function enablePushNotifications(userId) {
  if (!("Notification" in window)) {
    console.log("Notifications not supported.");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    console.log("Notification permission denied.");
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const subscriptionJson = subscription.toJSON();

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscriptionJson.keys.p256dh,
      auth: subscriptionJson.keys.auth,
      subscription: subscriptionJson,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Failed to save subscription:", error);
    return;
  }

  console.log("✅ Push subscription saved.");
}

/**
 * Disable Notifications
 */
export async function disablePushNotifications() {
  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
  }

  console.log("Notifications disabled.");
}

/**
 * Notification Status
 */
export async function notificationStatus() {
  if (!("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

/**
 * Register Push Notifications
 * (This is the function you'll call from your pages.)
 */
export async function registerPushNotifications() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await registerServiceWorker();

    await enablePushNotifications(user.id);

    console.log("✅ Push Notifications Ready");
  } catch (err) {
    console.error("Push Notification Setup Failed:", err);
  }
}