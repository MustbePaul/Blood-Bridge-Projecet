// src/pages/Donors.tsx
import React, { useCallback, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import supabase from "../utils/supabaseClient";

const Donors: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEligible, setIsEligible] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    blood_type: "",
    gender: "",
    street_address: "",
    city: "",
    state: "",
    zipcode: "",
    emergency_contact: "",
    emergency_phone: "",
    medical_conditions: "",
    medications: "",
  });

  const calculateEligibility = (dob: string) => {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 17 && age <= 65;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "date_of_birth") setIsEligible(calculateEligibility(value));
  };

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!isEligible) {
        toast.warning("You are not eligible to donate blood based on your age.");
        return;
      }

      setLoading(true);

      const address = [formData.street_address, formData.city, formData.state, formData.zipcode]
        .filter(Boolean)
        .join(", ");

      const donorData = {
        // Removed user_id completely
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        blood_type: formData.blood_type,
        gender: formData.gender,
        address,
        emergency_contact: formData.emergency_contact,
        emergency_phone: formData.emergency_phone,
        medical_conditions: formData.medical_conditions || null,
        medications: formData.medications || null,
        is_eligible: isEligible,
        last_donation_date: null,
        total_donations: 0,
      };

      try {
        const { data, error } = await supabase.from("donors").insert([donorData]).select("*");

        if (error) throw error;

        console.log("Form submitted successfully:", data);
        toast.success("✅ Thank you for registering! Our team will contact you soon.");
        setSubmitted(true);

        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          date_of_birth: "",
          blood_type: "",
          gender: "",
          street_address: "",
          city: "",
          state: "",
          zipcode: "",
          emergency_contact: "",
          emergency_phone: "",
          medical_conditions: "",
          medications: "",
        });
        setIsEligible(false);
      } catch (err: any) {
        console.error("Error submitting form:", err);

        if (err.message?.includes("row-level security policy")) {
          toast.error("Database security error: RLS INSERT policy may be missing.");
        } else if (err.code === "23505") {
          toast.error("This email is already registered. Please use a different email.");
        } else if (err.code === "23502") {
          toast.error("Missing required information. Please fill in all required fields.");
        } else {
          toast.error(`Error submitting form: ${err.message || "Please try again."}`);
        }
      } finally {
        setLoading(false);
        setTimeout(() => setSubmitted(false), 5000);
      }
    },
    [formData, isEligible]
  );

  // Styles
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: "1rem",
    boxSizing: "border-box",
    transition: "border 0.3s",
  };
  const labelStyle: React.CSSProperties = { display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#555" };
  const sectionStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "1.5rem", marginTop: "1rem" };
  const fieldStyle: React.CSSProperties = { flex: 1, minWidth: 250 };
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar />
      <header style={{ background: "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)", color: "white", padding: "2rem 0", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem" }}>❤ LifeSaver Blood Donation</h1>
        <p>Join our community of life-saving heroes</p>
      </header>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        <section style={{ background: "white", borderRadius: 10, padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <h2 style={{ color: "#d32f2f", marginBottom: "1rem", fontSize: "1.9rem" }}>Become a Blood Donor</h2>
          <form onSubmit={handleSubmit}>
            {/* Personal Info */}
            <h3 style={{ color: "#d32f2f", marginBottom: "1rem" }}>Personal Information</h3>
            <div style={sectionStyle}>
              <div style={fieldStyle}>
                <label htmlFor="name" style={labelStyle}>Full Name</label>
                <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} required style={{ ...inputStyle, textTransform: "capitalize" }} />
              </div>
              <div style={fieldStyle}>
                <label htmlFor="email" style={labelStyle}>Email</label>
                <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required style={inputStyle} />
              </div>
            </div>

            <div style={sectionStyle}>
              <div style={fieldStyle}>
                <label htmlFor="phone" style={labelStyle}>Phone</label>
                <input id="phone" name="phone" type="tel" pattern="[0-9]{10}" placeholder="e.g. 0987654321" value={formData.phone} onChange={handleInputChange} required style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label htmlFor="date_of_birth" style={labelStyle}>Date of Birth</label>
                <input id="date_of_birth" name="date_of_birth" type="date" max={todayStr} value={formData.date_of_birth} onChange={handleInputChange} required style={inputStyle} />
                {formData.date_of_birth && (
                  <p style={{ color: isEligible ? "green" : "red", marginTop: "0.25rem" }}>
                    {isEligible ? "You are eligible to donate blood." : "You are NOT eligible to donate blood."}
                  </p>
                )}
              </div>
            </div>

            {/* Blood Type & Gender */}
            <div style={sectionStyle}>
              <div style={fieldStyle}>
                <label htmlFor="blood_type" style={labelStyle}>Blood Type</label>
                <select id="blood_type" name="blood_type" value={formData.blood_type} onChange={handleInputChange} required style={inputStyle}>
                  <option value="">Select Blood Type</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label htmlFor="gender" style={labelStyle}>Gender</label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} required style={inputStyle}>
                  <option value="">Select Gender</option>
                  {["Female", "Male", "Other", "Prefer not to say"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isEligible}
              style={{
                background: loading ? "#ccc" : "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)",
                color: "white",
                border: "none",
                padding: "1rem 2rem",
                fontSize: "1.1rem",
                borderRadius: 6,
                cursor: loading ? "not-allowed" : "pointer",
                display: "block",
                margin: "2rem auto 0",
                width: 200,
              }}
            >
              {loading ? "Registering..." : "Register Now"}
            </button>
          </form>
        </section>
      </main>

      <footer style={{ background: "#333", color: "white", textAlign: "center", padding: "2rem 0", marginTop: "3rem" }}>
        <p>© {new Date().getFullYear()} LifeSaver Blood Donation Program</p>
        <p>Contact us: info@lifesaver.org | (800) 555-LIFE</p>
      </footer>
    </div>
  );
};

export default Donors;
