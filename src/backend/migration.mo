import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
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

  public type UserProfile = {
    name : Text;
    role : Text;
  };

  // New types for admins, leaves, bonuses, fines, feedback, shifts, and schedules
  public type LeaveType = {
    #casual;
    #sick;
    #unpaid;
    #earned;
    #maternity;
    #paternity;
    #compOff;
    #special;
  };

  public type LeaveRecord = {
    id : Nat;
    staffId : Nat;
    leaveType : LeaveType;
    startDate : Text;
    endDate : Text;
    approved : Bool;
    appliedAt : Int;
    approvedBy : ?Nat;
  };

  public type BonusRecord = {
    id : Nat;
    staffId : Nat;
    amount : Nat;
    reason : Text;
    date : Text;
    awardedAt : Int;
    awardedBy : Nat;
  };

  public type FineRecord = {
    id : Nat;
    staffId : Nat;
    amount : Nat;
    reason : Text;
    date : Text;
    issuedAt : Int;
    issuedBy : Nat;
  };

  public type FeedbackRecord = {
    id : Nat;
    customerName : Text;
    staffId : Nat;
    rating : Nat;
    comments : Text;
    createdAt : Int;
  };

  public type Shift = {
    id : Nat;
    startTime : Text;
    endTime : Text;
    name : Text;
    createdAt : Int;
  };

  public type Schedule = {
    id : Nat;
    staffId : Nat;
    shiftId : Nat;
    date : Text;
    createdAt : Int;
  };

  // Old actor type (without new features)
  type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
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

  // New actor type (with all features)
  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    adminProfiles : Map.Map<Nat, StaffProfile>;
    staffProfiles : Map.Map<Nat, StaffProfile>;
    attendanceRecords : Map.Map<Nat, AttendanceRecord>;
    earningsEntries : Map.Map<Nat, EarningsEntry>;
    notificationEvents : Map.Map<Nat, NotificationEvent>;
    halfDayRecords : Map.Map<Nat, HalfDayRecord>;
    staffPasswords : Map.Map<Nat, Text>;
    leaves : Map.Map<Nat, LeaveRecord>;
    bonuses : Map.Map<Nat, BonusRecord>;
    fines : Map.Map<Nat, FineRecord>;
    feedback : Map.Map<Nat, FeedbackRecord>;
    shifts : Map.Map<Nat, Shift>;
    schedules : Map.Map<Nat, Schedule>;
    nextStaffId : Nat;
    nextAdminId : Nat;
    nextAttendanceId : Nat;
    nextEarningsId : Nat;
    nextNotificationId : Nat;
    nextHalfDayId : Nat;
    nextLeaveId : Nat;
    nextBonusId : Nat;
    nextFineId : Nat;
    nextFeedbackId : Nat;
    nextShiftId : Nat;
    nextScheduleId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      userProfiles = old.userProfiles;
      staffProfiles = old.staffProfiles;
      adminProfiles = Map.empty<Nat, StaffProfile>();
      attendanceRecords = old.attendanceRecords;
      earningsEntries = old.earningsEntries;
      notificationEvents = old.notificationEvents;
      halfDayRecords = old.halfDayRecords;
      staffPasswords = old.staffPasswords;
      leaves = Map.empty<Nat, LeaveRecord>();
      bonuses = Map.empty<Nat, BonusRecord>();
      fines = Map.empty<Nat, FineRecord>();
      feedback = Map.empty<Nat, FeedbackRecord>();
      shifts = Map.empty<Nat, Shift>();
      schedules = Map.empty<Nat, Schedule>();
      nextStaffId = old.nextStaffId;
      nextAdminId = 1;
      nextAttendanceId = old.nextAttendanceId;
      nextEarningsId = old.nextEarningsId;
      nextNotificationId = old.nextNotificationId;
      nextHalfDayId = old.nextHalfDayId;
      nextLeaveId = 1;
      nextBonusId = 1;
      nextFineId = 1;
      nextFeedbackId = 1;
      nextShiftId = 1;
      nextScheduleId = 1;
    };
  };
};
