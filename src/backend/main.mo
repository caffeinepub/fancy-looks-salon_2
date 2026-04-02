import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Iter "mo:core/Iter";



actor {
  // Keep these stable variables for upgrade compatibility
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    role : Text;
  };

  module StaffProfile {
    public func compareByName(a : StaffProfile, b : StaffProfile) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  public type StaffProfile = {
    id : Nat;
    name : Text;
    photoUrl : Text;
    shiftStart : Text;
    shiftEnd : Text;
    isPremium : Bool;
    isActive : Bool;
    createdAt : Int;
  };

  public type AttendanceRecord = {
    id : Nat;
    staffId : Nat;
    date : Text;
    checkInTime : ?Int;
    checkOutTime : ?Int;
    isLate : Bool;
    isEarlyExit : Bool;
    overtimeMinutes : Nat;
  };

  public type EarningsEntry = {
    id : Nat;
    staffId : Nat;
    date : Text;
    parts : [Nat];
    total : Nat;
  };

  public type NotificationEvent = {
    id : Nat;
    staffId : Nat;
    staffName : Text;
    eventType : {
      #checkIn;
      #checkOut;
    };
    timestamp : Int;
    message : Text;
  };

  public type HalfDayRecord = {
    id : Nat;
    staffId : Nat;
    date : Text;
    markedAt : Int;
  };

  // Stable storage — data persists across canister upgrades
  stable var userProfiles = Map.empty<Principal, UserProfile>();
  stable var staffProfiles = Map.empty<Nat, StaffProfile>();
  stable var attendanceRecords = Map.empty<Nat, AttendanceRecord>();
  stable var earningsEntries = Map.empty<Nat, EarningsEntry>();
  stable var notificationEvents = Map.empty<Nat, NotificationEvent>();
  stable var halfDayRecords = Map.empty<Nat, HalfDayRecord>();
  stable var staffPasswords = Map.empty<Nat, Text>();

  stable var nextStaffId = 1;
  stable var nextAttendanceId = 1;
  stable var nextEarningsId = 1;
  stable var nextNotificationId = 1;
  stable var nextHalfDayId = 1;

  func verifyAdminPasswordInternal(password : Text) : Bool {
    password == "Fancy0308";
  };

  func verifyAdminPasswordOrTrap(password : Text) {
    if (not verifyAdminPasswordInternal(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
  };

  func getCurrentTime() : Int {
    Time.now();
  };

  func parseTime(timeStr : Text) : (Nat, Nat) {
    let parts = timeStr.split(#char(':')).toArray();
    if (parts.size() != 2) {
      Runtime.trap("Invalid time format");
    };
    let hours = switch (Nat.fromText(parts[0])) {
      case (?h) { h };
      case (null) { Runtime.trap("Invalid hour format") };
    };
    let minutes = switch (Nat.fromText(parts[1])) {
      case (?m) { m };
      case (null) { Runtime.trap("Invalid minute format") };
    };
    (hours, minutes);
  };

  func getMinutesSinceShiftStart(currentTime : Int, shiftStart : Text) : Int {
    let (shiftHours, shiftMinutes) = parseTime(shiftStart);
    let shiftStartTime = (shiftHours * 60 + shiftMinutes) * 60 * 1_000_000_000;
    let currentHour = (currentTime / (60 * 1_000_000_000)).toNat();
    let currentMinute = (currentHour % 60).toInt();
    let currentHourOnly = (
      (currentTime / (60 * 1_000_000_000)) /
      60
    ).toNat();
    let currentHourN = currentHourOnly.toInt();

    let minutesSinceMidnight = currentHourN * 60 + currentMinute;
    minutesSinceMidnight - shiftStartTime;
  };

  func isLate(checkInTime : Int, shiftStart : Text) : Bool {
    getMinutesSinceShiftStart(checkInTime, shiftStart) > 10 * 60 * 1_000_000_000;
  };

  func getMinutesUntilShiftEnd(checkOutTime : Int, shiftEnd : Text) : Int {
    let (shiftHours, shiftMinutes) = parseTime(shiftEnd);
    let shiftEndTime = (shiftHours * 60 + shiftMinutes) * 60 * 1_000_000_000;
    let currentHour = (checkOutTime / (60 * 1_000_000_000)).toNat();
    let currentMinute = (currentHour % 60).toInt();
    let currentHourOnly = (
      (checkOutTime / (60 * 1_000_000_000)) /
      60
    ).toNat();
    let currentHourN = currentHourOnly.toInt();

    let minutesSinceMidnight = currentHourN * 60 + currentMinute;
    shiftEndTime - minutesSinceMidnight;
  };

  func isEarlyExit(checkOutTime : Int, shiftEnd : Text) : Bool {
    getMinutesUntilShiftEnd(checkOutTime, shiftEnd) > 10 * 60 * 1_000_000_000;
  };

  func calculateOvertimeMinutes(checkOutTime : Int, shiftEnd : Text) : Nat {
    let overtime = getMinutesUntilShiftEnd(checkOutTime, shiftEnd) - (10 * 60 * 1_000_000_000);
    if (overtime > 0) {
      (overtime / (60 * 1_000_000_000)).toNat();
    } else { 0 };
  };

  // STAFF MANAGEMENT - Password protected only (no IC identity check)
  public shared func addStaff(
    adminPassword : Text,
    name : Text,
    photoUrl : Text,
    shiftStart : Text,
    shiftEnd : Text,
    isPremium : Bool,
  ) : async Nat {
    verifyAdminPasswordOrTrap(adminPassword);

    let id = nextStaffId;
    let profile : StaffProfile = {
      id;
      name;
      photoUrl;
      shiftStart;
      shiftEnd;
      isPremium;
      isActive = true;
      createdAt = getCurrentTime();
    };
    staffProfiles.add(id, profile);
    nextStaffId += 1;
    id;
  };

  public shared func updateStaff(
    adminPassword : Text,
    id : Nat,
    name : Text,
    photoUrl : Text,
    shiftStart : Text,
    shiftEnd : Text,
    isPremium : Bool,
    isActive : Bool,
  ) : async () {
    verifyAdminPasswordOrTrap(adminPassword);

    switch (staffProfiles.get(id)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?existing) {
        let updatedProfile : StaffProfile = {
          id;
          name;
          photoUrl;
          shiftStart;
          shiftEnd;
          isPremium;
          isActive;
          createdAt = existing.createdAt;
        };
        staffProfiles.add(id, updatedProfile);
      };
    };
  };

  public shared func removeStaff(adminPassword : Text, id : Nat) : async () {
    verifyAdminPasswordOrTrap(adminPassword);
    if (not staffProfiles.containsKey(id)) { Runtime.trap("Staff not found") };
    staffProfiles.remove(id);
  };

  public query func getAllStaff() : async [StaffProfile] {
    let staffArray = staffProfiles.values().toArray();
    staffArray.sort(StaffProfile.compareByName);
  };

  public query func getStaffById(id : Nat) : async StaffProfile {
    switch (staffProfiles.get(id)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?profile) { profile };
    };
  };

  // ATTENDANCE - Open (no auth needed)
  public shared func checkIn(staffId : Nat) : async Int {
    let timestamp = getCurrentTime();
    let staffProfile = switch (staffProfiles.get(staffId)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?profile) { profile };
    };

    let attendance : AttendanceRecord = {
      id = nextAttendanceId;
      staffId;
      date = (timestamp / (24 * 60 * 60 * 1_000_000_000)).toText();
      checkInTime = ?timestamp;
      checkOutTime = null;
      isLate = isLate(timestamp, staffProfile.shiftStart);
      isEarlyExit = false;
      overtimeMinutes = 0;
    };

    attendanceRecords.add(nextAttendanceId, attendance);

    let notification : NotificationEvent = {
      id = nextNotificationId;
      staffId;
      staffName = staffProfile.name;
      eventType = #checkIn;
      timestamp;
      message = if (attendance.isLate) { "You are Late" } else { "Check-in successful" };
    };

    notificationEvents.add(nextNotificationId, notification);

    nextAttendanceId += 1;
    nextNotificationId += 1;
    timestamp;
  };

  public shared func checkOut(staffId : Nat) : async Int {
    let timestamp = getCurrentTime();
    let staffProfile = switch (staffProfiles.get(staffId)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?profile) { profile };
    };

    var foundAttendance : ?Nat = null;
    for ((id, record) in attendanceRecords.entries()) {
      if (record.staffId == staffId and record.checkOutTime == null) {
        foundAttendance := ?id;
      };
    };

    let attendanceId = switch (foundAttendance) {
      case (null) { Runtime.trap("No open attendance record found for this staff") };
      case (?id) { id };
    };

    let lastAttendance = switch (attendanceRecords.get(attendanceId)) {
      case (null) { Runtime.trap("Attendance record not found") };
      case (?record) { record };
    };

    let updatedAttendance : AttendanceRecord = {
      lastAttendance with
      checkOutTime = ?timestamp;
      isEarlyExit = isEarlyExit(timestamp, staffProfile.shiftEnd);
      overtimeMinutes = calculateOvertimeMinutes(timestamp, staffProfile.shiftEnd);
    };

    attendanceRecords.add(attendanceId, updatedAttendance);

    let notification : NotificationEvent = {
      id = nextNotificationId;
      staffId;
      staffName = staffProfile.name;
      eventType = #checkOut;
      timestamp;
      message = if (updatedAttendance.isEarlyExit) {
        "Check-out successful, Early Exit";
      } else { "Check-out successful" };
    };

    notificationEvents.add(nextNotificationId, notification);
    nextNotificationId += 1;
    timestamp;
  };

  public shared func updateCheckInTime(adminPassword : Text, staffId : Nat, date : Text, newCheckInHour : Nat, newCheckInMinute : Nat) : async () {
    verifyAdminPasswordOrTrap(adminPassword);

    let staffProfile = switch (staffProfiles.get(staffId)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?profile) { profile };
    };
    var foundId : ?Nat = null;
    for ((id, record) in attendanceRecords.entries()) {
      if (record.staffId == staffId and record.date == date) {
        foundId := ?id;
      };
    };
    let attendanceId = switch (foundId) {
      case (null) { Runtime.trap("Attendance record not found for this date") };
      case (?id) { id };
    };
    let existing = switch (attendanceRecords.get(attendanceId)) {
      case (null) { Runtime.trap("Attendance record not found") };
      case (?r) { r };
    };
    let dayStartNs : Int = (Time.now() / (24 * 60 * 60 * 1_000_000_000)) * (24 * 60 * 60 * 1_000_000_000);
    let newCheckInTime : Int = dayStartNs + (newCheckInHour * 60 + newCheckInMinute) * 60 * 1_000_000_000;
    let updated : AttendanceRecord = {
      existing with
      checkInTime = ?newCheckInTime;
      isLate = isLate(newCheckInTime, staffProfile.shiftStart);
    };
    attendanceRecords.add(attendanceId, updated);
  };

  public shared func updateCheckOutTime(
    adminPassword : Text,
    staffId : Nat,
    date : Text,
    newCheckOutHour : Nat,
    newCheckOutMinute : Nat,
  ) : async () {
    verifyAdminPasswordOrTrap(adminPassword);

    let staffProfile = switch (staffProfiles.get(staffId)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?profile) { profile };
    };

    var foundId : ?Nat = null;
    for ((id, record) in attendanceRecords.entries()) {
      if (record.staffId == staffId and record.date == date) {
        foundId := ?id;
      };
    };

    let attendanceId = switch (foundId) {
      case (null) { Runtime.trap("Attendance record not found for this date") };
      case (?id) { id };
    };

    let existing = switch (attendanceRecords.get(attendanceId)) {
      case (null) { Runtime.trap("Attendance record not found") };
      case (?r) { r };
    };

    let dayStartNs : Int = (Time.now() / (24 * 60 * 60 * 1_000_000_000)) * (24 * 60 * 60 * 1_000_000_000);
    let newCheckOutTime : Int = dayStartNs + (newCheckOutHour * 60 + newCheckOutMinute) * 60 * 1_000_000_000;

    let updated : AttendanceRecord = {
      existing with
      checkOutTime = ?newCheckOutTime;
      isEarlyExit = isEarlyExit(newCheckOutTime, staffProfile.shiftEnd);
      overtimeMinutes = calculateOvertimeMinutes(newCheckOutTime, staffProfile.shiftEnd);
    };

    attendanceRecords.add(attendanceId, updated);
  };

  public query func getTodayAttendance() : async [AttendanceRecord] {
    let today = (Time.now() / (24 * 60 * 60 * 1_000_000_000)).toText();
    attendanceRecords.values().toArray().filter(func(record) { record.date == today });
  };

  public query func getAttendanceByDate(date : Text) : async [AttendanceRecord] {
    attendanceRecords.values().toArray().filter(func(record) { record.date == date });
  };

  // Get ALL attendance records (no auth needed)
  public query func getAllAttendanceRecords() : async [AttendanceRecord] {
    attendanceRecords.values().toArray();
  };

  // HALF DAY RECORDS - Password protected
  public shared func markHalfDay(adminPassword : Text, staffId : Nat, date : Text) : async Nat {
    verifyAdminPasswordOrTrap(adminPassword);

    if (not staffProfiles.containsKey(staffId)) { Runtime.trap("Staff not found") };

    let existing = halfDayRecords.values().toArray().find(
      func(record) { record.staffId == staffId and record.date == date },
    );

    switch (existing) {
      case (?record) { record.id };
      case (null) {
        let newRecord : HalfDayRecord = {
          id = nextHalfDayId;
          staffId;
          date;
          markedAt = getCurrentTime();
        };
        halfDayRecords.add(nextHalfDayId, newRecord);
        nextHalfDayId += 1;
        newRecord.id;
      };
    };
  };

  public shared func removeHalfDay(adminPassword : Text, staffId : Nat, date : Text) : async () {
    verifyAdminPasswordOrTrap(adminPassword);

    for ((id, record) in halfDayRecords.entries()) {
      if (record.staffId == staffId and record.date == date) {
        halfDayRecords.remove(id);
        return;
      };
    };
  };

  public query func getHalfDaysByDate(date : Text) : async [HalfDayRecord] {
    halfDayRecords.values().toArray().filter(func(record) { record.date == date });
  };

  public query func getHalfDaysByMonth(year : Nat, month : Nat) : async [HalfDayRecord] {
    let _ = (year, month);
    halfDayRecords.values().toArray();
  };

  // EARNINGS - Password protected
  public shared func addOrUpdateEarningsEntry(adminPassword : Text, staffId : Nat, date : Text, parts : [Nat]) : async Nat {
    verifyAdminPasswordOrTrap(adminPassword);

    if (not staffProfiles.containsKey(staffId)) { Runtime.trap("Staff not found") };

    let total = parts.foldLeft(0, Nat.add);

    let entry : EarningsEntry = {
      id = nextEarningsId;
      staffId;
      date;
      parts;
      total;
    };

    earningsEntries.add(nextEarningsId, entry);
    nextEarningsId += 1;
    entry.id;
  };

  public query func getEarningsByStaffAndMonth(staffId : Nat, year : Nat, month : Nat) : async [EarningsEntry] {
    let _ = (year, month);
    earningsEntries.values().toArray().filter(func(entry) { entry.staffId == staffId });
  };

  // NOTIFICATIONS
  public query func getRecentNotifications(limit : Nat) : async [NotificationEvent] {
    let allNotifications = notificationEvents.values().toArray();
    let sortedNotifications = allNotifications.reverse();
    if (limit >= sortedNotifications.size()) {
      sortedNotifications;
    } else {
      sortedNotifications.sliceToArray(0, limit);
    };
  };

  public shared func cleanOldNotifications(adminPassword : Text) : async Nat {
    verifyAdminPasswordOrTrap(adminPassword);

    let todayDayNumber = Time.now() / (24 * 60 * 60 * 1_000_000_000);
    var deletedCount = 0;

    for ((id, event) in notificationEvents.entries()) {
      let eventDayNumber = event.timestamp / (24 * 60 * 60 * 1_000_000_000);
      if (eventDayNumber < todayDayNumber) {
        notificationEvents.remove(id);
        deletedCount += 1;
      };
    };
    deletedCount;
  };

  // ADMIN AUTH
  public query func verifyAdminPassword(password : Text) : async Bool {
    verifyAdminPasswordInternal(password);
  };

  // Keep user profile functions for upgrade compatibility
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // STAFF PASSWORD MANAGEMENT - Password protected only (no IC identity check)
  public shared func setStaffPassword(adminPassword : Text, staffId : Nat, newPassword : Text) : async () {
    verifyAdminPasswordOrTrap(adminPassword);
    if (not staffProfiles.containsKey(staffId)) {
      Runtime.trap("Staff not found");
    };
    staffPasswords.add(staffId, newPassword);
  };

  public query func verifyStaffPassword(staffId : Nat, password : Text) : async Bool {
    switch (staffPasswords.get(staffId)) {
      case (null) { false };
      case (?storedPassword) { storedPassword == password };
    };
  };

  public query func hasStaffPassword(staffId : Nat) : async Bool {
    staffPasswords.containsKey(staffId);
  };

  public query func findStaffByPassword(password : Text) : async ?Nat {
    for ((staffId, storedPassword) in staffPasswords.entries()) {
      if (storedPassword == password) {
        return ?staffId;
      };
    };
    null;
  };

};
