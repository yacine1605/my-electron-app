import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { z } from "zod";
import { apiClient } from "./hooks/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

const distributorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  registrationNumber: z.string().optional(),
  businessType: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  contactPerson: z.string().optional(),
  paymentTerms: z.string().optional(),
  creditLimit: z.string().optional(),
  notes: z.string().optional(),
});

type DistributorFormData = z.infer<typeof distributorSchema>;

interface AddDistributorDialogProps {
  name?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ── API call ──────────────────────────────────────────────────────────────────

async function createDistributor(data: DistributorFormData) {
  return apiClient.post("distributors", { json: data }).json();
}

// ── Component ─────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    label: "Basic Info",
    fields: ["name", "contactPerson", "businessType", "registrationNumber"],
  },
  {
    label: "Contact",
    fields: ["email", "phone", "website"],
  },
  {
    label: "Location",
    fields: ["address", "city", "postalCode", "country"],
  },
  {
    label: "Commercial",
    fields: ["paymentTerms", "creditLimit", "notes"],
  },
  {
    label: "Access",
    fields: ["password"],
  },
];

const FIELD_META: Record<
  string,
  {
    label: string;
    placeholder?: string;
    type?: string;
    required?: boolean;
    textarea?: boolean;
  }
> = {
  name: {
    label: "Company Name",
    placeholder: "SARL MedTech Algérie",
    required: true,
  },
  contactPerson: { label: "Contact Person", placeholder: "Ahmed Benali" },
  businessType: {
    label: "Business Type",
    placeholder: "Wholesale Distributor",
  },
  registrationNumber: {
    label: "Registration Number",
    placeholder: "16B1234567",
  },
  email: { label: "Email", placeholder: "contact@example.dz", type: "email" },
  phone: { label: "Phone", placeholder: "+213 21 ..." },
  website: { label: "Website", placeholder: "https://example.dz" },
  address: { label: "Address", placeholder: "12 Rue Didouche Mourad" },
  city: { label: "City", placeholder: "Alger" },
  postalCode: { label: "Postal Code", placeholder: "16000" },
  country: { label: "Country", placeholder: "Algeria" },
  paymentTerms: { label: "Payment Terms", placeholder: "30 days net" },
  creditLimit: {
    label: "Credit Limit (DZD)",
    placeholder: "500000",
    type: "number",
  },
  notes: { label: "Notes", placeholder: "Internal notes...", textarea: true },
  password: {
    label: "Portal Password",
    placeholder: "••••••••",
    type: "password",
    required: true,
  },
};

export const AddDistributorDialog = ({
  name,
  open,
  onOpenChange,
  onSuccess,
}: AddDistributorDialogProps) => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState<Partial<DistributorFormData>>({
    name: name ?? "",
    country: "Algeria",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: createDistributor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributors"] });
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({ name: name ?? "", country: "Algeria" });
    setErrors({});
    setActiveSection(0);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = () => {
    const result = distributorSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[String(e.path[0])] = e.message;
      });
      setErrors(fieldErrors);
      // Jump to first section with an error
      for (let i = 0; i < SECTIONS.length; i++) {
        if (SECTIONS[i].fields.some((f) => fieldErrors[f])) {
          setActiveSection(i);
          break;
        }
      }
      return;
    }
    mutation.mutate(result.data);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col"
          style={{ maxHeight: "90vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Add Distributor
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Fill in the distributor's details below
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-1 px-6 pt-4 pb-1 overflow-x-auto">
            {SECTIONS.map((s, i) => {
              const hasError = s.fields.some((f) => errors[f]);
              return (
                <button
                  key={s.label}
                  onClick={() => setActiveSection(i)}
                  className={`
                    flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${
                      activeSection === i
                        ? "bg-blue-600 text-white shadow-sm"
                        : hasError
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  {hasError && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 mb-0.5" />
                  )}
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Form Fields */}
          <div className="px-6 py-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4">
              {SECTIONS[activeSection].fields.map((field) => {
                const meta = FIELD_META[field];
                const value = (formData as any)[field] ?? "";
                const error = errors[field];

                return (
                  <div
                    key={field}
                    className={meta.textarea ? "col-span-2" : "col-span-1"}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {meta.label}
                      {meta.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>

                    {meta.textarea ? (
                      <textarea
                        value={value}
                        onChange={(e) => handleChange(field, e.target.value)}
                        placeholder={meta.placeholder}
                        rows={3}
                        className={`
                          w-full px-3 py-2 rounded-lg border text-sm resize-none
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                          transition-colors placeholder:text-gray-400
                          ${error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}
                        `}
                      />
                    ) : (
                      <div className="relative">
                        <input
                          type={
                            field === "password" && showPassword
                              ? "text"
                              : (meta.type ?? "text")
                          }
                          value={value}
                          onChange={(e) => handleChange(field, e.target.value)}
                          placeholder={meta.placeholder}
                          className={`
                            w-full px-3 py-2 rounded-lg border text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                            transition-colors placeholder:text-gray-400
                            ${error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}
                            ${field === "password" ? "pr-10" : ""}
                          `}
                        />
                        {field === "password" && (
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {error && (
                      <p className="mt-1 text-xs text-red-500">{error}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex gap-2">
              {activeSection > 0 && (
                <button
                  onClick={() => setActiveSection((i) => i - 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {mutation.isError && (
                <p className="text-sm text-red-500">
                  {(mutation.error as any)?.message ?? "Something went wrong"}
                </p>
              )}

              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>

              {activeSection < SECTIONS.length - 1 ? (
                <button
                  onClick={() => setActiveSection((i) => i + 1)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={mutation.isPending}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-2"
                >
                  {mutation.isPending && (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
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
                  )}
                  {mutation.isPending ? "Creating..." : "Create Distributor"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
