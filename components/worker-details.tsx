"use client"

import Image from "next/image"
import { Building, FileText, IdCard, MapPin, Phone, ShieldCheck, Shirt, User } from "lucide-react"
import { Label } from "@/components/ui/label"
import { getWorkerSections, type SectionKey, type WorkerRecord } from "@/lib/worker-fields"

const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
  personal: <User className="w-4 h-4" />,
  emergency: <Phone className="w-4 h-4" />,
  work: <Building className="w-4 h-4" />,
  government: <IdCard className="w-4 h-4" />,
  address: <MapPin className="w-4 h-4" />,
  banking: <Building className="w-4 h-4" />,
  additional: <Shirt className="w-4 h-4" />,
  status: <ShieldCheck className="w-4 h-4" />,
}

// Long free-text sections read better one field per row.
const SINGLE_COLUMN_SECTIONS: SectionKey[] = ["address"]

export function WorkerDetails({ worker }: { worker: WorkerRecord }) {
  const sections = getWorkerSections(worker)
  const documents = [
    { label: "Passport Photo", url: worker.passport_photo_url, aspect: "aspect-3/4" },
    { label: "Aadhaar Document", url: worker.aadhaar_photo_url, aspect: "aspect-3/2" },
    { label: "PAN Document", url: worker.pan_photo_url, aspect: "aspect-3/2" },
  ].filter((doc) => doc.url)

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.key} className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {SECTION_ICONS[section.key]}
            {section.title}
          </h3>
          <div
            className={
              SINGLE_COLUMN_SECTIONS.includes(section.key)
                ? "grid grid-cols-1 gap-4"
                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            }
          >
            {section.fields.map((field) => (
              <div key={field.label}>
                <Label className="text-muted-foreground">{field.label}</Label>
                <p
                  className={
                    field.empty
                      ? "text-sm italic text-muted-foreground"
                      : `font-medium break-words ${field.mono ? "font-mono" : ""}`
                  }
                >
                  {field.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {documents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Document Photos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div key={doc.label} className="space-y-2">
                <Label className="text-muted-foreground">{doc.label}</Label>
                <div className={`relative ${doc.aspect} border rounded-lg overflow-hidden`}>
                  <Image src={doc.url!} alt={doc.label} fill className="object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
