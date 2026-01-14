import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

const firebaseConfig = {
    apiKey: "AIzaSyAnVyaxBKk4W5sPYIo5Y4a6s9xqM9Z0e4s",
    authDomain: "transport-erp-apk.firebaseapp.com",
    projectId: "transport-erp-apk",
    storageBucket: "transport-erp-apk.firebasestorage.app",
    messagingSenderId: "911241426266",
    appId: "1:911241426266:web:a5d99a8670a9a1e3442f63"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pwa-192x192.png',
        data: payload.data // Pass data payload for click handling
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const tripId = event.notification.data?.tripId;
    const urlToOpen = tripId ? `https://transport-erp-mobile.vercel.app/trips/${tripId}` : 'https://transport-erp-mobile.vercel.app/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If a window client is already open, focus it and navigate
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if ('focus' in client) {
                    return client.navigate(urlToOpen).then(c => c.focus());
                }
            }
            // If no window client is open, open a new one
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
