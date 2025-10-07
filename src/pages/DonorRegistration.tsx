// src/pages/DonorRegistration.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../components/routes";
import supabase from "../utils/supabaseClient";
import AppDrawer from "../components/AppDrawer";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaTint,
  FaList,
} from "react-icons/fa";
import type { IconType } from "react-icons";

// Theme colors
const theme = {
  background: "#fff5f5",
  primary: "#b71c1c",
  secondary: "#d32f2f",
  cardBackground: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
  inputBorder: "#f28b82",
  textPrimary: "#b71c1c",
  textSecondary: "#555",
  white: "#ffffff",
  success: "#4caf50",
  error: "#f44336",
  disabled: "#ccc",
};

// Shared styles
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: theme.background,
  },
  main: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  card: {
    width: "100%",
    maxWidth: "500px",
    background: theme.white,
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    borderRadius: "24px",
    borderTop: `6px solid ${theme.primary}`,
    padding: "2.5rem",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: 700,
    color: theme.primary,
    marginBottom: "0.5rem",
    textAlign: "center" as const,
  },
  subText: {
    color: theme.textSecondary,
    textAlign: "center" as const,
    marginBottom: "2rem",
    fontSize: "1rem",
    lineHeight: "1.5",
  },
  progressBarOuter: {
    width: "100%",
    backgroundColor: "rgba(183, 28, 28, 0.1)",
    borderRadius: "10px",
    height: "8px",
    marginBottom: "2rem",
    overflow: "hidden",
  },
  progressBarInner: (progress: number) => ({
    backgroundColor: theme.secondary,
    height: "100%",
    borderRadius: "10px",
    width: `${progress}%`,
    transition: "width 0.5s ease-in-out",
  }),
  successBox: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    color: theme.success,
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "1.5rem",
    textAlign: "center" as const,
    border: `2px solid rgba(76, 175, 80, 0.2)`,
    animation: "pulse 2s infinite",
  },
  errorBox: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    color: theme.error,
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "1.5rem",
    textAlign: "center" as const,
    border: `2px solid rgba(244, 67, 54, 0.2)`,
  },
  submitBtn: (loading: boolean) => ({
    width: "100%",
    background: loading ? theme.disabled : theme.primary,
    color: theme.white,
    fontWeight: 600,
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    cursor: loading ? "not-allowed" : "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transform: "scale(1)",
    transition: "all 0.3s ease",
    fontSize: "16px",
    marginBottom: "1rem",
  }),
  secondaryBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: theme.white,
    border: `2px solid ${theme.primary}`,
    color: theme.primary,
    fontWeight: 600,
    padding: "12px",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
    fontSize: "16px",
  },
};

// Fix for React Icons TS issue
const renderIcon = (IconComponent: IconType, props = {}) => {
  const Icon = IconComponent as any;
  return <Icon size={16} {...props} />;
};

