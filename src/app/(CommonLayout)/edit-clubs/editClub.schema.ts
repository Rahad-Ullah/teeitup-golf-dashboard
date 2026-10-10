import { z } from "zod";

export const statsSchema = z.object({
  yardage: z.string().optional(),
  par: z.number().optional(),
  slope: z.number().optional(),
  rating: z.number().optional(),
  holes: z.number().optional(),
  tees: z.number().optional(),
  elevation: z.string().optional(),
  avgTime: z.string().optional(),
  courseType: z.string().optional(),
  difficulty: z.string().optional(),
});

export const sellingPointSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

export const facilitySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export const signatureHoleSchema = z.object({
  number: z.string().optional(),
  name: z.string().optional(),
  par: z.number().optional(),
  yardage: z.number().optional(),
  notes: z.string().optional(),
  image: z.any().optional(),
});

export const galleryItemSchema = z.object({
  src: z.any().optional(),
  mediaId: z.string().optional(),
});

export const holeVideoSchema = z.object({
  holeNumber: z.number().optional(),
  url: z.string().optional(),
});

export const editClubSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED"]).optional(),
  isFeatured: z.boolean().optional(),
  rating: z.number().optional(),
  reviewsCount: z.number().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  image: z.any().optional(),
  stats: statsSchema.optional(),
  sellingPoints: z.array(sellingPointSchema).optional(),
  facilities: z.array(facilitySchema).optional(),
  signatureHole: signatureHoleSchema.optional(),
  gallery: z.array(galleryItemSchema).optional(),
  holeVideos: z.array(holeVideoSchema).optional(),
});

export type EditClubFormValues = z.infer<typeof editClubSchema>;
export type SellingPoint = z.infer<typeof sellingPointSchema>;
export type Facility = z.infer<typeof facilitySchema>;
export type GalleryItem = z.infer<typeof galleryItemSchema>;
export type HoleVideo = z.infer<typeof holeVideoSchema>;

export const defaultEditClubValues: EditClubFormValues = {
  name: "",
  location: "",
  status: "PENDING",
  isFeatured: false,
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
