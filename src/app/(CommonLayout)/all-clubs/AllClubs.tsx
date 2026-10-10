"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Mail, Clock, Plus, X, Building2, Info, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Sparkles, Trophy, Check, HelpCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import RequireRole from "@/components/auth/RequireRole";
import InputField from "@/components/form/InputField";
import InputFieldPassword from "@/components/form/InputFieldPassword";
import { fetchUrl, getMediaUrl } from "@/lib/fetchUrl";

type ClubStatus = "Active" | "Pending" | "Suspended";

interface ClubRow {
  id: string;
  name: string;
  location: string;
  ownerEmail: string;
  status: ClubStatus;
  isFeatured: boolean;
  teeTimeCount: number;
  summary?: string;
  description?: string;
  heroImage?: { url: string } | null;
  stats?: {
    yardage: string;
    par: number;
    slope: number;
    rating: number;
    holes: number;
    tees: number;
    elevation: string;
    avgTime: string;
    courseType: string;
    difficulty: string;
  } | null;
  signatureHole?: {
    number: string;
    name: string;
    par: number;
    yardage: number;
    notes: string;
    image?: { url: string } | null;
  } | null;
  sellingPoints?: { title: string; description: string }[];
  facilities?: { name: string; description: string }[];
}

interface CreateClubForm {
  name: string;
  email: string;
  password: string;
}

const toClubStatus = (status: string): ClubStatus => {
  if (status === "ACTIVE") return "Active";
  if (status === "SUSPENDED") return "Suspended";
  return "Pending";
};

const checkCompleteness = (club: ClubRow) => {
  const completeness = {
    summary: !!club.summary && club.summary.trim().length > 0,
    description: !!club.description && club.description.trim().length > 0,
    heroImage: !!club.heroImage && !!club.heroImage.url,
    stats: !!club.stats && !!club.stats.yardage && club.stats.par > 0 && club.stats.holes > 0,
    signatureHole: !!club.signatureHole && !!club.signatureHole.name && !!club.signatureHole.image?.url,
  };

  const isComplete = Object.values(completeness).every(Boolean);
  return { completeness, isComplete };
};

