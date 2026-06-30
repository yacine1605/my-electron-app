import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/hooks/useAuth";
import { OfferDetail, OfferStatus, ProcedureType } from "@/lib/hooks/useOffers";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// UI primitives (adjust imports to match your project)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { apiClient } from "./hooks/apiClient";

/* ────────────────────────────────────────────────────────────────
   Types & helpers
   ──────────────────────────────────────────────────────────────── */

interface OfferUpdatePayload {
  title?: string;
  emailSubject?: string;
  emailBody?: string;
  emailSignature?: string;
  status?: OfferStatus;

  // Header
  commercialName?: string | null;
  consultationNumber?: string | null;
  establishment?: string | null;
  wilaya?: string | null;
  depositLocation?: string | null;
  procedureType?: ProcedureType | null;
  hospitalDepositDate?: string | null;
  technicalDepartmentDepositDate?: string | null;

  // Documents
  hasTechnicalSheet?: boolean | null;
  hasConformityCertificate?: boolean | null;
  hasOriginCertificate?: boolean | null;
  hasManufacturingCertificate?: boolean | null;
  hasUserManual?: boolean | null;
  hasCatalog?: boolean | null;
  hasSample?: boolean | null;

  // Prescriptions
  warrantyDuration?: string | null;
  deliveryDelay?: string | null;
  savDuration?: string | null;
  interventionDelay?: string | null;
  savLocations?: string | null;
  trainingDuration?: string | null;

  // Suivi commercial
  maintenanceWorkshop?: string | null;
  availableTechnicalMeans?: string | null;
  proformaInvoice?: string | null;
  paymentSchedule?: string | null;
  discountObtained?: string | null;
  offerExpirationDate?: string | null;
  ddpConditions?: string | null;

  // PVs & Cautions
  siteVisitPV?: boolean | null;
  pliOpeningPV?: boolean | null;
  provisionalAttributionPV?: boolean | null;
  definitiveAttributionPV?: boolean | null;
  justiceFolder?: boolean | null;
  submissionBond?: boolean | null;
  goodExecutionBond?: boolean | null;

  // Audit
  supplierCommercialAudit?: string | null;
}

const STATUS_LABELS: Record<OfferStatus, string> = {
  draft: "Brouillon",
  pending: "En attente",
  sent: "Envoyé",
  partial_failed: "Échec partiel",
  failed: "Échoué",
  completed: "Terminé",
};

const PROCEDURE_TYPES: { value: ProcedureType; label: string }[] = [
  { value: "appel_offre", label: "Appel d'offres" },
  { value: "consultation", label: "Consultation" },
];

function toDateInputValue(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd");
}

/* ────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────── */

