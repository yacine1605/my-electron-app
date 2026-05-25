import { create } from "zustand";

//type OfferStore = {
//  attachment: File | null;
//  setAttachment: (file: File | null) => void;
//  offerTitle: string;
//  setOfferTitle: (title: string) => void;
//};
//
//export const useOfferStore = create<OfferStore>((set) => ({
//  attachment: null,
//  setAttachment: (file) => set({ attachment: file }),
//  offerTitle: "",
//  setOfferTitle: (title) => set({ offerTitle: title }),
//}));
type Offer = {
  id: string;
  title: string;
  entityName: string;
  entityType: string;
  city: string;
  createdAt: string;
  status: "draft" | "pending" | "validated" | "rejected";
  recipientsCount: number;
  hasAttachment: boolean;
};

type BackendAttachment = {
  path: string;
  name: string;
  size: number;
};

type OfferStore = {
  attachment: File | null;
  setAttachment: (file: File | null) => void;

  backendAttachment: BackendAttachment | null;
  setBackendAttachment: (attachment: BackendAttachment | null) => void;

  offerTitle: string;
  setOfferTitle: (title: string) => void;

  currentOfferId: string | null;
  setCurrentOfferId: (id: string | null) => void;

  offers: Offer[];
  addOffer: (offer: Offer) => void;

  // ✅ properly typed as File[]
  referenceFiles: File[];
  setReferenceFiles: (files: File[]) => void;
};

export const useOfferStore = create<OfferStore>((set) => ({
  attachment: null,
  setAttachment: (file) => set({ attachment: file }),

  backendAttachment: null,
  setBackendAttachment: (attachment) => set({ backendAttachment: attachment }),

  offerTitle: "",
  setOfferTitle: (title) => set({ offerTitle: title }),

  currentOfferId: null,
  setCurrentOfferId: (id) => set({ currentOfferId: id }),

  offers: [],
  addOffer: (offer) =>
    set((state) => ({
      offers: [...state.offers, offer],
    })),

  // ✅ replaces the broken untyped referenceFile
  referenceFiles: [],
  setReferenceFiles: (files) => set({ referenceFiles: files }),
}));
