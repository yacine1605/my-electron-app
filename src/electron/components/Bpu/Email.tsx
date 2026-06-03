"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useOfferStore } from "@/lib/hooks/useOffre";
import { useAccountants } from "@/lib/hooks/useUsers";
import { useAuthStore } from "@/lib/hooks/Useauthstore";

import { getAuthHeaders } from "@/lib/hooks/apiClient";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type MedicalEntity = {
  name: string;
  type: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  contactPerson: string;
};

type AttachmentType =
  | "technical_sheet"
  | "conformity_certificate"
  | "origin_certificate"
  | "manufacturing_certificate"
  | "user_manual"
  | "catalog"
  | "sample"
  | "other";

type AttachmentFile = { file: File; type: AttachmentType };

type ExtractedTenderLot = { number: string; object: string };

type ExtractedTender = {
  title?: string | null;
  tenderNumber?: string | null;
  name_organization?: string | null;
  type_organization?: string | null;
  ministry?: string | null;
  wilaya?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  year?: string | null;
  procedureType?: "appel_offre" | "consultation" | null;
  lots?: ExtractedTenderLot[];
};

type ExtractedDocument = {
  documentType: "TENDER" | "CONSULTATION" | "INVOICE" | "UNKNOWN";
  tender?: ExtractedTender | null;
  invoice?: any;
};

type Recipient = { id?: string; name: string; email: string; role?: string };

type WizardData = {
  offerTitle: string;
  medicalEntity: MedicalEntity;
  emailSubject: string;
  emailBody: string;
  emailSignature: string;
  recipients: Recipient[];

  lots: ExtractedTenderLot[];

  lotNumber: string;
  lotObject: string;

  // ── En-tête plan de charge / offre ──
  commercialName: string; // ← AJOUTÉ
  consultationNumber: string; // ← AJOUTÉ
  establishment: string; // ← AJOUTÉ
  wilaya: string; // ← AJOUTÉ
  depositLocation: string; // ← AJOUTÉ
  procedureType: "appel_offre" | "consultation" | null; // ← AJOUTÉ
  hospitalDepositDate: string; // ← AJOUTÉ
  technicalDepartmentDepositDate: string; // ← AJOUTÉ

  warrantyDuration: string;
  deliveryDelay: string;
  savDuration: string;
  interventionDelay: string;
  savLocations: string;
  trainingDuration: string;
  supplierCommercialAudit: string; // ← AJOUTÉ

  hasTechnicalSheet: boolean;
  hasConformityCertificate: boolean;
  hasOriginCertificate: boolean;
  hasManufacturingCertificate: boolean;
  hasUserManual: boolean;
  hasCatalog: boolean;
  hasSample: boolean;

  attachments: AttachmentFile[];
};

type ValidationErrors = Record<string, string>;

type SendResultDetail = {
  recipientId: string;
  recipientEmail: string;
  status: "sent" | "failed";
  error?: string;
};

type SendResult = {
  offerId: string;
  total: number;
  sent: number;
  failed: number;
  details: SendResultDetail[];
  attachments?: {
    path: string;
    url: string;
    name: string;
    size: number;
    mimeType: string;
    type: string;
  }[];
};

type ApiState =
  | { status: "idle" }
  | { status: "loading"; action: "send" | "draft" }
  | { status: "success"; result: SendResult }
  | { status: "error"; message: string };

/* ─── Constants ─────────────────────────────────────────────────────────── */

const API_BASE = "https://api.digitservz.dz/api";

const STEPS = [
  "Entité",
  "Plan de charge",
  "Contenu email",
  "Pièces jointes",
  "Destinataires",
  "Vérification",
];

const ATTACHMENT_LABELS: Record<AttachmentType, string> = {
  technical_sheet: "Fiches techniques",
  conformity_certificate: "Certificats conformité",
  origin_certificate: "Certificat d'origine",
  manufacturing_certificate: "Certificat de fabrication Algérienne",
  user_manual: "Manuel d'utilisateur",
  catalog: "Catalogues",
  sample: "Échantillons",
  other: "Autre document",
};

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const initialData: WizardData = {
  offerTitle: "",
  medicalEntity: {
    name: "",
    type: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    contactPerson: "",
  },
  emailSubject: "Relance concernant notre échange avec {{entityName}}",
  emailBody: `Bonjour {{contactPerson}},

Suite à nos échanges avec {{entityName}}, je me permets de vous relancer concernant notre offre.

Nous restons à votre entière disposition pour toute information complémentaire ou précision sur les équipements et services proposés.

Dans l'attente de votre retour, nous vous prions d'agréer, {{contactPerson}}, l'expression de nos salutations distinguées.`,
  emailSignature: "",
  recipients: [],
  lots: [],
  lotNumber: "",
  lotObject: "",

  // ── AJOUTÉ ──
  commercialName: "",
  consultationNumber: "",
  establishment: "",
  wilaya: "",
  depositLocation: "",
  procedureType: null,
  hospitalDepositDate: "",
  technicalDepartmentDepositDate: "",
  supplierCommercialAudit: "",

  warrantyDuration: "",
  deliveryDelay: "",
  savDuration: "",
  interventionDelay: "",
  savLocations: "",
  trainingDuration: "",

  hasTechnicalSheet: false,
  hasConformityCertificate: false,
  hasOriginCertificate: false,
  hasManufacturingCertificate: false,
  hasUserManual: false,
  hasCatalog: false,
  hasSample: false,
  attachments: [],
};

/* ─── Utilities ─────────────────────────────────────────────────────────── */

