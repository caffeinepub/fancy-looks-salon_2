import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface StaffProfile {
    id: bigint;
    isPremium: boolean;
    name: string;
    createdAt: bigint;
    photoUrl: string;
    isActive: boolean;
    shiftStart: string;
    shiftEnd: string;
}
export interface EarningsEntry {
    id: bigint;
    total: bigint;
    staffId: bigint;
    date: string;
    parts: Array<bigint>;
}
export interface AttendanceRecord {
    id: bigint;
    staffId: bigint;
    date: string;
    isEarlyExit: boolean;
    isLate: boolean;
    checkInTime?: bigint;
    checkOutTime?: bigint;
    overtimeMinutes: bigint;
}
export interface UserProfile {
    name: string;
    role: string;
}
export interface NotificationEvent {
    id: bigint;
    staffName: string;
    staffId: bigint;
    message: string;
    timestamp: bigint;
    eventType: Variant_checkIn_checkOut;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_checkIn_checkOut {
    checkIn = "checkIn",
    checkOut = "checkOut"
}
export interface backendInterface {
    addOrUpdateEarningsEntry(adminPassword: string, staffId: bigint, date: string, parts: Array<bigint>): Promise<bigint>;
    addStaff(adminPassword: string, name: string, photoUrl: string, shiftStart: string, shiftEnd: string, isPremium: boolean): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkIn(staffId: bigint): Promise<bigint>;
    checkOut(staffId: bigint): Promise<bigint>;
    getAllStaff(): Promise<Array<StaffProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEarningsByStaffAndMonth(staffId: bigint, year: bigint, month: bigint): Promise<Array<EarningsEntry>>;
    getRecentNotifications(limit: bigint): Promise<Array<NotificationEvent>>;
    getStaffById(id: bigint): Promise<StaffProfile>;
    getTodayAttendance(): Promise<Array<AttendanceRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeStaff(adminPassword: string, id: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateStaff(adminPassword: string, id: bigint, name: string, photoUrl: string, shiftStart: string, shiftEnd: string, isPremium: boolean, isActive: boolean): Promise<void>;
    verifyAdminPassword(password: string): Promise<boolean>;
}
