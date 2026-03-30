import type { DashboardSnapshot, ExpectedField, Language, UploadResponse } from "@ecovision/shared";
import { EXPECTED_FIELDS } from "@ecovision/shared";
import { CheckCircle2, Database, FileSpreadsheet, FlaskConical, UploadCloud, X } from "lucide-react";
import { useMemo, useState } from "react";

import { fetchMongoCollections, ingestMongoDataset, uploadDataset } from "@/lib/api";
import { cn } from "@/lib/utils";

type ConnectTab = "demo" | "upload" | "mongo";

interface ConnectDataModalProps {
  open: boolean;
  onClose: () => void;
  onUseDemo: () => void;
  onUseSnapshot: (snapshot: DashboardSnapshot) => void;
}

const importantMappingFields: ExpectedField[] = EXPECTED_FIELDS;

const MappingEditor = ({
  fields,
  mapping,
  onChange
}: {
  fields: string[];
  mapping: Partial<Record<ExpectedField, string>>;
  onChange: (field: ExpectedField, value: string) => void;
}) => (
  <div className="grid gap-3 md:grid-cols-2">
    {importantMappingFields.map((field) => (
      <label key={field} className="space-y-1">
        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{field.replace(/_/g, " ")}</span>
        <select
          value={mapping[field] ?? ""}
          onChange={(event) => onChange(field, event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">Unmapped</option>
          {fields.map((candidate) => (
            <option key={candidate} value={candidate}>
              {candidate}
            </option>
          ))}
        </select>
      </label>
    ))}
  </div>
);

const PreviewTable = ({ result }: { result: UploadResponse }) => {
  const columns = Object.keys(result.previewRows[0] ?? {});

  if (!columns.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
        No preview rows were available. The dashboard can still load the normalized dataset.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8">
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-white/8 text-sm">
          <thead className="bg-white/5">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-3 py-2 text-left font-medium text-slate-300">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {result.previewRows.map((row, index) => (
              <tr key={index} className="bg-slate-950/50">
                {columns.map((column) => (
                  <td key={column} className="px-3 py-2 align-top text-slate-400">
                    {String(row[column] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ConnectDataModal = ({ open, onClose, onUseDemo, onUseSnapshot }: ConnectDataModalProps) => {
  const [activeTab, setActiveTab] = useState<ConnectTab>("demo");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [uploadMapping, setUploadMapping] = useState<Partial<Record<ExpectedField, string>>>({});
  const [isUploading, setUploading] = useState(false);
  const [mongoUri, setMongoUri] = useState("");
  const [mongoDatabase, setMongoDatabase] = useState("");
  const [mongoCollection, setMongoCollection] = useState("");
  const [collections, setCollections] = useState<string[]>([]);
  const [mongoResult, setMongoResult] = useState<UploadResponse | null>(null);
  const [mongoMapping, setMongoMapping] = useState<Partial<Record<ExpectedField, string>>>({});
  const [isMongoLoading, setMongoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeResult = useMemo(() => (activeTab === "upload" ? uploadResult : mongoResult), [activeTab, mongoResult, uploadResult]);

  if (!open) {
    return null;
  }

  const handleFileUpload = async (file: File, mapping?: Partial<Record<ExpectedField, string>>) => {
    setUploading(true);
    setErrorMessage("");

    try {
      const result = await uploadDataset(file, mapping as Record<string, string> | undefined);
      setSelectedFile(file);
      setUploadResult(result);
      setUploadMapping(result.inferredMapping);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleLoadCollections = async () => {
    setMongoLoading(true);
    setErrorMessage("");

    try {
      const result = await fetchMongoCollections({
        uri: mongoUri,
        database: mongoDatabase
      });
      setCollections(result.collections);
      if (result.collections.length) {
        setMongoCollection(result.collections[0]);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load collections.");
    } finally {
      setMongoLoading(false);
    }
  };

  const handlePreviewMongo = async (mapping?: Partial<Record<ExpectedField, string>>) => {
    setMongoLoading(true);
    setErrorMessage("");

    try {
      const result = await ingestMongoDataset({
        uri: mongoUri,
        database: mongoDatabase,
        collection: mongoCollection,
        fieldMapping: mapping as Record<string, string> | undefined
      });
      setMongoResult(result);
      setMongoMapping(result.inferredMapping);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to ingest MongoDB data.");
    } finally {
      setMongoLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-md">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#081120] shadow-[0_24px_90px_rgba(2,6,23,0.72)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-6 py-5">
          <div>
            <p className="font-display text-2xl text-white">Connect Climate Data</p>
            <p className="mt-1 text-sm text-slate-400">
              Upload structured files, preview MongoDB collections, or switch back to the resilient demo dataset.
            </p>
          </div>
          <button
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:text-white"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-r border-white/8 bg-slate-950/40 p-5">
            <div className="space-y-3">
              {[
                { id: "demo" as const, label: "Demo Mode", icon: FlaskConical, description: "Auto-load premium mock UAE climate intelligence." },
                { id: "upload" as const, label: "Upload Files", icon: UploadCloud, description: "Import CSV, JSON, or Excel and preview mappings." },
                { id: "mongo" as const, label: "MongoDB", icon: Database, description: "Use a session URI to inspect collections and ingest live data." }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={cn(
                      "w-full rounded-[24px] border p-4 text-left transition",
                      activeTab === tab.id
                        ? "border-cyan-400/30 bg-cyan-400/10 text-white"
                        : "border-white/8 bg-white/5 text-slate-300 hover:border-white/15"
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <p className="font-semibold">{tab.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{tab.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="max-h-[78vh] overflow-y-auto p-6">
            {errorMessage ? (
              <div className="mb-5 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </div>
            ) : null}

            {activeTab === "demo" ? (
              <div className="space-y-5">
                <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
                  <p className="font-display text-xl text-white">Competition-safe demo environment</p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                    The demo dataset now includes all seven Emirates with archive history, SPI, NDVI, land surface temperature, soil moisture, MSTT forecast values, assistant samples, and bilingual audio briefing text. Use it whenever live ingestion is unavailable.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Seven Emirates", "SPI trend", "NDVI trend", "LST trend", "Soil moisture", "MSTT metadata", "Arabic/English briefings"].map((item) => (
                      <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        {item}
                      </span>
                    ))}
                  </div>
                  <button
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950"
                    onClick={onUseDemo}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Use Demo Dataset
                  </button>
                </div>
              </div>
            ) : null}

            {activeTab === "upload" ? (
              <div className="space-y-5">
                <div className="rounded-[26px] border border-dashed border-white/12 bg-white/5 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-display text-xl text-white">Upload structured files</p>
                      <p className="mt-2 text-sm text-slate-300">
                        Accepted formats: CSV, JSON, XLSX, XLS. The backend will infer fields, normalize rows, and prepare a dashboard snapshot.
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100">
                      <FileSpreadsheet className="h-4 w-4" />
                      Select File
                      <input
                        type="file"
                        accept=".csv,.json,.xlsx,.xls"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handleFileUpload(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {selectedFile ? <p className="mt-3 text-xs text-slate-500">Selected: {selectedFile.name}</p> : null}
                  {isUploading ? <p className="mt-3 text-sm text-cyan-200">Processing upload and inferring schema...</p> : null}
                </div>

                {uploadResult ? (
                  <div className="space-y-5">
                    <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <p className="font-display text-xl text-white">Upload preview ready</p>
                          <p className="mt-1 text-sm text-slate-300">
                            {uploadResult.snapshot.profile.recordCount} rows across {uploadResult.snapshot.profile.cityCount} cities. Completeness score {Math.round(uploadResult.snapshot.profile.completenessScore * 100)}%.
                          </p>
                        </div>
                        <button
                          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"
                          onClick={() => onUseSnapshot(uploadResult.snapshot)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Use Imported Dataset
                        </button>
                      </div>
                      {uploadResult.warnings.length ? (
                        <div className="mt-4 space-y-2">
                          {uploadResult.warnings.map((warning) => (
                            <div key={warning.code} className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                              {warning.message}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-display text-lg text-white">Field Mapping</p>
                          <p className="mt-1 text-sm text-slate-400">
                            Adjust mappings if your source schema differs from the expected dashboard fields.
                          </p>
                        </div>
                        <button
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100"
                          onClick={() => selectedFile && void handleFileUpload(selectedFile, uploadMapping)}
                        >
                          Apply Mapping
                        </button>
                      </div>
                      <div className="mt-4">
                        <MappingEditor
                          fields={uploadResult.availableFields}
                          mapping={uploadMapping}
                          onChange={(field, value) => setUploadMapping((current) => ({ ...current, [field]: value }))}
                        />
                      </div>
                    </div>

                    <PreviewTable result={uploadResult} />
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "mongo" ? (
              <div className="space-y-5">
                <div className="grid gap-4 rounded-[26px] border border-white/8 bg-white/5 p-5 md:grid-cols-2">
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">MongoDB URI</span>
                    <input
                      value={mongoUri}
                      onChange={(event) => setMongoUri(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      placeholder="mongodb+srv://..."
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Database</span>
                    <input
                      value={mongoDatabase}
                      onChange={(event) => setMongoDatabase(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      placeholder="ecovision"
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      className="w-full rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100"
                      onClick={() => void handleLoadCollections()}
                      disabled={isMongoLoading}
                    >
                      {isMongoLoading ? "Loading..." : "Load Collections"}
                    </button>
                  </div>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Collection</span>
                    <select
                      value={mongoCollection}
                      onChange={(event) => setMongoCollection(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="">Select collection</option>
                      {collections.map((collection) => (
                        <option key={collection} value={collection}>
                          {collection}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 md:col-span-2"
                    onClick={() => void handlePreviewMongo()}
                    disabled={!mongoUri || !mongoDatabase || !mongoCollection || isMongoLoading}
                  >
                    {isMongoLoading ? "Ingesting..." : "Preview Mongo Dataset"}
                  </button>
                </div>

                {mongoResult ? (
                  <div className="space-y-5">
                    <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <p className="font-display text-xl text-white">Mongo preview ready</p>
                          <p className="mt-1 text-sm text-slate-300">
                            {mongoResult.snapshot.profile.recordCount} normalized records from {mongoCollection}. Preview before switching the live dashboard.
                          </p>
                        </div>
                        <button
                          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"
                          onClick={() => onUseSnapshot(mongoResult.snapshot)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Use Mongo Dataset
                        </button>
                      </div>
                    </div>

                    <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-display text-lg text-white">Field Mapping</p>
                          <p className="mt-1 text-sm text-slate-400">
                            Mongo documents often flatten differently. Remap fields if the preview needs improvement.
                          </p>
                        </div>
                        <button
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100"
                          onClick={() => void handlePreviewMongo(mongoMapping)}
                        >
                          Re-ingest With Mapping
                        </button>
                      </div>
                      <div className="mt-4">
                        <MappingEditor
                          fields={mongoResult.availableFields}
                          mapping={mongoMapping}
                          onChange={(field, value) => setMongoMapping((current) => ({ ...current, [field]: value }))}
                        />
                      </div>
                    </div>

                    <PreviewTable result={mongoResult} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
