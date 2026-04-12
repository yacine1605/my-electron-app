import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Check,
  Edit3,
  FilePlus2,
  Files,
  Maximize2,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

// If you don't already have a cn utility:
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type CampaignStatus = "DRAFT" | "SENDING" | "SENT";

type Campaign = {
  id: string;
  name: string;
  org: string;
  status: CampaignStatus;
  eta?: string;
};

type Product = {
  id: string;
  title: string;
  qty: number;
  keys?: string;
  details?: string;
  conformity?: number;
};

const campaigns: Campaign[] = [
  {
    id: "cmp-108",
    name: "CAMP 108",
    org: "—",
    status: "DRAFT",
  },
  {
    id: "cmp-109",
    name: "CAMP 109",
    org: "CHU BAB EL OUED",
    status: "SENDING",
    eta: "Dans 11j 12h 10m",
  },
  {
    id: "cmp-112",
    name: "CAMP 112",
    org: "chu bab el oued",
    status: "SENDING",
  },
  {
    id: "cmp-114",
    name: "CAMP 114",
    org: "chu belhadj setif",
    status: "SENDING",
  },
  {
    id: "cmp-115",
    name: "CAMP 115",
    org: "uiui",
    status: "DRAFT",
  },
];

const requestedProducts: Product[] = [
  {
    id: "p-1",
    title: "MASQUE D’ANESTHESIE FACIAL…",
    qty: 10,
    keys: "Caractéristiques: 4",
    details: "Clés: Details",
  },
  {
    id: "p-2",
    title: "MASQUE D’ANESTHESIE FACI…",
    qty: 10,
    keys: "Caractéristiques: 4",
    details: "Clés: Details",
  },
  {
    id: "p-3",
    title: "MASQUE D’ANESTHESIE…",
    qty: 10,
    keys: "Caractéristiques: 4",
    details: "Clés: Details",
  },
];

const extractedExample: Product = {
  id: "e-1",
  title: "MASQUE D’ANESTHESIE FACIAL AVEC CONTOUR GONFLABLE TRANSPARENT N°3",
  qty: 10,
  details: "Fichier: Lot 02.pdf • Cliquer pour afficher le détail complet",
  conformity: 53,
};