function applyTemplateVariables(text: string, entity: MedicalEntity): string {
  return text
    .replace(/\{\{entityName\}\}/g, entity.name || "votre établissement")
    .replace(
      /\{\{contactPerson\}\}/g,
      entity.contactPerson || "Madame, Monsieur",
    )
    .replace(/\{\{city\}\}/g, entity.city || "votre ville");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Type non autorisé : ${file.type || "inconnu"}. Formats acceptés : PDF, Word, Excel, PNG, JPG, WEBP.`;
  }
  if (file.size > 20 * 1024 * 1024) {
    return "Fichier trop volumineux (max 20 MB).";
  }
  return null;
}

function buildFormData(data: WizardData, sourceOfferId?: string): FormData {
  const fd = new FormData();
  const payload = {
    sourceOfferId,
    offerTitle: data.offerTitle,
    medicalEntity: data.medicalEntity,
    emailSubject: data.emailSubject,
    emailBody: data.emailBody,
    emailSignature: data.emailSignature,
    recipientIds: data.recipients.map((r) => r.id).filter(Boolean),
    supplierIds: [], // ← AJOUTÉ (Zod attend un tableau)

    lots: data.lots,
    lotNumber: data.lotNumber,
    lotObject: data.lotObject,

    // ── AJOUTÉ ──
    commercialName: data.commercialName,
    consultationNumber: data.consultationNumber,
    establishment: data.establishment,
    wilaya: data.wilaya,
    depositLocation: data.depositLocation,
    procedureType: data.procedureType,
    hospitalDepositDate: data.hospitalDepositDate || null,
    technicalDepartmentDepositDate: data.technicalDepartmentDepositDate || null,
    supplierCommercialAudit: data.supplierCommercialAudit,

    warrantyDuration: data.warrantyDuration,
    deliveryDelay: data.deliveryDelay,
    savDuration: data.savDuration,
    interventionDelay: data.interventionDelay,
    savLocations: data.savLocations,
    trainingDuration: data.trainingDuration,
    hasTechnicalSheet: data.hasTechnicalSheet,
    hasConformityCertificate: data.hasConformityCertificate,
    hasOriginCertificate: data.hasOriginCertificate,
    hasManufacturingCertificate: data.hasManufacturingCertificate,
    hasUserManual: data.hasUserManual,
    hasCatalog: data.hasCatalog,
    hasSample: data.hasSample,
  };

  fd.append("data", JSON.stringify(payload));

  data.attachments.forEach((att) => {
    fd.append("attachments", att.file);
    fd.append("attachmentTypes", att.type);
  });

  return fd;
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function StepIndicator({
  steps,
  current,
  onJump,
}: {
  steps: string[];
  current: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="mb-6 grid grid-cols-3 gap-2 md:grid-cols-6">
      {steps.map((step, index) => {
        const isActive = index === current;
        const isDone = index < current;
        return (
          <button
            key={step}
            type="button"
            onClick={() => isDone && onJump(index)}
            disabled={!isDone}
            className={[
              "rounded-xl border p-3 text-center text-sm transition",
              isActive
                ? "border-teal-600 bg-teal-50 font-semibold text-teal-700"
                : "",
              isDone
                ? "cursor-pointer border-teal-400 bg-teal-50 text-teal-600 hover:border-teal-600"
                : "",
              !isActive && !isDone
                ? "border-gray-200 bg-white text-gray-500"
                : "",
            ].join(" ")}
          >
            <div className="mb-1 text-xs opacity-70">Étape {index + 1}</div>
            <div>{step}</div>
          </button>
        );
      })}
    </div>
  );
}

function SendResultPanel({ result }: { result: SendResult }) {
  const pct = Math.round((result.sent / result.total) * 100);
  const allOk = result.failed === 0;

  return (
    <div
      className={`mt-4 rounded-xl border p-4 ${
        allOk ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50"
      }`}
    >
      <h4
        className={`mb-3 font-semibold ${
          allOk ? "text-teal-800" : "text-amber-800"
        }`}
      >
        Résultat de l&apos;envoi : {result.sent}/{result.total} email(s)
      </h4>

      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-teal-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: "Envoyé(s)", value: result.sent, color: "text-teal-700" },
          {
            label: "Échoué(s)",
            value: result.failed,
            color: result.failed > 0 ? "text-red-600" : "text-gray-500",
          },
          { label: "Total", value: result.total, color: "text-gray-700" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-lg bg-white p-3 text-center shadow-sm"
          >
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="mt-0.5 text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {result.details.map((d) => (
          <div
            key={d.recipientId}
            className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
          >
            <span className="text-gray-700">{d.recipientEmail}</span>
            <div className="flex items-center gap-2">
              {d.error && (
                <span className="max-w-40 truncate text-xs text-red-500">
                  {d.error}
                </span>
              )}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  d.status === "sent"
                    ? "bg-teal-100 text-teal-800"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {d.status === "sent" ? "Envoyé" : "Échec"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {result.attachments && result.attachments.length > 0 && (
        <div className="mt-4 rounded-lg bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-gray-700">
            {result.attachments.length} pièce(s) jointe(s) enregistrée(s)
          </p>
          <div className="flex flex-wrap gap-2">
            {result.attachments.map((att, i) => (
              <span
                key={i}
                className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
              >
                {ATTACHMENT_LABELS[att.type as AttachmentType] || att.type} :{" "}
                {att.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────── */

type MedicalEntityEmailWizardProps = {
  sourceOfferId?: string;
  initialWizardData?: Partial<WizardData>;
};

export default function MedicalEntityEmailWizard({
  sourceOfferId,
  initialWizardData,
}: MedicalEntityEmailWizardProps) {
  const { setOfferTitle, setCurrentOfferId } = useOfferStore();
  const userSignature = useAuthStore((s) => s.user?.signature);

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    ...initialData,
    ...initialWizardData,
    medicalEntity: {
      ...initialData.medicalEntity,
      ...initialWizardData?.medicalEntity,
    },
    recipients: initialWizardData?.recipients ?? [],
    attachments: initialWizardData?.attachments ?? [],
    emailSubject: initialWizardData?.emailSubject || initialData.emailSubject,
    emailBody: initialWizardData?.emailBody || initialData.emailBody,
    emailSignature:
      initialWizardData?.emailSignature ||
      userSignature ||
      initialData.emailSignature,
    lotNumber: initialWizardData?.lotNumber ?? "",
    lotObject: initialWizardData?.lotObject ?? "",
    lots: initialWizardData?.lots?.length
      ? initialWizardData.lots
      : initialWizardData?.lotNumber || initialWizardData?.lotObject
        ? [
            {
              number: initialWizardData.lotNumber ?? "",
              object: initialWizardData.lotObject ?? "",
            },
          ]
        : [],

    // ── AJOUTÉ : merge des nouveaux champs depuis initialWizardData ──
    commercialName:
      initialWizardData?.commercialName ?? initialData.commercialName,
    consultationNumber:
      initialWizardData?.consultationNumber ?? initialData.consultationNumber,
    establishment:
      initialWizardData?.establishment ?? initialData.establishment,
    wilaya: initialWizardData?.wilaya ?? initialData.wilaya,
    depositLocation:
      initialWizardData?.depositLocation ?? initialData.depositLocation,
    procedureType:
      initialWizardData?.procedureType ?? initialData.procedureType,
    hospitalDepositDate:
      initialWizardData?.hospitalDepositDate ?? initialData.hospitalDepositDate,
    technicalDepartmentDepositDate:
      initialWizardData?.technicalDepartmentDepositDate ??
      initialData.technicalDepartmentDepositDate,
    supplierCommercialAudit:
      initialWizardData?.supplierCommercialAudit ??
      initialData.supplierCommercialAudit,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [recipientSearch, setRecipientSearch] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedDocument | null>(
    null,
  );
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [apiState, setApiState] = useState<ApiState>({ status: "idle" });
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err" | "info" | "warn";
  } | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [emailResults, setEmailResults] = useState<any[]>([]);
  const [showEmailPicker, setShowEmailPicker] = useState(false);

  const showToast = useCallback(
    (msg: string, type: "ok" | "err" | "info" | "warn" = "info", ms = 5000) => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), ms);
    },
    [],
  );

  const { data: availableRecipients = [], isError, refetch } = useAccountants();

  /* ── Extraction depuis les emails ── */
  const getDataFromEmail = async () => {
    setIsScanning(true);
    try {
      const response = await axios.post(
        `${API_BASE}/email-extractor/scan`,
        {},
        { headers: getAuthHeaders() },
      );
      if (!response?.data?.results?.length) {
        showToast("Aucun email avec PDF trouvé.", "warn");
        return;
      }
      const usable = response.data.results.filter((r: any) => {
        const d = r?.attachments?.[0]?.data ?? r?.attachments?.[0]?.invoice;
        return d && d.documentType !== "UNKNOWN";
      });
      if (usable.length === 0) {
        showToast("Aucun document reconnu.", "warn");
        return;
      }
      if (usable.length === 1) {
        setExtractedData(
          usable[0]?.attachments?.[0]?.data ??
            usable[0]?.attachments?.[0]?.invoice,
        );
        showToast("Données extraites avec succès !", "ok");
      } else {
        setEmailResults(usable);
        setShowEmailPicker(true);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showToast(
          `Erreur scan : ${error.response?.data?.error ?? error.message}`,
          "err",
        );
      }
    } finally {
      setIsScanning(false);
    }
  };

  /* ── Extraction PDF ── */
  async function extractDataFromPdf(file: File) {
    if (file.type !== "application/pdf") {
      showToast("Veuillez importer un fichier PDF.", "err");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      showToast("PDF trop volumineux. Taille maximale : 100 MB.", "err");
      return;
    }

    setIsExtractingPdf(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const res = await fetch(`${API_BASE}/ai/extract-tender`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const json = await res.json();
      if (!res.ok)
        throw new Error(json.message ?? "Erreur pendant l'extraction.");

      const extracted: ExtractedDocument = json.data;

      if (
        extracted.documentType !== "TENDER" &&
        extracted.documentType !== "CONSULTATION"
      ) {
        showToast("Le PDF ne semble pas être un cahier des charges.", "warn");
        return;
      }

      setExtractedData(extracted);
      showToast("PDF analysé avec succès. Formulaire rempli.", "ok");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue.";
      showToast(`Erreur extraction PDF : ${message}`, "err");
    } finally {
      setIsExtractingPdf(false);
    }
  }

  /* ── Application des données extraites au formulaire ── */
  useEffect(() => {
    if (!extractedData) return;
    console.log("Extracted documentType:", extractedData.documentType);
    console.log("Extracted tender:", extractedData.tender);

    if (
      extractedData.documentType === "TENDER" ||
      extractedData.documentType === "CONSULTATION"
    ) {
      const tender = extractedData.tender;
      const lots = tender?.lots ?? [];

      setData((prev) => ({
        ...prev,
        offerTitle: tender?.title || prev.offerTitle,
        consultationNumber: tender?.tenderNumber || prev.consultationNumber, // ← AJOUTÉ
        procedureType: tender?.procedureType || prev.procedureType, // ← AJOUTÉ
        ...(lots.length > 0
          ? syncPrimaryLot(
              lots.map((l) => ({
                number: l.number,
                object: l.object,
              })),
            )
          : {}),
        lots:
          lots.length > 0
            ? lots.map((l) => ({ number: l.number, object: l.object }))
            : prev.lots,
        medicalEntity: {
          ...prev.medicalEntity,
          name: tender?.name_organization || prev.medicalEntity.name,
          type:
            tender?.type_organization ||
            detectEntityType(tender?.name_organization) ||
            prev.medicalEntity.type,
          city: tender?.wilaya || prev.medicalEntity.city,
          address: tender?.address || prev.medicalEntity.address,
          phone: tender?.phone || prev.medicalEntity.phone,
          email: tender?.email || prev.medicalEntity.email,
          contactPerson:
            extractContactPerson(tender?.name_organization) ||
            prev.medicalEntity.contactPerson,
        },
        // ── AJOUTÉ ──
        wilaya: tender?.wilaya || prev.wilaya,
        establishment: tender?.name_organization || prev.establishment,
      }));
    }

    if (extractedData.documentType === "INVOICE") {
      const invoice = extractedData.invoice || extractedData;
      setData((prev) => ({
        ...prev,
        offerTitle: invoice?.offerTitle || prev.offerTitle,
        medicalEntity: {
          ...prev.medicalEntity,
          name: invoice?.clientName || prev.medicalEntity.name,
          address: invoice?.clientAddress || prev.medicalEntity.address,
          phone: invoice?.vendorPhone || prev.medicalEntity.phone,
          email: invoice?.vendorEmail || prev.medicalEntity.email,
          contactPerson:
            invoice?.clientName || prev.medicalEntity.contactPerson,
          city: extractCity(invoice?.clientAddress) || prev.medicalEntity.city,
          type:
            detectEntityType(invoice?.clientName) || prev.medicalEntity.type,
        },
      }));
    }
  }, [extractedData]);

  /* ── Helpers détection ── */
  function detectEntityType(text?: string | null): string {
    if (!text) return "";
    const value = text.toLowerCase();
    if (value.includes("clinique")) return "Clinique";
    if (value.includes("hopital") || value.includes("hôpital"))
      return "Hôpital";
    if (value.includes("epsp")) return "EPSP";
    if (value.includes("universite") || value.includes("université"))
      return "Université";
    if (value.includes("laboratoire")) return "Laboratoire";
    return "";
  }

  function extractCity(address?: string | null): string {
    if (!address) return "";
    const cities = [
      "Alger",
      "Oran",
      "Blida",
      "Constantine",
      "Annaba",
      "Batna",
      "Sétif",
      "Tlemcen",
      "Tizi Ouzou",
      "Béchar",
      "Ghardaïa",
      "Ouargla",
    ];
    const normalized = address.toLowerCase();
    for (const city of cities) {
      if (normalized.includes(city.toLowerCase())) return city;
    }
    return "";
  }

  function extractContactPerson(text?: string | null): string {
    if (!text) return "";
    const match = text.match(/(Dr\.?\s+[A-ZÀ-ÿa-z\s]+)/i);
    return match?.[1]?.trim() || "";
  }

  /* ── Filtre destinataires ── */
  const filteredRecipients = useMemo(() => {
    const q = recipientSearch.toLowerCase();
    return availableRecipients.filter(
      (r: any) =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        (r.role ?? "").toLowerCase().includes(q),
    );
  }, [recipientSearch, availableRecipients]);

  /* ── Validation ──────────────────────────────────────────────────────── */
  function validateStep(step: number): boolean {
    const errs: ValidationErrors = {};

    if (step === 0) {
      if (!data.medicalEntity.name.trim())
        errs.name = "Le nom de l'entité est obligatoire.";
      if (!data.medicalEntity.type.trim())
        errs.type = "Le type d'entité est obligatoire.";

      if (!data.medicalEntity.city.trim())
        errs.city = "La ville est obligatoire.";
      if (!data.medicalEntity.email.trim())
        errs.email = "L'email de l'entité est obligatoire.";
      else if (!isValidEmail(data.medicalEntity.email))
        errs.email = "Veuillez saisir un email valide.";
      if (!data.medicalEntity.contactPerson.trim())
        errs.contactPerson = "Le contact principal est obligatoire.";
    }

    if (step === 1) {
      if (data.lots.length === 0) {
        errs.lots = "Ajoutez au moins un lot.";
      } else {
        data.lots.forEach((lot, idx) => {
          if (!lot.number.trim()) {
            errs[`lot_number_${idx}`] = "Le n° de lot est obligatoire.";
          }
          if (!lot.object.trim()) {
            errs[`lot_object_${idx}`] = "L'objet du lot est obligatoire.";
          }
        });
      }
    }

    if (step === 2) {
      if (!data.emailSubject.trim())
        errs.emailSubject = "L'objet de l'email est obligatoire.";
      if (!data.emailBody.trim())
        errs.emailBody = "Le message est obligatoire.";
      if (!data.emailSignature.trim())
        errs.emailSignature = "La signature est obligatoire.";
    }

    if (step === 3) {
      data.attachments.forEach((att, idx) => {
        const err = isValidFile(att.file);
        if (err) errs[`attachment_${idx}`] = err;
      });
    }

    if (step === 4 && data.recipients.length === 0)
      errs.recipients = "Veuillez sélectionner au moins un destinataire.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ── Navigation ────────────────────────────────────────────────────── */
  function handleNext() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((p) => Math.min(p + 1, STEPS.length - 1));
  }

  function handlePrevious() {
    setErrors({});
    setCurrentStep((p) => Math.max(p - 1, 0));
  }

  function handleJump(i: number) {
    if (i < currentStep) {
      setErrors({});
      setCurrentStep(i);
    }
  }

  function updateMedicalEntity<K extends keyof MedicalEntity>(
    key: K,
    value: MedicalEntity[K],
  ) {
    setData((prev) => ({
      ...prev,
      medicalEntity: { ...prev.medicalEntity, [key]: value },
    }));
  }

  function updatePlanDeCharge<K extends keyof WizardData>(
    key: K,
    value: WizardData[K],
  ) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  /* ── Lots management ──────────────────────────────────────────────────── */
  function syncPrimaryLot(lots: ExtractedTenderLot[]) {
    return {
      lotNumber: lots[0]?.number ?? "",
      lotObject: lots[0]?.object ?? "",
    };
  }

  function addLot() {
    setData((prev) => {
      const lots = [...prev.lots, { number: "", object: "" }];
      return { ...prev, lots, ...syncPrimaryLot(lots) };
    });
  }

  function removeLot(index: number) {
    setData((prev) => {
      const lots = prev.lots.filter((_, i) => i !== index);
      return { ...prev, lots, ...syncPrimaryLot(lots) };
    });
  }

  function updateLot(index: number, key: "number" | "object", value: string) {
    setData((prev) => {
      const lots = prev.lots.map((lot, i) =>
        i === index ? { ...lot, [key]: value } : lot,
      );
      return {
        ...prev,
        lots,
        ...syncPrimaryLot(lots),
      };
    });
  }

  /* ── Recipients ────────────────────────────────────────────────────── */
  function toggleRecipient(recipient: Recipient) {
    setData((prev) => {
      const exists = prev.recipients.some((r) => r.id === recipient.id);
      return {
        ...prev,
        recipients: exists
          ? prev.recipients.filter((r) => r.id !== recipient.id)
          : [...prev.recipients, recipient],
      };
    });
  }

  /* ── Attachments ─────────────────────────────────────────────────────── */
  function addAttachment(file: File) {
    const err = isValidFile(file);
    if (err) {
      showToast(err, "err");
      return;
    }
    setData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, { file, type: "other" }],
    }));
  }

  function removeAttachment(index: number) {
    setData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  }

  /* ── API: Send ───────────────────────────────────────────────────────── */
  async function handleSend() {
    const allValid = [0, 1, 2, 3, 4].every((s) => validateStep(s));
    if (!allValid) {
      showToast("Veuillez corriger les erreurs avant d'envoyer.", "err");
      return;
    }

    setApiState({ status: "loading", action: "send" });

    try {
      const res = await fetch(`${API_BASE}/offers/send`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: buildFormData(data, sourceOfferId),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Erreur serveur");

      const result: SendResult = json.data;
      setApiState({ status: "success", result });
      setCurrentOfferId(result.offerId);
      setOfferTitle(data.offerTitle);

      showToast(
        // `${result.sent}/${result.total} email(s) envoyé(s)`,
        result.failed === 0 ? "ok" : "warn",
        // 6000,
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erreur inconnue";
      setApiState({ status: "error", message: errMsg });
      showToast(`Erreur : ${errMsg}`, "err", 7000);
    }
  }

  /* ── API: Draft ────────────────────────────────────────────────────── */
  async function handleSaveDraft() {
    setApiState({ status: "loading", action: "draft" });

    try {
      const res = await fetch(`${API_BASE}/offers/draft`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: buildFormData(data, sourceOfferId),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Erreur serveur");

      showToast(
        `Brouillon sauvegardé (ID: ${(json.data.offerId as string).slice(0, 8)}…)`,
        "ok",
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erreur inconnue";
      showToast(`Impossible de sauvegarder : ${errMsg}`, "err");
    } finally {
      setApiState({ status: "idle" });
    }
  }

  /* ── Derived flags ───────────────────────────────────────────────────── */
  const isSending = apiState.status === "loading" && apiState.action === "send";
  const isSavingDraft =
    apiState.status === "loading" && apiState.action === "draft";
  const isLoading = apiState.status === "loading";

  /* ═══════════════════════════════════════════════════════════════════════
     RENDERERS PAR ÉTAPE
     ═══════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    setData((prev) => {
      if (prev.lots.length > 0) return prev;

      const seeded =
        prev.lotNumber || prev.lotObject
          ? [
              {
                number: prev.lotNumber,
                object: prev.lotObject,
              },
            ]
          : [{ number: "", object: "" }];

      return {
        ...prev,
        lots: seeded,
        ...syncPrimaryLot(seeded),
      };
    });
  }, []);

  function renderStep0() {
    return (
      <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={getDataFromEmail}
              disabled={isScanning}
              className="flex items-center gap-2 rounded-lg border border-teal-500 px-4 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  Scan en cours…
                </>
              ) : (
                <>📧 Scanner les emails</>
              )}
            </button>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-blue-500 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50">
              {isExtractingPdf ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  Analyse du PDF…
                </>
              ) : (
                <>📄 Importer PDF</>
              )}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                disabled={isExtractingPdf}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) extractDataFromPdf(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Titre de l&apos;offre
            </label>
            <input
              type="text"
              value={data.offerTitle}
              onChange={(e) =>
                setData((prev) => ({ ...prev, offerTitle: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Ex : Acquisition équipements médicaux"
            />
          </div>

          {data.lots.length > 0 && (
            <div className="md:col-span-2 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="mb-3 text-sm font-semibold text-blue-800">
                Lots détectés ({data.lots.length})
              </p>
              <div className="space-y-2">
                {data.lots.map((lot, idx) => (
                  <div
                    key={`${lot.number}-${idx}`}
                    className="rounded-lg border border-blue-100 bg-white p-3"
                  >
                    <div className="font-medium text-blue-800">
                      Lot {lot.number}
                    </div>
                    <div className="text-sm text-gray-700">{lot.object}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {extractedData?.documentType && (
            <div className="md:col-span-2 flex items-center gap-2">
              <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-medium text-teal-700">
                Détecté : {extractedData.documentType}
              </span>
              {extractedData?.tender?.tenderNumber && (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                  N° {extractedData.tender.tenderNumber}
                </span>
              )}
            </div>
          )}

          {/* ── ENTITÉ MÉDICALE ── */}
          <div className="md:col-span-2">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">
              Entité médicale
            </h3>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nom de l&apos;entité *
            </label>
            <input
              type="text"
              value={data.medicalEntity.name}
              onChange={(e) => updateMedicalEntity("name", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.name
                  ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                  : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              }`}
              placeholder="Ex : CHU Mustapha"
            />
            <FieldError message={errors.name} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Type d&apos;entité *
            </label>
            <input
              type="text"
              value={data.medicalEntity.type}
              onChange={(e) => updateMedicalEntity("type", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.type
                  ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                  : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              }`}
              placeholder="Ex : Hôpital, Clinique, Université"
            />
            <FieldError message={errors.type} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ville *
            </label>
            <input
              type="text"
              value={data.medicalEntity.city}
              onChange={(e) => updateMedicalEntity("city", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.city
                  ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                  : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              }`}
              placeholder="Ex : Alger"
            />
            <FieldError message={errors.city} />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Adresse
            </label>
            <input
              type="text"
              value={data.medicalEntity.address}
              onChange={(e) => updateMedicalEntity("address", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Ex : Rue Didouche Mourad"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Téléphone
            </label>
            <input
              type="text"
              value={data.medicalEntity.phone}
              onChange={(e) => updateMedicalEntity("phone", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Ex : 0550 00 00 00"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email de l&apos;entité *
            </label>
            <input
              type="email"
              value={data.medicalEntity.email}
              onChange={(e) => updateMedicalEntity("email", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.email
                  ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                  : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              }`}
              placeholder="Ex : contact@hopital.dz"
            />
            <FieldError message={errors.email} />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contact principal *
            </label>
            <input
              type="text"
              value={data.medicalEntity.contactPerson}
              onChange={(e) =>
                updateMedicalEntity("contactPerson", e.target.value)
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.contactPerson
                  ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                  : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              }`}
              placeholder="Ex : Dr. Ahmed Benali"
            />
            <FieldError message={errors.contactPerson} />
          </div>

          {/* ── EN-TÊTE PLAN DE CHARGE / OFFRE ── */}
          <div className="md:col-span-2 mt-2">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">
              En-tête de l&apos;offre
            </h3>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nom commercial / Raison sociale
            </label>
            <input
              type="text"
              value={data.commercialName}
              onChange={(e) =>
                updatePlanDeCharge("commercialName", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Ex : Digital Services"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              N° consultation / Appel d&apos;offres
            </label>
            <input
              type="text"
              value={data.consultationNumber}
              onChange={(e) =>
                updatePlanDeCharge("consultationNumber", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Ex : 2024-045-AO"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Établissement
            </label>
            <input
              type="text"
              value={data.establishment}
              onChange={(e) =>
                updatePlanDeCharge("establishment", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Ex : CHU Mustapha Pacha"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Wilaya
            </label>
            <input
              type="text"
              value={data.wilaya}
              onChange={(e) => updatePlanDeCharge("wilaya", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Ex : Alger"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Lieu de dépôt
            </label>
            <input
              type="text"
              value={data.depositLocation}
              onChange={(e) =>
                updatePlanDeCharge("depositLocation", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Ex : Bureau des marchés, 1er étage"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Type de procédure
            </label>
            <select
              value={data.procedureType ?? ""}
              onChange={(e) =>
                updatePlanDeCharge(
                  "procedureType",
                  e.target.value === ""
                    ? null
                    : (e.target.value as "appel_offre" | "consultation"),
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">— Sélectionner —</option>
              <option value="appel_offre">Appel d&apos;offres</option>
              <option value="consultation">Consultation</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date dépôt à l&apos;hôpital
            </label>
            <input
              type="date"
              value={data.hospitalDepositDate}
              onChange={(e) =>
                updatePlanDeCharge("hospitalDepositDate", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date dépôt au service technique
            </label>
            <input
              type="date"
              value={data.technicalDepartmentDepositDate}
              onChange={(e) =>
                updatePlanDeCharge(
                  "technicalDepartmentDepositDate",
                  e.target.value,
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {showEmailPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">
                    {emailResults.length} emails détectés — lequel utiliser ?
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowEmailPicker(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {emailResults.map((result, index) => {
                    const attachment = result?.attachments?.[0];
                    const d = attachment?.data ?? attachment?.invoice;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setExtractedData(d);
                          setShowEmailPicker(false);
                          showToast("Données extraites avec succès !", "ok");
                        }}
                        className="w-full rounded-xl border border-gray-200 p-4 text-left transition hover:border-teal-400 hover:bg-teal-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {result.subject || "Sans objet"}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {result.from}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              📎 {attachment?.filename}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                d?.documentType === "TENDER"
                                  ? "bg-blue-100 text-blue-700"
                                  : d?.documentType === "INVOICE"
                                    ? "bg-green-100 text-green-700"
                                    : d?.documentType === "CONSULTATION"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {d?.documentType ?? "UNKNOWN"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailPicker(false)}
                  className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  function renderStep1() {
    const docFields: {
      key: keyof WizardData;
      label: string;
      type: AttachmentType;
    }[] = [
      {
        key: "hasTechnicalSheet",
        label: "Fiches techniques",
        type: "technical_sheet",
      },
      {
        key: "hasConformityCertificate",
        label: "Certificats conformité",
        type: "conformity_certificate",
      },
      {
        key: "hasOriginCertificate",
        label: "Certificat d'origine",
        type: "origin_certificate",
      },
      {
        key: "hasManufacturingCertificate",
        label: "Certificat de fabrication Algérienne",
        type: "manufacturing_certificate",
      },
      {
        key: "hasUserManual",
        label: "Manuel d'utilisateur",
        type: "user_manual",
      },
      { key: "hasCatalog", label: "Catalogues", type: "catalog" },
      { key: "hasSample", label: "Échantillons", type: "sample" },
    ];

    return (
      <div className="space-y-5">
        <p className="text-sm text-gray-500">
          Renseignez les informations du Plan de charge individuel.
        </p>

        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Lots ({data.lots.length})
            </h3>

            <button
              type="button"
              onClick={addLot}
              className="rounded-lg border border-teal-500 px-3 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-50"
            >
              + Ajouter un lot
            </button>
          </div>

          {data.lots.length === 0 && (
            <p className="text-xs text-gray-500">
              Aucun lot. Cliquez sur « Ajouter un lot ».
            </p>
          )}

          <div className="space-y-3">
            {data.lots.map((lot, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">
                    Lot {idx + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeLot(idx)}
                    className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      N° lot *
                    </label>

                    <input
                      type="text"
                      value={lot.number}
                      onChange={(e) => updateLot(idx, "number", e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                        errors[`lot_number_${idx}`]
                          ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                          : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                      }`}
                      placeholder="Ex : 04, 5"
                    />

                    <FieldError message={errors[`lot_number_${idx}`]} />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Objet du lot *
                    </label>

                    <input
                      type="text"
                      value={lot.object}
                      onChange={(e) => updateLot(idx, "object", e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                        errors[`lot_object_${idx}`]
                          ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                          : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                      }`}
                      placeholder="Ex : Équipements de laboratoire"
                    />

                    <FieldError message={errors[`lot_object_${idx}`]} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <FieldError message={errors.lots} />
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">
            Documents requis (cases du plan de charge)
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {docFields.map(({ key, label }) => (
              <label
                key={key as string}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition hover:border-teal-300"
              >
                <input
                  type="checkbox"
                  checked={!!data[key]}
                  onChange={(e) =>
                    updatePlanDeCharge(key, e.target.checked as any)
                  }
                  className="h-4 w-4 accent-teal-600"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">
            Prescriptions (Durées & délais)
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { key: "warrantyDuration", label: "Durée de garantie" },
              {
                key: "deliveryDelay",
                label: "Délai de livraison / installation",
              },
              { key: "savDuration", label: "Durée de S.A.V" },
              { key: "interventionDelay", label: "Délai d'intervention" },
              { key: "trainingDuration", label: "Durée de formation" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {label}
                </label>
                <input
                  type="text"
                  value={data[key as keyof WizardData] as string}
                  onChange={(e) =>
                    updatePlanDeCharge(
                      key as keyof WizardData,
                      e.target.value as any,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Ex : 12 mois"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Localités S.A.V
              </label>
              <input
                type="text"
                value={data.savLocations}
                onChange={(e) =>
                  updatePlanDeCharge("savLocations", e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Ex : Alger, Oran, Constantine"
              />
            </div>
          </div>
        </div>

        {/* ── AJOUTÉ : Audit commercial ── */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">
            Audit commercial
          </h3>
          <textarea
            value={data.supplierCommercialAudit}
            onChange={(e) =>
              updatePlanDeCharge("supplierCommercialAudit", e.target.value)
            }
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="Ex : Offre conforme aux exigences du cahier des charges. Prix compétitifs."
          />
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Objet de l&apos;email *
          </label>
          <input
            type="text"
            value={data.emailSubject}
            onChange={(e) =>
              setData((prev) => ({ ...prev, emailSubject: e.target.value }))
            }
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
              errors.emailSubject
                ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
            }`}
            placeholder="Saisir l'objet de l'email"
          />
          <FieldError message={errors.emailSubject} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Message *
          </label>
          <textarea
            value={data.emailBody}
            onChange={(e) =>
              setData((prev) => ({ ...prev, emailBody: e.target.value }))
            }
            rows={8}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
              errors.emailBody
                ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
            }`}
            placeholder="Saisir le message"
          />
          <FieldError message={errors.emailBody} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Signature *
          </label>
          <textarea
            value={data.emailSignature}
            onChange={(e) =>
              setData((prev) => ({ ...prev, emailSignature: e.target.value }))
            }
            rows={4}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
              errors.emailSignature
                ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
            }`}
            placeholder={
              "Ex :\nMohamed Yacine\nAgent commercial\nMon Entreprise"
            }
          />
          <FieldError message={errors.emailSignature} />
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-4">
        <label className="block cursor-pointer">
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition hover:border-teal-400 hover:bg-teal-50/30">
            <div className="mb-2 text-3xl">📎</div>
            <p className="text-sm font-medium text-gray-700">
              Glissez-déposez vos fichiers ici
            </p>
            <p className="mt-1 text-xs text-gray-500">
              ou cliquez pour parcourir
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">
              PDF, Word, Excel, PNG, JPG, WEBP — max 20 MB
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  Array.from(e.target.files).forEach(addAttachment);
                }
                e.target.value = "";
              }}
            />
          </div>
        </label>

        {data.attachments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">
                {data.attachments.length} fichier(s) ajouté(s)
              </p>
              <button
                type="button"
                onClick={() =>
                  setData((prev) => ({ ...prev, attachments: [] }))
                }
                className="text-xs text-red-500 hover:underline"
              >
                Tout supprimer
              </button>
            </div>

            {data.attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {att.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(att.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Rechercher un destinataire
          </label>
          <input
            type="text"
            value={recipientSearch}
            onChange={(e) => setRecipientSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="Nom, email ou rôle…"
            disabled={isLoading}
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Chargement…
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Impossible de charger les utilisateurs.
            <button
              onClick={() => refetch()}
              className="ml-3 underline hover:text-red-800"
            >
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !isError && filteredRecipients.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">
            Aucun destinataire trouvé.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="space-y-2">
            {filteredRecipients.map((recipient: any) => {
              const isSelected = data.recipients.some(
                (r) => r.id === recipient.id,
              );
              return (
                <label
                  key={recipient.id}
                  className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${
                    isSelected
                      ? "border-teal-400 bg-teal-50"
                      : "border-gray-200 bg-white hover:border-teal-200 hover:bg-teal-50/30"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      isSelected
                        ? "bg-teal-200 text-teal-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {recipient.name
                      ?.split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {recipient.name}
                    </p>
                    <p className="text-xs text-gray-500">{recipient.email}</p>
                    {recipient.role && (
                      <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {recipient.role}
                      </span>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRecipient(recipient)}
                    className="h-4 w-4 accent-teal-600"
                  />
                </label>
              );
            })}
          </div>
        )}

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-sm font-medium text-gray-700">
            {data.recipients.length} destinataire(s) sélectionné(s)
          </p>
          {data.recipients.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {data.recipients.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs text-teal-800"
                >
                  {r.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <FieldError message={errors.recipients} />
      </div>
    );
  }

  function renderStep5() {
    const resolvedSubject = applyTemplateVariables(
      data.emailSubject,
      data.medicalEntity,
    );
    const resolvedBody = applyTemplateVariables(
      data.emailBody,
      data.medicalEntity,
    );

    return (
      <div className="space-y-4">
        <section className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              1. Entité médicale &amp; en-tête
            </h3>
            <button
              type="button"
              onClick={() => handleJump(0)}
              className="text-xs text-teal-600 hover:underline"
            >
              Modifier
            </button>
          </div>
          {data.offerTitle && (
            <p className="mb-2 text-xs text-gray-500">
              <span className="font-medium">Titre :</span> {data.offerTitle}
            </p>
          )}
          <div className="grid grid-cols-1 gap-1.5 text-xs md:grid-cols-2">
            {[
              ["Nom", data.medicalEntity.name],
              ["Type", data.medicalEntity.type],
              ["Ville", data.medicalEntity.city],
              ["Adresse", data.medicalEntity.address || "—"],
              ["Téléphone", data.medicalEntity.phone || "—"],
              ["Email", data.medicalEntity.email],
              ["Contact", data.medicalEntity.contactPerson],
              ["Nom commercial", data.commercialName || "—"],
              ["N° consultation", data.consultationNumber || "—"],
              ["Établissement", data.establishment || "—"],
              ["Wilaya", data.wilaya || "—"],
              ["Lieu de dépôt", data.depositLocation || "—"],
              ["Type procédure", data.procedureType || "—"],
              ["Date dépôt hôpital", data.hospitalDepositDate || "—"],
              [
                "Date dépôt service technique",
                data.technicalDepartmentDepositDate || "—",
              ],
            ].map(([label, val]) => (
              <p key={label as string} className="text-gray-600">
                <span className="font-medium text-gray-800">{label} :</span>{" "}
                {val}
              </p>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              2. Plan de charge individuel
            </h3>
            <button
              type="button"
              onClick={() => handleJump(1)}
              className="text-xs text-teal-600 hover:underline"
            >
              Modifier
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-xs md:grid-cols-2">
            <div className="mb-3 space-y-1.5">
              {data.lots.map((lot, idx) => (
                <p key={idx} className="text-xs text-gray-600">
                  <span className="font-medium text-gray-800">
                    Lot {lot.number} :
                  </span>{" "}
                  {lot.object}
                </p>
              ))}
            </div>
            {[
              ["Garantie", data.warrantyDuration || "—"],
              ["Livraison", data.deliveryDelay || "—"],
              ["S.A.V", data.savDuration || "—"],
              ["Intervention", data.interventionDelay || "—"],
              ["Formation", data.trainingDuration || "—"],
              ["Localités S.A.V", data.savLocations || "—"],
              ["Audit commercial", data.supplierCommercialAudit || "—"],
            ].map(([label, val]) => (
              <p key={label as string} className="text-gray-600">
                <span className="font-medium text-gray-800">{label} :</span>{" "}
                {val}
              </p>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.hasTechnicalSheet && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                Fiches techniques
              </span>
            )}
            {data.hasConformityCertificate && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                Conformité
              </span>
            )}
            {data.hasOriginCertificate && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                Origine
              </span>
            )}
            {data.hasManufacturingCertificate && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                Fabrication DZ
              </span>
            )}
            {data.hasUserManual && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                Manuel
              </span>
            )}
            {data.hasCatalog && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                Catalogues
              </span>
            )}
            {data.hasSample && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                Échantillons
              </span>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              3. Contenu email
            </h3>
            <button
              type="button"
              onClick={() => handleJump(2)}
              className="text-xs text-teal-600 hover:underline"
            >
              Modifier
            </button>
          </div>
          <p className="mb-2 text-xs text-gray-600">
            <span className="font-medium text-gray-800">Objet :</span>{" "}
            {resolvedSubject}
          </p>
          <div className="rounded-lg bg-gray-50 p-3 text-xs whitespace-pre-wrap text-gray-700">
            {resolvedBody}
          </div>
          <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs whitespace-pre-wrap text-gray-500">
            {data.emailSignature}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              4. Pièces jointes ({data.attachments.length})
            </h3>
            <button
              type="button"
              onClick={() => handleJump(3)}
              className="text-xs text-teal-600 hover:underline"
            >
              Modifier
            </button>
          </div>
          {data.attachments.length === 0 ? (
            <p className="text-xs text-gray-500">Aucune pièce jointe</p>
          ) : (
            <ul className="space-y-1.5 text-xs text-gray-600">
              {data.attachments.map((att, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                  {att.file.name} ({(att.file.size / 1024 / 1024).toFixed(2)}{" "}
                  MB)
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              5. Destinataires ({data.recipients.length})
            </h3>
            <button
              type="button"
              onClick={() => handleJump(4)}
              className="text-xs text-teal-600 hover:underline"
            >
              Modifier
            </button>
          </div>
          <ul className="space-y-1 text-xs text-gray-600">
            {data.recipients.map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                {r.name} — {r.email}
              </li>
            ))}
          </ul>
        </section>

        {apiState.status !== "success" && (
          <div className="rounded-lg bg-teal-50 p-4 text-sm text-teal-800 ring-1 ring-teal-200">
            Tout est prêt. Cliquez sur{" "}
            <span className="font-semibold">Envoyer les emails</span> pour
            expédier à {data.recipients.length} destinataire(s) avec{" "}
            {data.attachments.length} pièce(s) jointe(s).
          </div>
        )}

        {apiState.status === "error" && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            <span className="font-semibold">Erreur :</span> {apiState.message}
          </div>
        )}

        {apiState.status === "success" && (
          <SendResultPanel result={apiState.result} />
        )}
      </div>
    );
  }

  function renderStepContent() {
    switch (currentStep) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  }

  const isLastStep = currentStep === STEPS.length - 1;

  const toastStyles: Record<string, string> = {
    ok: "bg-teal-50 text-teal-800 ring-1 ring-teal-300",
    err: "bg-red-50 text-red-700 ring-1 ring-red-300",
    info: "bg-blue-50 text-blue-800 ring-1 ring-blue-300",
    warn: "bg-amber-50 text-amber-800 ring-1 ring-amber-300",
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${toastStyles[toast.type]}`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Créer une offre</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configurez et envoyez votre offre avec le Plan de charge individuel
          </p>
        </div>

        <StepIndicator
          steps={STEPS}
          current={currentStep}
          onJump={handleJump}
        />

        <div className="min-h-[320px] rounded-2xl border border-gray-200 p-5">
          {renderStepContent()}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Précédent
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isLoading}
              className="rounded-lg border border-amber-400 px-4 py-2 text-sm text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSavingDraft ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                  Sauvegarde…
                </span>
              ) : (
                "Enregistrer brouillon"
              )}
            </button>

            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || apiState.status === "success"}
                className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSending ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Envoi en cours…
                  </span>
                ) : apiState.status === "success" ? (
                  "Envoyé ✓"
                ) : (
                  "Envoyer les emails"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