const AllClubs = () => {
  const [clubList, setClubList] = useState<ClubRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [clubToDelete, setClubToDelete] = useState<ClubRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClubForm>();

  useEffect(() => {
    const loadClubs = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetchUrl("/courses/admin/all?limit=100");
        const rows: ClubRow[] = res.data.map((course: any) => ({
          id: course.id,
          name: course.name,
          location: course.location,
          ownerEmail: course.owner?.email ?? "—",
          status: toClubStatus(course.status),
          isFeatured: course.isFeatured ?? false,
          teeTimeCount: course.teeTimeCount,
          summary: course.summary,
          description: course.description,
          heroImage: course.heroImage,
          stats: course.stats,
          signatureHole: course.signatureHole,
          sellingPoints: course.sellingPoints,
          facilities: course.facilities,
        }));
        setClubList(rows);
      } catch (err: any) {
        setLoadError(err.message || "Failed to load clubs.");
      } finally {
        setIsLoading(false);
      }
    };

    loadClubs();
  }, []);

  const handleApprove = async (id: string, isFeaturedValue: boolean = false) => {
    setIsUpdating(id);
    try {
      const res = await fetchUrl(`/courses/${id}/approve`, {
        method: "PATCH",
        body: { isFeatured: isFeaturedValue },
      });
      toast.success("Club approved successfully!");
      setClubList((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: "Active",
                isFeatured: res.data.isFeatured ?? isFeaturedValue,
              }
            : c
        )
      );
      if (selectedClub && selectedClub.id === id) {
        setSelectedClub((prev) => prev ? { ...prev, status: "Active", isFeatured: res.data.isFeatured ?? isFeaturedValue } : null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to approve club.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    setIsUpdating(id);
    const newFeatured = !currentFeatured;
    try {
      const res = await fetchUrl(`/courses/${id}/approve`, {
        method: "PATCH",
        body: { isFeatured: newFeatured },
      });
      toast.success(newFeatured ? "Club marked as featured!" : "Club removed from featured.");
      setClubList((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, isFeatured: res.data.isFeatured ?? newFeatured } : c
        )
      );
      if (selectedClub && selectedClub.id === id) {
        setSelectedClub((prev) => prev ? { ...prev, isFeatured: res.data.isFeatured ?? newFeatured } : null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update featured status.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteClub = async () => {
    if (!clubToDelete) return;
    setIsDeleting(true);
    try {
      await fetchUrl(`/courses/${clubToDelete.id}`, {
        method: "DELETE",
      });
      toast.success(`"${clubToDelete.name}" has been deleted.`);
      setClubList((prev) => prev.filter((c) => c.id !== clubToDelete.id));
      if (selectedClub && selectedClub.id === clubToDelete.id) {
        setSelectedClub(null);
      }
      setClubToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete club.");
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmit: SubmitHandler<CreateClubForm> = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await fetchUrl("/courses", {
        method: "POST",
        body: data,
      });
      const course = res.data;

      const newClub: ClubRow = {
        id: course._id,
        name: course.name,
        location: course.location,
        ownerEmail: data.email,
        status: toClubStatus(course.status),
        isFeatured: course.isFeatured ?? false,
        teeTimeCount: 0,
        summary: course.summary,
        description: course.description,
        heroImage: course.heroImage,
        stats: course.stats,
        signatureHole: course.signatureHole,
        sellingPoints: course.sellingPoints,
        facilities: course.facilities,
      };

      setClubList([newClub, ...clubList]);
      setIsModalOpen(false);
      reset();
      toast.success("Club created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create club.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RequireRole role="admin">
      <div className="flex flex-col gap-8 p-6 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Clubs</h1>
            <p className="text-gray-500 mt-1">
              {clubList.length} clubs registered on the platform
            </p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/10 cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Club</span>
          </button>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Club</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Tee Times</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Featured</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading clubs...
                    </div>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-red-500 text-sm font-medium">
                    {loadError}
                  </td>
                </tr>
              ) : clubList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No clubs registered yet.
                  </td>
                </tr>
              ) : (
                clubList.map((club) => (
                  <tr
                    key={club.id}
                    onClick={() => setSelectedClub(club)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#eefaf3] flex items-center justify-center text-[#2ea268] font-bold shrink-0">
                          {club.name[0]}
                        </div>
                        <span className="font-bold text-gray-900">{club.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-300" />
                        {club.location}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-300" />
                        {club.ownerEmail}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-gray-900 font-bold">
                        <Clock className="w-3.5 h-3.5 text-gray-300" />
                        {club.teeTimeCount}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold border inline-block",
                          club.status === "Active"
                            ? "bg-green-50 text-green-600 border-green-100"
                            : club.status === "Suspended"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-orange-50 text-orange-600 border-orange-100"
                        )}
                      >
                        {club.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          club.status === "Active" && handleToggleFeatured(club.id, club.isFeatured);
                        }}
                        disabled={club.status !== "Active" || isUpdating === club.id}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          club.isFeatured ? "bg-emerald-600" : "bg-gray-200",
                          (club.status !== "Active" || isUpdating === club.id) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                            club.isFeatured ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {club.status === "Pending" ? (
                          <button
                            onClick={() => handleApprove(club.id)}
                            disabled={isUpdating === club.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60 shadow-xs"
                          >
                            {isUpdating === club.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : null}
                            Approve
                          </button>
                        ) : null}
                        <Link
                          href={`/edit-clubs?id=${club.id}`}
                          className="bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 border border-slate-200 shadow-xs"
                          title="Edit Club Details"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => setClubToDelete(club)}
                          className="bg-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-400 hover:text-red-600 font-bold p-1.5 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center border border-slate-200 shadow-xs"
                          title="Delete Club"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW CLUB MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl z-10 overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon & Title */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">Create Club Account</h3>
                  <p className="text-xs text-slate-400 mt-1">Set up essential credentials for the owner.</p>
                </div>
              </div>

              {/* Creation Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <InputField
                  title="Club Name"
                  name="name"
                  placeholder="e.g. Shadow Creek Golf Course"
                  register={register}
                  error={errors.name}
                />
                
                <InputField
                  title="E-Mail Address"
                  name="email"
                  type="email"
                  placeholder="owner@shadowcreek.com"
                  register={register}
                  error={errors.email}
                />

                <InputFieldPassword
                  title="Password"
                  name="password"
                  placeholder="••••••••"
                  register={register}
                  error={errors.password}
                  inputClassName="bg-white border border-slate-200 py-3.5 rounded-xl text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#0b3b0b]/40 focus:bg-white"
                />

                {/* Helpful Instruction Tip */}
                <div className="flex gap-2.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    The club owner will use these credentials to log in. Once logged in, they can fill out full course details and images from their Edit Profile page.
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold transition-all cursor-pointer text-center disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-emerald-600/10 text-center disabled:opacity-60"
                  >
                    {isSubmitting ? "Creating..." : "Create Club"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLUB DETAILS MODAL */}
      <AnimatePresence>
        {selectedClub && (() => {
          const { completeness, isComplete } = checkCompleteness(selectedClub);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedClub(null)}
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl z-10 my-8 max-h-[85vh] overflow-y-auto flex flex-col"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedClub(null)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="mb-6 flex flex-wrap items-center gap-4">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl shrink-0">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{selectedClub.name}</h2>
                    <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-1">
                      <MapPin className="w-4 h-4 text-slate-400" /> {selectedClub.location}
                      <span className="text-slate-300">•</span>
                      <Mail className="w-4 h-4 text-slate-400" /> {selectedClub.ownerEmail}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Link
                      href={`/edit-clubs?id=${selectedClub.id}`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-emerald-600/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Club</span>
                    </Link>
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold border",
                        selectedClub.status === "Active"
                          ? "bg-green-50 text-green-600 border-green-100"
                          : "bg-orange-50 text-orange-600 border-orange-100"
                      )}
                    >
                      {selectedClub.status}
                    </span>
                    {selectedClub.isFeatured && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 fill-amber-500 text-amber-500" /> Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 overflow-y-auto">
                  {/* Left Column (7 cols in desktop) */}
                  <div className="md:col-span-7 space-y-6">
                    {/* ── COMPLETENESS CARD ── */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          Form Completion Status
                        </h4>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          isComplete ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                        )}>
                          {isComplete ? "Completed" : "Incomplete"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { key: "summary", label: "Summary & Overview" },
                          { key: "description", label: "Detailed Description" },
                          { key: "heroImage", label: "Hero Image Upload" },
                          { key: "stats", label: "Stats & Course Info" },
                          { key: "signatureHole", label: "Signature Hole Setup" },
                        ].map((item) => {
                          const isFilled = completeness[item.key as keyof typeof completeness];
                          return (
                            <div key={item.key} className="flex items-center gap-2">
                              <CheckCircle2 className={cn("w-4 h-4 shrink-0", isFilled ? "text-green-500" : "text-slate-350")} />
                              <span className={cn("font-medium", isFilled ? "text-slate-700" : "text-slate-400 line-through")}>
                                {item.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Approve Button in Modal */}
                      {selectedClub.status === "Pending" && (
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-4">
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {isComplete
                              ? "All required fields are completed. You can approve this club now."
                              : "The club owner needs to complete all form sections before this club can be approved."}
                          </p>
                          <button
                            onClick={() => handleApprove(selectedClub.id)}
                            disabled={!isComplete || isUpdating === selectedClub.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Approve Club
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── OVERVIEW ── */}
                    <div className="space-y-3">
                      <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Overview</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase">Summary</h4>
                          <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                            {selectedClub.summary || "No summary provided."}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase">Description</h4>
                          <p className="text-slate-600 text-sm mt-1 leading-relaxed whitespace-pre-line">
                            {selectedClub.description || "No description provided."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── STATS ── */}
                    <div className="space-y-3">
                      <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Stats & Course Info</h3>
                      {selectedClub.stats ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: "Yardage", value: selectedClub.stats.yardage },
                            { label: "Par", value: selectedClub.stats.par },
                            { label: "Slope", value: selectedClub.stats.slope },
                            { label: "Rating", value: selectedClub.stats.rating },
                            { label: "Holes", value: selectedClub.stats.holes },
                            { label: "Tees", value: selectedClub.stats.tees },
                            { label: "Elevation", value: selectedClub.stats.elevation },
                            { label: "Difficulty", value: selectedClub.stats.difficulty },
                          ].map((stat, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">{stat.label}</span>
                              <span className="block font-bold text-slate-800 text-sm mt-1">{stat.value || "—"}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm">No course stats provided.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column (5 cols in desktop) */}
                  <div className="md:col-span-5 space-y-6">
                    {/* ── HERO IMAGE ── */}
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-2">Hero Image</h3>
                      {selectedClub.heroImage?.url ? (
                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                          <img
                            src={getMediaUrl(selectedClub.heroImage.url)}
                            alt="Hero Image"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                          No hero image uploaded
                        </div>
                      )}
                    </div>

                    {/* ── SIGNATURE HOLE ── */}
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-2">Signature Hole</h3>
                      {selectedClub.signatureHole ? (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                          {selectedClub.signatureHole.image?.url && (
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200">
                              <img
                                src={getMediaUrl(selectedClub.signatureHole.image.url)}
                                alt="Signature Hole"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-sm">
                              Hole {selectedClub.signatureHole.number || "—"}: {selectedClub.signatureHole.name || "—"}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              Par {selectedClub.signatureHole.par || "—"} • {selectedClub.signatureHole.yardage || "—"} Yards
                            </span>
                          </div>
                          <p className="text-slate-500 text-xs leading-relaxed">
                            {selectedClub.signatureHole.notes || "No signature hole notes."}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center text-slate-400 text-xs">
                          No signature hole details
                        </div>
                      )}
                    </div>

                    {/* ── SELLING POINTS ── */}
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-2">Selling Points</h3>
                      {selectedClub.sellingPoints && selectedClub.sellingPoints.length > 0 && selectedClub.sellingPoints.some(sp => sp.title) ? (
                        <div className="space-y-2">
                          {selectedClub.sellingPoints.map((sp, i) => sp.title ? (
                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                {sp.title}
                              </div>
                              <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">{sp.description}</p>
                            </div>
                          ) : null)}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs">No selling points provided.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/edit-clubs?id=${selectedClub.id}`}
                      className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all shadow-md shadow-emerald-600/10 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Club Details</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setClubToDelete(selectedClub)}
                      className="py-3 px-4 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedClub(null)}
                    className="py-3 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold transition-all cursor-pointer text-center"
                  >
                    Close Details
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
          {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {clubToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setClubToDelete(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-2xl z-10 overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setClubToDelete(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-5 border border-red-100">
                  <AlertTriangle className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 leading-tight">
                  Delete Golf Club?
                </h3>
                <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <strong className="text-slate-900 font-semibold">{clubToDelete.name}</strong>?
                  This action will remove the club from the platform, deactivate manager access, and unpublish its tee times.
                </p>

                <div className="flex gap-3 w-full mt-7">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setClubToDelete(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteClub}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-red-600/20 inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Club</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </RequireRole>
  );
};

export default AllClubs;
