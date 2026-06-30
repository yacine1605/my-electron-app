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
  phone2: string;
  email: string;
  contactPerson: string;
  serviceToContact: string;
};

type AttachmentType =
  | "technical_sheet"
  | "conformity_certificate"
  | "origin_certificate"
  | "manufacturing_certificate"
  | "catalog"
  | "quantitative_estimate"
  | "user_manual"
  | "sample"
  | "other";

type AttachmentFile = { file: File; type: AttachmentType };

type ExtractedTenderLot = {
  number: string;
  object: string;
  detailQuantitatifPages?: number[] | null;
  excelBase64?: string | null;
  excelFileName?: string | null;
  technicalDocuments?: {
    hasTechnicalSheet?: boolean | null;
    hasConformityCertificate?: boolean | null;
    hasOriginCertificate?: boolean | null;
    hasManufacturingCertificate?: boolean | null;
    hasCatalog?: boolean | null;
    hasUserManual?: boolean | null;
    hasSample?: boolean | null;
  } | null;
  clientRequirements?: {
    particularPrescriptions?: string | null;
    warrantyDuration?: string | null;
    deliveryDelay?: string | null;
    savDuration?: string | null;
    interventionDelay?: string | null;
    savLocations?: string | null;
    trainingDuration?: string | null;
  } | null;
};

type ExtractedTender = {
  title?: string | null;
  tenderNumber?: string | null;
  name_organization?: string | null;
  type_organization?: string | null;
  ministry?: string | null;
  direction?: string | null;
  email?: string | null;
  wilaya?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  phone2?: string | null;
  contactPerson?: string | null;
  serviceToContact?: string | null;
  year?: string | null;
  procedureType?: "appel_offre" | "consultation" | null;
  depositLocation?: string | null;
  hospitalDepositDate?: string | null;
  technicalDepartmentDepositDate?: string | null;
  maintenanceWorkshop?: string | null;
  availableTechnicalMeans?: string | null;
  offerExpirationDate?: string | null;
  ddpConditions?: string | null;
  siteVisitPV?: boolean | null;
  pliOpeningPV?: boolean | null;
  provisionalAttributionPV?: boolean | null;
  definitiveAttributionPV?: boolean | null;
  justiceFolder?: boolean | null;
  submissionBond?: boolean | null;
  goodExecutionBond?: boolean | null;
  supplierCommercialAudit?: string | null;
  lots?: ExtractedTenderLot[];
};

type ExtractedDocument = {
  documentType: "TENDER" | "CONSULTATION" | "INVOICE" | "UNKNOWN";
  tender?: ExtractedTender | null;
  invoice?: any;
};

type Recipient = { id?: string; name: string; email: string; role?: string };

type TechnicalDocument = {
  hasTechnicalSheet: boolean;
  hasConformityCertificate: boolean;
  hasOriginCertificate: boolean;
  hasManufacturingCertificate: boolean;
  hasCatalog: boolean;
  hasUserManual: boolean;
  hasSample: boolean;
};

type ClientRequirement = {
  particularPrescriptions: string;
  warrantyDuration: string;
  deliveryDelay: string;
  savDuration: string;
  interventionDelay: string;
  savLocations: string;
  trainingDuration: string;
};

type LotWithDetails = {
  number: string;
  object: string;
  technicalDocuments: TechnicalDocument;
  clientRequirements: ClientRequirement;
  excelBase64?: string | null;
  excelFileName?: string | null;
};

