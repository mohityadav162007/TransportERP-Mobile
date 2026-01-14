import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { supabase } from "./supabase";

const firebaseConfig = {
    apiKey: "AIzaSyAnVyaxBKk4W5sPYIo5Y4a6s9xqM9Z0e4s",
    authDomain: "transport-erp-apk.firebaseapp.com",
    projectId: "transport-erp-apk",
    storageBucket: "transport-erp-apk.firebasestorage.app",
    messagingSenderId: "911241426266",
    appId: "1:911241426266:web:a5d99a8670a9a1e3442f63"
};

const VAPID_KEY = "BI3qQ7-163_CUHZ7oQ_RwgQ8_mQICBDzcIDtEeFhs8YSJXQd3fiqb9Y6jDxapygfK9t4LwPAw6TfAB2f_XwQxv4";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
    try {
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (currentToken) {
            console.log('current token for client: ', currentToken);
            await registerTokenInBackend(currentToken);
        } else {
            console.log('No registration token available. Request permission to generate one.');
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
    }
};

const registerTokenInBackend = async (token) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: existingToken } = await supabase
            .from('fcm_tokens')
            .select('*')
            .eq('user_id', user.id)
            .eq('token', token)
            .single();

        if (!existingToken) {
            const { error } = await supabase
                .from('fcm_tokens')
                .insert({
                    user_id: user.id,
                    token: token,
                    device_type: 'android',
                    last_updated: new Date().toISOString()
                });
            if (error) console.error('Error saving FCM token:', error);
        } else {
            await supabase
                .from('fcm_tokens')
                .update({ last_updated: new Date().toISOString() })
                .eq('id', existingToken.id);
        }

    } catch (error) {
        console.error("Error registering FCM token:", error);
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
