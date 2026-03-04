import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Principal "mo:core/Principal";

module {
  type UserProfile = {
    name : Text;
    role : Text;
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

  type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    staffProfiles : Map.Map<Nat, StaffProfile>;
    attendanceRecords : Map.Map<Nat, AttendanceRecord>;
    earningsEntries : Map.Map<Nat, EarningsEntry>;
    notificationEvents : Map.Map<Nat, NotificationEvent>;
    nextStaffId : Nat;
    nextAttendanceId : Nat;
    nextEarningsId : Nat;
    nextNotificationId : Nat;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    staffProfiles : Map.Map<Nat, StaffProfile>;
    attendanceRecords : Map.Map<Nat, AttendanceRecord>;
    earningsEntries : Map.Map<Nat, EarningsEntry>;
    notificationEvents : Map.Map<Nat, NotificationEvent>;
    nextStaffId : Nat;
    nextAttendanceId : Nat;
    nextEarningsId : Nat;
    nextNotificationId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      userProfiles = old.userProfiles;
      staffProfiles = old.staffProfiles;
      attendanceRecords = old.attendanceRecords;
      earningsEntries = old.earningsEntries;
      notificationEvents = old.notificationEvents;
      nextStaffId = old.nextStaffId;
      nextAttendanceId = old.nextAttendanceId;
      nextEarningsId = old.nextEarningsId;
      nextNotificationId = old.nextNotificationId;
    };
  };
};
