import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Crown,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserCircle2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { StaffProfile } from "../../backend.d";
import { useActor } from "../../hooks/useActor";

function isCanisterStoppedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("stopped") ||
    lower.includes("cc0508") ||
    lower.includes("reject_code: 5") ||
    lower.includes("reject code: 5") ||
    lower.includes("c0508")
  );
}

function isPermissionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("unauthorized") ||
    lower.includes("not authorized") ||
    lower.includes("admin") ||
    lower.includes("permission") ||
    lower.includes("access denied")
  );
}

type FormData = {
  name: string;
  photoUrl: string;
  shiftStart: string;
  shiftEnd: string;
  isPremium: boolean;
  isActive: boolean;
};

const DEFAULT_FORM: FormData = {
  name: "",
  photoUrl: "",
  shiftStart: "09:00",
  shiftEnd: "18:00",
  isPremium: false,
  isActive: true,
};

interface StaffFormDialogProps {
  open: boolean;
  onClose: () => void;
  editingStaff: StaffProfile | null;
}

function StaffFormDialog({
  open,
  onClose,
  editingStaff,
}: StaffFormDialogProps) {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();

  const [form, setForm] = useState<FormData>(
    editingStaff
      ? {
          name: editingStaff.name,
          photoUrl: editingStaff.photoUrl,
          shiftStart: editingStaff.shiftStart,
          shiftEnd: editingStaff.shiftEnd,
          isPremium: editingStaff.isPremium,
          isActive: editingStaff.isActive,
        }
      : DEFAULT_FORM,
  );

  const isEdit = !!editingStaff;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Reset retry error when dialog opens
  useEffect(() => {
    if (open) setRetryError(null);
  }, [open]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_SIZE = 300;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressed);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Image load failed"));
      };
      img.src = objectUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const compressed = await compressImage(file);
      setForm((p) => ({ ...p, photoUrl: compressed }));
    } catch {
      toast.error("Could not process image. Please try another file.");
    }
  };

  const isBase64Photo = form.photoUrl.startsWith("data:");

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Name is required");
      if (!actor) throw new Error("Not connected");
      return actor.addStaff(
        "Fancy0308",
        form.name.trim(),
        form.photoUrl.trim(),
        form.shiftStart,
        form.shiftEnd,
        form.isPremium,
      );
    },
    onSuccess: () => {
      toast.success("Staff member added!");
      queryClient.invalidateQueries({ queryKey: ["allStaff"] });
      onClose();
    },
    onError: (err) => {
      if (isPermissionError(err)) {
        setRetryError("permission");
        toast.error("অনুমতি নেই। পুনরায় লগইন করুন।");
      } else if (isCanisterStoppedError(err)) {
        setRetryError("canister_stopped");
        toast.error("Server temporarily unavailable. Please retry.");
      } else {
        setRetryError("other");
        toast.error(
          err instanceof Error ? err.message : "Failed to add staff.",
        );
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingStaff) throw new Error("No staff to edit");
      if (!form.name.trim()) throw new Error("Name is required");
      if (!actor) throw new Error("Not connected");
      return actor.updateStaff(
        "Fancy0308",
        editingStaff.id,
        form.name.trim(),
        form.photoUrl.trim(),
        form.shiftStart,
        form.shiftEnd,
        form.isPremium,
        form.isActive,
      );
    },
    onSuccess: () => {
      toast.success("Staff member updated!");
      queryClient.invalidateQueries({ queryKey: ["allStaff"] });
      onClose();
    },
    onError: (err) => {
      if (isPermissionError(err)) {
        setRetryError("permission");
        toast.error("অনুমতি নেই। পুনরায় লগইন করুন।");
      } else if (isCanisterStoppedError(err)) {
        setRetryError("canister_stopped");
        toast.error("Server temporarily unavailable. Please retry.");
      } else {
        setRetryError("other");
        toast.error(
          err instanceof Error ? err.message : "Failed to update staff.",
        );
      }
    },
  });

  const isActorLoading = isFetching && !actor;
  const isPending =
    addMutation.isPending || updateMutation.isPending || isActorLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRetryError(null);
    if (isEdit) updateMutation.mutate();
    else addMutation.mutate();
  };

  const handleRetry = () => {
    setRetryError(null);
    if (isEdit) updateMutation.mutate();
    else addMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="staff_mgmt.add_dialog"
        className="max-w-md font-body"
        style={{
          background: "oklch(0.13 0.006 60)",
          border: "1px solid oklch(0.76 0.15 85 / 0.25)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">
            {isEdit ? "Edit Staff Member" : "Add New Staff"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-widest">
              Full Name *
            </Label>
            <Input
              data-ocid="staff_mgmt.name_input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Priya Sharma"
              className="bg-input border-border text-foreground"
              required
            />
          </div>

          {/* Photo — URL or Gallery */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-widest">
              Photo (URL or select from gallery)
            </Label>

            {/* Preview + upload row */}
            <div className="flex items-center gap-3">
              {/* Circular preview */}
              <div
                data-ocid="staff_mgmt.photo_preview"
                className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                  border: "2px solid oklch(0.76 0.15 85 / 0.45)",
                  background: "oklch(0.18 0.008 70)",
                }}
              >
                {form.photoUrl ? (
                  <img
                    src={form.photoUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  <UserCircle2 className="w-6 h-6 text-muted-foreground opacity-50" />
                )}
              </div>

              {/* Upload button */}
              <Button
                data-ocid="staff_mgmt.photo_upload_button"
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 gap-1.5 text-xs font-body text-muted-foreground hover:text-gold hover:bg-gold/10 border border-border px-3"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                Select Photo
              </Button>

              {/* Clear button */}
              {form.photoUrl && (
                <Button
                  data-ocid="staff_mgmt.photo_clear_button"
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm((p) => ({ ...p, photoUrl: "" }))}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Clear photo"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* URL input — hidden/replaced when base64 is active */}
            {isBase64Photo ? (
              <div
                className="flex items-center gap-2 rounded-md px-3 py-2 text-xs"
                style={{
                  background: "oklch(0.76 0.15 85 / 0.08)",
                  border: "1px solid oklch(0.76 0.15 85 / 0.2)",
                }}
              >
                <Check
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "oklch(0.76 0.15 85)" }}
                />
                <span style={{ color: "oklch(0.76 0.15 85)" }}>
                  Photo selected from gallery
                </span>
              </div>
            ) : (
              <Input
                data-ocid="staff_mgmt.photo_input"
                value={form.photoUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, photoUrl: e.target.value }))
                }
                placeholder="https://example.com/photo.jpg"
                className="bg-input border-border text-foreground text-xs"
              />
            )}

            <p className="text-xs text-muted-foreground">
              Select from gallery or paste a photo URL. Leave empty for default
              avatar.
            </p>
          </div>

          {/* Shift times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">
                Shift Start
              </Label>
              <Input
                data-ocid="staff_mgmt.shift_start_input"
                type="time"
                value={form.shiftStart}
                onChange={(e) =>
                  setForm((p) => ({ ...p, shiftStart: e.target.value }))
                }
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">
                Shift End
              </Label>
              <Input
                data-ocid="staff_mgmt.shift_end_input"
                type="time"
                value={form.shiftEnd}
                onChange={(e) =>
                  setForm((p) => ({ ...p, shiftEnd: e.target.value }))
                }
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>

          {/* Premium toggle */}
          <div
            className="flex items-center justify-between rounded-lg p-3"
            style={{
              background: "oklch(0.76 0.15 85 / 0.06)",
              border: "1px solid oklch(0.76 0.15 85 / 0.2)",
            }}
          >
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-gold" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Premium Staff
                </p>
                <p className="text-xs text-muted-foreground">
                  Flexible timing, no attendance flags
                </p>
              </div>
            </div>
            <Switch
              data-ocid="staff_mgmt.premium_toggle"
              checked={form.isPremium}
              onCheckedChange={(v) => setForm((p) => ({ ...p, isPremium: v }))}
            />
          </div>

          {/* Active toggle (edit only) */}
          {isEdit && (
            <div
              className="flex items-center justify-between rounded-lg p-3"
              style={{
                background: "oklch(0.18 0.006 60)",
                border: "1px solid oklch(0.28 0.006 60)",
              }}
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  Active Status
                </p>
                <p className="text-xs text-muted-foreground">
                  Inactive staff won't appear in staff portal
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
              />
            </div>
          )}

          {/* Retry error banner */}
          <AnimatePresence>
            {retryError && (
              <motion.div
                data-ocid="staff_mgmt.error_state"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg p-3 flex items-start gap-3"
                style={{
                  background: "oklch(0.60 0.22 22 / 0.15)",
                  border: "1px solid oklch(0.60 0.22 22 / 0.4)",
                }}
              >
                <AlertTriangle
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: "oklch(0.65 0.22 22)" }}
                />
                <div className="flex-1 min-w-0">
                  {retryError === "permission" ? (
                    <>
                      <p className="text-xs text-foreground font-medium">
                        অনুমতি নেই। পুনরায় লগইন করুন।
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Permission denied. Please re-login.
                      </p>
                    </>
                  ) : retryError === "canister_stopped" ? (
                    <>
                      <p className="text-xs text-foreground font-medium">
                        সার্ভার সাময়িকভাবে বন্ধ আছে। একটু পরে আবার চেষ্টা করুন।
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Server temporarily unavailable. Please retry.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-foreground font-medium">
                      একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।
                    </p>
                  )}
                </div>
                {retryError !== "permission" && (
                  <Button
                    data-ocid="staff_mgmt.retry_button"
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleRetry}
                    disabled={isPending}
                    className="h-7 px-2 text-xs gap-1.5 flex-shrink-0"
                    style={{ color: "oklch(0.76 0.15 85)" }}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="gap-2 pt-2">
            <Button
              data-ocid="staff_mgmt.cancel_button"
              type="button"
              variant="ghost"
              onClick={onClose}
              className="font-body text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              data-ocid="staff_mgmt.save_button"
              type="submit"
              disabled={isPending}
              className="font-body font-semibold"
              style={{
                background: "oklch(0.76 0.15 85)",
                color: "oklch(0.08 0 0)",
                border: "none",
              }}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div
                    className="gold-spinner w-4 h-4"
                    style={{ borderTopColor: "black" }}
                  />
                  Saving…
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {isEdit ? "Update Staff" : "Add Staff"}
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteConfirmDialogProps {
  open: boolean;
  staff: StaffProfile | null;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirmDialog({
  open,
  staff,
  onConfirm,
  onCancel,
  isPending,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent
        className="max-w-sm font-body"
        style={{
          background: "oklch(0.13 0.006 60)",
          border: "1px solid oklch(0.60 0.22 22 / 0.4)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg text-foreground flex items-center gap-2">
            <AlertTriangle
              className="w-5 h-5"
              style={{ color: "oklch(0.65 0.22 22)" }}
            />
            Remove Staff Member
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="text-foreground font-medium">{staff?.name}</span>?
            This action cannot be undone.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button
            data-ocid="staff_mgmt.cancel_delete_button"
            variant="ghost"
            onClick={onCancel}
            className="font-body"
          >
            Cancel
          </Button>
          <Button
            data-ocid="staff_mgmt.confirm_delete_button"
            onClick={onConfirm}
            disabled={isPending}
            className="font-body font-semibold"
            style={{
              background: "oklch(0.60 0.22 22)",
              color: "white",
              border: "none",
            }}
          >
            {isPending ? "Removing…" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffManagementTab() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffProfile | null>(null);

  const { data: staffList, isLoading } = useQuery({
    queryKey: ["allStaff"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStaff();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeStaff("Fancy0308", id);
    },
    onSuccess: () => {
      toast.success("Staff member removed.");
      queryClient.invalidateQueries({ queryKey: ["allStaff"] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      if (isPermissionError(err)) {
        toast.error("অনুমতি নেই। পুনরায় লগইন করুন। (Permission denied.)", {
          duration: 6000,
        });
      } else if (isCanisterStoppedError(err)) {
        toast.error(
          "সার্ভার সাময়িকভাবে বন্ধ আছে। একটু পরে আবার চেষ্টা করুন। (Server temporarily unavailable. Please retry.)",
          { duration: 6000 },
        );
      } else {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to remove staff member. Please try again.",
        );
      }
    },
  });

  const allStaff = staffList ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Staff Directory
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {allStaff.filter((s) => s.isActive).length} active ·{" "}
            {allStaff.filter((s) => !s.isActive).length} inactive
          </p>
        </div>
        <Button
          data-ocid="staff_mgmt.add_button"
          onClick={() => setShowAddDialog(true)}
          className="font-body font-semibold gap-2"
          style={{
            background: "oklch(0.76 0.15 85)",
            color: "oklch(0.08 0 0)",
            border: "none",
          }}
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </Button>
      </div>

      {/* Loading — show when data is loading or actor is initializing */}
      {(isLoading || (isFetching && !actor)) && (
        <div
          data-ocid="staff_mgmt.loading_state"
          className="flex flex-col items-center gap-3 py-12"
        >
          <Loader2 className="w-7 h-7 animate-spin text-gold" />
          <p className="text-xs text-muted-foreground">Loading staff data…</p>
        </div>
      )}

      {/* Staff table */}
      {!isLoading && (
        <div data-ocid="staff_mgmt.staff_table">
          {allStaff.length === 0 ? (
            <motion.div
              data-ocid="staff_mgmt.empty_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
              style={{
                border: "1px dashed oklch(0.30 0.010 70)",
                borderRadius: "0.75rem",
              }}
            >
              <UserCircle2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="font-display text-foreground">
                No staff members yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Add Staff" to get started
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {allStaff.map((staff, i) => (
                <motion.div
                  key={String(staff.id)}
                  data-ocid={`staff_mgmt.staff_row.${i + 1}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="rounded-xl p-4 flex flex-wrap items-center gap-4"
                  style={{
                    background: "oklch(0.13 0.006 60)",
                    border: `1px solid ${staff.isActive ? "oklch(0.26 0.010 70)" : "oklch(0.20 0.006 60)"}`,
                    opacity: staff.isActive ? 1 : 0.6,
                  }}
                >
                  {/* Photo */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full overflow-hidden"
                      style={{
                        border: "1.5px solid oklch(0.76 0.15 85 / 0.3)",
                      }}
                    >
                      {staff.photoUrl ? (
                        <img
                          src={staff.photoUrl}
                          alt={staff.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            img.src = `https://i.pravatar.cc/150?img=${(Number(staff.id) % 70) + 1}`;
                          }}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: "oklch(0.20 0.012 80)" }}
                        >
                          <UserCircle2 className="w-7 h-7 text-gold opacity-50" />
                        </div>
                      )}
                    </div>
                    {staff.isPremium && (
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "oklch(0.76 0.15 85)" }}
                      >
                        <Crown className="w-2 h-2 text-background" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-semibold text-sm text-foreground">
                        {staff.name}
                      </p>
                      {!staff.isActive && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded text-muted-foreground"
                          style={{
                            background: "oklch(0.20 0.006 60)",
                            border: "1px solid oklch(0.28 0.006 60)",
                          }}
                        >
                          Inactive
                        </span>
                      )}
                      {staff.isPremium && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            background: "oklch(0.76 0.15 85 / 0.12)",
                            color: "oklch(0.76 0.15 85)",
                            border: "1px solid oklch(0.76 0.15 85 / 0.25)",
                          }}
                        >
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Shift: {staff.shiftStart} – {staff.shiftEnd}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      data-ocid={`staff_mgmt.edit_button.${i + 1}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingStaff(staff)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-gold hover:bg-gold/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      data-ocid={`staff_mgmt.delete_button.${i + 1}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(staff)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <AnimatePresence>
        {(showAddDialog || editingStaff) && (
          <StaffFormDialog
            open={showAddDialog || !!editingStaff}
            onClose={() => {
              setShowAddDialog(false);
              setEditingStaff(null);
            }}
            editingStaff={editingStaff}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        staff={deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
