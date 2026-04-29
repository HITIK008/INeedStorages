import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
