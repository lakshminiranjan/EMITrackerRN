import { db } from "@/lib/firebase";
import { ClerkProvider, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import {
  DarkTheme as NavDark,
  DefaultTheme as NavLight,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <ThemeController />
    </ClerkProvider>
  );
}

function ThemeController() {
  const { user } = useUser();
  const [isDark, setIsDark] = useState(false);

  // 🔥 Load dark mode from Firestore
  useEffect(() => {
    if (!user) return;

    const loadTheme = async () => {
      const snap = await getDoc(doc(db, "profiles", user.id));
      if (snap.exists()) {
        const data = snap.data();
        setIsDark(data.darkMode || false);
      }
    };

    loadTheme();
  }, [user]);

  return (
    <PaperProvider theme={isDark ? MD3DarkTheme : MD3LightTheme}>
      <ThemeProvider value={isDark ? NavDark : NavLight}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>

        <StatusBar style={isDark ? "light" : "dark"} />

        <Toast position="top" topOffset={100} />
      </ThemeProvider>
    </PaperProvider>
  );
}