"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, SubmitHandler, Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Tag,
  CheckCircle2,
  Trophy,
  Activity,
  Layers,
  Sparkles,
  X,
  Star,
  Loader2,
  Video
} from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/form/ImageUpload";
import InputField from "@/components/form/InputField";
import SelectField from "@/components/form/SelectField";
import TextareaField from "@/components/form/TextareaField";
import RequireRole from "@/components/auth/RequireRole";
import { fetchUrl, getMediaUrl } from "@/lib/fetchUrl";

interface SellingPoint {
  title: string;
  description: string;
}

interface Facility {
  name: string;
  description: string;
}

interface GalleryImage {
  src: string | File;
  mediaId?: string;
}

interface HoleVideo {
  holeNumber: number;
  url: string;
}

interface ClubFormValues {
  name: string;
  location: string;
  rating: number;
  reviewsCount: number;
  summary: string;
  description: string;
  image: string | File;
  stats: {
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
  };
  sellingPoints: SellingPoint[];
  facilities: Facility[];
  signatureHole: {
    number: string;
    name: string;
    par: number;
    yardage: number;
    notes: string;
    image: string | File;
  };
  gallery: GalleryImage[];
  holeVideos: HoleVideo[];
}

const blankClubInfo: ClubFormValues = {
  name: "",
  location: "",
  rating: 0,
  reviewsCount: 0,
  summary: "",
  description: "",
  image: "",
  stats: {
    yardage: "",
    par: 0,
    slope: 0,
    rating: 0,
    holes: 18,
    tees: 0,
    elevation: "",
    avgTime: "",
    courseType: "",
    difficulty: "",
  },
  sellingPoints: [
    { title: "", description: "" },
    { title: "", description: "" },
    { title: "", description: "" },
    { title: "", description: "" },
  ],
  facilities: [],
  signatureHole: {
    number: "",
    name: "",
    par: 0,
    yardage: 0,
    notes: "",
    image: "",
  },
  gallery: [],
  holeVideos: [],
};

const MEDIA_TYPE = {
  HERO: "COURSE_HERO",
  GALLERY: "COURSE_GALLERY",
  SIGNATURE_HOLE: "SIGNATURE_HOLE",
} as const;

