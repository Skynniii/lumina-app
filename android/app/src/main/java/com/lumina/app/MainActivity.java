package com.lumina.app;

import android.graphics.Color;
import android.os.Bundle;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    @SuppressWarnings("deprecation")
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Edge-to-edge: el WebView se dibuja también por detrás de la barra de
        // estado y de la barra de navegación, de modo que el color de la
        // cabecera de la app se "funde" con la barra de estado tal como ocurre
        // en una app nativa de Android.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Barras del sistema transparentes: en lugar de un color propio del
        // sistema, se ve el color de la parte superior/inferior de la app.
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);

        // Iconos, hora y batería oscuros, ya que la interfaz de la app es clara.
        WindowInsetsControllerCompat controller =
                new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(true);
        controller.setAppearanceLightNavigationBars(true);
    }
}
