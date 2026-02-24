import { SignedIn, SignedOut } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <>
      <SignedIn>
        <Tabs
          screenOptions={{
            headerShown: false, // 🔥 removes top page name
            tabBarActiveTintColor: "#1976D2",
            tabBarInactiveTintColor: "#777",
            tabBarStyle: {
              height: 60,
              paddingBottom: 6,
            },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: "Dashboard",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="grid-outline" size={size} color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="emi"
            options={{
              title: "EMI",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="cash-outline" size={size} color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="analytics"
            options={{
              title: "Analytics",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="stats-chart-outline" size={size} color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </SignedIn>

      <SignedOut>
        <Redirect href="../(auth)/sign-in" />
      </SignedOut>
    </>
  );
}