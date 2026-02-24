import { db } from "@/lib/firebase";
import { useClerk, useUser } from "@clerk/clerk-expo";
import * as LocalAuthentication from "expo-local-authentication";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Avatar,
  Button,
  Card,
  Divider,
  List,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user } = useUser();
  const clerk = useClerk();
  const theme = useTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [editing, setEditing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);


  const [biometric, setBiometric] = useState(false);

  // Load profile
  useEffect(() => {
    if (!user) return;

    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");

    const loadProfile = async () => {
      const snap = await getDoc(doc(db, "profiles", user.id));
      if (snap.exists()) {
        const data = snap.data();
        setPhone(data.phone || "");

        setBiometric(data.biometric || false);
      }
    };

    loadProfile();
  }, [user]);

  // Save profile
  const handleSave = async () => {
    if (!user) return;

    try {
      await user.update({
        firstName,
        lastName,
      });

      await setDoc(doc(db, "profiles", user.id), {
        phone,
        biometric,
      }, { merge: true });

      await user.reload();

      setEditing(false);
      Alert.alert("Profile Updated");
    } catch (error) {
      Alert.alert("Error updating profile");
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;

    try {
      setSigningOut(true);
      await clerk.signOut();
    } catch (error) {
      Alert.alert("Error signing out");
    } finally {
      setSigningOut(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user) return;

            try {
              setDeleting(true);

              await deleteDoc(doc(db, "profiles", user.id));
              await user.delete();

            } catch (error) {
              Alert.alert("Error deleting account");
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const initial =
    firstName?.charAt(0)?.toUpperCase() || "U";

  const handleDarkToggle = async (value: boolean) => {
    if (!user) return;



    await setDoc(
      doc(db, "profiles", user.id),
      {
        phone,
        darkMode: value,
        biometric,
      },
      { merge: true }
    );
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (!user) return;

    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert("Biometric not available on this device");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm to enable biometric lock",
      });

      if (!result.success) {
        Alert.alert("Authentication failed");
        return;
      }
    }

    setBiometric(value);

    await setDoc(
      doc(db, "profiles", user.id),
      {
        phone,
        biometric: value,
      },
      { merge: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>

        {/* PROFILE CARD */}
        <Card style={styles.profileCard}>
          <View style={{ alignItems: "center" }}>
            <Avatar.Text
              size={90}
              label={initial}
              style={{
                backgroundColor: theme.colors.primary,
              }}
            />

            {!editing && (
              <>
                <Text
                  variant="titleLarge"
                  style={{ marginTop: 12 }}
                >
                  {firstName} {lastName}
                </Text>

                <Text style={{ opacity: 0.6 }}>
                  {user?.primaryEmailAddress?.emailAddress}
                </Text>

                <Text style={{ marginTop: 8 }}>
                  {phone ? phone : "Add your number"}
                </Text>

                <Button
                  mode="text"
                  onPress={() => setEditing(true)}
                >
                  Edit Profile
                </Button>
              </>
            )}
          </View>

          {editing && (
            <View style={{ marginTop: 20 }}>
              <TextInput
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
              />

              <TextInput
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
              />

              <TextInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.input}
              />

              <Button
                mode="contained"
                onPress={handleSave}
                style={{ marginTop: 10 }}
              >
                Save
              </Button>
            </View>
          )}
        </Card>

        {/* PREFERENCES */}
        <Text style={styles.section}>
          Preferences
        </Text>

        <Card style={styles.card}>


          <List.Item
            title="Biometric Lock"
            right={() => (
              <Switch
                value={biometric}
                onValueChange={handleBiometricToggle}
              />
            )}
          />
        </Card>

        {/* ACCOUNT */}
        <Text style={styles.section}>
          Account
        </Text>

        <Card style={styles.card}>
          <List.Item
            title={signingOut ? "Signing out..." : "Sign Out"}
            onPress={handleSignOut}
            disabled={signingOut}
          />

          <Divider />

          <List.Item
            title={deleting ? "Deleting..." : "Delete Account"}
            titleStyle={{ color: "red" }}
            onPress={handleDelete}
            disabled={deleting}
          />
        </Card>
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            EMITracker
          </Text>
          <Text style={styles.versionSub}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  profileCard: {
    margin: 16,
    padding: 20,
    borderRadius: 24,
  },

  versionContainer: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: "center",
  },

  versionText: {
    fontWeight: "600",
    opacity: 0.6,
  },

  versionSub: {
    fontSize: 12,
    opacity: 0.4,
  },

  section: {
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 8,
    fontWeight: "600",
    opacity: 0.6,
  },

  card: {
    marginHorizontal: 16,
    borderRadius: 20,
  },

  input: {
    width: "100%",
    marginTop: 10,
  },
});