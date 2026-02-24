import { useOAuth, useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

WebBrowser.maybeCompleteAuthSession();

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [googleLoading, setGoogleLoading] = React.useState(false);
  const onSignInPress = async () => {
    if (!isLoaded) return;

    if (!emailAddress || !password) {
      setError("Please enter email and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/dashboard");
      } else {
        setError("Login failed");
      }

    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Invalid credentials");
    } finally {
      setLoading(false);
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
    } catch (err: any) {
      setError("Google login failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#6C4AB6" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* TOP IMAGE SECTION */}
      <View style={styles.topSection}>
        <Image
          source={require("../../assets/images/signin.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* WHITE CARD */}
      <Animated.View
        entering={FadeInDown.duration(700)}
        style={styles.card}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}

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
          style={[
            styles.loginBtn,
            loading && { opacity: 0.6 }
          ]}
          onPress={onSignInPress}
          disabled={loading}
        >
          <Text style={styles.loginText}>
            {loading ? "Logging in..." : "Login"}
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
          <Text>Don't have an account? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable>
              <Text style={styles.signUp}>Sign Up</Text>
            </Pressable>
          </Link>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topSection: {
    flex: 1.1,
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: 260,
    height: 260,
  },

  card: {
    flex: 1.4,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 25,
  },

  label: {
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10,
    color: "#333",
  },

  input: {
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  loginBtn: {
    backgroundColor: "#F6C000",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 15,
  },

  loginText: {
    fontWeight: "600",
    fontSize: 16,
  },

  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },

  or: {
    marginHorizontal: 10,
    color: "#888",
  },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F2",
    padding: 16,
    borderRadius: 16,
  },

  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },

  googleText: {
    fontWeight: "600",
    fontSize: 15,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },

  signUp: {
    color: "#F6C000",
    fontWeight: "600",
  },

  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});