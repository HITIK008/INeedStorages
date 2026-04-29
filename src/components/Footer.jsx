import { NavLink } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-900 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-100">
              <img src="/logo.svg" alt="INeedStorage logo" className="h-6 w-6 rounded object-cover" />
              <span>INeedStorages</span>
            </div>
            <p className="text-sm text-zinc-400 max-w-md">
              Fast and reliable temporary file hosting for sharing, upload links,
              and simple anonymous storage workflows.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wide text-zinc-500">Product</h3>
            <FooterLink to="/">Overview</FooterLink>
            <FooterLink to="/files">Files</FooterLink>
            <FooterLink to="/upload-links">Upload Links</FooterLink>
            <FooterLink to="/speedtest">Speed Test</FooterLink>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wide text-zinc-500">Legal</h3>
            <FooterLink to="/terms">Terms of Service</FooterLink>
            <FooterLink to="/privacy">Privacy Policy</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
            <FooterLink to="/help">Help</FooterLink>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-900 text-xs text-zinc-500 text-center">
          © {new Date().getFullYear()} INeedStorages. Built with care for secure file sharing.
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <NavLink to={to} className="block text-sm text-zinc-400 hover:text-zinc-200">
      {children}
    </NavLink>
  );
}

