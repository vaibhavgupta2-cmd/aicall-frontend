import React, {
  useState,
  KeyboardEvent,
  ChangeEvent,
  SetStateAction,
  Dispatch,
} from "react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

interface TagInputProps {
  placeholder?: string
  values: string[]
  setValues: Dispatch<SetStateAction<string[]>>
}

const TagInput: React.FC<TagInputProps> = ({
  placeholder = "Type and press enter...",
  setValues,
  values,
}) => {
  const [input, setInput] = useState<string>("")

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && input.trim()) {
      setValues((prev) => {
        const res = input.trim()
        if (prev.includes(res)) {
          return prev
        }

        return [...prev, res]
      })
      setInput("")
      event.preventDefault() // Prevent form submission if wrapped in a form
    } else if (event.key === "Backspace" && !input && values.length > 0) {
      setValues(values.slice(0, -1))
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value)
  }

  const handleDelete = (index: number) => {
    setValues(values.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((tag, index) => (
        <div key={index} className="flex items-center bg-gray-100 rounded">
          <span className="mx-1 p-1">{tag}</span>
          <Button
            onClick={() => handleDelete(index)}
            className="text-sm p-2 h-6"
          >
            ×
          </Button>
        </div>
      ))}
      <Input
        className="min-w-16"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
    </div>
  )
}

export default TagInput

