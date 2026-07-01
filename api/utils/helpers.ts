// Generate a unique school code
export function generateSchoolCode(): string {
  const prefix = "SCH";
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString(36).substring(-2).toUpperCase();
  return `${prefix}${random}${timestamp}`;
}

// Format phone number to international format
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s/g, "").replace(/-/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "+254" + cleaned.substring(1);
  }
  if (!cleaned.startsWith("+")) {
    cleaned = "+254" + cleaned;
  }
  return cleaned;
}

// Format currency to KSH
export function formatKSH(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `KSH ${num.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Generate a unique admission number
export function generateAdmissionNumber(prefix: string, count: number): string {
  const year = new Date().getFullYear();
  const sequence = (count + 1).toString().padStart(4, "0");
  return `${prefix}${year}${sequence}`;
}

// Generate random password
export function generatePassword(length = 10): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Get current date in Kenya timezone
export function getKenyaDate(): Date {
  return new Date();
}

// Add days to a date
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Format date for display
export function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