type WizardData = {
  offerTitle: string;
  medicalEntity: MedicalEntity;
  emailSubject: string;
  emailBody: string;
  emailSignature: string;
  recipients: Recipient[];
  lots: LotWithDetails[];
  lotNumber: string;
  lotObject: string;
  commercialName: string;
  consultationNumber: string;
  establishment: string;
  wilaya: string;
  depositLocation: string;
  procedureType: "appel_offre" | "consultation" | null;
  hospitalDepositDate: string;
  technicalDepartmentDepositDate: string;
  maintenanceWorkshop: string;
  availableTechnicalMeans: string;
  proformaInvoice: string;
  paymentSchedule: string;
  discountObtained: string;
  offerExpirationDate: string;
  ddpConditions: string;
  siteVisitPV: boolean;
  pliOpeningPV: boolean;
  provisionalAttributionPV: boolean;
  definitiveAttributionPV: boolean;
  justiceFolder: boolean;
  submissionBond: boolean;
  goodExecutionBond: boolean;
  supplierCommercialAudit: string;
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
  quantitative_estimate: "Détail quantitatif et estimatif",
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

const defaultTechnicalDocuments: TechnicalDocument = {
  hasTechnicalSheet: false,
  hasConformityCertificate: false,
  hasOriginCertificate: false,
  hasManufacturingCertificate: false,
  hasCatalog: false,
  hasUserManual: false,
  hasSample: false,
};

const defaultClientRequirements: ClientRequirement = {
  particularPrescriptions: "",
  warrantyDuration: "",
  deliveryDelay: "",
  savDuration: "",
  interventionDelay: "",
  savLocations: "",
  trainingDuration: "",
};

const initialData: WizardData = {
  offerTitle: "",
  medicalEntity: {
    name: "",
    type: "",
    address: "",
    city: "",
    phone: "",
    phone2: "",
    email: "",
    contactPerson: "",
    serviceToContact: "",
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
  commercialName: "",
  consultationNumber: "",
  establishment: "",
  wilaya: "",
  depositLocation: "",
  procedureType: null,
  hospitalDepositDate: "",
  technicalDepartmentDepositDate: "",
  maintenanceWorkshop: "",
  availableTechnicalMeans: "",
  proformaInvoice: "",
  paymentSchedule: "",
  discountObtained: "",
  offerExpirationDate: "",
  ddpConditions: "",
  siteVisitPV: false,
  pliOpeningPV: false,
  provisionalAttributionPV: false,
  definitiveAttributionPV: false,
  justiceFolder: false,
  submissionBond: false,
  goodExecutionBond: false,
  supplierCommercialAudit: "",
  attachments: [],
};

/* ─── Utilities ─────────────────────────────────────────────────────────── */
function buildAddress(tender?: ExtractedTender | null): string {
  if (!tender) return "";
  return [tender.address, tender.direction].filter(Boolean).join(" — ");
}
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
    supplierIds: [],
    lots: data.lots.map((lot) => ({
      number: lot.number,
      object: lot.object,
      technicalDocuments: lot.technicalDocuments,
      clientRequirements: lot.clientRequirements,
    })),
    lotNumber: data.lotNumber,
    lotObject: data.lotObject,
    commercialName: data.commercialName,
    consultationNumber: data.consultationNumber,
    establishment: data.establishment,
    wilaya: data.wilaya,
    depositLocation: data.depositLocation,
    procedureType: data.procedureType,
    hospitalDepositDate: data.hospitalDepositDate || null,
    technicalDepartmentDepositDate: data.technicalDepartmentDepositDate || null,
    maintenanceWorkshop: data.maintenanceWorkshop,
    availableTechnicalMeans: data.availableTechnicalMeans,
    proformaInvoice: data.proformaInvoice,
    paymentSchedule: data.paymentSchedule,
    discountObtained: data.discountObtained,
    offerExpirationDate: data.offerExpirationDate,
    ddpConditions: data.ddpConditions,
    siteVisitPV: data.siteVisitPV,
    pliOpeningPV: data.pliOpeningPV,
    provisionalAttributionPV: data.provisionalAttributionPV,
    definitiveAttributionPV: data.definitiveAttributionPV,
    justiceFolder: data.justiceFolder,
    submissionBond: data.submissionBond,
    goodExecutionBond: data.goodExecutionBond,
    supplierCommercialAudit: data.supplierCommercialAudit,
  };

  fd.append("data", JSON.stringify(payload));

  data.attachments.forEach((att) => {
    fd.append("attachments", att.file);
    fd.append("attachmentTypes", att.type);
  });

  return fd;
}

function base64ToFile(
  base64: string,
  filename: string,
  mimeType = "application/pdf",
): File {
  const byteString = atob(base64);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return new File([byteArray], filename, { type: mimeType });
}

