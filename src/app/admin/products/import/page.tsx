'use client'

import { useMemo, useRef, useState } from "react"
import JSZip from "jszip"
import { FileSpreadsheet, FileText, Loader2, ShieldCheck, UploadCloud } from "lucide-react"
import { useAction, useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface ProductRecord {
  _id: Id<"products">
  sku: string
  name: string
  status: "draft" | "published" | "archived"
}

interface ImportResult {
  code: string
  name?: string
  status: "updated" | "skipped" | "error"
  reason?: string
}

const excludedDocumentPattern = /price list|integrity|corrections|verification|certification|internal|bundles?|suite/i

function normalizeCode(value: string): string | null {
  const match = value.toUpperCase().match(/TW[- ]?([A-Z]{3})[- ]?(\d{1,3}[A-Z]?)/)
  if (!match) return null
  const suffixMatch = match[2].match(/^(\d{1,2})([A-Z]?)$/)
  const suffix = suffixMatch ? `${suffixMatch[1].padStart(3, "0")}${suffixMatch[2]}` : match[2]
  return `TW-${match[1]}-${suffix}`
}

function contentType(file: File): string {
  if (file.name.toLowerCase().endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

async function extractDocxText(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const documentXml = await zip.file("word/document.xml")?.async("text")
  if (!documentXml) throw new Error("DOCX has no document body")
  const text = new DOMParser().parseFromString(documentXml, "application/xml").documentElement.textContent ?? ""
  return text.replace(/\s+/g, " ").trim()
}

function productFields(text: string, file: File) {
  const priceMatch = text.match(/\bUSD\s*([\d,]+(?:\.\d{1,2})?)\b/i)
  const versionMatch = text.match(/\bv(\d+(?:\.\d+)+)\b/i)
  const description = text.slice(0, 50000).trim()
  const firstSentence = description.split(/(?<=[.!?])\s+/)[0]?.slice(0, 240) || `Product documentation for ${file.name}`
  return {
    shortDescription: firstSentence,
    description,
    price: priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : undefined,
    version: versionMatch ? versionMatch[1] : undefined,
  }
}

export default function ProductImportPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const products = useQuery(api.products.list, { status: "draft", limit: 1000, offset: 0 })
  const upload = useAction(api.storage.uploadFile)
  const update = useMutation(api.products.update)
  const [files, setFiles] = useState<File[]>([])
  const [running, setRunning] = useState(false)
  const [processed, setProcessed] = useState(0)
  const [results, setResults] = useState<ImportResult[]>([])

  const productByCode = useMemo(() => {
    const map = new Map<string, ProductRecord>()
    for (const product of products?.items ?? []) {
      const code = normalizeCode(product.sku)
      if (code) map.set(code, product as ProductRecord)
    }
    return map
  }, [products])

  const selectedCodes = useMemo(() => {
    const codes = new Set<string>()
    for (const file of files) {
      const code = normalizeCode(file.name)
      if (code) codes.add(code)
    }
    return codes
  }, [files])

  const runImport = async () => {
    const excel = new Map<string, File>()
    const docs = new Map<string, File>()
    const duplicates = new Set<string>()
    for (const file of files) {
      const code = normalizeCode(file.name)
      if (!code) continue
      if (file.name.toLowerCase().endsWith(".docx")) {
        if (excludedDocumentPattern.test(file.name)) continue
        if (docs.has(code)) duplicates.add(code)
        else docs.set(code, file)
      } else if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
        if (excel.has(code)) duplicates.add(code)
        else excel.set(code, file)
      }
    }

    const pairs = [...excel.keys()].filter((code) => docs.has(code) && !duplicates.has(code))
    if (!pairs.length) {
      toast.error("No unambiguous Excel and DOCX pairs were found")
      return
    }

    setRunning(true)
    setProcessed(0)
    setResults([])
    const nextResults: ImportResult[] = []
    try {
      for (const code of pairs) {
        const product = productByCode.get(code)
        if (!product) {
          nextResults.push({ code, status: "skipped", reason: "No matching draft product" })
          setProcessed((value) => value + 1)
          continue
        }
        if (product.status !== "draft") {
          nextResults.push({ code, name: product.name, status: "skipped", reason: "Product is not a draft" })
          setProcessed((value) => value + 1)
          continue
        }
        try {
          const workbook = excel.get(code)!
          const documentation = docs.get(code)!
          const text = await extractDocxText(documentation)
          const fields = productFields(text, documentation)
          const workbookUpload = await upload({ name: workbook.name, content: await workbook.arrayBuffer(), contentType: contentType(workbook), folder: "Products" })
          const documentationUpload = await upload({ name: documentation.name, content: await documentation.arrayBuffer(), contentType: contentType(documentation), folder: "Product Documentation" })
          const updateFields: Parameters<typeof update>[0] = {
            id: product._id,
            downloadableFile: workbookUpload.url,
            downloadableFileStorageId: workbookUpload.storageId,
            documentationFile: documentationUpload.url,
            documentationFileStorageId: documentationUpload.storageId,
            fileSize: `${(workbook.size / (1024 * 1024)).toFixed(1)} MB`,
            fileType: workbook.name.toLowerCase().endsWith(".xls") ? "Excel Workbook (.xls)" : "Excel Workbook (.xlsx)",
            shortDescription: fields.shortDescription,
            description: fields.description,
            ...(fields.price !== undefined ? { price: fields.price } : {}),
            ...(fields.version ? { version: fields.version } : {}),
            status: "draft",
          }
          await update(updateFields)
          nextResults.push({ code, name: product.name, status: "updated" })
        } catch (error) {
          nextResults.push({ code, name: product.name, status: "error", reason: error instanceof Error ? error.message : String(error) })
        }
        setProcessed((value) => value + 1)
        setResults([...nextResults])
      }
      setResults(nextResults)
      toast.success(`${nextResults.filter((result) => result.status === "updated").length} draft products updated`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Product Import"
        description="Attach verified Excel workbooks and DOCX product pages to existing draft products."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Products", href: "/admin/products" }, { label: "Import" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Source files</CardTitle>
          <CardDescription>Select the Excel and DOCX files together. Matching is performed by product code, not filename wording.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <input ref={inputRef} type="file" multiple accept=".xlsx,.xls,.docx" className="hidden" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={running}>
            <UploadCloud className="mr-2 h-4 w-4" /> Select product files
          </Button>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><FileSpreadsheet className="h-4 w-4" /> {files.filter((file) => file.name.match(/\.xlsx?$/i)).length} Excel</span>
            <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> {files.filter((file) => file.name.endsWith(".docx")).length} DOCX</span>
            <Badge variant="outline">{selectedCodes.size} product codes</Badge>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Only existing draft products are eligible. The importer never publishes, archives, or creates products.</span>
          </div>
          {running && <Progress value={pairsProgress(processed, files)} />}
          <Button onClick={runImport} disabled={running || !files.length || !products}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {running ? `Updating ${processed}...` : "Update draft products"}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Import report</CardTitle><CardDescription>Each result is retained for review in this session.</CardDescription></CardHeader>
          <CardContent className="max-h-[32rem] space-y-2 overflow-auto">
            {results.map((result) => (
              <div key={result.code} className="flex items-center justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
                <span className="font-mono text-xs">{result.code}</span>
                <span className="min-w-0 flex-1 truncate">{result.name ?? result.reason}</span>
                <Badge variant={result.status === "updated" ? "default" : "outline"}>{result.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function pairsProgress(processed: number, selectedFiles: File[]) {
  const total = new Set(selectedFiles.map((file) => normalizeCode(file.name)).filter(Boolean)).size
  return total ? (processed / total) * 100 : 0
}