// Input field
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: IconType;
}
const InputField: React.FC<InputFieldProps> = ({ icon, style, ...props }) => (
  <div style={{ position: "relative", marginBottom: "1rem" }}>
    <div
      style={{
        position: "absolute",
        left: "12px",
        top: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        color: theme.textSecondary,
        zIndex: 1,
      }}
    >
      {renderIcon(icon)}
    </div>
    <input
      {...props}
      style={{
        width: "100%",
        padding: "12px 12px 12px 40px",
        border: `2px solid ${theme.inputBorder}`,
        borderRadius: "12px",
        outline: "none",
        fontSize: "16px",
        backgroundColor: theme.white,
        color: theme.textSecondary,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        transition: "border-color 0.3s, box-shadow 0.3s",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = theme.primary;
        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(183, 28, 28, 0.1)`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = theme.inputBorder;
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      }}
    />
  </div>
);

// Select field
interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon: IconType;
  options: string[];
  placeholder?: string;
}
const SelectField: React.FC<SelectFieldProps> = ({
  icon,
  options,
  placeholder = "Select option",
  style,
  ...props
}) => (
  <div style={{ position: "relative", marginBottom: "1rem" }}>
    <div
      style={{
        position: "absolute",
        left: "16px",
        top: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        color: theme.textSecondary,
        pointerEvents: "none",
      }}
    >
      {renderIcon(icon)}
    </div>
    <select
      {...props}
      style={{
        width: "100%",
        padding: "12px 16px 12px 45px",
        border: `2px solid ${theme.inputBorder}`,
        borderRadius: "12px",
        outline: "none",
        fontSize: "16px",
        backgroundColor: theme.white,
        color: theme.textSecondary,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        transition: "border-color 0.3s, box-shadow 0.3s",
        cursor: "pointer",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = theme.primary;
        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(183, 28, 28, 0.1)`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = theme.inputBorder;
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

interface DonorRegistrationProps {
  isPublic?: boolean;
}

const DonorRegistration: React.FC<DonorRegistrationProps> = ({
  isPublic = false,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
  name: "",
  email: "",
  phone: "",
  blood_type: "",
  address: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true); // open by default ✅

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setFormData({ ...formData, [e.target.name]: e.target.value });

  useEffect(() => {
    const requiredFields = isPublic
      ? ["name", "email", "phone", "blood_type"]
      : ["name", "email", "phone", "blood_type", "address"];
    const filled = requiredFields.filter(
      (field) => formData[field as keyof typeof formData] !== ""
    ).length;
    setProgress(Math.round((filled / requiredFields.length) * 100));
  }, [formData, isPublic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: supabaseError } = await supabase
        .from("donors")
        .insert([formData]);
      if (supabaseError) throw supabaseError;

      setSuccess(true);
      if (isPublic) {
        setTimeout(() => navigate(ROUTES.splash), 2000);
      } else {
        setFormData({
          name: "",
          email: "",
          phone: "",
          blood_type: "",
          address: "",
        });
      }
    } catch (err: any) {
      setError(err.message || "Could not register donor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        `}
      </style>

      <div style={styles.container}>
        {!isPublic && (
          <AppDrawer
            isOpen={drawerOpen}
            onToggle={() => setDrawerOpen(!drawerOpen)}
          />
        )}

        <main style={styles.main}>
          <div style={styles.card}>
            <h1 style={styles.heading}>
              {isPublic ? "Join Our Blood Donor Community" : "Register a Donor"}
            </h1>
            <p style={styles.subText}>
              {isPublic
                ? "Save lives by donating blood. Fill the form below to get started."
                : "Add donor details to your system."}
            </p>

            <div style={styles.progressBarOuter}>
              <div style={styles.progressBarInner(progress)} />
            </div>

            {success && <div style={styles.successBox}>✅ Donor successfully registered!</div>}
            {error && <div style={styles.errorBox}>❌ {error}</div>}

            <form onSubmit={handleSubmit}>
              <InputField
                icon={FaUser}
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <InputField
                icon={FaEnvelope}
                name="email"
                placeholder="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <InputField
                icon={FaPhone}
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <SelectField
                icon={FaTint}
                name="blood_type"
                value={formData.blood_type}
                onChange={handleChange}
                placeholder="Select Blood Type"
                options={[
                  "A+",
                  "A-",
                  "B+",
                  "B-",
                  "AB+",
                  "AB-",
                  "O+",
                  "O-",
                ]}
                required
              />
              {!isPublic && (
                <InputField
                  icon={FaMapMarkerAlt}
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              )}

              <button
                type="submit"
                disabled={loading}
                style={styles.submitBtn(loading)}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 16px rgba(0,0,0,0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.15)";
                  }
                }}
              >
                {loading ? "Submitting..." : "🩸 Register Donor"}
              </button>

              {!isPublic && (
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.DonorList)}
                  style={styles.secondaryBtn}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(183, 28, 28, 0.05)";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.white;
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {renderIcon(FaList)} View All Donors
                </button>
              )}
            </form>
          </div>  
        </main>
      </div>
    </>
  );
};

export default DonorRegistration;
