import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
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

  type StaffProfile = {
    id : Nat;
    name : Text;
    photoUrl : Text;
    shiftStart : Text;
    shiftEnd : Text;
    isPremium : Bool;
    isActive : Bool;
    createdAt : Int;
  };

  type AttendanceRecord = {
    id : Nat;
    staffId : Nat;
    date : Text;
    checkInTime : ?Int;
    checkOutTime : ?Int;
    isLate : Bool;
    isEarlyExit : Bool;
    overtimeMinutes : Nat;
  };

  type EarningsEntry = {
    id : Nat;
    staffId : Nat;
    date : Text;
    parts : [Nat];
    total : Nat;
  };

  type NotificationEvent = {
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

  let userProfiles = Map.empty<Principal, UserProfile>();
  let staffProfiles = Map.empty<Nat, StaffProfile>();
  let attendanceRecords = Map.empty<Nat, AttendanceRecord>();
  let earningsEntries = Map.empty<Nat, EarningsEntry>();
  let notificationEvents = Map.empty<Nat, NotificationEvent>();

  var nextStaffId = 1;
  var nextAttendanceId = 1;
  var nextEarningsId = 1;
  var nextNotificationId = 1;

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  func getCurrentTime() : Int {
    Time.now();
  };

  public shared ({ caller }) func addStaff(name : Text, photoUrl : Text, shiftStart : Text, shiftEnd : Text, isPremium : Bool) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add staff");
    };

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

  public shared ({ caller }) func updateStaff(id : Nat, name : Text, photoUrl : Text, shiftStart : Text, shiftEnd : Text, isPremium : Bool, isActive : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update staff");
    };

    switch (staffProfiles.get(id)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?_) {
        let updatedProfile : StaffProfile = {
          id;
          name;
          photoUrl;
          shiftStart;
          shiftEnd;
          isPremium;
          isActive;
          createdAt = Time.now();
        };
        staffProfiles.add(id, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func removeStaff(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove staff");
    };

    if (not staffProfiles.containsKey(id)) { Runtime.trap("Staff not found") };
    staffProfiles.remove(id);
  };

  public query ({ caller }) func getAllStaff() : async [StaffProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view staff");
    };

    staffProfiles.values().toArray().sort(StaffProfile.compareByName);
  };

  public query ({ caller }) func getStaffById(id : Nat) : async StaffProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view staff");
    };

    switch (staffProfiles.get(id)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?profile) { profile };
    };
  };

  public shared ({ caller }) func checkIn(staffId : Nat) : async Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check in");
    };

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
      isLate = false;
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
      message = "Check-in successful";
    };

    notificationEvents.add(nextNotificationId, notification);

    nextAttendanceId += 1;
    nextNotificationId += 1;
    timestamp;
  };

  public shared ({ caller }) func checkOut(staffId : Nat) : async Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check out");
    };

    let timestamp = getCurrentTime();
    let staffProfile = switch (staffProfiles.get(staffId)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?profile) { profile };
    };

    let lastAttendanceId = if (nextAttendanceId > 1) { nextAttendanceId - 1 } else { Runtime.trap("No previous attendance record found") };

    let lastAttendance = switch (attendanceRecords.get(lastAttendanceId)) {
      case (null) { Runtime.trap("No previous attendance record found") };
      case (?record) { record };
    };

    let updatedAttendance : AttendanceRecord = {
      lastAttendance with checkOutTime = ?timestamp;
    };

    attendanceRecords.add(lastAttendanceId, updatedAttendance);

    let notification : NotificationEvent = {
      id = nextNotificationId;
      staffId;
      staffName = staffProfile.name;
      eventType = #checkOut;
      timestamp;
      message = "Check-out successful";
    };

    notificationEvents.add(nextNotificationId, notification);

    nextNotificationId += 1;
    timestamp;
  };

  public query ({ caller }) func getTodayAttendance() : async [AttendanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance");
    };

    let today = (Time.now() / (24 * 60 * 60 * 1_000_000_000)).toText();
    attendanceRecords.values().toArray().filter(
      func(record) { record.date == today }
    );
  };

  public shared ({ caller }) func addOrUpdateEarningsEntry(staffId : Nat, date : Text, parts : [Nat]) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage earnings");
    };

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

  public query ({ caller }) func getEarningsByStaffAndMonth(staffId : Nat, year : Nat, month : Nat) : async [EarningsEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view earnings");
    };

    let _ = (year, month);
    earningsEntries.values().toArray().filter(
      func(entry) { entry.staffId == staffId }
    );
  };

  public query ({ caller }) func getRecentNotifications(limit : Nat) : async [NotificationEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };

    let allNotifications = notificationEvents.values().toArray();
    let sortedNotifications = allNotifications.reverse();
    if (limit >= sortedNotifications.size()) {
      sortedNotifications;
    } else {
      sortedNotifications.sliceToArray(0, limit);
    };
  };

  public query func verifyAdminPassword(password : Text) : async Bool {
    password == "Fancy0308";
  };
};
