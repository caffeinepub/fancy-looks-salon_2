import Map "mo:core/Map";
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

  type HalfDayRecord = {
    id : Nat;
    staffId : Nat;
    date : Text;
    markedAt : Int;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    staffProfiles : Map.Map<Nat, StaffProfile>;
    attendanceRecords : Map.Map<Nat, AttendanceRecord>;
    earningsEntries : Map.Map<Nat, EarningsEntry>;
    notificationEvents : Map.Map<Nat, NotificationEvent>;
    halfDayRecords : Map.Map<Nat, HalfDayRecord>;
    staffPasswords : Map.Map<Nat, Text>;
    nextStaffId : Nat;
    nextAttendanceId : Nat;
    nextEarningsId : Nat;
    nextNotificationId : Nat;
    nextHalfDayId : Nat;
  };

  type NewActor = OldActor;

  public func run(old : OldActor) : NewActor {
    // No changes to persistent state required, pass through
    old;
  };
};
