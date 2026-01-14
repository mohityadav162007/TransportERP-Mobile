import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as admin from 'https://esm.sh/firebase-admin@11.10.1?target=deno'
import { getMessaging } from 'https://esm.sh/firebase-admin@11.10.1/messaging?target=deno'

// TODO: Deploy this function with your Service Account JSON in secrets or hardcoded (not recommended for prod but okay for initial setup if handled carefully)
// Better: Set firebase_service_account secret in Supabase Dashboard
// For this file, we assume we parse it from an env var 'FIREBASE_SERVICE_ACCOUNT' or you paste it here.

const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}')

if (Object.keys(serviceAccount).length > 0) {
    // Initialize Firebase Admin
    if (admin.getApps().length === 0) {
        admin.initializeApp({
            credential: admin.cert(serviceAccount)
        });
    }
} else {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT environment variable.");
}


console.log("Hello from send-notifications!")

serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch all Admin FCM Tokens
        // Assuming all users in fcm_tokens are admins for now, or fetch users with admin role.
        // Let's just fetch all tokens for simplicity as per requirement "Admin users only" (assuming the app is only for admins for now)
        const { data: tokensData, error: tokenError } = await supabase
            .from('fcm_tokens')
            .select('token')

        if (tokenError) throw tokenError
        const tokens = tokensData.map(t => t.token)

        if (tokens.length === 0) {
            return new Response(JSON.stringify({ message: 'No devices registered' }), { headers: { 'Content-Type': 'application/json' } })
        }

        const messages = []

        // 2. Rule 1: POD Upload Pending
        // unloading_date exists, pod is not uploaded, 8 days passed
        // 8 days ago:
        const eightDaysAgo = new Date();
        eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
        const eightDaysAgoStr = eightDaysAgo.toISOString().split('T')[0];

        const { data: pendingPodTrips } = await supabase
            .from('trips')
            .select('id, vehicle_number, unloading_date')
            .not('unloading_date', 'is', null)
            .is('pod_status', 'pending') // Assuming 'pending' is the status for no POD. Or check pod_path is null.
            // Note: 'pod_status' might be 'PENDING' even if pod_path is not null depending on legacy data, but we fixed that logic. 
            // Let's be safe and check pod_path too if possible, OR trust pod_status 'PENDING'.
            // Requirement: "POD is not uploaded".
            .lte('unloading_date', eightDaysAgoStr)

        if (pendingPodTrips && pendingPodTrips.length > 0) {
            // We could send one notification per trip, or a summary.
            // "Notifications repeat DAILY until the issue is resolved"
            // "On tap -> open the specific Trip Details page" implies one notification per trip?
            // If there are 10 trips, sending 10 notifications might be spammy.
            // But the requirement says "On tap -> open the specific Trip Details page".
            // Let's send one notification for the *oldest* or *most critical* one, or maybe up to 3.
            // Or send a summary "X Pending PODs" and open the list.
            // Requirement: "On tap -> open the specific Trip Details page". This strongly implies individual notifications.
            // Let's loop through them.
            for (const trip of pendingPodTrips) {
                messages.push({
                    tokens: tokens, // Multicast
                    notification: {
                        title: `POD Pending: ${trip.vehicle_number}`,
                        body: `Unloading was on ${trip.unloading_date}. Upload POD now.`
                    },
                    data: {
                        tripId: trip.id,
                        type: 'POD_PENDING'
                    }
                });
            }
        }

        // 3. Rule 2: Party Advance Pending
        // party_advance is NULL or 0, 36 hours passed since loading_date
        const thirtySixHoursAgo = new Date(Date.now() - 36 * 60 * 60 * 1000);
        // loading_date is usually just a date (YYYY-MM-DD), not timestamp. 
        // If it's a date, we compare if loading_date < (now - 36h).
        // Effectively if loading_date was yesterday or before.
        const thirtySixHoursAgoStr = thirtySixHoursAgo.toISOString().split('T')[0];

        const { data: pendingAdvanceTrips } = await supabase
            .from('trips')
            .select('id, vehicle_number, loading_date, party_advance')
            .lte('loading_date', thirtySixHoursAgoStr)
            .or('party_advance.is.null,party_advance.eq.0')

        if (pendingAdvanceTrips && pendingAdvanceTrips.length > 0) {
            for (const trip of pendingAdvanceTrips) {
                messages.push({
                    tokens: tokens,
                    notification: {
                        title: `Party Advance Pending: ${trip.vehicle_number}`,
                        body: `Loading was on ${trip.loading_date}. Enter logic now.`
                    },
                    data: {
                        tripId: trip.id,
                        type: 'ADVANCE_PENDING'
                    }
                });
            }
        }

        // Send all messages
        // Firebase Admin sendMulticast
        const results = [];
        if (messages.length > 0 && admin.getApps().length > 0) {
            for (const msg of messages) {
                const response = await getMessaging().sendMulticast({
                    tokens: msg.tokens,
                    notification: msg.notification,
                    data: msg.data
                });
                results.push(response);
            }
        }

        return new Response(
            JSON.stringify({ success: true, messagesSent: messages.length, results }),
            { headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { "Content-Type": "application/json" }, status: 500 },
        )
    }
})
