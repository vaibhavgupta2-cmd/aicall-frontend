import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FC } from "react"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"

type DropdownOption = {
  key: string
  label: string
  checked: boolean
}

type DropdownMenuCheckboxesProps = {
  options: DropdownOption[]
  onChange: (key: string, checked: boolean) => void
  placeholder?: string
  containerClassName?: string
}

const DropdownMenuCheckboxes: FC<DropdownMenuCheckboxesProps> = ({
  options,
  onChange,
  placeholder,
  containerClassName,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start min-w-44 max-w-64 text-wrap h-max",
            containerClassName
          )}
        >
          {options.every((opt) => !opt.checked)
            ? placeholder
            : options
                .filter((opt) => opt.checked)
                .map((opt) => opt.label)
                .join(", ")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.key}
            checked={option.checked}
            onCheckedChange={(checked) => onChange(option.key, checked)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuCheckboxes

