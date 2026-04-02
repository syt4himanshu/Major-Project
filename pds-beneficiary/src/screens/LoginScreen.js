import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
    const { login } = useAuth();
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1); // 1 = enter mobile, 2 = enter OTP
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        if (!mobile.trim()) return Alert.alert("Error", "Enter your mobile number");
        setLoading(true);
        try {
            await api.post("/auth/otp/send", { mobile: mobile.trim() });
            setStep(2);
        } catch (err) {
            Alert.alert("Error", err.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim()) return Alert.alert("Error", "Enter the OTP");
        setLoading(true);
        try {
            const res = await api.post("/auth/otp/verify", {
                mobile: mobile.trim(),
                otp: otp.trim(),
            });
            await login(res.data.token);
        } catch (err) {
            Alert.alert("Error", err.response?.data?.error || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.card}>
                <Text style={styles.logo}>🌾 PDS</Text>
                <Text style={styles.title}>Beneficiary Login</Text>
                <Text style={styles.subtitle}>
                    {step === 1 ? "Enter your registered mobile number" : `OTP sent to ${mobile}`}
                </Text>

                {step === 1 ? (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="+91XXXXXXXXXX"
                            keyboardType="phone-pad"
                            value={mobile}
                            onChangeText={setMobile}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={styles.btn}
                            onPress={handleSendOtp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.btnText}>Send OTP</Text>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter 6-digit OTP"
                            keyboardType="number-pad"
                            value={otp}
                            onChangeText={setOtp}
                            maxLength={6}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={styles.btn}
                            onPress={handleVerifyOtp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.btnText}>Verify OTP</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setStep(1)} style={styles.back}>
                            <Text style={styles.backText}>← Change number</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f4ff",
        justifyContent: "center",
        padding: 24,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 28,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    logo: { fontSize: 40, textAlign: "center", marginBottom: 8 },
    title: {
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
        color: "#1a1a2e",
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 24,
    },
    input: {
        borderWidth: 1.5,
        borderColor: "#dde3f0",
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: "#f8f9ff",
    },
    btn: {
        backgroundColor: "#1a73e8",
        borderRadius: 10,
        padding: 15,
        alignItems: "center",
    },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    back: { marginTop: 16, alignItems: "center" },
    backText: { color: "#1a73e8", fontSize: 14 },
});
