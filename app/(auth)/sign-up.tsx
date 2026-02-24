import { useOAuth, useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

WebBrowser.maybeCompleteAuthSession();

export default function Page() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [verificationFlow, setVerificationFlow] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [otpError, setOtpError] = React.useState("");
  const [googleLoading, setGoogleLoading] = React.useState(false);

  // 🚨 IMPORTANT: early return AFTER hooks
  if (!isLoaded) return null;

  const onSignUpPress = async () => {
    if (!signUp) return;

    setError("");
    setLoading(true);

    const onVerifyPress = async () => {
      if (!signUp) return;

      if (!verificationCode) {
        setError("Please enter verification code");
        return;
      }

      setError("");
      setVerifying(true);

      try {
        const result = await signUp.attemptEmailAddressVerification({
          code: verificationCode,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          router.replace("/(tabs)/dashboard");
        } else {
          setError("Verification failed. Try again.");
        }

      } catch (err: any) {
        setError(err?.errors?.[0]?.message || "Invalid verification code");
      } finally {
        setVerifying(false);
      }
    };

    try {
      const result = await signUp.create({
        firstName,
        lastName,
        emailAddress,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/dashboard");
      }

      if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setVerificationFlow(true);
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!signUp) return;

    if (!verificationCode) {
      setOtpError("Please enter verification code");
      return;
    }

    setOtpError("");
    setVerifying(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/dashboard");
      } else {
        setOtpError("Invalid verification code");
      }

    } catch (err: any) {
      setOtpError(
        err?.errors?.[0]?.message || "Invalid verification code"
      );
    } finally {
      setVerifying(false);
    }
  };

  const onGooglePress = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const { createdSessionId, setActive: setOAuthActive } =
        await startOAuthFlow();

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        router.replace("/(tabs)/dashboard");
      }
    } catch {
      setError("Google signup failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#6C4AB6" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.topSection}>
          <Image
            source={require("../../assets/images/signup.png")}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <Animated.View entering={FadeInDown.duration(700)} style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter First Name"
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter Last Name"
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            value={emailAddress}
            onChangeText={setEmailAddress}
            placeholder="Enter Email Address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Enter Password"
          />

          <Pressable
            style={[styles.signupBtn, loading && { opacity: 0.6 }]}
            onPress={onSignUpPress}
            disabled={loading}
          >
            <Text style={styles.signupText}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Text>
          </Pressable>

          <View style={styles.orContainer}>
            <View style={styles.line} />
            <Text style={styles.or}>Or</Text>
            <View style={styles.line} />
          </View>

          <Pressable
            style={[
              styles.googleBtn,
              googleLoading && { opacity: 0.6 }
            ]}
            onPress={onGooglePress}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Text style={styles.googleText}>Connecting...</Text>
            ) : (
              <>
                <Image
                  source={require("../../assets/images/google.png")}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleText}>
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text>Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <Text style={styles.signIn}>Sign In</Text>
              </Pressable>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>

      {/* OTP Modal */}
      <Modal visible={verificationFlow} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Verify Email</Text>

            <Text style={styles.label}>Enter OTP sent to email</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={verificationCode}
              onChangeText={setVerificationCode}
            />

            {otpError ? (
              <Text style={styles.otpError}>{otpError}</Text>
            ) : null}

            <Pressable
              style={[styles.signupBtn, verifying && { opacity: 0.6 }]}
              onPress={onVerifyPress}
              disabled={verifying}
            >
              <Text style={styles.signupText}>
                {verifying ? "Verifying..." : "Verify"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingBottom: 20,
  },
  otpError: {
    color: "red",
    marginTop: 5,
    marginBottom: 5,
    fontSize: 13,
  },
  image: { width: 260, height: 260 },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 25,
    paddingBottom: 40,
  },
  label: { fontSize: 14, marginBottom: 6, marginTop: 10, color: "#333" },
  input: {
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  signupBtn: {
    backgroundColor: "#F6C000",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 15,
  },
  signupText: { fontWeight: "600", fontSize: 16 },
  orContainer: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: "#E0E0E0" },
  or: { marginHorizontal: 10, color: "#888" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F2",
    padding: 16,
    borderRadius: 16,
  },
  googleIcon: { width: 22, height: 22, marginRight: 10 },
  googleText: { fontWeight: "600", fontSize: 15 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 25 },
  signIn: { color: "#F6C000", fontWeight: "600" },
  error: { color: "red", textAlign: "center", marginBottom: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    width: "85%",
    padding: 25,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
});