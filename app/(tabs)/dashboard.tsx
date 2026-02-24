import { db } from "@/lib/firebase";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from "react-native";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Dialog,
  Divider,
  Portal,
  ProgressBar,
  Text,
  TextInput
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Toast } from "react-native-toast-message/lib/src/Toast";


if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
};

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();

  const [emis, setEmis] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [viewEmi, setViewEmi] = useState<any>(null);
  const [showUpcomingGrid, setShowUpcomingGrid] = useState(false);
  const [dueEmis, setDueEmis] = useState<any[]>([]);
  const [currentDueIndex, setCurrentDueIndex] = useState(0);
  const [showDueDialog, setShowDueDialog] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "emis"),
      where("userId", "==", user.id)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmis(data);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!emis.length) return;

    const today = new Date().getDate();

    const allDueToday = emis.filter(
      (emi) =>
        emi.dueDay === today &&
        emi.emisPaid < emi.totalEmis
    );

    if (allDueToday.length > 0) {
      setDueEmis(allDueToday);
      setCurrentDueIndex(0);
      setShowDueDialog(true);
    }
  }, [emis]);



  const filteredEmis = useMemo(() => {
    return emis.filter((e) =>
      e.emiName?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, emis]);

  const totalMonthly = useMemo(() => {
    return emis.reduce((s, e) => s + (e.monthlyEmi || 0), 0);
  }, [emis]);

  const getNextDueDate = (dueDay: number) => {
    const now = new Date();
    let due = new Date(now.getFullYear(), now.getMonth(), dueDay);
    if (due < now) {
      due = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
    }
    const diff =
      (due.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24);

    return {
      date: due.toDateString(),
      days: Math.ceil(diff),
    };
  };

  const upcomingEmis = emis.filter((e) => e.emisLeft > 0);

  const nearestUpcoming = useMemo(() => {
    if (!upcomingEmis.length) return null;

    return [...upcomingEmis].sort(
      (a, b) =>
        getNextDueDate(a.dueDay).days -
        getNextDueDate(b.dueDay).days
    )[0];
  }, [emis]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.easeInEaseOut();
    setExpandedId(expandedId === id ? null : id);
  };


  const handleDuePaid = async () => {
    const currentEmi = dueEmis[currentDueIndex];
    if (!currentEmi) return;

    const newPaid = currentEmi.emisPaid + 1;

    await updateDoc(doc(db, "emis", currentEmi.id), {
      emisPaid: newPaid,
    });

    Toast.show({
      type: "success",
      text1: `${currentEmi.emiName} marked as paid`,
    });

    moveToNextDue();
  };

  const moveToNextDue = () => {
    if (currentDueIndex < dueEmis.length - 1) {
      setCurrentDueIndex(currentDueIndex + 1);
    } else {
      setShowDueDialog(false);
      setDueEmis([]);
      setCurrentDueIndex(0);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteDoc(doc(db, "emis", deleteId));

      Toast.show({
        type: "success",
        text1: "EMI Deleted Successfully",
      });

      setShowDelete(false);
      setDeleteId(null);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to delete EMI",
      });
    }
  };

  const initial =
    user?.firstName?.charAt(0).toUpperCase() ?? "U";

  function GridRow({ label, value }: any) {
    return (
      <View style={styles.gridRow}>
        <Text style={styles.gridLabel}>{label}</Text>
        <Text style={styles.gridValue}>{value}</Text>
      </View>
    );
  }

  return (

    <SafeAreaView style={styles.container}>
      <ScrollView>

        {/* HEADER */}
        <View style={styles.header}>

          <Pressable
            style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Avatar.Text size={45} label={initial} />

            <View style={{ marginLeft: 12 }}>
              <Text variant="bodySmall">{getGreeting()}</Text>
              <Text
                variant="titleMedium"
                style={{ fontWeight: "700" }}
              >
                {user?.firstName}
              </Text>
            </View>
          </Pressable>

          <Ionicons name="notifications-outline" size={22} />
        </View>

        <TextInput
          mode="outlined"
          placeholder="Search EMIs..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.search}
        />

        {/* TOTAL CARD */}

        <Card style={styles.totalCard}>
          <View style={styles.circleLarge} />
          <View style={styles.circleMedium} />

          <Card.Content style={styles.totalContent}>
            <Text style={styles.totalLabel}>
              Total Monthly EMI
            </Text>

            <Text style={styles.totalAmount}>
              ₹ {totalMonthly}
            </Text>

            <Text style={styles.totalSub}>
              Stable this month
            </Text>
          </Card.Content>
        </Card>
        {/* UPCOMING */}
        {nearestUpcoming && (
          <>
            <View style={styles.sectionRow}>
              <Text variant="titleMedium">
                Upcoming Payment
              </Text>
              <Pressable onPress={() => setShowUpcomingGrid(true)}>
                <Text style={{ color: "#1976D2" }}>
                  View all
                </Text>
              </Pressable>
            </View>

            <Card style={styles.card}>
              <Card.Content style={styles.rowBetween}>
                <View>
                  <Text variant="bodySmall">
                    Next payment upcoming
                  </Text>
                  <Text variant="titleSmall">
                    {nearestUpcoming.emiName}
                  </Text>
                  <Text variant="bodySmall">
                    {getNextDueDate(nearestUpcoming.dueDay).date} (
                    {getNextDueDate(nearestUpcoming.dueDay).days} days left)
                  </Text>
                </View>
                <Text style={{ fontWeight: "700" }}>
                  ₹ {nearestUpcoming.monthlyEmi}
                </Text>
              </Card.Content>
            </Card>
          </>
        )}

        {/* YOUR EMIS */}
        <Text style={styles.sectionTitle}>
          Your EMIs
        </Text>

        {filteredEmis.map((emi) => {
          const percent =
            emi.totalEmis > 0
              ? emi.emisPaid / emi.totalEmis
              : 0;

          return (
            <Card key={emi.id} style={styles.card}>
              <Card.Content>
                <Pressable
                  style={styles.rowBetween}
                  onPress={() => toggleExpand(emi.id)}
                >
                  <View style={styles.row}>
                    <Avatar.Icon size={40} icon="cash" />
                    <View style={{ marginLeft: 10 }}>
                      <Text variant="titleSmall">
                        {emi.emiName}
                      </Text>
                      <Text variant="bodySmall">
                        ₹ {emi.monthlyEmi}/month
                      </Text>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <Chip>Active</Chip>
                    <Ionicons
                      name={
                        expandedId === emi.id
                          ? "chevron-up"
                          : "chevron-down"
                      }
                      size={18}
                    />
                  </View>
                </Pressable>

                {expandedId === emi.id && (
                  <>
                    <Divider style={{ marginVertical: 10 }} />
                    <Text variant="bodySmall">
                      EMI {emi.emisPaid} of {emi.totalEmis}
                    </Text>
                    <ProgressBar progress={percent} />

                    <View style={styles.actions}>
                      <Button
                        mode="outlined"
                        onPress={() => setViewEmi(emi)}
                      >
                        View
                      </Button>

                      <Button
                        mode="contained-tonal"
                        onPress={() =>
                          router.push({
                            pathname: "/(tabs)/emi",
                            params: {
                              editId: emi.id,
                              refresh: Date.now().toString(),
                            },
                          })
                        }
                      >
                        Edit
                      </Button>

                      <Button
                        textColor="red"
                        onPress={() => {
                          setDeleteId(emi.id);
                          setShowDelete(true);
                        }}
                      >
                        Delete
                      </Button>
                    </View>
                  </>
                )}
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>

      {/* VIEW GRID */}
      <Modal visible={!!viewEmi} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            {viewEmi && (
              <>
                <Text style={styles.modalTitle}>
                  EMI Details
                </Text>

                <GridRow label="EMI Name" value={viewEmi.emiName} />
                <GridRow label="EMI Type" value={viewEmi.emiType} />
                <GridRow label="Loan Amount" value={`₹ ${viewEmi.loanAmount}`} />
                <GridRow label="Monthly EMI" value={`₹ ${viewEmi.monthlyEmi}`} />
                <GridRow label="Total EMIs" value={viewEmi.totalEmis} />
                <GridRow label="EMIs Paid" value={viewEmi.emisPaid} />
                <GridRow label="EMIs Left" value={viewEmi.emisLeft} />
                <GridRow
                  label="Total Yet To Pay"
                  value={`₹ ${viewEmi.emisLeft * viewEmi.monthlyEmi}`}
                />
                <GridRow label="Due Day" value={viewEmi.dueDay} />
                <GridRow
                  label="Start Date"
                  value={
                    viewEmi.startDate?.toDate
                      ? viewEmi.startDate.toDate().toDateString()
                      : "-"
                  }
                />
                <GridRow
                  label="End Date"
                  value={
                    viewEmi.endDate?.toDate
                      ? viewEmi.endDate.toDate().toDateString()
                      : "-"
                  }
                />
                <GridRow
                  label="Interest Amount"
                  value={`₹ ${viewEmi.interestAmount}`}
                />
                <GridRow
                  label="Interest %"
                  value={`${viewEmi.interestPercent ?? 0}%`}
                />
              </>
            )}

            <Button
              mode="contained"
              onPress={() => setViewEmi(null)}
              style={{ marginTop: 20, borderRadius: 30 }}
            >
              Close
            </Button>

          </View>
        </View>
      </Modal>
      {/* UPCOMING GRID */}
      <Modal visible={showUpcomingGrid} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.gridTitle}>
              All Upcoming EMIs
            </Text>

            {upcomingEmis.map((e) => (
              <View key={e.id} style={styles.gridRow}>
                <Text style={{ fontWeight: "600" }}>
                  {e.emiName}
                </Text>
                <Text>₹ {e.monthlyEmi}</Text>
              </View>
            ))}

            <Button
              mode="contained"
              onPress={() => setShowUpcomingGrid(false)}
              style={{ marginTop: 15 }}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>

      <Portal>
        <Dialog visible={showDelete} onDismiss={() => setShowDelete(false)}>
          <Dialog.Title>Delete EMI?</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete this EMI?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button textColor="red" onPress={handleDelete}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={showDueDialog} onDismiss={() => setShowDueDialog(false)}>
          <Dialog.Title>EMI Due Today</Dialog.Title>
          <Dialog.Content>
            <Text>
              {dueEmis[currentDueIndex]?.emiName} EMI of ₹
              {dueEmis[currentDueIndex]?.monthlyEmi} is due today.
            </Text>
            <Text style={{ marginTop: 8 }}>
              Did you complete the payment?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={moveToNextDue}>
              Not Yet
            </Button>
            <Button onPress={handleDuePaid}>
              Yes, Paid
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F5F9", paddingTop: 15 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  totalCard: {
    marginHorizontal: 16,
    marginBottom: 25,
    borderRadius: 24,
    backgroundColor: "#6C4AB6",
    height: 130,              // 🔥 bigger height
    justifyContent: "center", // 🔥 vertical center
    overflow: "hidden",
    elevation: 6,
  },

  totalContent: {
    justifyContent: "center",
  },

  totalLabel: {
    color: "#E6DBFF",
    fontSize: 16,
  },

  totalAmount: {
    color: "#FFFFFF",
    fontSize: 36,        // 🔥 bigger amount
    fontWeight: "700",
    marginVertical: 6,
  },

  totalSub: {
    color: "#E0D9F5",
    fontSize: 14,
  },

  /* Circles */

  circleLarge: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.08)",
    right: -40,
    top: -40,
  },

  circleMedium: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.05)",
    right: 30,
    bottom: -60,
  },
  search: { marginHorizontal: 16, marginBottom: 20 },


  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 10,
  },

  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "600",
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    width: "88%",
    marginTop: 40,   // 🔥 Added top margin
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
  },

  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  gridLabel: {
    fontWeight: "600",
    fontSize: 14,
  },

  gridValue: {
    fontSize: 14,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  row: { flexDirection: "row", alignItems: "center" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },


  gridTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },

});