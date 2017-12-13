package uk.ac.gcu.mkolev200.spacekickoff;

        import android.content.pm.ActivityInfo;
        import android.os.Build;
        import android.support.annotation.RequiresApi;
        import android.support.v7.app.AppCompatActivity;
        import android.os.Bundle;
        import android.view.View;
        import android.webkit.WebSettings;
        import android.webkit.WebView;

public class MainActivity extends AppCompatActivity {

    WebView webView;
    @RequiresApi(api = Build.VERSION_CODES.KITKAT)
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        View decorView = getWindow().getDecorView();
        // Set the IMMERSIVE flag.
        // Set the content to appear under the system bars so that the content
        // doesn't resize when the system bars hide and show.
        int uiOptions = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION // hide nav bar
                | View.SYSTEM_UI_FLAG_FULLSCREEN // hide status bar
                | View.SYSTEM_UI_FLAG_IMMERSIVE;
        decorView.setSystemUiVisibility(uiOptions);

        setContentView(R.layout.activity_main);

        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);



        WebView.setWebContentsDebuggingEnabled(true);
        webView = findViewById(R.id.webview1);
        webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);

        //allow cross-origin requests
        WebSettings settings = webView.getSettings();
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setJavaScriptEnabled(true);

        webView.loadUrl("file:///android_asset/index.html");

    }
}
