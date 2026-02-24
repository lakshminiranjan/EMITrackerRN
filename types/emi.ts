export interface EMI {
  id: string;
  userId: string;
  emiName: string;
  totalAmount: number;
  monthlyEmi: number;
  dueDate: string; // store as ISO string
  totalEmis: number;
  emisPaid: number;
  emisLeft: number;
  createdAt: any;
}