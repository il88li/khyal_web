package com.khiyal.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/** يستقبل رسائل البيانات (title, body, link) التي يرسلها الخادم ويعرضها كإشعار */
class KhiyalMessagingService : FirebaseMessagingService() {
    override fun onMessageReceived(m: RemoteMessage) {
        val d = m.data; val title = d["title"] ?: "خيال"; val body = d["body"] ?: ""; val link = d["link"] ?: "/"
        val nm = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(NotificationChannel("khiyal", "خيال", NotificationManager.IMPORTANCE_HIGH))
        val i = Intent(this, MainActivity::class.java).apply { flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP; putExtra("link", link) }
        val pi = PendingIntent.getActivity(this, link.hashCode(), i, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        nm.notify(System.currentTimeMillis().toInt(), NotificationCompat.Builder(this, "khiyal").setSmallIcon(R.drawable.ic_stat)
            .setContentTitle(title).setContentText(body).setStyle(NotificationCompat.BigTextStyle().bigText(body)).setAutoCancel(true).setContentIntent(pi).build())
    }
    override fun onNewToken(token: String) { /* يُسلَّم للويب عبر KhiyalNative.requestToken عند فتح التطبيق/تسجيل الدخول */ }
}
