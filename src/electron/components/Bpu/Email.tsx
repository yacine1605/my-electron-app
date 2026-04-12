import { useMemo, useState } from "react";

/**
 * Types
 */
type MedicalEntity = {
  name: string;
  type: string;
  speciality: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  contactPerson: string;
};

type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  subjectSuggestion: string;
  bodySuggestion: string;
};

type Recipient = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

type WizardData = {
  medicalEntity: MedicalEntity;
  selectedTemplateId: string | null;
  emailSubject: string;
  emailBody: string;
  emailSignature: string;
  attachment: File | null;
  recipients: Recipient[];
};

type ValidationErrors = Record<string, string>;

/**
 * Données mockées pour les templates
 */
const templates: EmailTemplate[] = [
  {
    id: "intro",
    name: "Prise de contact",
    description: "Premier contact commercial avec une entité médicale.",
    subjectSuggestion: "Présentation de notre solution pour {{entityName}}",
    bodySuggestion:
      "Bonjour {{contactPerson}},\n\nJe me permets de vous contacter afin de vous présenter notre solution qui pourrait répondre aux besoins de {{entityName}}.\n\nJe reste à votre disposition pour échanger.",
  },
  {
    id: "followup",
    name: "Relance commerciale",
    description: "Relancer un contact après une première prise de contact.",
    subjectSuggestion: "Relance concernant notre échange avec {{entityName}}",
    bodySuggestion:
      "Bonjour {{contactPerson}},\n\nJe reviens vers vous concernant notre précédent échange au sujet de {{entityName}}.\n\nN'hésitez pas à me faire un retour si vous souhaitez plus d'informations.",
  },
  {
    id: "partnership",
    name: "Proposition de partenariat",
    description: "Proposer une collaboration ou un partenariat.",
    subjectSuggestion: "Proposition de collaboration avec {{entityName}}",
    bodySuggestion:
      "Bonjour {{contactPerson}},\n\nNous souhaiterions vous proposer une collaboration adaptée aux besoins de {{entityName}}.\n\nVous trouverez davantage d'informations dans le document joint.",
  },
];

/**
 * Données mockées pour les destinataires
 */
const availableRecipients: Recipient[] = [
  {
    id: "1",
    name: "Dr. Ahmed Bensalem",
    email: "ahmed.bensalem@clinique.dz",
    role: "Médecin",
  },
  {
    id: "2",
    name: "Mme Nadia Khelifi",
    email: "n.khelifi@hopital.dz",
    role: "Direction",
  },
  {
    id: "3",
    name: "M. Samir Touati",
    email: "s.touati@centre-medical.dz",
    role: "Administration",
  },
  {
    id: "4",
    name: "Dr. Lina Meziane",
    email: "l.meziane@cabinet.dz",
    role: "Spécialiste",
  },
];

/**
 * État initial du wizard
 */
const initialData: WizardData = {
  medicalEntity: {
    name: "",
    type: "",
    speciality: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    contactPerson: "",
  },
  selectedTemplateId: null,
  emailSubject: "",
  emailBody: "",
  emailSignature: "",
  attachment: null,
  recipients: [],
};

const steps = [
  "Entité médicale",
  "Template",
  "Contenu email",
  "Pièce jointe",
  "Destinataires",
  "Vérification",
];

/**
 * Fonction utilitaire : remplace les variables dynamiques
 * Exemple : {{entityName}}, {{contactPerson}}, {{city}}
 */
function applyTemplateVariables(
  text: string,
  medicalEntity: MedicalEntity,
): string {
  return text
    .replace("{{entityName}}", medicalEntity.name || "votre établissement")
    .replace(
      "{{contactPerson}}",
      medicalEntity.contactPerson || "Madame, Monsieur",
    )
    .replace("{{city}}", medicalEntity.city || "votre ville");
}