const EditClub = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [heroImageId, setHeroImageId] = useState<string | undefined>(undefined);
  const [signatureHoleImageId, setSignatureHoleImageId] = useState<string | undefined>(undefined);

  const { register, control, handleSubmit, reset, setError, watch, formState: { errors } } = useForm<ClubFormValues>({
    defaultValues: blankClubInfo
  });

  const { fields: facilityFields, append: appendFacility, remove: removeFacility } = useFieldArray({
    control,
    name: "facilities"
  });

  const { fields: galleryFields, append: appendGallery, remove: removeGallery } = useFieldArray({
    control,
    name: "gallery"
  });

  const { fields: holeVideoFields, append: appendHoleVideo, remove: removeHoleVideo } = useFieldArray({
    control,
    name: "holeVideos"
  });

  useEffect(() => {
    const loadCourse = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetchUrl("/courses/mine");
        const course = res.data;

        setCourseId(course._id);
        setHeroImageId(course.heroImage?._id);
        setSignatureHoleImageId(course.signatureHole?.image?._id);

        const sellingPoints: SellingPoint[] = [0, 1, 2, 3].map(
          (i) => course.sellingPoints?.[i] ?? { title: "", description: "" }
        );

        reset({
          name: course.name ?? "",
          location: course.location ?? "",
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
      } catch (err: any) {
        setLoadError(err.message || "Failed to load club profile.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [reset]);

  const uploadImage = async (file: File, type: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    if (courseId) {
      formData.append("relatedModel", "Course");
      formData.append("relatedTo", courseId);
    }
    const res = await fetchUrl("/media/upload", { method: "POST", body: formData });
    return res.data._id;
  };

  const onSubmit: SubmitHandler<ClubFormValues> = async (data) => {
    setIsSaving(true);
    try {
      const newHeroImageId = data.image instanceof File
        ? await uploadImage(data.image, MEDIA_TYPE.HERO)
        : heroImageId;

      const newSignatureHoleImageId = data.signatureHole.image instanceof File
        ? await uploadImage(data.signatureHole.image, MEDIA_TYPE.SIGNATURE_HOLE)
        : signatureHoleImageId;

      const galleryIds = (
        await Promise.all(
          data.gallery.map(async (item) => {
            if (item.src instanceof File) return uploadImage(item.src, MEDIA_TYPE.GALLERY);
            return item.mediaId;
          })
        )
      ).filter((id): id is string => Boolean(id));

      // Filter out array items that are completely blank across all fields
      const filledSellingPoints = data.sellingPoints.filter(
        (sp) => sp.title.trim() || sp.description.trim()
      );
      const filledFacilities = data.facilities.filter(
        (f) => f.name.trim() || f.description.trim()
      );
      const filledHoleVideos = data.holeVideos.filter((v) => v.holeNumber > 0 || v.url.trim());

      const payload: Record<string, unknown> = {
        name: data.name,
        location: data.location,
        facilities: filledFacilities,
        gallery: galleryIds,
      };
      
      if (data.summary.trim()) payload.summary = data.summary;
      if (data.description.trim()) payload.description = data.description;
      if (newHeroImageId) payload.heroImage = newHeroImageId;
      
      // Send stats and signature hole regardless of completion status
      payload.stats = data.stats;
      payload.sellingPoints = filledSellingPoints;
      payload.holeVideos = filledHoleVideos;
      payload.signatureHole = { ...data.signatureHole, image: newSignatureHoleImageId };

      const res = await fetchUrl("/courses/mine", { method: "PATCH", body: payload });
      const course = res.data;

      setHeroImageId(course.heroImage?._id);
      setSignatureHoleImageId(course.signatureHole?.image?._id);
      reset(
        {
          ...data,
          image: getMediaUrl(course.heroImage?.url),
          signatureHole: { ...data.signatureHole, image: getMediaUrl(course.signatureHole?.image?.url) },
          gallery: (course.gallery ?? []).map((media: any) => ({
            src: getMediaUrl(media.url),
            mediaId: media._id,
          })),
          holeVideos: course.holeVideos ?? [],
        },
        { keepDirty: false }
      );

      toast.success("Club profile updated!");
    } catch (err: any) {
      const fieldErrors: { field?: string; message: string }[] | undefined = err.data?.errors;
      if (fieldErrors?.length) {
        fieldErrors.forEach((fe) => {
          if (fe.field) {
            // Server field paths are dot-joined (e.g. "stats.holes"), which
            // matches react-hook-form's nested path syntax directly.
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
    <RequireRole role="club_owner">
      <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                Edit Club Profile
              </h1>
              <p className="text-slate-500 mt-2 text-lg font-medium">
                All profile updates flow dynamically to your public website details page.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-slate-400 py-24">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading club profile...
            </div>
          ) : loadError ? (
            <div className="text-center text-red-500 font-medium py-24">{loadError}</div>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">

            {/* SECTION 1: CORE BRAND DETAILS */}
            <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-slate-100 pointer-events-none">
                <Sparkles size={120} />
              </div>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <Tag size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Core Club Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <InputField title="Club Name" name="name" register={register} error={errors.name} />
                  <InputField title="Location (City, State)" name="location" register={register} error={errors.location} />

                  <div className="grid grid-cols-2 gap-4">
                    <InputField title="Average Rating" name="rating" type="number" register={register} error={errors.rating} disabled />
                    <InputField title="Verified Reviews Count" name="reviewsCount" type="number" register={register} error={errors.reviewsCount} disabled />
                  </div>
                  <p className="text-xs text-slate-400 -mt-2">Rating and review count are calculated automatically from player reviews.</p>

                  <TextareaField title="Brief Summary (Hero Tagline)" name="summary" register={register} error={errors.summary} />
                  <TextareaField title="Detailed Course Overview Description" name="description" register={register} error={errors.description} rows={6} />
                </div>

                <div>
                  <Controller control={control} name="image" render={({ field }) => (
                    <ImageUpload label="Hero Background Image Banner" value={field.value} onChange={field.onChange} aspectRatio="aspect-video" />
                  )} />
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
                <InputField title="Total Yardage" name="stats.yardage" register={register} error={errors.stats?.yardage} />
                <InputField title="Par Rating" name="stats.par" type="number" register={register} error={errors.stats?.par} />
                <InputField title="Slope Rating" name="stats.slope" type="number" register={register} error={errors.stats?.slope} />
                <InputField title="Course Rating" name="stats.rating" type="number" register={register} error={errors.stats?.rating} />
                <SelectField
                  title="Number of Holes (Course Total)"
                  name="stats.holes"
                  options={[
                    { label: "9 Holes", value: 9 },
                    { label: "18 Holes", value: 18 },
                  ]}
                  register={register}
                  error={errors.stats?.holes}
                />
                <InputField title="Number of Tee Boxes" name="stats.tees" type="number" register={register} error={errors.stats?.tees} />
                <InputField title="Elevation Changes" name="stats.elevation" register={register} error={errors.stats?.elevation} />
                <InputField title="Average Round Time" name="stats.avgTime" register={register} error={errors.stats?.avgTime} />
                <InputField title="Course Type" name="stats.courseType" register={register} error={errors.stats?.courseType} />
                <InputField title="Difficulty Level" name="stats.difficulty" register={register} error={errors.stats?.difficulty} />
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
                      register={register}
                      error={errors.sellingPoints?.[index]?.title}
                    />
                    <TextareaField
                      title="Selling Point Description"
                      name={`sellingPoints.${index}.description`}
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
                          register={register}
                          error={errors.facilities?.[index]?.name}
                        />
                        <TextareaField
                          title="Facility Description"
                          name={`facilities.${index}.description`}
                          placeholder="Describe targets, size, availability..."
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
                    <InputField title="Which Hole # (e.g. 14)" name="signatureHole.number" register={register} error={errors.signatureHole?.number} />
                    <InputField title="Hole Name" name="signatureHole.name" register={register} error={errors.signatureHole?.name} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField title="Par Rating" name="signatureHole.par" type="number" register={register} error={errors.signatureHole?.par} />
                    <InputField title="Yardage" name="signatureHole.yardage" type="number" register={register} error={errors.signatureHole?.yardage} />
                  </div>

                  <TextareaField title="Strategic Playing Notes" name="signatureHole.notes" register={register} error={errors.signatureHole?.notes} rows={4} />
                </div>

                <div>
                  <Controller control={control} name="signatureHole.image" render={({ field }) => (
                    <ImageUpload label="Signature Hole Showcase Image" value={field.value} onChange={field.onChange} aspectRatio="aspect-video" />
                  )} />
                </div>
              </div>
            </section>

            {/* SECTION 6: COURSE GALLERY */}
            <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <ImageIcon size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Course Photo Gallery</h2>
                </div>
                <button
                  type="button"
                  onClick={() => appendGallery({ src: "" })}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-blue-100 cursor-pointer self-start"
                >
                  <Plus size={18} /> Add Photo
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {galleryFields.map((field, index) => (
                    <motion.div
                      key={field.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group bg-slate-50 border border-slate-200 p-4 rounded-2xl relative hover:border-blue-300 transition-all shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={() => removeGallery(index)}
                        className="absolute -top-3 -right-3 bg-white hover:bg-red-500 text-slate-400 hover:text-white rounded-full p-2 transition-all shadow-sm border border-slate-200 hover:border-red-500 z-10 cursor-pointer"
                      >
                        <X size={14} />
                      </button>

                      <Controller control={control} name={`gallery.${index}.src` as const} render={({ field }) => (
                        <ImageUpload label={`Gallery Image #${index + 1}`} value={field.value} onChange={field.onChange} aspectRatio="aspect-video" />
                      )} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>

            {/* SECTION 7: COURSE HOLE VIDEOS */}
            {(() => {
              const usedHoles = new Set(watch("holeVideos").map((v) => v.holeNumber));
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
                              register={register}
                              error={errors.holeVideos?.[index]?.url}
                              rules={{
                                validate: (v: string) =>
                                  !v || /^https?:\/\/.+/.test(v) || "Must start with https://",
                              }}
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
              <p className="text-slate-400 text-sm font-medium italic">
                * Publishing updates will immediately update the public club landing page.
              </p>
              <button
                type="submit"
                disabled={isSaving}
                className="group flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-5 rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl cursor-pointer disabled:opacity-60 disabled:hover:scale-100"
              >
                {isSaving ? "Publishing..." : "Publish Updates"}
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
