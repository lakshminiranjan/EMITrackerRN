import { db } from "@/lib/firebase";
import { useUser } from "@clerk/clerk-expo";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Card,
  Chip,
  Divider,
  ProgressBar,
  Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AnalyticsScreen() {
  const { user } = useUser();
  const [emis, setEmis] = useState<any[]>([]);

  // 🔥 FIREBASE FETCH ONLY HERE
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

  // 🔥 CALCULATIONS
  const totalPaid = useMemo(() => {
    return emis.reduce(
      (sum, e) => sum + e.monthlyEmi * e.emisPaid,
      0
    );
  }, [emis]);

  const totalLoan = useMemo(() => {
    return emis.reduce((sum, e) => sum + e.loanAmount, 0);
  }, [emis]);

  const totalRemaining = totalLoan - totalPaid;

  const monthlyAverage = useMemo(() => {
    return emis.reduce((sum, e) => sum + e.monthlyEmi, 0);
  }, [emis]);

  const completion = totalLoan
    ? totalPaid / totalLoan
    : 0;

  const activeEmis = emis.filter(
    (e) => e.emisPaid < e.totalEmis
  ).length;

  // 🔥 Animated Pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 🔥 Smart Financial Health Score
  const financialHealthScore = Math.round(
    completion * 100
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <Card style={styles.headerCard}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Analytics
          </Text>
          <Text style={styles.headerSub}>
            Financial overview
          </Text>
        </Card>

        {/* STATS GRID */}
        <View style={styles.grid}>

          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              ₹ {totalPaid.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>
              Total Paid
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              ₹ {totalRemaining.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>
              Remaining
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {activeEmis}
            </Text>
            <Text style={styles.statLabel}>
              Active EMIs
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.round(completion * 100)}%
            </Text>
            <ProgressBar
              progress={completion}
              color="#4CAF50"
              style={{ marginTop: 8, height: 6 }}
            />
            <Text style={styles.statLabel}>
              Completion
            </Text>
          </Card>
        </View>

        {/* MONTHLY OUTFLOW */}
        <Card style={styles.monthlyCard}>
          <Text variant="titleMedium">
            Monthly Outflow
          </Text>

          <Animated.Text
            style={[
              styles.bigAmount,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            ₹ {monthlyAverage.toLocaleString()}
          </Animated.Text>

          <Chip style={styles.stableChip}>
            Stable this month
          </Chip>
        </Card>

        {/* 🔥 SMART INSIGHTS SECTION */}
        <Card style={styles.insightCard}>
          <Text variant="titleMedium">
            Financial Health Score
          </Text>

          <Text style={styles.healthScore}>
            {financialHealthScore}%
          </Text>

          <ProgressBar
            progress={completion}
            color="#6C4AB6"
            style={{ height: 8, borderRadius: 10 }}
          />

          <Divider style={{ marginVertical: 15 }} />

          <Text variant="titleSmall">
            Smart Insight
          </Text>

          {completion > 0.7 ? (
            <Text style={styles.insightText}>
              Excellent progress. You're managing EMIs efficiently.
            </Text>
          ) : completion > 0.4 ? (
            <Text style={styles.insightText}>
              Good progress. Consider prepaying smaller loans.
            </Text>
          ) : (
            <Text style={styles.insightText}>
              Focus on reducing outstanding EMIs to improve health score.
            </Text>
          )}
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  headerCard: {
    margin: 16,
    padding: 20,
    borderRadius: 26,
    backgroundColor: "#6C4AB6", // 🔥 brand violet
  },

  headerTitle: {
    color: "#fff",
    fontWeight: "700",
  },

  headerSub: {
    color: "#EDE7F6",
    marginTop: 4,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 16,
  },

  statCard: {
    width: "48%",
    marginBottom: 16,
    padding: 18,
    borderRadius: 22,
    elevation: 3,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },

  statLabel: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 6,
  },

  monthlyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#F3EFFF",
  },

  bigAmount: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 10,
  },

  stableChip: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
  },

  insightCard: {
    marginHorizontal: 16,
    marginBottom: 25,
    padding: 20,
    borderRadius: 24,
  },

  healthScore: {
    fontSize: 32,
    fontWeight: "700",
    marginVertical: 10,
    color: "#6C4AB6",
  },

  insightText: {
    marginTop: 8,
    opacity: 0.7,
  },
});