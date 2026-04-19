import { createRoot } from "react-dom/client";
import { registerLicense } from '@syncfusion/ej2-base';
import App from "./App.tsx";
import "./index.css";

// Register Syncfusion License Key
// Replace with your valid license key
registerLicense('YOUR_LICENSE_KEY_GOES_HERE');

createRoot(document.getElementById("root")!).render(<App />);
