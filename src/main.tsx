import { createRoot } from "react-dom/client";
import { registerLicense } from '@syncfusion/ej2-base';
import App from "./App.tsx";
import "./index.css";

// Register Syncfusion License Key
// Replace with your valid license key
registerLicense('YOUR_LICENSE_KEY_GOES_HERE');

// Startup diagnostics
const missing: string[] = [];
if (!import.meta.env.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
if (!import.meta.env.VITE_R2_ACCOUNT_ID) missing.push('VITE_R2_ACCOUNT_ID');
if (missing.length > 0) {
  console.warn('[PUSDAOP] Missing env vars at build time:', missing.join(', '));
} else {
  console.info('[PUSDAOP] All env vars loaded OK — URL:', import.meta.env.VITE_SUPABASE_URL);
}

createRoot(document.getElementById("root")!).render(<App />);
