import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
      const role = localStorage.getItem("user_role") || "";

      const roleRoutes: Record<string, string> = {
        admin: "/admin-dashboard",
        hospital_staff: "/hospital-dashboard",
        blood_bank_staff: "/bloodbank-dashboard",
      };

      if (isLoggedIn) {
        navigate(roleRoutes[role] || "/login");
      } else {
        navigate("/login");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      background: 'var(--color-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff'
    }}>
      {/* Animated App Title */}
      <motion.h1
        style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.5px' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Smart Blood Tracker
      </motion.h1>

      {/* Animated Loader */}
      <motion.div
        style={{ marginTop: '16px', width: '40px', height: '40px', border: '4px solid #fff', borderTopColor: 'transparent', borderRadius: '9999px' }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
    </div>
  );
};

export default SplashScreen;
