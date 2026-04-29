import MainLayout from "./layouts/MainLayout";

// Pages
import Overview from "./pages/Overview";
import Files from "./pages/Files";
import UploadLinks from "./pages/UploadLinks";
import Subscriptions from "./pages/Subscriptions";
import Settings from "./pages/Settings";
import FileDetail from "./pages/FileDetail";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import PublicUpload from "./pages/PublicUpload";

// Additional pages
import Pricing from "./pages/Pricing";
import Blog from "./pages/Blog";
import SpeedTest from "./pages/SpeedTest";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import HelpWebhooks from "./pages/HelpWebhooks";
import HelpLandingPage from "./pages/HelpLandingPage";
import Developers from "./pages/Developers";
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter, Routes, Route } from "react-router-dom";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Pages (No Layout) */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        
        {/* Public Upload Link (No Layout) */}
        <Route path="/upload/:linkId" element={<PublicUpload />} />

        {/* Main Routes with Layout */}
        <Route element={<MainLayout />}>
          {/* Public Overview page */}
          <Route path="/" element={<Overview />} />

          {/* Protected pages - require login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/files" element={<Files />} />
            <Route path="/file/:fileId" element={<FileDetail />} />
            <Route path="/upload-links" element={<UploadLinks />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Additional pages (some are simple stubs) */}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/speedtest" element={<SpeedTest />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<Help />} />
          <Route path="/help/webhooks" element={<HelpWebhooks />} />
          <Route path="/help/landing-page" element={<HelpLandingPage />} />
          <Route path="/logout" element={<Overview />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