function base64ToBlobUrl(base64: string, mimeType = "application/pdf"): string {
  const byteString = atob(base64);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
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

/* ─── Progress Indicator for PDF Analysis ───────────────────────────────── */
function PdfAnalysisProgress({
  progress,
  status,
}: {
  progress: number;
  status: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Analyse du PDF en cours
            </h3>
            <p className="text-xs text-gray-500">
              {status === "pending" && "Mise en file d'attente..."}
              {status === "processing" && `Analyse par chunks... ${progress}%`}
              {status === "completed" && "Analyse terminée !"}
            </p>
          </div>
        </div>

        <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-center text-xs text-gray-400">
          {progress < 100
            ? "Ne fermez pas cette page. L'analyse peut prendre plusieurs minutes pour les gros PDFs."
            : "Traitement final..."}
        </p>
      </div>
    </div>
  );
}

/* ─── Lot Excel Preview / Download ──────────────────────────────────────── */
function LotExcelPreview({
  base64,
  filename,
}: {
  base64: string;
  filename: string;
}) {
  const handleDownload = useCallback(() => {
    const byteString = atob(base64);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([byteArray], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [base64, filename]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <div>
            <h4 className="text-xs font-semibold text-gray-700">
              DQE — Détail Quantitatif et Estimatif
            </h4>
            <p className="text-[10px] text-gray-500">{filename}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 transition flex items-center gap-1"
        >
          <span>⬇</span> Télécharger Excel
        </button>
      </div>
      <div className="p-4 bg-gray-50/50">
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="inline-block h-8 w-8 rounded bg-green-100 text-green-700 items-center justify-center font-bold text-[10px]">
            XLSX
          </span>
          <div>
            <p className="font-medium text-gray-800">{filename}</p>
            <p className="text-gray-500">Fichier Excel généré par l&apos;IA</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Service To Contact Select ─────────────────────────────────────────── */
function ServiceToContactSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const SERVICES = [
    { id: "pharmacie", name: "Service Pharmacie" },
    { id: "marches", name: "Bureau des Marchés" },
    { id: "facturation", name: "Service Facturation" },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
    >
      <option value="">— Sélectionner un service —</option>
      {SERVICES.map((svc) => (
        <option key={svc.id} value={svc.name}>
          {svc.name}
        </option>
      ))}
      {value && !SERVICES.some((s) => s.name === value) && (
        <option value={value}>{value} (non listé)</option>
      )}
    </select>
  );
}

/* ─── File Preview Link (attachments) ───────────────────────────────────── */
function FilePreviewLink({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return null;

  const isPdf = file.type === "application/pdf";
  const isExcel =
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel";

  return (
    <a
      href={url}
      target={isPdf ? "_blank" : undefined}
      rel={isPdf ? "noopener noreferrer" : undefined}
      download={!isPdf ? file.name : undefined}
      className="ml-2 text-xs text-teal-600 hover:underline"
    >
      {isPdf ? "Voir PDF" : isExcel ? "📊 Excel" : "Télécharger"}
    </a>
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
              technicalDocuments: { ...defaultTechnicalDocuments },
              clientRequirements: { ...defaultClientRequirements },
            },
          ]
        : [],
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
    maintenanceWorkshop:
      initialWizardData?.maintenanceWorkshop ?? initialData.maintenanceWorkshop,
    availableTechnicalMeans:
      initialWizardData?.availableTechnicalMeans ??
      initialData.availableTechnicalMeans,
    proformaInvoice:
      initialWizardData?.proformaInvoice ?? initialData.proformaInvoice,
    paymentSchedule:
      initialWizardData?.paymentSchedule ?? initialData.paymentSchedule,
    discountObtained:
      initialWizardData?.discountObtained ?? initialData.discountObtained,
    offerExpirationDate:
      initialWizardData?.offerExpirationDate ?? initialData.offerExpirationDate,
    ddpConditions:
      initialWizardData?.ddpConditions ?? initialData.ddpConditions,
    siteVisitPV: initialWizardData?.siteVisitPV ?? initialData.siteVisitPV,
    pliOpeningPV: initialWizardData?.pliOpeningPV ?? initialData.pliOpeningPV,
    provisionalAttributionPV:
      initialWizardData?.provisionalAttributionPV ??
      initialData.provisionalAttributionPV,
    definitiveAttributionPV:
      initialWizardData?.definitiveAttributionPV ??
      initialData.definitiveAttributionPV,
    justiceFolder:
      initialWizardData?.justiceFolder ?? initialData.justiceFolder,
    submissionBond:
      initialWizardData?.submissionBond ?? initialData.submissionBond,
    goodExecutionBond:
      initialWizardData?.goodExecutionBond ?? initialData.goodExecutionBond,
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
  const [pdfJobProgress, setPdfJobProgress] = useState(0);
  const [pdfJobStatus, setPdfJobStatus] = useState<string>("");
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

  /* ════════════════════════════════════════════════════════════════════════
     EXTRACTION PDF — NOUVEAU SYSTÈME AVEC POLLING (supporte tous les tailles)
     ════════════════════════════════════════════════════════════════════════ */

  async function extractDataFromPdf(file: File) {
    if (file.type !== "application/pdf") {
      showToast("Veuillez importer un fichier PDF.", "err");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      showToast("PDF trop volumineux (>500MB). Impossible de traiter.", "err");
      return;
    }

    setIsExtractingPdf(true);
    setPdfJobProgress(0);
    setPdfJobStatus("pending");

    let pollInterval: NodeJS.Timeout | null = null;

    try {
      const formData = new FormData();
      formData.append("file", file);

      showToast("Upload du PDF en cours...", "info");

      const uploadRes = await fetch(`${API_BASE}/ai/extract-tender`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson.message || "Erreur lors de l'upload.");
      }

      const { jobId } = uploadJson.data;
      console.log(`[PDF] Job created: ${jobId}`);

      const result = await new Promise<any>((resolve, reject) => {
        let attempts = 0;
        const MAX_ATTEMPTS = 300;

        pollInterval = setInterval(async () => {
          attempts++;

          if (attempts > MAX_ATTEMPTS) {
            clearInterval(pollInterval!);
            reject(
              new Error(
                "L'analyse a dépassé le temps maximum (25 minutes). Le fichier est peut-être trop complexe.",
              ),
            );
            return;
          }

          try {
            const statusRes = await fetch(
              `${API_BASE}/ai/extract-tender/status/${jobId}`,
              { headers: getAuthHeaders() },
            );

            if (!statusRes.ok) {
              if (statusRes.status === 404) {
                clearInterval(pollInterval!);
                reject(new Error("Job expiré ou non trouvé."));
                return;
              }
              return;
            }

            const statusJson = await statusRes.json();
            const { status, progress, result, error } = statusJson.data;

            setPdfJobStatus(status);
            setPdfJobProgress(progress || 0);

            if (status === "completed") {
              clearInterval(pollInterval!);
              resolve(result);
            }

            if (status === "failed") {
              clearInterval(pollInterval!);
              reject(
                new Error(
                  error ||
                    "L'analyse a échoué. Vérifiez que le PDF est valide.",
                ),
              );
            }
          } catch (pollError) {
            console.warn("[PDF Poll] Network error, retrying...", pollError);
          }
        }, 5000);
      });

      const extracted: ExtractedDocument = result;

      if (
        extracted.documentType !== "TENDER" &&
        extracted.documentType !== "CONSULTATION"
      ) {
        showToast("Le PDF ne semble pas être un cahier des charges.", "warn");
        return;
      }

      setExtractedData(extracted);
      showToast(
        `PDF analysé avec succès ! ${extracted.tender?.lots?.length || 0} lot(s) détecté(s).`,
        "ok",
      );
    } catch (error) {
      let message = "Erreur inconnue.";

      if (error instanceof Error) {
        message = error.message;
      }

      showToast(`Erreur extraction PDF : ${message}`, "err", 15000);
      console.error("Erreur extraction PDF :", message);
    } finally {
      if (pollInterval) clearInterval(pollInterval);
      setIsExtractingPdf(false);
      setPdfJobProgress(0);
      setPdfJobStatus("");
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
      const lotAttachments: AttachmentFile[] = lots
        .filter((l) => !!l.excelBase64)
        .map((l, idx) => ({
          file: base64ToFile(
            l.excelBase64 as string,
            l.excelFileName || `DQE_Lot_${l.number || idx + 1}.xlsx`,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ),
          type: "quantitative_estimate" as AttachmentType,
        }));

      // Mapper les lots avec les documents techniques et exigences extraites
      const mappedLots: LotWithDetails[] = lots.map((l) => ({
        number: l.number,
        object: l.object,
        technicalDocuments: l.technicalDocuments
          ? {
              hasTechnicalSheet:
                l.technicalDocuments.hasTechnicalSheet ?? false,
              hasConformityCertificate:
                l.technicalDocuments.hasConformityCertificate ?? false,
              hasOriginCertificate:
                l.technicalDocuments.hasOriginCertificate ?? false,
              hasManufacturingCertificate:
                l.technicalDocuments.hasManufacturingCertificate ?? false,
              hasCatalog: l.technicalDocuments.hasCatalog ?? false,
              hasUserManual: l.technicalDocuments.hasUserManual ?? false,
              hasSample: l.technicalDocuments.hasSample ?? false,
            }
          : { ...defaultTechnicalDocuments },
        clientRequirements: l.clientRequirements
          ? {
              particularPrescriptions:
                l.clientRequirements.particularPrescriptions ?? "",
              warrantyDuration: l.clientRequirements.warrantyDuration ?? "",
              deliveryDelay: l.clientRequirements.deliveryDelay ?? "",
              savDuration: l.clientRequirements.savDuration ?? "",
              interventionDelay: l.clientRequirements.interventionDelay ?? "",
              savLocations: l.clientRequirements.savLocations ?? "",
              trainingDuration: l.clientRequirements.trainingDuration ?? "",
            }
          : { ...defaultClientRequirements },
        excelBase64: l.excelBase64,
        excelFileName: l.excelFileName,
      }));

      setData((prev) => ({
        ...prev,
        offerTitle: tender?.title || prev.offerTitle,
        consultationNumber: tender?.tenderNumber || prev.consultationNumber,
        procedureType: tender?.procedureType || prev.procedureType,
        depositLocation: tender?.depositLocation || prev.depositLocation,
        hospitalDepositDate:
          tender?.hospitalDepositDate || prev.hospitalDepositDate,
        technicalDepartmentDepositDate:
          tender?.technicalDepartmentDepositDate ||
          prev.technicalDepartmentDepositDate,
        maintenanceWorkshop:
          tender?.maintenanceWorkshop || prev.maintenanceWorkshop,
        availableTechnicalMeans:
          tender?.availableTechnicalMeans || prev.availableTechnicalMeans,
        offerExpirationDate:
          tender?.offerExpirationDate || prev.offerExpirationDate,
        ddpConditions: tender?.ddpConditions || prev.ddpConditions,
        siteVisitPV: tender?.siteVisitPV ?? prev.siteVisitPV,
        pliOpeningPV: tender?.pliOpeningPV ?? prev.pliOpeningPV,
        provisionalAttributionPV:
          tender?.provisionalAttributionPV ?? prev.provisionalAttributionPV,
        definitiveAttributionPV:
          tender?.definitiveAttributionPV ?? prev.definitiveAttributionPV,
        justiceFolder: tender?.justiceFolder ?? prev.justiceFolder,
        submissionBond: tender?.submissionBond ?? prev.submissionBond,
        goodExecutionBond: tender?.goodExecutionBond ?? prev.goodExecutionBond,
        supplierCommercialAudit:
          tender?.supplierCommercialAudit || prev.supplierCommercialAudit,
        ...(lots.length > 0 ? syncPrimaryLot(mappedLots) : {}),
        lots: lots.length > 0 ? mappedLots : prev.lots,
        attachments: (() => {
          if (lotAttachments.length === 0) return prev.attachments;
          const existingNames = new Set(
            prev.attachments.map((a) => a.file.name),
          );
          const newAttachments = lotAttachments.filter(
            (a) => !existingNames.has(a.file.name),
          );
          return [...prev.attachments, ...newAttachments];
        })(),
        medicalEntity: {
          ...prev.medicalEntity,
          name: tender?.name_organization || prev.medicalEntity.name,
          type:
            tender?.type_organization ||
            detectEntityType(tender?.name_organization) ||
            prev.medicalEntity.type,
          city: tender?.city || tender?.wilaya || prev.medicalEntity.city,
          address:
            tender?.address ||
            buildAddress(tender) ||
            prev.medicalEntity.address,
          phone: tender?.phone || prev.medicalEntity.phone,
          phone2: tender?.phone2 || prev.medicalEntity.phone2,
          email: tender?.email || prev.medicalEntity.email,
          contactPerson:
            tender?.contactPerson ||
            extractContactPerson(tender?.name_organization) ||
            prev.medicalEntity.contactPerson,
          serviceToContact:
            tender?.serviceToContact ||
            tender?.direction ||
            tender?.ministry ||
            prev.medicalEntity.serviceToContact,
        },
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
    // Français
    if (value.includes("clinique")) return "Clinique";
    if (value.includes("hopital") || value.includes("hôpital"))
      return "Hôpital";
    if (value.includes("epsp")) return "EPSP";
    if (value.includes("universite") || value.includes("université"))
      return "Université";
    if (value.includes("laboratoire")) return "Laboratoire";
    // Arabe
    if (value.includes("مستشفى") || value.includes("مصح")) return "Hôpital";
    if (value.includes("عيادة")) return "Clinique";
    if (value.includes("جامعة")) return "Université";
    if (value.includes("مختبر")) return "Laboratoire";
    if (value.includes("صيدلية")) return "Pharmacie";
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
      "الجزائر",
      "وهران",
      "البليدة",
      "قسنطينة",
      "عنابة",
      "باتنة",
      "سطيف",
      "تلمسان",
      "تيزي وزو",
      "بشار",
      "غرداية",
      "ورقلة",
    ];
    const normalized = address.toLowerCase();
    for (const city of cities) {
      if (normalized.includes(city.toLowerCase())) {
        // Normaliser les noms arabes vers français
        if (city === "الجزائر") return "Alger";
        if (city === "وهران") return "Oran";
        if (city === "البليدة") return "Blida";
        if (city === "قسنطينة") return "Constantine";
        if (city === "عنابة") return "Annaba";
        if (city === "باتنة") return "Batna";
        if (city === "سطيف") return "Sétif";
        if (city === "تلمسان") return "Tlemcen";
        if (city === "تيزي وزو") return "Tizi Ouzou";
        if (city === "بشار") return "Béchar";
        if (city === "غرداية") return "Ghardaïa";
        if (city === "ورقلة") return "Ouargla";
        return city;
      }
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
      if (!data.medicalEntity.phone.trim())
        errs.phone = "Le numéro de téléphone est obligatoire.";
      if (!data.medicalEntity.phone2.trim())
        errs.phone2 = "Le deuxième numéro de téléphone est obligatoire.";
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
  function syncPrimaryLot(lots: LotWithDetails[]) {
    return {
      lotNumber: lots[0]?.number ?? "",
      lotObject: lots[0]?.object ?? "",
    };
  }

  function addLot() {
    setData((prev) => {
      const lots = [
        ...prev.lots,
        {
          number: "",
          object: "",
          technicalDocuments: { ...defaultTechnicalDocuments },
          clientRequirements: { ...defaultClientRequirements },
        },
      ];
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

  function updateLotTechnicalDocument(
    lotIndex: number,
    docKey: keyof TechnicalDocument,
    value: boolean,
  ) {
    setData((prev) => ({
      ...prev,
      lots: prev.lots.map((lot, i) =>
        i === lotIndex
          ? {
              ...lot,
              technicalDocuments: {
                ...lot.technicalDocuments,
                [docKey]: value,
              },
            }
          : lot,
      ),
    }));
  }

  function updateLotClientRequirement(
    lotIndex: number,
    reqKey: keyof ClientRequirement,
    value: string,
  ) {
    setData((prev) => ({
      ...prev,
      lots: prev.lots.map((lot, i) =>
        i === lotIndex
          ? {
              ...lot,
              clientRequirements: {
                ...lot.clientRequirements,
                [reqKey]: value,
              },
            }
          : lot,
      ),
    }));
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

      showToast(result.failed === 0 ? "ok" : "warn");
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
                technicalDocuments: { ...defaultTechnicalDocuments },
                clientRequirements: { ...defaultClientRequirements },
              },
            ]
          : [
              {
                number: "",
                object: "",
                technicalDocuments: { ...defaultTechnicalDocuments },
                clientRequirements: { ...defaultClientRequirements },
              },
            ];

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
              Téléphone 1 *
            </label>
            <input
              type="text"
              value={data.medicalEntity.phone}
              onChange={(e) => updateMedicalEntity("phone", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.phone
                  ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                  : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              }`}
              placeholder="Ex : 0550 00 00 00"
            />
            <FieldError message={errors.phone} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Téléphone 2 *
            </label>
            <input
              type="text"
              value={data.medicalEntity.phone2}
              onChange={(e) => updateMedicalEntity("phone2", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.phone2
                  ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                  : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              }`}
              placeholder="Ex : 0770 00 00 00"
            />
            <FieldError message={errors.phone2} />
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

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Service à contacter
            </label>
            <ServiceToContactSelect
              value={data.medicalEntity.serviceToContact}
              onChange={(value) =>
                updateMedicalEntity("serviceToContact", value)
              }
            />
          </div>

          <div className="md:col-span-2 mt-2">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">
              En-tête de l&apos;offre
            </h3>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Raison sociale
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
    const technicalDocFields: {
      key: keyof TechnicalDocument;
      label: string;
    }[] = [
      { key: "hasTechnicalSheet", label: "Fiche Technique" },
      { key: "hasConformityCertificate", label: "Certificat de Conformité" },
      { key: "hasOriginCertificate", label: "Certificat d'Origine" },
      {
        key: "hasManufacturingCertificate",
        label: "Certificat de Fabrication Algérienne",
      },
      { key: "hasCatalog", label: "Catalogue" },
      { key: "hasUserManual", label: "Manuel Utilisateur" },
      { key: "hasSample", label: "Échantillon" },
    ];

    const clientReqFields: {
      key: keyof ClientRequirement;
      label: string;
      placeholder: string;
    }[] = [
      {
        key: "particularPrescriptions",
        label: "Prescriptions Particulières",
        placeholder: "Ex : Spécifications techniques particulières...",
      },
      {
        key: "warrantyDuration",
        label: "Durée de Garantie",
        placeholder: "Ex : 12 mois",
      },
      {
        key: "deliveryDelay",
        label: "Délai de Livraison / Installation",
        placeholder: "Ex : 30 jours",
      },
      {
        key: "savDuration",
        label: "Durée du S.A.V",
        placeholder: "Ex : 24 mois",
      },
      {
        key: "interventionDelay",
        label: "Délai d'Intervention",
        placeholder: "Ex : 48 heures",
      },
      {
        key: "savLocations",
        label: "Localités S.A.V",
        placeholder: "Ex : Alger, Oran, Constantine",
      },
      {
        key: "trainingDuration",
        label: "Durée de Formation",
        placeholder: "Ex : 3 jours",
      },
    ];

    return (
      <div className="space-y-6">
        <p className="text-sm text-gray-500">
          Renseignez les informations du Plan de charge individuel par lot.
        </p>

        <div className="space-y-4">
          {data.lots.map((lot, lotIdx) => (
            <div
              key={lotIdx}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden"
            >
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Lot {lotIdx + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => removeLot(lotIdx)}
                  className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>

              <div className="p-4 space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      N° lot *
                    </label>
                    <input
                      type="text"
                      value={lot.number}
                      onChange={(e) =>
                        updateLot(lotIdx, "number", e.target.value)
                      }
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                        errors[`lot_number_${lotIdx}`]
                          ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                          : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                      }`}
                      placeholder="Ex : 04, 5"
                    />
                    <FieldError message={errors[`lot_number_${lotIdx}`]} />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Objet du lot *
                    </label>
                    <input
                      type="text"
                      value={lot.object}
                      onChange={(e) =>
                        updateLot(lotIdx, "object", e.target.value)
                      }
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                        errors[`lot_object_${lotIdx}`]
                          ? "border-red-400 focus:border-red-400 focus:ring-red-300"
                          : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                      }`}
                      placeholder="Ex : Équipements de laboratoire"
                    />
                    <FieldError message={errors[`lot_object_${lotIdx}`]} />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-gray-800">
                    Documents Technique (OUI / NON)
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {technicalDocFields.map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition hover:border-teal-300"
                      >
                        <input
                          type="checkbox"
                          checked={!!lot.technicalDocuments[key]}
                          onChange={(e) =>
                            updateLotTechnicalDocument(
                              lotIdx,
                              key,
                              e.target.checked,
                            )
                          }
                          className="h-4 w-4 accent-teal-600"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-gray-800">
                    Exigences du Client
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {clientReqFields.map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          {label}
                        </label>
                        <input
                          type="text"
                          value={lot.clientRequirements[key]}
                          onChange={(e) =>
                            updateLotClientRequirement(
                              lotIdx,
                              key,
                              e.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {lot.excelBase64 && (
                  <LotExcelPreview
                    base64={lot.excelBase64}
                    filename={
                      lot.excelFileName ||
                      `DQE_Lot_${lot.number || lotIdx + 1}.xlsx`
                    }
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addLot}
          className="w-full rounded-lg border border-teal-500 px-4 py-3 text-sm font-medium text-teal-700 transition hover:bg-teal-50"
        >
          + Ajouter un lot
        </button>

        <FieldError message={errors.lots} />
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-center">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {att.file.name}
                    </p>
                    <FilePreviewLink file={att.file} />
                  </div>
                  <p className="text-xs text-gray-500">
                    {(att.file.size / 1024 / 1024).toFixed(2)} MB
                    {att.type !== "other" && (
                      <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                        {ATTACHMENT_LABELS[att.type]}
                      </span>
                    )}
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
              ["Téléphone 1", data.medicalEntity.phone || "—"],
              ["Téléphone 2", data.medicalEntity.phone2 || "—"],
              ["Email", data.medicalEntity.email],
              ["Contact", data.medicalEntity.contactPerson],
              [
                "Service à contacter",
                data.medicalEntity.serviceToContact || "—",
              ],
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
              ["Date expiration", data.offerExpirationDate || "—"],
              ["Atelier maintenance", data.maintenanceWorkshop || "—"],
              ["Moyens techniques", data.availableTechnicalMeans || "—"],
              ["Conditions DDP", data.ddpConditions || "—"],
            ].map(([label, val]) => (
              <p key={label as string} className="text-gray-600">
                <span className="font-medium text-gray-800">{label} :</span>{" "}
                {val}
              </p>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {data.siteVisitPV && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                PV Visite Site
              </span>
            )}
            {data.pliOpeningPV && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                PV Ouverture Plis
              </span>
            )}
            {data.provisionalAttributionPV && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                PV Attribution Provisoire
              </span>
            )}
            {data.definitiveAttributionPV && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                PV Attribution Définitive
              </span>
            )}
            {data.justiceFolder && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                Dossier Justice
              </span>
            )}
            {data.submissionBond && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                Caution Soumission
              </span>
            )}
            {data.goodExecutionBond && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                Caution Bonne Exécution
              </span>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              2. Plan de charge individuel ({data.lots.length} lot(s))
            </h3>
            <button
              type="button"
              onClick={() => handleJump(1)}
              className="text-xs text-teal-600 hover:underline"
            >
              Modifier
            </button>
          </div>

          {data.lots.map((lot, lotIdx) => (
            <div
              key={lotIdx}
              className="mb-4 rounded-lg border border-gray-100 bg-gray-50/50 p-3"
            >
              <h4 className="text-xs font-semibold text-gray-800 mb-2">
                Lot {lotIdx + 1} — {lot.number} : {lot.object}
                {lot.excelBase64 && (
                  <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] text-teal-700">
                    📊 DQE Excel
                  </span>
                )}
              </h4>

              <div className="mb-2">
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Documents Technique :
                </p>
                <div className="flex flex-wrap gap-1">
                  {lot.technicalDocuments.hasTechnicalSheet && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      Fiche Technique
                    </span>
                  )}
                  {lot.technicalDocuments.hasConformityCertificate && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      Conformité
                    </span>
                  )}
                  {lot.technicalDocuments.hasOriginCertificate && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      Origine
                    </span>
                  )}
                  {lot.technicalDocuments.hasManufacturingCertificate && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      Fabrication DZ
                    </span>
                  )}
                  {lot.technicalDocuments.hasCatalog && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      Catalogue
                    </span>
                  )}
                  {lot.technicalDocuments.hasUserManual && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      Manuel
                    </span>
                  )}
                  {lot.technicalDocuments.hasSample && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      Échantillon
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1 text-xs md:grid-cols-2">
                {[
                  [
                    "Prescriptions Particulières",
                    lot.clientRequirements.particularPrescriptions || "—",
                  ],
                  [
                    "Durée de Garantie",
                    lot.clientRequirements.warrantyDuration || "—",
                  ],
                  [
                    "Délai de Livraison",
                    lot.clientRequirements.deliveryDelay || "—",
                  ],
                  ["Durée du S.A.V", lot.clientRequirements.savDuration || "—"],
                  [
                    "Délai d'Intervention",
                    lot.clientRequirements.interventionDelay || "—",
                  ],
                  [
                    "Localités S.A.V",
                    lot.clientRequirements.savLocations || "—",
                  ],
                  [
                    "Durée de Formation",
                    lot.clientRequirements.trainingDuration || "—",
                  ],
                ].map(([label, val]) => (
                  <p key={label} className="text-gray-600">
                    <span className="font-medium text-gray-800">{label} :</span>{" "}
                    {val}
                  </p>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs md:grid-cols-2">
            {[
              ["Atelier de Maintenance", data.maintenanceWorkshop || "—"],
              ["Moyens Techniques", data.availableTechnicalMeans || "—"],
              ["Facture Proforma", data.proformaInvoice || "—"],
              ["Échéancier Paiement", data.paymentSchedule || "—"],
              ["Remise Obtenue", data.discountObtained || "—"],
              ["Date Expiration", data.offerExpirationDate || "—"],
              ["Conditions DDP", data.ddpConditions || "—"],
              ["Audit commercial", data.supplierCommercialAudit || "—"],
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
                  {att.type !== "other" && (
                    <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                      {ATTACHMENT_LABELS[att.type]}
                    </span>
                  )}
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

        <div className="min-h-80 rounded-2xl border border-gray-200 p-5">
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
