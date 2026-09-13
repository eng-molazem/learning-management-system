import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import NebulaBackground from "./NebulaBackground";

export default function Layout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <NebulaBackground />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