export default function EditOfferPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userRole = useAuthStore((s) => s.user?.role);

  const [form, setForm] = useState<OfferUpdatePayload>({});
  const [activeTab, setActiveTab] = useState("general");

  /* ── Fetch offer ── */
  const {
    data: offer,
    isLoading,
    isError,
  } = useQuery<OfferDetail>({
    queryKey: ["offers", offerId],
    enabled: Boolean(offerId),
    queryFn: async () => {
      const json = await apiClient
        .get(`offers/${offerId}`)
        .json<{ success: boolean; data: OfferDetail }>();
      if (!json.success) throw new Error("Erreur serveur");
      return json.data;
    },
  });

  /* ── Init form when data arrives ── */
  useEffect(() => {
    if (!offer) return;
    setForm({
      title: offer.title,
      emailSubject: offer.emailSubject,
      emailBody: offer.emailBody,
      emailSignature: offer.emailSignature,
      status: offer.status,

      commercialName: offer.commercialName,
      consultationNumber: offer.consultationNumber,
      establishment: offer.establishment,
      wilaya: offer.wilaya,
      depositLocation: offer.depositLocation,
      procedureType: offer.procedureType,
      hospitalDepositDate: offer.hospitalDepositDate,
      technicalDepartmentDepositDate: offer.technicalDepartmentDepositDate,

      hasTechnicalSheet: offer.hasTechnicalSheet,
      hasConformityCertificate: offer.hasConformityCertificate,
      hasOriginCertificate: offer.hasOriginCertificate,
      hasManufacturingCertificate: offer.hasManufacturingCertificate,
      hasUserManual: offer.hasUserManual,
      hasCatalog: offer.hasCatalog,
      hasSample: offer.hasSample,

      warrantyDuration: offer.warrantyDuration,
      deliveryDelay: offer.deliveryDelay,
      savDuration: offer.savDuration,
      interventionDelay: offer.interventionDelay,
      savLocations: offer.savLocations,
      trainingDuration: offer.trainingDuration,

      maintenanceWorkshop: offer.maintenanceWorkshop,
      availableTechnicalMeans: offer.availableTechnicalMeans,
      proformaInvoice: offer.proformaInvoice,
      paymentSchedule: offer.paymentSchedule,
      discountObtained: offer.discountObtained,
      offerExpirationDate: offer.offerExpirationDate,
      ddpConditions: offer.ddpConditions,

      siteVisitPV: offer.siteVisitPV,
      pliOpeningPV: offer.pliOpeningPV,
      provisionalAttributionPV: offer.provisionalAttributionPV,
      definitiveAttributionPV: offer.definitiveAttributionPV,
      justiceFolder: offer.justiceFolder,
      submissionBond: offer.submissionBond,
      goodExecutionBond: offer.goodExecutionBond,

      supplierCommercialAudit: offer.supplierCommercialAudit,
    });
  }, [offer]);

  /* ── Update mutation ── */
  const updateMutation = useMutation({
    mutationFn: async (payload: OfferUpdatePayload) => {
      const res = await apiClient
        .put(`offers/${offerId}`, { json: payload })
        .json<{ success: boolean; message?: string }>();
      if (!res.success) throw new Error(res.message ?? "Erreur mise à jour");
      return res;
    },
    onSuccess: () => {
      toast.success("Offre mise à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["offers", offerId] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erreur lors de la mise à jour");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerId) return;
    updateMutation.mutate(form);
  };

  const updateField = <K extends keyof OfferUpdatePayload>(
    field: K,
    value: OfferUpdatePayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) return <EditOfferSkeleton />;
  if (isError || !offer)
    return (
      <div className="p-8 text-center text-red-500">
        Impossible de charger l'offre.
      </div>
    );

  const canEdit = userRole === "admin" || userRole === "agent_commercial";

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Modifier l'offre
            </h1>
            <p className="text-muted-foreground text-sm">
              {offer.title}{" "}
              <Badge variant="secondary" className="ml-2">
                {STATUS_LABELS[offer.status]}
              </Badge>
            </p>
          </div>
        </div>
        {canEdit && (
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 grid w-full grid-cols-5">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="header">En-tête</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="tracking">Suivi</TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════
              TAB 1 — GÉNÉRAL
              ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>
                  Contenu de l'email et identification de l'offre.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="title">Titre de l'offre</Label>
                  <Input
                    id="title"
                    value={form.title ?? ""}
                    onChange={(e) => updateField("title", e.target.value)}
                    disabled={!canEdit}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="emailSubject">Objet du mail</Label>
                  <Input
                    id="emailSubject"
                    value={form.emailSubject ?? ""}
                    onChange={(e) =>
                      updateField("emailSubject", e.target.value)
                    }
                    disabled={!canEdit}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="emailBody">Corps du mail</Label>
                  <Textarea
                    id="emailBody"
                    rows={6}
                    value={form.emailBody ?? ""}
                    onChange={(e) => updateField("emailBody", e.target.value)}
                    disabled={!canEdit}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="emailSignature">Signature</Label>
                  <Textarea
                    id="emailSignature"
                    rows={3}
                    value={form.emailSignature ?? ""}
                    onChange={(e) =>
                      updateField("emailSignature", e.target.value)
                    }
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>Statut</Label>
                  <Select
                    value={form.status ?? offer.status}
                    onValueChange={(v) =>
                      updateField("status", v as OfferStatus)
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Entité médicale</Label>
                  <Input
                    value={offer.medicalEntity?.name ?? ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════
              TAB 2 — EN-TÊTE
              ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="header" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Identification de l'appel d'offres</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nom commercial</Label>
                  <Input
                    value={form.commercialName ?? ""}
                    onChange={(e) =>
                      updateField("commercialName", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>N° Consultation</Label>
                  <Input
                    value={form.consultationNumber ?? ""}
                    onChange={(e) =>
                      updateField("consultationNumber", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Établissement</Label>
                  <Input
                    value={form.establishment ?? ""}
                    onChange={(e) =>
                      updateField("establishment", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Wilaya</Label>
                  <Input
                    value={form.wilaya ?? ""}
                    onChange={(e) =>
                      updateField("wilaya", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Lieu de dépôt</Label>
                  <Textarea
                    value={form.depositLocation ?? ""}
                    onChange={(e) =>
                      updateField("depositLocation", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Type de procédure</Label>
                  <Select
                    value={form.procedureType ?? ""}
                    onValueChange={(v) =>
                      updateField("procedureType", (v as ProcedureType) || null)
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Non défini</SelectItem>
                      {PROCEDURE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date dépôt hôpital</Label>
                  <Input
                    type="date"
                    value={toDateInputValue(form.hospitalDepositDate)}
                    onChange={(e) =>
                      updateField("hospitalDepositDate", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Date dépôt service technique</Label>
                  <Input
                    type="date"
                    value={toDateInputValue(
                      form.technicalDepartmentDepositDate,
                    )}
                    onChange={(e) =>
                      updateField(
                        "technicalDepartmentDepositDate",
                        e.target.value || null,
                      )
                    }
                    disabled={!canEdit}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════
              TAB 3 — DOCUMENTS
              ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documents requis</CardTitle>
                <CardDescription>
                  Cases à cocher selon le cahier des charges.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    key: "hasTechnicalSheet",
                    label: "Fiche technique",
                  },
                  {
                    key: "hasConformityCertificate",
                    label: "Certificat de conformité",
                  },
                  {
                    key: "hasOriginCertificate",
                    label: "Certificat d'origine",
                  },
                  {
                    key: "hasManufacturingCertificate",
                    label: "Certificat de fabrication",
                  },
                  {
                    key: "hasUserManual",
                    label: "Manuel d'utilisation",
                  },
                  { key: "hasCatalog", label: "Catalogue" },
                  { key: "hasSample", label: "Échantillon" },
                ].map((doc) => (
                  <div key={doc.key} className="flex items-center gap-2">
                    <Checkbox
                      id={doc.key}
                      checked={!!(form as any)[doc.key]}
                      onCheckedChange={(checked) =>
                        updateField(doc.key as any, checked === true)
                      }
                      disabled={!canEdit}
                    />
                    <Label htmlFor={doc.key} className="cursor-pointer">
                      {doc.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════
              TAB 4 — PRESCRIPTIONS
              ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="prescriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prescriptions techniques</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Durée de garantie</Label>
                  <Input
                    value={form.warrantyDuration ?? ""}
                    onChange={(e) =>
                      updateField("warrantyDuration", e.target.value || null)
                    }
                    disabled={!canEdit}
                    placeholder="ex: 24 mois"
                  />
                </div>
                <div>
                  <Label>Délai de livraison</Label>
                  <Input
                    value={form.deliveryDelay ?? ""}
                    onChange={(e) =>
                      updateField("deliveryDelay", e.target.value || null)
                    }
                    disabled={!canEdit}
                    placeholder="ex: 30 jours"
                  />
                </div>
                <div>
                  <Label>Durée SAV</Label>
                  <Input
                    value={form.savDuration ?? ""}
                    onChange={(e) =>
                      updateField("savDuration", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Délai d'intervention</Label>
                  <Input
                    value={form.interventionDelay ?? ""}
                    onChange={(e) =>
                      updateField("interventionDelay", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Localisations SAV</Label>
                  <Textarea
                    value={form.savLocations ?? ""}
                    onChange={(e) =>
                      updateField("savLocations", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Durée de formation</Label>
                  <Input
                    value={form.trainingDuration ?? ""}
                    onChange={(e) =>
                      updateField("trainingDuration", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════
              TAB 5 — SUIVI
              ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="tracking" className="space-y-4">
            {/* Suivi commercial */}
            <Card>
              <CardHeader>
                <CardTitle>Suivi commercial</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Atelier de maintenance</Label>
                  <Input
                    value={form.maintenanceWorkshop ?? ""}
                    onChange={(e) =>
                      updateField("maintenanceWorkshop", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Moyens techniques disponibles</Label>
                  <Input
                    value={form.availableTechnicalMeans ?? ""}
                    onChange={(e) =>
                      updateField(
                        "availableTechnicalMeans",
                        e.target.value || null,
                      )
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Proforma</Label>
                  <Input
                    value={form.proformaInvoice ?? ""}
                    onChange={(e) =>
                      updateField("proformaInvoice", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Échéancier de paiement</Label>
                  <Input
                    value={form.paymentSchedule ?? ""}
                    onChange={(e) =>
                      updateField("paymentSchedule", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Remise obtenue</Label>
                  <Input
                    value={form.discountObtained ?? ""}
                    onChange={(e) =>
                      updateField("discountObtained", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Date d'expiration de l'offre</Label>
                  <Input
                    type="date"
                    value={toDateInputValue(form.offerExpirationDate)}
                    onChange={(e) =>
                      updateField("offerExpirationDate", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Conditions DDP</Label>
                  <Textarea
                    value={form.ddpConditions ?? ""}
                    onChange={(e) =>
                      updateField("ddpConditions", e.target.value || null)
                    }
                    disabled={!canEdit}
                  />
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* PVs & Cautions */}
            <Card>
              <CardHeader>
                <CardTitle>Suivi du dossier — PVs & Cautions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: "siteVisitPV", label: "PV visite des lieux" },
                  { key: "pliOpeningPV", label: "PV ouverture des plis" },
                  {
                    key: "provisionalAttributionPV",
                    label: "PV attribution provisoire",
                  },
                  {
                    key: "definitiveAttributionPV",
                    label: "PV attribution définitive",
                  },
                  { key: "justiceFolder", label: "Dossier justice" },
                  { key: "submissionBond", label: "Caution de soumission" },
                  {
                    key: "goodExecutionBond",
                    label: "Caution de bonne exécution",
                  },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <Checkbox
                      id={item.key}
                      checked={!!(form as any)[item.key]}
                      onCheckedChange={(checked) =>
                        updateField(item.key as any, checked === true)
                      }
                      disabled={!canEdit}
                    />
                    <Label htmlFor={item.key} className="cursor-pointer">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Separator />

            {/* Audit */}
            <Card>
              <CardHeader>
                <CardTitle>Audit commercial</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={4}
                  value={form.supplierCommercialAudit ?? ""}
                  onChange={(e) =>
                    updateField(
                      "supplierCommercialAudit",
                      e.target.value || null,
                    )
                  }
                  disabled={!canEdit}
                  placeholder="Notes d'audit sur les fournisseurs..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Skeleton loader
   ──────────────────────────────────────────────────────────────── */

function EditOfferSkeleton() {
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
