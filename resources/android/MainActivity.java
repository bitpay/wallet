package cash.abcpay.wallet.dev;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.fcm.FCMPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Initializes the Bridge
        this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
            add(FCMPlugin.class);
        }});
    }
}
