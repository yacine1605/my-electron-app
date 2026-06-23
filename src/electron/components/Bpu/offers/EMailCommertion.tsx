import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/hooks/useAuth";
import { Supplier, useGetSuppliers } from "@/lib/hooks/useSuppliers";
import { useNavigate } from "react-router";
import { useOfferStore } from "@/lib/hooks/useOffre";
import { getAuthHeaders } from "./hooks/apiClient";

type SupplierRecipient = {
  id: string;
  name: string;
  email: string;
  businessType: string;
};

type RecipientGroup = {
  type: string;
  suppliersData: SupplierRecipient[];
};

// CHANGED: attachment → attachments array
type WizardData = {
  emailSubject: string;
  emailBody: string;
  attachments: File[];
  recipients: SupplierRecipient[];
};

type ValidationErrors = Record<string, string>;

type Props = {
  offerId: string;
};

const API_BASE = "https://api.digitservz.dz/api";

const STEPS = [
  "Contenu email",
  "Pièces jointes",
  "Destinataires",
  "Vérification",
];

// CHANGED: initial attachments to empty array
const initialData: WizardData = {
  emailSubject: "Demande Proforma",
  emailBody:
    "Bonjour,\n\n" +
    "Veuillez trouver ci-joint notre demande de proforma pour l'offre commerciale.\n\n" +
    "Merci de bien vouloir compléter le tableau ci-dessous et nous le retourner :\n\n" +
    "═══════════════════════════════════════════════════════════════════════════\n" +
    "DOCUMENTS TECHNIQUE\n" +
    "═══════════════════════════════════════════════════════════════════════════\n\n" +
    "DOCUMENT                          | OUI | NON | OBSERVATIONS\n" +
    "───────────────────────────────────────────────────────────────────────────\n" +
    "Fiche Technique                   | [ ] | [ ] | _________________________\n" +
    "Certificat de Conformité          | [ ] | [ ] | _________________________\n" +
    "Certificat d'Origine              | [ ] | [ ] | _________________________\n" +
    "Certificat de Fabrication Algérienne | [ ] | [ ] | _________________________\n" +
    "Catalogue                         | [ ] | [ ] | _________________________\n" +
    "Manuel Utilisateur                | [ ] | [ ] | _________________________\n" +
    "Échantillon                       | [ ] | [ ] | _________________________\n\n" +
    "═══════════════════════════════════════════════════════════════════════════\n" +
    "EXIGENCES DU CLIENT\n" +
    "═══════════════════════════════════════════════════════════════════════════\n\n" +
    "RUBRIQUE                          | INFORMATIONS\n" +
    "───────────────────────────────────────────────────────────────────────────\n" +
    "Prescriptions Particulières       | _______________________________________\n" +
    "Durée de Garantie                 | _______________________________________\n" +
    "Délai de Livraison / Installation | _______________________________________\n" +
    "Durée du S.A.V                    | _______________________________________\n" +
    "Délai d'Intervention              | _______________________________________\n" +
    "Localités S.A.V                   | _______________________________________\n" +
    "Durée de Formation                | _______________________________________\n\n" +
    "═══════════════════════════════════════════════════════════════════════════\n\n" +
    "Cordialement.",
  attachments: [],
  recipients: [],
};

// CHANGED: helper to validate by extension when MIME type is missing/unreliable
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
];

