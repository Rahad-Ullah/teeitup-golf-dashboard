"use no memo";
"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray, SubmitHandler, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Tag,
  CheckCircle2,
  Trophy,
  Activity,
  Layers,
  Sparkles,
  X,
  Star,
  Loader2,
  Video,
  ArrowLeft,
  ShieldCheck,
  Mail,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import ImageUpload from "@/components/form/ImageUpload";
import InputField from "@/components/form/InputField";
import SelectField from "@/components/form/SelectField";
import TextareaField from "@/components/form/TextareaField";
import RequireRole from "@/components/auth/RequireRole";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { fetchUrl, getMediaUrl } from "@/lib/fetchUrl";
import {
  editClubSchema,
  defaultEditClubValues,
  EditClubFormValues,
} from "./editClub.schema";

const MEDIA_TYPE = {
  HERO: "COURSE_HERO",
  GALLERY: "COURSE_GALLERY",
  SIGNATURE_HOLE: "SIGNATURE_HOLE",
} as const;

interface EditClubProps {
  clubId?: string;
}

const EditClub = ({ clubId: propClubId }: EditClubProps = {}) => {
  const searchParams = useSearchParams();
  const queryClubId = searchParams.get("id");
  const targetCourseId = propClubId || queryClubId || null;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [heroImageId, setHeroImageId] = useState<string | undefined>(undefined);
  const [signatureHoleImageId, setSignatureHoleImageId] = useState<string | undefined>(undefined);
  const [courseOwnerEmail, setCourseOwnerEmail] = useState<string | null>(null);

  const loadedCourseIdRef = useRef<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EditClubFormValues>({
    resolver: zodResolver(editClubSchema),
    defaultValues: defaultEditClubValues,
  });

  const watchedHoleVideos = useWatch({ control, name: "holeVideos" }) || [];

  const {
    fields: facilityFields,
    append: appendFacility,
    remove: removeFacility,
  } = useFieldArray({ control, name: "facilities" });

  const {
    fields: galleryFields,
    append: appendGallery,
    remove: removeGallery,
  } = useFieldArray({ control, name: "gallery" });

  const {
    fields: holeVideoFields,
    append: appendHoleVideo,
    remove: removeHoleVideo,
  } = useFieldArray({ control, name: "holeVideos" });

  useEffect(() => {
    const targetKey = targetCourseId || (isAdmin ? "admin-first" : "mine");
    if (loadedCourseIdRef.current === targetKey) {
      return;
    }

    const loadCourse = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        let course: any = null;

        if (targetCourseId) {
          try {
            const res = await fetchUrl(`/courses/admin/${targetCourseId}`);
            course = res.data;
          } catch {
            const allRes = await fetchUrl("/courses/admin/all?limit=100");
            const found = allRes.data?.find(
              (c: any) => c.id === targetCourseId || c._id === targetCourseId
            );
            if (found) {
              course = found;
            } else {
              throw new Error("Course not found.");
            }
          }
        } else if (isAdmin) {
          const allRes = await fetchUrl("/courses/admin/all?limit=100");
          if (allRes.data && allRes.data.length > 0) {
            course = allRes.data[0];
          } else {
            throw new Error("No registered clubs found.");
          }
        } else {
          const res = await fetchUrl("/courses/mine");
          course = res.data;
        }

        if (!course) {
          throw new Error("Failed to load club details.");
        }

        const resolvedId = course._id || course.id;
        setCourseId(resolvedId);
        setHeroImageId(course.heroImage?._id);
        setSignatureHoleImageId(course.signatureHole?.image?._id);
        setCourseOwnerEmail(course.owner?.email || course.ownerEmail || null);

        const sellingPoints = [0, 1, 2, 3].map(
          (i) => course.sellingPoints?.[i] ?? { title: "", description: "" }
        );

        const mappedStatus: "ACTIVE" | "PENDING" | "SUSPENDED" =
          course.status === "Active" || course.status === "ACTIVE"
            ? "ACTIVE"
            : course.status === "Suspended" || course.status === "SUSPENDED"
            ? "SUSPENDED"
            : "PENDING";

        reset({
          name: course.name ?? "",
          location: course.location ?? "",
          status: mappedStatus,
          isFeatured: Boolean(course.isFeatured),
          rating: course.rating ?? 0,
          reviewsCount: course.reviewsCount ?? 0,
          summary: course.summary ?? "",
          description: course.description ?? "",
          image: getMediaUrl(course.heroImage?.url),
          stats: {
            yardage: course.stats?.yardage ?? "",
            par: course.stats?.par ?? 0,
            slope: course.stats?.slope ?? 0,
            rating: course.stats?.rating ?? 0,
            holes: course.stats?.holes ?? 18,
            tees: course.stats?.tees ?? 0,
            elevation: course.stats?.elevation ?? "",
            avgTime: course.stats?.avgTime ?? "",
            courseType: course.stats?.courseType ?? "",
            difficulty: course.stats?.difficulty ?? "",
          },
          sellingPoints,
          facilities: course.facilities ?? [],
          signatureHole: {
            number: course.signatureHole?.number ?? "",
            name: course.signatureHole?.name ?? "",
            par: course.signatureHole?.par ?? 0,
            yardage: course.signatureHole?.yardage ?? 0,
            notes: course.signatureHole?.notes ?? "",
            image: getMediaUrl(course.signatureHole?.image?.url),
          },
          gallery: (course.gallery ?? []).map((media: any) => ({
            src: getMediaUrl(media.url),
            mediaId: media._id,
          })),
          holeVideos: course.holeVideos ?? [],
        });

        loadedCourseIdRef.current = targetKey;
      } catch (err: any) {
        setLoadError(err.message || "Failed to load club profile.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [targetCourseId, isAdmin]);

  const uploadImage = async (file: File, type: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const relatedId = courseId || targetCourseId;
    if (relatedId) {
      formData.append("relatedModel", "Course");
      formData.append("relatedTo", relatedId);
    }
    const res = await fetchUrl("/media/upload", { method: "POST", body: formData });
    return res.data._id;
  };

  const onSubmit: SubmitHandler<EditClubFormValues> = async (data) => {
    setIsSaving(true);
    try {
      const newHeroImageId =
        data.image instanceof File
          ? await uploadImage(data.image, MEDIA_TYPE.HERO)
          : heroImageId;

      const newSignatureHoleImageId =
        data.signatureHole?.image instanceof File
          ? await uploadImage(data.signatureHole.image, MEDIA_TYPE.SIGNATURE_HOLE)
          : signatureHoleImageId;

      const galleryIds = (
        await Promise.all(
          (data.gallery || []).map(async (item) => {
            if (item.src instanceof File) return uploadImage(item.src, MEDIA_TYPE.GALLERY);
            return item.mediaId;
          })
        )
      ).filter((id): id is string => Boolean(id));

      const payload: Record<string, unknown> = {
        name: data.name,
        location: data.location,
        summary: data.summary,
        description: data.description,
        stats: data.stats,
        sellingPoints: (data.sellingPoints || []).filter((sp) => sp.title?.trim() || sp.description?.trim()),
        facilities: (data.facilities || []).filter((f) => f.name?.trim() || f.description?.trim()),
        holeVideos: (data.holeVideos || []).filter((v) => v.url?.trim()),
        gallery: galleryIds,
        signatureHole: {
          ...data.signatureHole,
          image: newSignatureHoleImageId || undefined,
        },
      };

      if (newHeroImageId) {
        payload.heroImage = newHeroImageId;
      }

      if (isAdmin) {
        payload.status = data.status;
        payload.isFeatured = data.isFeatured;
      }

      const patchEndpoint =
        isAdmin && (courseId || targetCourseId)
          ? `/courses/${courseId || targetCourseId}`
          : "/courses/mine";

      const res = await fetchUrl(patchEndpoint, { method: "PATCH", body: payload });
      const course = res.data;

      setHeroImageId(course?.heroImage?._id ?? newHeroImageId);
      setSignatureHoleImageId(course?.signatureHole?.image?._id ?? newSignatureHoleImageId);

      const targetKey = targetCourseId || (isAdmin ? "admin-first" : "mine");
      loadedCourseIdRef.current = targetKey;

      reset(
        {
          ...data,
          status:
            course?.status === "Active" || course?.status === "ACTIVE"
              ? "ACTIVE"
              : course?.status === "Suspended" || course?.status === "SUSPENDED"
              ? "SUSPENDED"
              : course?.status === "Pending" || course?.status === "PENDING"
              ? "PENDING"
              : data.status,
          isFeatured: course?.isFeatured ?? data.isFeatured,
          image: course?.heroImage?.url ? getMediaUrl(course.heroImage.url) : data.image,
          signatureHole: {
            ...data.signatureHole,
            image: course?.signatureHole?.image?.url
              ? getMediaUrl(course.signatureHole.image.url)
              : data.signatureHole?.image,
          },
          gallery: (course?.gallery ?? []).map((media: any) => ({
            src: getMediaUrl(media.url),
            mediaId: media._id,
          })),
          holeVideos: course?.holeVideos ?? data.holeVideos,
        },
        { keepDirty: false }
      );

      toast.success(isAdmin ? "Club updated successfully!" : "Club profile updated!");
    } catch (err: any) {
      const fieldErrors: { field?: string; message: string }[] | undefined = err.data?.errors;
      if (fieldErrors?.length) {
        fieldErrors.forEach((fe) => {
          if (fe.field) {
            setError(fe.field as any, { type: "server", message: fe.message });
          }
        });
        toast.error("Some fields couldn't be saved — see the highlighted errors below.");
      } else {
        toast.error(err.message || "Failed to update club profile.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RequireRole role={["club_owner", "admin"]}>
      <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Admin Navigation Bar */}
          {isAdmin && (
            <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
              <Link
                href="/all-clubs"
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-emerald-700 bg-white hover:bg-emerald-50 px-4 py-2.5 rounded-xl border border-slate-200 transition-all shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Clubs</span>
              </Link>
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Admin Management Mode</span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                {isAdmin ? "Edit Club Details" : "Edit Club Profile"}
              </h1>
              <p className="text-slate-500 mt-2 text-lg font-medium">
                {isAdmin
                  ? "Update club parameters, media, course metrics, and public showcase data."
                  : "All profile updates flow dynamically to your public website details page."}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-slate-400 py-24">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading club profile...
            </div>
          ) : loadError ? (
            <div className="bg-white border border-red-100 rounded-3xl p-12 text-center shadow-xs">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Failed to load club</h3>
              <p className="text-sm text-slate-500 mb-6">{loadError}</p>
              {isAdmin && (
                <Link
                  href="/all-clubs"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to All Clubs</span>
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
              {/* ADMIN CONTROLS SECTION */}
              {isAdmin && (
                <section className="bg-linear-to-r from-emerald-50/70 via-teal-50/50 to-slate-50 border border-emerald-200/80 rounded-3xl p-8 shadow-xs">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Admin Platform Controls</h2>
                      <p className="text-xs text-slate-500">Configure publication status and promotional highlights.</p>
                    </div>
                    {courseOwnerEmail && (
                      <div className="ml-auto flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-2xs">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Owner: <strong className="text-slate-800">{courseOwnerEmail}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField
                      title="Club Status"
                      name="status"
                      options={[
                        { label: "Active (Approved & Visible)", value: "ACTIVE" },
                        { label: "Pending (Under Review)", value: "PENDING" },
                        { label: "Suspended (Hidden)", value: "SUSPENDED" },
                      ]}
                      control={control}
                      register={register}
                      error={errors.status}
                    />

                    <div>
                      <label className="block text-[11px] font-bold tracking-widest text-[#9CA3AF] uppercase mb-2">
                        Featured Course
                      </label>
                      <Controller
                        control={control}
                        name="isFeatured"
                        render={({ field }) => (
                          <div
                            onClick={() => field.onChange(!field.value)}
                            className={cn(
                              "flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all bg-white",
                              field.value ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-slate-200 hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <Sparkles className={cn("w-4 h-4", field.value ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
                              <span className="text-sm font-semibold text-slate-800">
                                Feature this club on homepage
                              </span>
                            </div>
                            <div
                              className={cn(
                                "w-10 h-6 rounded-full transition-colors relative flex items-center px-0.5",
                                field.value ? "bg-emerald-600" : "bg-slate-300"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                                  field.value ? "translate-x-4" : "translate-x-0"
                                )}
                              />
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* SECTION 1: CORE BRAND DETAILS */}
              <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs relative overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                    <Tag size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Core Club Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <InputField title="Club Name" name="name" control={control} register={register} error={errors.name} />
                    <InputField title="Location (City, State)" name="location" control={control} register={register} error={errors.location} />

                    <div className="grid grid-cols-2 gap-4">
                      <InputField title="Average Rating" name="rating" type="number" control={control} register={register} rules={{ valueAsNumber: true }} error={errors.rating} disabled />
                      <InputField title="Verified Reviews Count" name="reviewsCount" type="number" control={control} register={register} rules={{ valueAsNumber: true }} error={errors.reviewsCount} disabled />
                    </div>
                    <p className="text-xs text-slate-400 -mt-2">Rating and review count are calculated automatically from player reviews.</p>

                    <TextareaField title="Brief Summary (Hero Tagline)" name="summary" control={control} register={register} error={errors.summary} />
                    <TextareaField title="Detailed Course Overview Description" name="description" control={control} register={register} error={errors.description} rows={6} />
                  </div>

                  <div>
                    <Controller
                      control={control}
                      name="image"
                      render={({ field }) => (
                        <ImageUpload label="Hero Background Image Banner" value={field.value} onChange={field.onChange} aspectRatio="aspect-video" />
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 2: COURSE SPECIFICATIONS */}
              <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600">
                    <Activity size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Course Specs & Metrics</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  <InputField title="Total Yardage" name="stats.yardage" control={control} register={register} error={errors.stats?.yardage} />
                  <InputField title="Par Rating" name="stats.par" type="number" control={control} register={register} rules={{ valueAsNumber: true }} error={errors.stats?.par} />
                  <InputField title="Slope Rating" name="stats.slope" type="number" control={control} register={register} rules={{ valueAsNumber: true }} error={errors.stats?.slope} />
                  <InputField title="Course Rating" name="stats.rating" type="number" control={control} register={register} rules={{ valueAsNumber: true }} error={errors.stats?.rating} />
                  <SelectField
                    title="Number of Holes (Course Total)"
                    name="stats.holes"
                    options={[
                      { label: "9 Holes", value: 9 },
                      { label: "18 Holes", value: 18 },
                    ]}
                    control={control}
                    register={register}
                    rules={{ valueAsNumber: true }}
                    error={errors.stats?.holes}
                  />
                  <InputField title="Number of Tee Boxes" name="stats.tees" type="number" control={control} register={register} rules={{ valueAsNumber: true }} error={errors.stats?.tees} />
                  <InputField title="Elevation Changes" name="stats.elevation" control={control} register={register} error={errors.stats?.elevation} />
                  <InputField title="Average Round Time" name="stats.avgTime" control={control} register={register} error={errors.stats?.avgTime} />
                  <InputField title="Course Type" name="stats.courseType" control={control} register={register} error={errors.stats?.courseType} />
                  <InputField title="Difficulty Level" name="stats.difficulty" control={control} register={register} error={errors.stats?.difficulty} />
                </div>
              </section>

              {/* SECTION 3: WHY GOLFERS LOVE THIS COURSE (4 SELLING POINTS) */}
              <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                    <Trophy size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Why Golfers Love This Course (4 Selling Points)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                      <span className="inline-block text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 uppercase tracking-wider mb-2">
                        Highlight Selling Point #{index + 1}
                      </span>
                      <InputField
                        title="Selling Point Title"
                        name={`sellingPoints.${index}.title`}
                        control={control}
                        register={register}
                        error={errors.sellingPoints?.[index]?.title}
                      />
                      <TextareaField
                        title="Selling Point Description"
                        name={`sellingPoints.${index}.description`}
                        control={control}
                        register={register}
                        error={errors.sellingPoints?.[index]?.description}
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 4: PRACTICE & PLAYING FACILITIES */}
              <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                      <Layers size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Practice & Playing Facilities</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendFacility({ name: "", description: "" })}
                    className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-purple-100 cursor-pointer self-start"
                  >
                    <Plus size={18} /> Add Facility
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {facilityFields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group bg-slate-50 border border-slate-200 p-6 rounded-2xl relative hover:border-purple-300 transition-all shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => removeFacility(index)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-2"
                        >
                          <Trash2 size={18} />
                        </button>

                        <div className="space-y-4 pr-8">
                          <InputField
                            title="Facility Name"
                            name={`facilities.${index}.name`}
                            placeholder="e.g. 350-Yard Driving Range"
                            control={control}
                            register={register}
                            error={errors.facilities?.[index]?.name}
                          />
                          <TextareaField
                            title="Facility Description"
                            name={`facilities.${index}.description`}
                            placeholder="Describe targets, size, availability..."
                            control={control}
                            register={register}
                            error={errors.facilities?.[index]?.description}
                            rows={2}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              {/* SECTION 5: SIGNATURE HOLE SHOWCASE */}
              <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                    <Star size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Signature Hole Showcase</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <InputField title="Which Hole # (e.g. 14)" name="signatureHole.number" control={control} register={register} error={errors.signatureHole?.number} />
                      <InputField title="Hole Name" name="signatureHole.name" control={control} register={register} error={errors.signatureHole?.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <InputField title="Par Rating" name="signatureHole.par" type="number" control={control} register={register} rules={{ valueAsNumber: true }} error={errors.signatureHole?.par} />
                      <InputField title="Yardage" name="signatureHole.yardage" type="number" control={control} register={register} rules={{ valueAsNumber: true }} error={errors.signatureHole?.yardage} />
                    </div>

                    <TextareaField title="Strategic Playing Notes" name="signatureHole.notes" control={control} register={register} error={errors.signatureHole?.notes} rows={4} />
                  </div>

                  <div>
                    <Controller
                      control={control}
                      name="signatureHole.image"
                      render={({ field }) => (
                        <ImageUpload label="Signature Hole Showcase Image" value={field.value} onChange={field.onChange} aspectRatio="aspect-video" />
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 6: PHOTO GALLERY */}
              <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
                      <ImageIcon size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Visual Gallery</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendGallery({ src: "", mediaId: "" })}
                    className="flex items-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-sky-100 cursor-pointer self-start"
                  >
                    <Plus size={18} /> Add Photo
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {galleryFields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group relative bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-sky-300 transition-all shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => removeGallery(index)}
                          className="absolute top-6 right-6 z-10 bg-white/90 hover:bg-white text-slate-400 hover:text-red-500 transition-all p-2 rounded-xl shadow-xs"
                        >
                          <Trash2 size={16} />
                        </button>
                        <Controller
                          control={control}
                          name={`gallery.${index}.src` as const}
                          render={({ field }) => (
                            <ImageUpload label={`Gallery Image #${index + 1}`} value={field.value} onChange={field.onChange} aspectRatio="aspect-video" />
                          )}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              {/* SECTION 7: COURSE HOLE VIDEOS */}
              {(() => {
                const holeVideos = watchedHoleVideos;
                const usedHoles = new Set((holeVideos || []).map((v) => v.holeNumber));
                const nextAvailableHole =
                  Array.from({ length: 18 }, (_, i) => i + 1).find((n) => !usedHoles.has(n)) ?? null;

                return (
                  <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                          <Video size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Course Hole Videos</h2>
                      </div>
                      <button
                        type="button"
                        disabled={nextAvailableHole === null}
                        onClick={() => {
                          if (nextAvailableHole !== null) {
                            appendHoleVideo({ holeNumber: nextAvailableHole, url: "" });
                          }
                        }}
                        className="flex items-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-teal-100 cursor-pointer self-start disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus size={18} /> Add Hole
                      </button>
                    </div>
                    <p className="text-sm text-slate-400 font-medium mb-8">
                      Add a video link for any hole — YouTube, Vimeo, or any hosted video URL. Click &quot;Add Hole&quot; for each hole you want to showcase.
                    </p>

                    {holeVideoFields.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl gap-3">
                        <Video size={36} className="text-slate-300" />
                        <p className="text-sm font-medium">No hole videos added yet</p>
                        <p className="text-xs">Click &quot;Add Hole&quot; above to start adding video links</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence mode="popLayout">
                          {holeVideoFields.map((field, index) => (
                            <motion.div
                              key={field.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="group bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 hover:border-teal-300 transition-all relative"
                            >
                              <button
                                type="button"
                                onClick={() => removeHoleVideo(index)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1"
                              >
                                <Trash2 size={16} />
                              </button>

                              <div className="pr-7">
                                <label className="block text-[11px] font-bold tracking-widest text-[#9CA3AF] uppercase mb-2">
                                  Hole Number
                                </label>
                                <Controller
                                  control={control}
                                  name={`holeVideos.${index}.holeNumber`}
                                  render={({ field: f }) => (
                                    <select
                                      value={f.value}
                                      onChange={(e) => f.onChange(Number(e.target.value))}
                                      className="w-full rounded-lg bg-white border border-slate-200 px-4 py-3 text-[14px] text-gray-600 outline-none transition-all focus:border-teal-400"
                                    >
                                      {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
                                        <option
                                          key={n}
                                          value={n}
                                          disabled={usedHoles.has(n) && f.value !== n}
                                        >
                                          Hole #{n}{usedHoles.has(n) && f.value !== n ? " (added)" : ""}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                />
                              </div>

                              <InputField
                                title="Video URL"
                                name={`holeVideos.${index}.url`}
                                placeholder="https://..."
                                control={control}
                                register={register}
                                error={errors.holeVideos?.[index]?.url}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </section>
                );
              })()}

              {/* FORM SUBMISSION BAR */}
              <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-slate-200 gap-6">
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <Link
                      href="/all-clubs"
                      className="py-4 px-6 rounded-2xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-bold transition-all"
                    >
                      Cancel & Back
                    </Link>
                  )}
                  <p className="text-slate-400 text-sm font-medium italic">
                    * Publishing updates will immediately update the public club landing page.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="group flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-5 rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl cursor-pointer disabled:opacity-60 disabled:hover:scale-100"
                >
                  {isSaving ? "Saving..." : isAdmin ? "Save All Changes" : "Publish Updates"}
                  {isSaving ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={24} className="group-hover:animate-bounce" />
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </RequireRole>
  );
};

export default EditClub;
