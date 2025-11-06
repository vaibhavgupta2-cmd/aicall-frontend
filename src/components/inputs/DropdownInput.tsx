import { DropdownKey } from "@/types"
import { Dispatch, FC, SetStateAction } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const DropdownInput: FC<{
  options: DropdownKey[]
  selected?: string
  placeholder?: string
  setSelected: (e?: string) => void
}> = ({ options, setSelected, selected, placeholder }) => {
  return (
    <Select value={selected} onValueChange={(e) => setSelected(e)}>
      <SelectTrigger className="min-w-40">
        <SelectValue placeholder={placeholder || selected} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option, i) => (
            <SelectItem key={i} value={option.key}>
              {option.value}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default DropdownInput

