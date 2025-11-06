import { Dispatch, FC, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { format as formatDate, FormatOptions } from "date-fns"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type DateInputProps = {
  date?: Date
  setDate: Dispatch<SetStateAction<Date | undefined>>
  format?: string
  placeholder?: string
  formatOptions?: FormatOptions
}

const DateInput: FC<DateInputProps> = ({
  date,
  setDate,
  format = "PPP",
  placeholder = "Pick a date",
  formatOptions,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[280px] justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            formatDate(date, format, formatOptions)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export default DateInput