export default function CampaignsPage() {
  const [searchCampaign, setSearchCampaign] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("extraction");
  const [analysisType, setAnalysisType] = React.useState<string>("Mixte");
  const [structure, setStructure] = React.useState<string[]>(["Auto"]);
  const [threshold, setThreshold] = React.useState<number>(20);

  const filteredCampaigns = React.useMemo(() => {
    const q = searchCampaign.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.org.toLowerCase().includes(q),
    );
  }, [searchCampaign]);

  return (
    <div className="w-full h-dvh bg-background text-foreground">
      <div className="h-full grid grid-cols-[300px,1fr,360px] gap-4 p-4">
        {/* Left: Campaigns */}
        <aside className="rounded-xl border bg-card">
          <div className="p-3 pb-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-base font-semibold">Campaigns</div>
              <Button size="icon" variant="outline" className="h-7 w-7">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchCampaign}
                  onChange={(e) => setSearchCampaign(e.target.value)}
                  placeholder="Search campaigns"
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
          </div>
          <Separator />
          <ScrollArea className="h-[calc(100%-88px)] px-3 py-2">
            <div className="space-y-2 pr-2">
              {filteredCampaigns.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border bg-background p-3 hover:bg-accent/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-semibold">{c.name}</div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-1 text-[12px] text-muted-foreground truncate">
                    {c.org}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <SoftPill>Data depot non renseignée</SoftPill>
                    {c.eta && (
                      <SoftPill className="bg-emerald-50 text-emerald-700 border-emerald-100">
                        {c.eta}
                      </SoftPill>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Center: Workspace */}
        <main className="rounded-xl border bg-card p-3">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            <div className="flex items-center justify-between">
              <TabsList className="h-8">
                <TabsTrigger value="edition" className="h-8 text-sm">
                  Edition
                </TabsTrigger>
                <TabsTrigger value="extraction" className="h-8 text-sm">
                  Extraction
                </TabsTrigger>
                <TabsTrigger value="envoi" className="h-8 text-sm">
                  Envoi
                </TabsTrigger>
                <TabsTrigger value="pieces" className="h-8 text-sm">
                  Pieces jointes (1)
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Attacher PDF
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reanalyser les fichiers
                </Button>
              </div>
            </div>

            <Separator className="my-3" />

            <TabsContent value="extraction" className="flex-1">
              <div className="space-y-4">
                {/* Type d'analyse */}
                <section className="space-y-2">
                  <div className="text-sm font-medium">Type d'analyse</div>
                  <ToggleGroup
                    type="single"
                    value={analysisType}
                    onValueChange={(v) => v && setAnalysisType(v)}
                    className="flex flex-wrap gap-2"
                  >
                    {["Mixte", "Cahier des charges", "Offre simple"].map(
                      (t) => (
                        <ChipToggle
                          key={t}
                          value={t}
                          label={t}
                          checked={analysisType === t}
                        />
                      ),
                    )}
                  </ToggleGroup>
                </section>

                {/* Structure dominante */}
                <section className="space-y-2">
                  <div className="text-sm font-medium">Structure dominante</div>
                  <ToggleGroup
                    type="multiple"
                    value={structure}
                    onValueChange={(vals) => setStructure(vals)}
                    className="flex flex-wrap gap-2"
                  >
                    {["Auto", "Tableau/Liste", "Paragraphe", "Mixte"].map(
                      (s) => (
                        <ChipToggle
                          key={s}
                          value={s}
                          label={s}
                          checked={structure.includes(s)}
                        />
                      ),
                    )}
                  </ToggleGroup>
                  <div className="text-[12px] text-muted-foreground">
                    Mixte · Auto · Nombre global: libre
                  </div>
                </section>

                {/* Produits extraits et produits demandes */}
                <section className="space-y-2">
                  <div className="text-sm font-medium">
                    Produits extraits et produits demandes
                  </div>

                  <Card className="border-emerald-200/70">
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                          <Files className="h-4 w-4 text-emerald-600" />
                          Produits extraits depuis les PDFs joints
                          <span className="ml-1 text-emerald-700">9/9</span>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-8">
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter tout
                          </Button>
                          <Button variant="outline" size="sm" className="h-8">
                            <Maximize2 className="mr-2 h-4 w-4" />
                            Agrandir
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {/* slider and percentage row */}
                      <div className="flex items-center gap-3 py-2">
                        <div className="flex-1">
                          <Slider
                            value={[threshold]}
                            step={1}
                            min={0}
                            max={100}
                            onValueChange={(v) => setThreshold(v[0] ?? 0)}
                          />
                        </div>
                        <div className="text-sm font-medium w-16 text-right">
                          {threshold}%
                        </div>
                        <Button
                          variant="link"
                          className="h-8 px-2 text-muted-foreground"
                          onClick={() => setThreshold(20)}
                        >
                          Reset 20%
                        </Button>
                      </div>

                      {/* extracted item card */}
                      <div className="mt-2 rounded-xl border bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[14px] font-semibold leading-5">
                              {trunc(extractedExample.title, 90)}
                            </div>
                            <div className="mt-2 text-[12px] text-muted-foreground">
                              {extractedExample.details}
                            </div>
                          </div>
                          <Badge className="rounded-full bg-emerald-500 text-white px-3 py-1 text-[12px]">
                            Conformité {extractedExample.conformity}%
                          </Badge>
                        </div>

                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled
                            className="h-8 bg-muted text-muted-foreground"
                          >
                            Déja ajouté
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </div>
            </TabsContent>

            {/* Other tabs (placeholders) */}
            <TabsContent value="edition">
              <div className="text-sm text-muted-foreground">
                Edition content…
              </div>
            </TabsContent>
            <TabsContent value="envoi">
              <div className="text-sm text-muted-foreground">
                Envoi content…
              </div>
            </TabsContent>
            <TabsContent value="pieces">
              <div className="text-sm text-muted-foreground">
                Pieces jointes…
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right: Requested products */}
        <aside className="rounded-xl border bg-card p-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] font-semibold">
                Produits demandés dans la campagne
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </div>

          <Separator className="my-3" />

          <ScrollArea className="h-[calc(100%-52px)] pr-2">
            <div className="space-y-2">
              {requestedProducts.map((p) => (
                <div key={p.id} className="rounded-lg border bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium leading-4 line-clamp-2">
                        {p.title}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Qty: {p.qty}.0 | {p.keys}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.details}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Cliquer pour details
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <IconButton aria-label="edit">
                        <Edit3 className="h-4 w-4" />
                      </IconButton>
                      <IconButton aria-label="duplicate">
                        <FilePlus2 className="h-4 w-4" />
                      </IconButton>
                      <IconButton aria-label="delete">
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Small helpers/components ---------- */

function StatusBadge({ status }: { status: CampaignStatus }) {
  const map: Record<CampaignStatus, { label: string; className: string }> = {
    DRAFT: {
      label: "DRAFT",
      className: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    },
    SENDING: {
      label: "SENDING",
      className: "bg-amber-50 text-amber-700 border border-amber-100",
    },
    SENT: {
      label: "SENT",
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
  };
  const { label, className } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
        className,
      )}
    >
      {label}
    </span>
  );
}

function SoftPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border bg-muted/40 px-2 py-0.5 text-[11px]",
        className,
      )}
    >
      {children}
    </span>
  );
}

function ChipToggle({
  value,
  label,
  checked,
}: {
  value: string;
  label: string;
  checked?: boolean;
}) {
  return (
    <ToggleGroupItem
      value={value}
      aria-label={label}
      className={cn(
        "h-8 rounded-full px-3 text-[12px] font-medium",
        "data-[state=on]:bg-foreground data-[state=on]:text-background",
        "border bg-muted/30 hover:bg-muted/50",
      )}
    >
      <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/40 bg-white/30 data-[state=on]:bg-white/20">
        {checked ? <Check className="h-3 w-3" /> : null}
      </span>
      {label}
    </ToggleGroupItem>
  );
}

function IconButton({
  children,
  "aria-label": aria,
}: {
  children: React.ReactNode;
  "aria-label": string;
}) {
  return (
    <Button size="icon" variant="ghost" aria-label={aria} className="h-8 w-8">
      {children}
    </Button>
  );
}

function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
