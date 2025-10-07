// src/pages/Blood_banks.tsx
import React, { useEffect, useState, useCallback } from "react";
import ProtectedLayout from "../components/ProtectedLayout";
import supabase from "../utils/supabaseClient";

interface BloodBank {
    id: string;
    name: string;
    location?: string;
    created_at?: string;
}

const BloodBanks: React.FC = () => {
    const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false); // State to check user role
    
    // State for the new blood bank form
    const [newName, setNewName] = useState("");
    const [newLocation, setNewLocation] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [insertError, setInsertError] = useState<string | null>(null);


    // #########################################
    // # DATA FETCHING FUNCTIONS               #
    // #########################################

    const fetchBanks = useCallback(async () => {
        setError(null);
        const { data, error } = await supabase.from("blood_banks").select("*");
        
        if (error) {
            console.error("Supabase Error:", error);
            setError(error.message);
        } else {
            setBloodBanks(data || []);
        }
        setLoading(false);
    }, []);

    const checkAdminRole = useCallback(async () => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;
        
        const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        if (error) {
            console.error("Role Check Error:", error);
            // Optionally set error or just default to non-admin
        } else {
            setIsAdmin(data.role === 'admin');
        }
    }, []);

    useEffect(() => {
        checkAdminRole();
        fetchBanks();
    }, [fetchBanks, checkAdminRole]);


    // #########################################
    // # ADMIN INSERT FUNCTION                 #
    // #########################################

    const handleInsert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setIsSubmitting(true);
        setInsertError(null);

        const { error } = await supabase
            .from("blood_banks")
            .insert({ 
                name: newName.trim(), 
                location: newLocation.trim() || null 
            });

        if (error) {
            console.error("Insert Error:", error);
            setInsertError("Failed to add bank: " + error.message);
        } else {
            // Success: Clear form and re-fetch the list
            setNewName("");
            setNewLocation("");
            await fetchBanks();
        }

        setIsSubmitting(false);
    };

    // #########################################
    // # RENDER LOGIC                          #
    // #########################################

    return (
        <ProtectedLayout>
            <div style={{ padding: "24px" }}>
                <h2>Blood Bank Management</h2>

                {/* --- Admin Form --- */}
                {isAdmin && (
                    <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #f0f0f0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                        <h3>Add New Blood Bank</h3>
                        <form onSubmit={handleInsert} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Bank Name (e.g., Central BB)"
                                required
                                disabled={isSubmitting}
                                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }}
                            />
                            <input
                                type="text"
                                value={newLocation}
                                onChange={(e) => setNewLocation(e.target.value)}
                                placeholder="Location (Optional)"
                                disabled={isSubmitting}
                                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }}
                            />
                            <button 
                                type="submit" 
                                disabled={isSubmitting || !newName.trim()}
                                style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                {isSubmitting ? 'Adding...' : 'Add Bank'}
                            </button>
                        </form>
                        {insertError && <p style={{ color: 'red', marginTop: '10px' }}>{insertError}</p>}
                    </div>
                )}
                {/* ------------------ */}
                
                <h3>Blood Banks</h3>
                {loading ? <p>Loading...</p> : (
                    error ? (
                        <p style={{color:'red'}}>Error fetching blood banks: {error}</p>
                    ) : bloodBanks.length === 0 ? (
                        <p>No blood banks currently registered in the system.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {bloodBanks.map(bank => (
                                <div key={bank.id} style={{ padding:12, border:"1px solid #ddd", borderRadius:10 }}>
                                    <strong>{bank.name}</strong><br />
                                    {bank.location && <span>Location: {bank.location}</span>}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </ProtectedLayout>
    );
};

export default BloodBanks;