/**
 * Fonction utilitaire : validation basique d'email
 */
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function MedicalEntityEmailWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [recipientSearch, setRecipientSearch] = useState("");

  /**
   * On récupère le template actuellement sélectionné
   */
  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === data.selectedTemplateId) || null;
  }, [data.selectedTemplateId]);

  /**
   * Filtrage des destinataires selon la recherche
   */
  const filteredRecipients = useMemo(() => {
    const search = recipientSearch.toLowerCase();
    return availableRecipients.filter(
      (recipient) =>
        recipient.name.toLowerCase().includes(search) ||
        recipient.email.toLowerCase().includes(search) ||
        (recipient.role || "").toLowerCase().includes(search),
    );
  }, [recipientSearch]);

  /**
   * Validation de chaque étape
   */
  function validateStep(step: number): boolean {
    const newErrors: ValidationErrors = {};

    if (step === 0) {
      if (!data.medicalEntity.name.trim()) {
        newErrors.name = "Le nom de l'entité médicale est obligatoire.";
      }

      if (!data.medicalEntity.type.trim()) {
        newErrors.type = "Le type d'entité est obligatoire.";
      }

      if (!data.medicalEntity.speciality.trim()) {
        newErrors.speciality = "La spécialité est obligatoire.";
      }

      if (!data.medicalEntity.city.trim()) {
        newErrors.city = "La ville est obligatoire.";
      }

      if (!data.medicalEntity.email.trim()) {
        newErrors.email = "L'email de l'entité est obligatoire.";
      } else if (!isValidEmail(data.medicalEntity.email)) {
        newErrors.email = "Veuillez saisir un email valide.";
      }

      if (!data.medicalEntity.contactPerson.trim()) {
        newErrors.contactPerson = "Le contact principal est obligatoire.";
      }
    }

    if (step === 1) {
      if (!data.selectedTemplateId) {
        newErrors.selectedTemplateId = "Veuillez choisir un template.";
      }
    }

    if (step === 2) {
      if (!data.emailSubject.trim()) {
        newErrors.emailSubject = "L'objet de l'email est obligatoire.";
      }

      if (!data.emailBody.trim()) {
        newErrors.emailBody = "Le message personnalisé est obligatoire.";
      }

      if (!data.emailSignature.trim()) {
        newErrors.emailSignature = "La signature est obligatoire.";
      }
    }

    if (step === 3) {
      if (data.attachment) {
        const isPdf = data.attachment.type === "application/pdf";
        if (!isPdf) {
          newErrors.attachment = "La pièce jointe doit être un fichier PDF.";
        }

        const maxSize = 10 * 1024 * 1024;
        if (data.attachment.size > maxSize) {
          newErrors.attachment =
            "Le fichier PDF dépasse la taille maximale de 10 MB.";
        }
      }
    }

    if (step === 4) {
      if (data.recipients.length === 0) {
        newErrors.recipients =
          "Veuillez sélectionner au moins un destinataire.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /**
   * Aller à l'étape suivante
   */
  function handleNext() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }

  /**
   * Revenir à l'étape précédente
   */
  function handlePrevious() {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  /**
   * Simuler une sauvegarde de brouillon
   * Ici on fait seulement un console.log
   */
  function handleSaveDraft() {
    console.log("Brouillon sauvegardé :", data);
    alert("Brouillon sauvegardé dans la console.");
  }

  /**
   * Action finale : confirmation sans envoi réel
   */
  function handleConfirmWithoutSending() {
    const allStepsValid = [0, 1, 2, 3, 4].every((step) => validateStep(step));

    if (!allStepsValid) {
      alert("Veuillez corriger les erreurs avant de confirmer.");
      return;
    }

    console.log("Confirmation finale sans envoi :", data);
    alert("Vérification terminée. Aucun email n'a été envoyé.");
  }

  /**
   * Met à jour les champs de l'entité médicale
   */
  function updateMedicalEntity<K extends keyof MedicalEntity>(
    key: K,
    value: MedicalEntity[K],
  ) {
    setData((prev) => ({
      ...prev,
      medicalEntity: {
        ...prev.medicalEntity,
        [key]: value,
      },
    }));
  }

  /**
   * Sélection d'un template
   * On pré-remplit automatiquement objet et message si encore vides
   */
  function handleSelectTemplate(template: EmailTemplate) {
    setData((prev) => ({
      ...prev,
      selectedTemplateId: template.id,
      emailSubject:
        prev.emailSubject.trim() ||
        applyTemplateVariables(template.subjectSuggestion, prev.medicalEntity),
      emailBody:
        prev.emailBody.trim() ||
        applyTemplateVariables(template.bodySuggestion, prev.medicalEntity),
    }));
  }

  /**
   * Ajoute ou retire un destinataire
   */
  function toggleRecipient(recipient: Recipient) {
    setData((prev) => {
      const exists = prev.recipients.some((r) => r.id === recipient.id);

      if (exists) {
        return {
          ...prev,
          recipients: prev.recipients.filter((r) => r.id !== recipient.id),
        };
      }

      return {
        ...prev,
        recipients: [...prev.recipients, recipient],
      };
    });
  }

  /**
   * Affichage du contenu de l'étape courante
   */
  function renderStepContent() {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Nom de l'entité médicale
              </label>
              <input
                type="text"
                value={data.medicalEntity.name}
                onChange={(e) => updateMedicalEntity("name", e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Ex: Clinique El Amal"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Type d'entité
              </label>
              <input
                type="text"
                value={data.medicalEntity.type}
                onChange={(e) => updateMedicalEntity("type", e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Ex: Clinique, Hôpital, Cabinet"
              />
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Spécialité
              </label>
              <input
                type="text"
                value={data.medicalEntity.speciality}
                onChange={(e) =>
                  updateMedicalEntity("speciality", e.target.value)
                }
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Ex: Cardiologie"
              />
              {errors.speciality && (
                <p className="mt-1 text-sm text-red-600">{errors.speciality}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Ville</label>
              <input
                type="text"
                value={data.medicalEntity.city}
                onChange={(e) => updateMedicalEntity("city", e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Ex: Alger"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Adresse</label>
              <input
                type="text"
                value={data.medicalEntity.address}
                onChange={(e) => updateMedicalEntity("address", e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Ex: 12 Rue Didouche Mourad"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Téléphone
              </label>
              <input
                type="text"
                value={data.medicalEntity.phone}
                onChange={(e) => updateMedicalEntity("phone", e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Ex: 0550 00 00 00"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Email de l'entité
              </label>
              <input
                type="email"
                value={data.medicalEntity.email}
                onChange={(e) => updateMedicalEntity("email", e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Ex: contact@clinique.dz"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Contact principal
              </label>
              <input
                type="text"
                value={data.medicalEntity.contactPerson}
                onChange={(e) =>
                  updateMedicalEntity("contactPerson", e.target.value)
                }
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Ex: Dr. Mourad Salah"
              />
              {errors.contactPerson && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contactPerson}
                </p>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <p className="mb-4 text-sm text-gray-600">
              Choisissez un template d'email pour pré-remplir l'objet et le
              message.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {templates.map((template) => {
                const isSelected = data.selectedTemplateId === template.id;

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelectTemplate(template)}
                    className={`rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <h3 className="text-base font-semibold">{template.name}</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {template.description}
                    </p>
                    <p className="mt-3 text-xs text-gray-500">
                      Objet suggéré : {template.subjectSuggestion}
                    </p>
                  </button>
                );
              })}
            </div>

            {errors.selectedTemplateId && (
              <p className="mt-3 text-sm text-red-600">
                {errors.selectedTemplateId}
              </p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Variables disponibles dans le template :
              <span className="ml-2 font-medium">
                {"{{entityName}}"}, {"{{contactPerson}}"}, {"{{city}}"}
              </span>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Objet de l'email
              </label>
              <input
                type="text"
                value={data.emailSubject}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, emailSubject: e.target.value }))
                }
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Saisir l'objet"
              />
              {errors.emailSubject && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.emailSubject}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Message personnalisé
              </label>
              <textarea
                value={data.emailBody}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, emailBody: e.target.value }))
                }
                className="min-h-55 w-full rounded-lg border px-3 py-2"
                placeholder="Saisir le message"
              />
              {errors.emailBody && (
                <p className="mt-1 text-sm text-red-600">{errors.emailBody}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Signature
              </label>
              <textarea
                value={data.emailSignature}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    emailSignature: e.target.value,
                  }))
                }
                className="min-h-30 w-full rounded-lg border px-3 py-2"
                placeholder={
                  "Ex:\nMohamed Yacine\nAgent commercial\nMon Entreprise"
                }
              />
              {errors.emailSignature && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.emailSignature}
                </p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="mb-3 text-sm text-gray-600">
                Ajouter une pièce jointe au format PDF
              </p>

              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setData((prev) => ({ ...prev, attachment: file }));
                }}
                className="mx-auto block"
              />

              <p className="mt-2 text-xs text-gray-500">
                Taille maximale recommandée : 10 MB
              </p>
            </div>

            {data.attachment && (
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm">
                  <span className="font-medium">Fichier sélectionné :</span>{" "}
                  {data.attachment.name}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Taille : {(data.attachment.size / 1024 / 1024).toFixed(2)} MB
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setData((prev) => ({ ...prev, attachment: null }))
                  }
                  className="mt-3 rounded-lg border px-3 py-1 text-sm hover:bg-gray-100"
                >
                  Supprimer le fichier
                </button>
              </div>
            )}

            {errors.attachment && (
              <p className="text-sm text-red-600">{errors.attachment}</p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Rechercher un destinataire
              </label>
              <input
                type="text"
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Nom, email ou rôle"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredRecipients.map((recipient) => {
                const isSelected = data.recipients.some(
                  (r) => r.id === recipient.id,
                );

                return (
                  <label
                    key={recipient.id}
                    className={`flex cursor-pointer items-start justify-between rounded-lg border p-4 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-sm text-gray-600">{recipient.email}</p>
                      {recipient.role && (
                        <p className="text-xs text-gray-500">
                          {recipient.role}
                        </p>
                      )}
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRecipient(recipient)}
                      className="mt-1 h-4 w-4"
                    />
                  </label>
                );
              })}
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium">
                Destinataires sélectionnés : {data.recipients.length}
              </p>
              {data.recipients.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                  {data.recipients.map((recipient) => (
                    <li key={recipient.id}>
                      {recipient.name} - {recipient.email}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {errors.recipients && (
              <p className="text-sm text-red-600">{errors.recipients}</p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <section className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">1. Entité médicale</h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Modifier
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                <p>
                  <span className="font-medium">Nom :</span>{" "}
                  {data.medicalEntity.name}
                </p>
                <p>
                  <span className="font-medium">Type :</span>{" "}
                  {data.medicalEntity.type}
                </p>
                <p>
                  <span className="font-medium">Spécialité :</span>{" "}
                  {data.medicalEntity.speciality}
                </p>
                <p>
                  <span className="font-medium">Ville :</span>{" "}
                  {data.medicalEntity.city}
                </p>
                <p>
                  <span className="font-medium">Adresse :</span>{" "}
                  {data.medicalEntity.address || "-"}
                </p>
                <p>
                  <span className="font-medium">Téléphone :</span>{" "}
                  {data.medicalEntity.phone || "-"}
                </p>
                <p>
                  <span className="font-medium">Email :</span>{" "}
                  {data.medicalEntity.email}
                </p>
                <p>
                  <span className="font-medium">Contact principal :</span>{" "}
                  {data.medicalEntity.contactPerson}
                </p>
              </div>
            </section>

            <section className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">2. Template</h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Modifier
                </button>
              </div>

              <p className="text-sm">
                {selectedTemplate?.name || "Aucun template sélectionné"}
              </p>
            </section>

            <section className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">3. Contenu email</h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Modifier
                </button>
              </div>

              <p className="mb-2 text-sm">
                <span className="font-medium">Objet :</span> {data.emailSubject}
              </p>

              <div className="mb-2 rounded-lg bg-gray-50 p-3 text-sm whitespace-pre-wrap">
                {data.emailBody}
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-sm whitespace-pre-wrap">
                {data.emailSignature}
              </div>
            </section>

            <section className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">4. Pièce jointe</h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Modifier
                </button>
              </div>

              <p className="text-sm">
                {data.attachment
                  ? data.attachment.name
                  : "Aucune pièce jointe sélectionnée"}
              </p>
            </section>

            <section className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">5. Destinataires</h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Modifier
                </button>
              </div>

              <ul className="list-disc pl-5 text-sm">
                {data.recipients.map((recipient) => (
                  <li key={recipient.id}>
                    {recipient.name} - {recipient.email}
                  </li>
                ))}
              </ul>
            </section>

            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
              Vérification terminée. La confirmation finale n'enverra pas
              d'email. Elle simulera seulement une validation.
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Création d'un email commercial</h1>
          <p className="mt-1 text-sm text-gray-600">
            Assistant multi-étapes pour préparer un email à destination d'une
            entité médicale, sans envoi réel.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-6">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isDone = index < currentStep;

            return (
              <div
                key={step}
                className={`rounded-xl border p-3 text-center text-sm ${
                  isActive
                    ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
                    : isDone
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                <div className="mb-1 text-xs">Étape {index + 1}</div>
                <div>{step}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-gray-200 p-5">
          {renderStepContent()}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Précédent
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Enregistrer brouillon
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Suivant
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmWithoutSending}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Confirmer sans envoyer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