function isAllowedFile(file: File): boolean {
  if (ALLOWED_MIME_TYPES.includes(file.type)) return true;
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

export default function CommercialSupplierEmailWizard({ offerId }: Props) {
  const navigate = useNavigate();
  const { user, logout, fetchUser, isAuthenticated } = useAuthStore();
  const { data: suppliers, isLoading, error } = useGetSuppliers();
  const { setReferenceFiles } = useOfferStore();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [currentStep, setCurrentStep] = useState(0);

  const [data, setData] = useState<WizardData>(initialData);

  const [errors, setErrors] = useState<ValidationErrors>({});

  const [recipientSearch, setRecipientSearch] = useState("");

  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const [sending, setSending] = useState(false);

  const [suppliersData, setSuppliers] = useState<Supplier[]>([]);
  console.log(suppliers);
  const [toast, setToast] = useState<{
    type: "ok" | "err";
    msg: string;
  } | null>(null);
  const isGroupFullySelected = (group: RecipientGroup) => {
    return group.suppliersData.every((s) =>
      data.recipients.some((r) => r.id === s.id),
    );
  };
  const isGroupPartiallySelected = (group: RecipientGroup) => {
    const selectedCount = group.suppliersData.filter((s) =>
      data.recipients.some((r) => r.id === s.id),
    ).length;
    return selectedCount > 0 && selectedCount < group.suppliersData.length;
  };

  const toggleGroupSelection = (group: RecipientGroup) => {
    const allSelected = isGroupFullySelected(group);

    if (allSelected) {
      setData((prev) => ({
        ...prev,
        recipients: prev.recipients.filter(
          (r) => !group.suppliersData.some((s) => s.id === r.id),
        ),
      }));
    } else {
      const newRecipients = group.suppliersData.filter(
        (s) => !data.recipients.some((r) => r.id === s.id),
      );
      setData((prev) => ({
        ...prev,
        recipients: [...prev.recipients, ...newRecipients],
      }));
    }
  };

  const toggleGroupCollapse = (type: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  useEffect(() => {
    setLoadingSuppliers(true);

    try {
      setSuppliers(suppliers ?? []);
    } catch (err) {
      console.error(err);
      showToast("Erreur chargement fournisseurs", "err");
    } finally {
      setLoadingSuppliers(false);
    }
  }, [suppliers]);

  const groupedSuppliers: RecipientGroup[] = useMemo(() => {
    const filtered = suppliersData?.filter((s) => {
      const q = recipientSearch.toLowerCase();

      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.businessType.toLowerCase().includes(q)
      );
    });

    const map = new Map<string, SupplierRecipient[]>();

    filtered?.forEach((supplier) => {
      const key = supplier.businessType || "Autres";

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key)?.push(supplier);
    });

    return Array.from(map.entries()).map(([type, suppliers]) => ({
      type,
      suppliersData: suppliers,
    }));
  }, [suppliersData, recipientSearch]);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });

    setTimeout(() => {
      setToast(null);
    }, 4000);
  }

  function validateStep(step: number) {
    const errs: ValidationErrors = {};

    if (step === 0) {
      if (!data.emailSubject.trim()) {
        errs.emailSubject = "Objet obligatoire";
      }

      if (!data.emailBody.trim()) {
        errs.emailBody = "Message obligatoire";
      }
    }

    // CHANGED: validate all attachments, not just one
    if (step === 1 && data.attachments.length > 0) {
      const hasInvalid = data.attachments.some((f) => !isAllowedFile(f));
      if (hasInvalid) {
        errs.attachments = "Seulement PDF, Word, Excel ou image (PNG/JPG/WEBP)";
      }
    }

    if (step === 2 && data.recipients.length === 0) {
      errs.recipients = "Sélectionnez au moins un fournisseur";
    }

    setErrors(errs);

    return Object.keys(errs).length === 0;
  }

  function next() {
    if (!validateStep(currentStep)) return;

    setCurrentStep((p) => Math.min(p + 1, STEPS.length - 1));
  }

  function previous() {
    setCurrentStep((p) => Math.max(0, p - 1));
  }

  function toggleRecipient(recipient: SupplierRecipient) {
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

  // CHANGED: remove a specific file by index
  const removeAttachment = (index: number) => {
    setData((prev) => {
      const next = [...prev.attachments];
      next.splice(index, 1);
      return { ...prev, attachments: next };
    });
  };

  async function handleSend() {
    const valid = [0, 1, 2].every((s) => validateStep(s));

    if (!valid) return;

    setSending(true);

    try {
      const fd = new FormData();

      fd.append(
        "data",
        JSON.stringify({
          offerId,
          subject: data.emailSubject,
          body: data.emailBody,
          supplierIds: data.recipients.map((r) => r.id),
          signature:
            user?.signature ||
            `${user?.lastName ?? ""} ${user?.firstName ?? ""}\n${user?.role ?? ""}\n${user?.email ?? ""}`,
        }),
      );

      // CHANGED: append all files
      data.attachments.forEach((file) => {
        fd.append("attachments", file);
      });

      await axios.post(`${API_BASE}/offers/send-commercial`, fd, {
        headers: getAuthHeaders(),
      });
      showToast("Emails envoyés avec succès", "ok");

      setTimeout(() => {
        navigate(`/offer/liste/${offerId}/responses`);
      }, 1200);
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de l'envoi", "err");
    } finally {
      setSending(false);
    }
  }

  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Objet email *
              </label>

              <input
                type="text"
                value={data.emailSubject}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    emailSubject: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Ex : Offre commerciale"
              />

              {errors.emailSubject && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.emailSubject}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Message *
              </label>

              <textarea
                rows={10}
                value={data.emailBody}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    emailBody: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Votre message..."
              />

              {errors.emailBody && (
                <p className="mt-1 text-xs text-red-500">{errors.emailBody}</p>
              )}
            </div>

            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
              <div className="text-sm whitespace-pre-wrap text-teal-900">
                {user?.signature ||
                  `${user?.lastName} ${user?.firstName ?? ""}

${user?.role ?? ""}

${user?.email ?? ""}`}
              </div>
            </div>
          </div>
        );

      // CHANGED: Step 2 now supports multiple files
      case 1:
        return (
          <div className="space-y-4">
            <label className="block cursor-pointer">
              <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center transition hover:border-teal-400 hover:bg-teal-50">
                <div className="mb-3 text-4xl">📎</div>

                <p className="text-sm text-gray-700">
                  PDF, Word, Excel ou image
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  PDF · DOC · DOCX · XLS · XLSX · PNG · JPG · WEBP
                </p>

                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;

                    setData((prev) => {
                      const next = [...prev.attachments, ...files];
                      setReferenceFiles(next); // sync to store (File[])
                      return { ...prev, attachments: next };
                    });
                  }}
                />
              </div>
            </label>

            {data.attachments.length > 0 && (
              <div className="space-y-2">
                {data.attachments.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-teal-800">
                        {file.name}
                      </p>
                      <p className="text-xs text-teal-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errors.attachments && (
              <p className="text-xs text-red-500">{errors.attachments}</p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <input
              type="text"
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />

            {loadingSuppliers ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Chargement...
              </div>
            ) : (
              groupedSuppliers.map((group) => {
                const isCollapsed = collapsedGroups.has(group.type);
                const allSelected = isGroupFullySelected(group);
                const partiallySelected = isGroupPartiallySelected(group);

                return (
                  <div
                    key={group.type}
                    className="rounded-2xl border border-gray-200 overflow-hidden"
                  >
                    <div
                      onClick={() => toggleGroupCollapse(group.type)}
                      className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer select-none hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = partiallySelected;
                            }}
                            onChange={() => toggleGroupSelection(group)}
                            className="h-4 w-4 accent-teal-600 cursor-pointer"
                          />
                        </div>

                        <h3 className="text-sm font-semibold text-gray-800">
                          {group.type}
                        </h3>
                        <span className="text-xs text-gray-400">
                          ({group.suppliersData.length})
                        </span>
                      </div>

                      <svg
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                          isCollapsed ? "-rotate-90" : "rotate-0"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    <div
                      className={`transition-all duration-200 ${
                        isCollapsed
                          ? "max-h-0 opacity-0"
                          : "max-h-[2000px] opacity-100"
                      } overflow-hidden`}
                    >
                      <div className="space-y-2 p-4">
                        {group.suppliersData.map((supplier) => {
                          const selected = data.recipients.some(
                            (r) => r.id === supplier.id,
                          );

                          return (
                            <label
                              key={supplier.id}
                              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                                selected
                                  ? "border-teal-400 bg-teal-50"
                                  : "border-gray-200 hover:border-teal-200"
                              }`}
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {supplier.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {supplier.email}
                                </p>
                              </div>

                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleRecipient(supplier)}
                                className="h-4 w-4 accent-teal-600"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {errors.recipients && (
              <p className="text-xs text-red-500">{errors.recipients}</p>
            )}
          </div>
        );

      // CHANGED: Step 4 review shows all attachments
      case 3:
        return (
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Email
              </h3>

              <p className="mb-2 text-sm text-gray-600">
                <span className="font-medium">Objet : {data.emailSubject}</span>
              </p>

              <div className="rounded-lg bg-gray-50 p-4 text-sm whitespace-pre-wrap text-gray-700">
                {data.emailBody}
              </div>

              <div className="mt-4 rounded-lg bg-teal-50 p-4 text-sm whitespace-pre-wrap text-teal-800">
                {user?.signature}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Pièces jointes ({data.attachments.length})
              </h3>

              {data.attachments.length === 0 ? (
                <p className="text-sm text-gray-600">Aucune</p>
              ) : (
                <ul className="space-y-1">
                  {data.attachments.map((f, i) => (
                    <li key={i} className="text-sm text-gray-600">
                      • {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Destinataires ({data.recipients.length})
              </h3>

              <div className="flex flex-wrap gap-2">
                {data.recipients.map((r) => (
                  <span
                    key={r.id}
                    className="rounded-full bg-teal-100 px-3 py-1 text-xs text-teal-800"
                  >
                    {r.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "ok"
              ? "bg-teal-50 text-teal-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Envoi Offre Commerciale
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Envoyer une offre aux fournisseurs
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {STEPS.map((step, index) => {
            const active = index === currentStep;

            return (
              <div
                key={step}
                className={`rounded-xl border p-4 text-center text-sm ${
                  active
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-200 bg-white text-gray-500"
                }`}
              >
                <div className="mb-1 text-xs opacity-60">Étape {index + 1}</div>

                {step}
              </div>
            );
          })}
        </div>

        <div className="min-h-100 rounded-2xl border border-gray-200 p-6">
          {renderStep()}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={previous}
            disabled={currentStep === 0}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
          >
            ← Précédent
          </button>

          {currentStep !== STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white"
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white"
            >
              {sending ? "Envoi..." : "Envoyer les emails"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
