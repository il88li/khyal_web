# خيال — Android WebView على Vercel

## URL
`https://your-app.vercel.app`

## إعدادات WebView (Kotlin)
```kotlin
settings.javaScriptEnabled = true
settings.domStorageEnabled = true
settings.allowFileAccess = false
settings.allowFileAccessFromFileURLs = false
settings.mixedContentMode = MIXED_CONTENT_NEVER_ALLOW
settings.safeBrowsingEnabled = true // API 26+

webViewClient = object : WebViewClient() {
  override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
    val host = request.url.host ?: return true
    val allowed = host.endsWith("vercel.app") || host == "khiyal.app" || host == "localhost"
    return !(request.url.scheme == "https" && allowed)
  }
}
```

## FCM
```kotlin
webView.evaluateJavascript(
  "window.__FCM_TOKEN__='${token}';window.dispatchEvent(new Event('fcmready'));", null
)
```

## ملاحظات
- Safe areas عبر CSS `env(safe-area-inset-*)`
- منع التكبير: viewport userScalable=false
- الشريط السفلي يتضمن زر الرفع في المنتصف
