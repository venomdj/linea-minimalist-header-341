// src/lib/onesignal.ts
// Handles: SDK loading, initialisation, permission request, player_id retrieval

declare global {
  interface Window {
    OneSignalDeferred?: ((onesignal: OneSignalType) => void)[];
  }
}

type OneSignalType = {
  init: (config: OneSignalConfig) => Promise<void>;
  Notifications: {
    requestPermission: () => Promise<void>;
    permission: boolean;
  };
  User: {
    PushSubscription: {
      id: string | null | undefined;
      optedIn: boolean;
    };
  };
  login: (externalId: string) => Promise<void>;
};

type OneSignalConfig = {
  appId: string;
  allowLocalhostAsSecureOrigin?: boolean;
  notifyButton?: { enable: boolean };
  serviceWorkerPath?: string;
};

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string;

/**
 * Dynamically loads the OneSignal SDK page script.
 * Safe to call multiple times — only injects once.
 */
export function loadOneSignalScript(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById("onesignal-sdk")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "onesignal-sdk";
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.error("[OneSignal] Failed to load SDK script.");
      resolve(); // resolve anyway to prevent hanging
    };
    document.head.appendChild(script);
  });
}

/**
 * Initialise OneSignal, link to the given Supabase userId,
 * request push permission, and return the subscription player_id.
 *
 * @param userId  Supabase auth user ID (used as OneSignal external_id)
 * @returns       OneSignal player_id string, or null if unavailable
 */
export async function initOneSignal(userId: string): Promise<string | null> {
  await loadOneSignalScript();

  return new Promise<string | null>((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(async (OneSignal: OneSignalType) => {
      try {
        await OneSignal.init({
          appId: APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: false }, // We manage permission UX ourselves
          serviceWorkerPath: "/OneSignalSDKWorker.js",
        });

        // Link this browser subscription to the Supabase user ID
        await OneSignal.login(userId);

        // Request permission if not already granted
        if (!OneSignal.Notifications.permission) {
          await OneSignal.Notifications.requestPermission();
        }

        // Wait a tick for the subscription ID to be set
        await new Promise((r) => setTimeout(r, 500));

        const id = OneSignal.User?.PushSubscription?.id ?? null;
        resolve(id);
      } catch (err) {
        console.error("[OneSignal] Init error:", err);
        resolve(null);
      }
    });
  });
}

/**
 * Retrieve the current browser's OneSignal subscription (player) ID.
 * Returns null if not subscribed or SDK not loaded.
 */
export function getOneSignalPlayerId(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!window.OneSignalDeferred) {
      resolve(null);
      return;
    }
    window.OneSignalDeferred.push((OneSignal: OneSignalType) => {
      const id = OneSignal.User?.PushSubscription?.id ?? null;
      resolve(id);
    });
  });
}

/**
 * Check if push notifications are currently permitted in this browser.
 */
export function isPushPermissionGranted(): boolean {
  return Notification.permission === "granted";
}
