import { getDb } from "../api/queries/connection";
import * as schema from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Check if admin settings already exist
  const existingSettings = await db
    .select()
    .from(schema.adminSettings)
    .limit(1);

  if (existingSettings.length === 0) {
    await db.insert(schema.adminSettings).values({
      adminPaybill: "4189489",
      subscriptionAmount: "2500.00",
      smsProvider: "mobitech",
      smsApiKey: process.env.MOBITECH_API_KEY || null,
      smsSenderId: "EDUPAY",
      darajaConsumerKey: process.env.DARAJA_CONSUMER_KEY || null,
      darajaConsumerSecret: process.env.DARAJA_CONSUMER_SECRET || null,
      darajaPasskey: process.env.DARAJA_PASSKEY || null,
      darajaShortcode: process.env.DARAJA_SHORTCODE || null,
    });
    console.log("✓ Admin settings created");
  }

  // Create sample school if none exists
  const existingSchools = await db.select().from(schema.schools).limit(1);
  if (existingSchools.length === 0) {
    const schoolCode = "SCH" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const [school] = await db.insert(schema.schools).values({
      name: "Greenfield Academy",
      code: schoolCode,
      email: "admin@greenfield.edu",
      phone: "+254712345678",
      address: "Nairobi, Kenya",
      paybillNumber: "522522",
      accountNumber: "Greenfield Academy",
      contactPerson: "Mr. John Kamau",
      contactPhone: "+254712345678",
      subscriptionAmount: "2500.00",
      subscriptionStatus: "active",
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      smsBalance: 100,
      totalSmsSent: 0,
      isActive: true,
    });

    console.log("✓ Sample school created:", schoolCode);

    // Create sample streams
    await db.insert(schema.streams).values([
      { schoolId: 1, name: "Form 1A", grade: "Form 1" },
      { schoolId: 1, name: "Form 1B", grade: "Form 1" },
      { schoolId: 1, name: "Form 2A", grade: "Form 2" },
      { schoolId: 1, name: "Form 2B", grade: "Form 2" },
      { schoolId: 1, name: "Form 3A", grade: "Form 3" },
      { schoolId: 1, name: "Form 3B", grade: "Form 3" },
      { schoolId: 1, name: "Form 4A", grade: "Form 4" },
      { schoolId: 1, name: "Form 4B", grade: "Form 4" },
    ]);
    console.log("✓ Sample streams created");

    // Create sample students
    await db.insert(schema.students).values([
      {
        schoolId: 1,
        streamId: 1,
        admissionNumber: "GF2024001",
        firstName: "James",
        lastName: "Mwangi",
        parentName: "Peter Mwangi",
        parentPhone: "+254711111111",
        parentEmail: "peter@example.com",
        feeBalance: "15000.00",
        pocketMoneyBalance: "2500.00",
      },
      {
        schoolId: 1,
        streamId: 1,
        admissionNumber: "GF2024002",
        firstName: "Mary",
        lastName: "Wanjiku",
        parentName: "Grace Wanjiku",
        parentPhone: "+254722222222",
        parentEmail: "grace@example.com",
        feeBalance: "8000.00",
        pocketMoneyBalance: "1200.00",
      },
      {
        schoolId: 1,
        streamId: 2,
        admissionNumber: "GF2024003",
        firstName: "John",
        lastName: "Ochieng",
        parentName: "Robert Ochieng",
        parentPhone: "+254733333333",
        parentEmail: "robert@example.com",
        feeBalance: "22000.00",
        pocketMoneyBalance: "500.00",
      },
      {
        schoolId: 1,
        streamId: 3,
        admissionNumber: "GF2024004",
        firstName: "Alice",
        lastName: "Mutua",
        parentName: "Jane Mutua",
        parentPhone: "+254744444444",
        parentEmail: "jane@example.com",
        feeBalance: "5000.00",
        pocketMoneyBalance: "3000.00",
      },
      {
        schoolId: 1,
        streamId: 3,
        admissionNumber: "GF2024005",
        firstName: "David",
        lastName: "Kipchoge",
        parentName: "William Kipchoge",
        parentPhone: "+254755555555",
        parentEmail: "william@example.com",
        feeBalance: "18500.00",
        pocketMoneyBalance: "800.00",
      },
      {
        schoolId: 1,
        streamId: 4,
        admissionNumber: "GF2024006",
        firstName: "Sarah",
        lastName: "Akinyi",
        parentName: "Mary Akinyi",
        parentPhone: "+254766666666",
        parentEmail: "mary@example.com",
        feeBalance: "12000.00",
        pocketMoneyBalance: "1500.00",
      },
      {
        schoolId: 1,
        streamId: 5,
        admissionNumber: "GF2024007",
        firstName: "Michael",
        lastName: "Kamau",
        parentName: "Joseph Kamau",
        parentPhone: "+254777777777",
        feeBalance: "9500.00",
        pocketMoneyBalance: "2000.00",
      },
      {
        schoolId: 1,
        streamId: 5,
        admissionNumber: "GF2024008",
        firstName: "Grace",
        lastName: "Njoroge",
        parentName: "Esther Njoroge",
        parentPhone: "+254788888888",
        feeBalance: "30000.00",
        pocketMoneyBalance: "0.00",
      },
      {
        schoolId: 1,
        streamId: 6,
        admissionNumber: "GF2024009",
        firstName: "Peter",
        lastName: "Maina",
        parentName: "George Maina",
        parentPhone: "+254799999999",
        feeBalance: "17500.00",
        pocketMoneyBalance: "5000.00",
      },
      {
        schoolId: 1,
        streamId: 7,
        admissionNumber: "GF2024010",
        firstName: "Lucy",
        lastName: "Wambui",
        parentName: "Ann Wambui",
        parentPhone: "+254700000000",
        feeBalance: "6500.00",
        pocketMoneyBalance: "3500.00",
      },
    ]);
    console.log("✓ Sample students created");

    // Create sample payments
    await db.insert(schema.payments).values([
      {
        schoolId: 1,
        studentId: 1,
        type: "fees",
        amount: "5000.00",
        status: "completed",
        phoneNumber: "+254711111111",
        mpesaReceipt: "RIE2K2J7K8",
      },
      {
        schoolId: 1,
        studentId: 1,
        type: "pocket_money",
        amount: "2500.00",
        status: "completed",
        phoneNumber: "+254711111111",
        mpesaReceipt: "RIE3L3M9N0",
      },
      {
        schoolId: 1,
        studentId: 2,
        type: "fees",
        amount: "7000.00",
        status: "completed",
        phoneNumber: "+254722222222",
      },
      {
        schoolId: 1,
        studentId: 3,
        type: "fees",
        amount: "3000.00",
        status: "completed",
        phoneNumber: "+254733333333",
      },
      {
        schoolId: 1,
        studentId: 4,
        type: "pocket_money",
        amount: "3000.00",
        status: "completed",
        phoneNumber: "+254744444444",
      },
      {
        schoolId: 1,
        studentId: 5,
        type: "fees",
        amount: "1500.00",
        status: "completed",
        phoneNumber: "+254755555555",
      },
    ]);
    console.log("✓ Sample payments created");
  }

  console.log("\n🎉 Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
