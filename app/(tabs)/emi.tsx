import { db } from "@/lib/firebase";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Dialog,
  Menu,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";


export default function EMIPage() {
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();

  const editId =
    typeof params?.editId === "string"
      ? params.editId
      : null;

  const [isEditMode, setIsEditMode] = useState(false);

  const [emiName, setEmiName] = useState("");
  const floatAnim = useState(new Animated.Value(0))[0];
  const [emiType, setEmiType] = useState("Personal Loan");
  const [loanAmount, setLoanAmount] = useState("");
  const [monthlyEmi, setMonthlyEmi] = useState("");
  const [totalEmis, setTotalEmis] = useState("");
  const [emisPaid, setEmisPaid] = useState("0");
  const [dueDay, setDueDay] = useState("");
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [originalData, setOriginalData] = useState<any>(null);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const resetForm = () => {
    setEmiName("");
    setEmiType("Personal Loan");
    setLoanAmount("");
    setMonthlyEmi("");
    setTotalEmis("");
    setEmisPaid("0");
    setDueDay("");
    setStartDate(null);
    setEndDate(null);
  };


  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 🔥 FIXED PARAM LISTENER
  useEffect(() => {
    if (!editId) {
      setIsEditMode(false);
      resetForm();
      return;
    }

    setIsEditMode(true);

    const fetchData = async () => {
      const snap = await getDoc(doc(db, "emis", editId));
      if (snap.exists()) {
        const data: any = snap.data();

        setEmiName(data.emiName ?? "");
        setEmiType(data.emiType ?? "Personal Loan");
        setLoanAmount(String(data.loanAmount ?? ""));
        setMonthlyEmi(String(data.monthlyEmi ?? ""));
        setTotalEmis(String(data.totalEmis ?? ""));
        setEmisPaid(String(data.emisPaid ?? "0"));
        setDueDay(String(data.dueDay ?? ""));

        setStartDate(data.startDate?.toDate?.() ?? null);
        setEndDate(data.endDate?.toDate?.() ?? null);

        setOriginalData({
          emiName: data.emiName ?? "",
          emiType: data.emiType ?? "Personal Loan",
          loanAmount: String(data.loanAmount ?? ""),
          monthlyEmi: String(data.monthlyEmi ?? ""),
          totalEmis: String(data.totalEmis ?? ""),
          emisPaid: String(data.emisPaid ?? "0"),
          dueDay: String(data.dueDay ?? ""),
        });
      }
    };

    fetchData();
  }, [editId, params?.refresh]);

  // Auto calculate End Date
  useEffect(() => {
    if (startDate && totalEmis) {
      const calculatedEnd = new Date(startDate);
      calculatedEnd.setMonth(
        calculatedEnd.getMonth() + Number(totalEmis) - 1
      );
      setEndDate(calculatedEnd);
    }
  }, [startDate, totalEmis]);

  const totalPayable = useMemo(() => {
    if (!monthlyEmi || !totalEmis) return 0;
    return Number(monthlyEmi) * Number(totalEmis);
  }, [monthlyEmi, totalEmis]);

  const interestAmount = useMemo(() => {
    if (!loanAmount) return 0;
    return totalPayable - Number(loanAmount);
  }, [loanAmount, totalPayable]);

  const handleSubmit = async () => {
    if (
      !emiName ||
      !loanAmount ||
      !monthlyEmi ||
      !totalEmis ||
      !dueDay ||
      !startDate
    ) {
      setValidationMessage("Please fill all fields");
      setShowValidationDialog(true);
      return;
    }

    if (isEditMode && originalData) {
      const isSame =
        emiName === originalData.emiName &&
        emiType === originalData.emiType &&
        loanAmount === originalData.loanAmount &&
        monthlyEmi === originalData.monthlyEmi &&
        totalEmis === originalData.totalEmis &&
        emisPaid === originalData.emisPaid &&
        dueDay === originalData.dueDay;

      if (isSame) {
        setValidationMessage("Update at least one field");
        setShowValidationDialog(true);
        return;
      }
    }
    if (!user) return;

    const payload = {
      userId: user.id,
      emiName,
      emiType,
      loanAmount: Number(loanAmount),
      monthlyEmi: Number(monthlyEmi),
      totalEmis: Number(totalEmis),
      emisPaid: Number(emisPaid),
      dueDay: Number(dueDay),
      interestAmount,
      startDate: startDate
        ? Timestamp.fromDate(startDate)
        : null,
      endDate: endDate
        ? Timestamp.fromDate(endDate)
        : null,
      updatedAt: Timestamp.now(),
    };

    try {
      if (isEditMode && editId) {
        await updateDoc(doc(db, "emis", editId), payload);

        Toast.show({
          type: "success",
          text1: "EMI Updated Successfully",
        });
      } else {
        await addDoc(collection(db, "emis"), payload);

        Toast.show({
          type: "success",
          text1: "EMI Created Successfully",
        });
      }

      resetForm();
      setIsEditMode(false);

      router.replace("/(tabs)/dashboard");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Something went wrong",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.replace("/(tabs)/dashboard")}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </Pressable>

          <Text variant="headlineMedium" style={styles.titleText}>
            {isEditMode ? "Edit EMI" : "Create New EMI"}
          </Text>
        </View>

        <View style={styles.imageContainer}>
          <Animated.Image
            source={require("../../assets/images/emi.png")}
            style={[
              styles.image,
              {
                transform: [{ translateY: floatAnim }],
              },
            ]}
            resizeMode="contain"
          />
        </View>

        <TextInput
          label="EMI Name"
          mode="outlined"
          value={emiName}
          onChangeText={setEmiName}
          style={styles.input}
        />

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TextInput
              label="EMI Type"
              mode="outlined"
              value={emiType}
              onFocus={() => setMenuVisible(true)}
              style={styles.input}
            />
          }
        >
          {[
            "Personal Loan",
            "Home Loan",
            "Car Loan",
            "Education Loan",
            "Credit Card",
            "Other",
          ].map((type) => (
            <Menu.Item
              key={type}
              onPress={() => {
                setEmiType(type);
                setMenuVisible(false);
              }}
              title={type}
            />
          ))}
        </Menu>

        <View style={styles.row}>
          <TextInput
            label="Loan Amount"
            mode="outlined"
            value={loanAmount}
            onChangeText={setLoanAmount}
            keyboardType="numeric"
            style={styles.halfInput}
          />
          <TextInput
            label="Monthly EMI"
            mode="outlined"
            value={monthlyEmi}
            onChangeText={setMonthlyEmi}
            keyboardType="numeric"
            style={styles.halfInput}
          />
        </View>

        <View style={styles.row}>
          <TextInput
            label="Total EMIs"
            mode="outlined"
            value={totalEmis}
            onChangeText={setTotalEmis}
            keyboardType="numeric"
            style={styles.halfInput}
          />
          <TextInput
            label="EMIs Paid"
            mode="outlined"
            value={emisPaid}
            onChangeText={setEmisPaid}
            keyboardType="numeric"
            style={styles.halfInput}
          />
        </View>

        <View style={styles.row}>
          <TextInput
            label="Due Day (1-31)"
            mode="outlined"
            value={dueDay}
            onChangeText={setDueDay}
            keyboardType="numeric"
            style={styles.halfInput}
          />
          <TextInput
            label="Start Date"
            mode="outlined"
            value={startDate ? startDate.toDateString() : ""}
            onFocus={() => setShowDatePicker(true)}
            style={styles.halfInput}
          />
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setStartDate(selectedDate);
            }}
          />
        )}

        <TextInput
          label="End Date"
          mode="outlined"
          value={endDate ? endDate.toDateString() : ""}
          editable={false}
          style={styles.input}
        />

        <Text style={{ marginTop: 10 }}>
          Interest: ₹ {interestAmount}
        </Text>

        <Button
          mode="contained"
          style={styles.button}
          onPress={handleSubmit}
        >
          {isEditMode ? "Update EMI" : "Save EMI"}
        </Button>
      </ScrollView>

      <Portal>
        <Dialog
          visible={showValidationDialog}
          onDismiss={() => setShowValidationDialog(false)}
        >
          <Dialog.Title>Warning</Dialog.Title>

          <Dialog.Content>
            <Text>{validationMessage}</Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowValidationDialog(false)}>
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
    paddingHorizontal: 16,
  },
  title: {
    marginVertical: 20,
    fontWeight: "bold",
  },
  input: {
    marginBottom: 15,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
    marginBottom: 15,
  },
  button: {
    marginTop: 20,
    paddingVertical: 6,
    borderRadius: 12,
  },
  image: {
    width: 400,
    height: 320,
    marginBottom: -50,
    marginTop: -20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },

  titleText: {
    fontWeight: "bold",
    marginLeft: 10,
  },
});