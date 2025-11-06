import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputHTMLAttributes } from "react"

type InputFileProps = {
  placeholder?: string
} & InputHTMLAttributes<HTMLInputElement>

export function InputFile({ placeholder, ...props }: InputFileProps) {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="fileInput">{placeholder || "File"}</Label>
      <Input id="fileInput" type="file" {...props} />
    </div>
  )
}

export default InputFile

