import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toCapitalizedSentence(status: string): string {
  // Split the string by underscores, capitalize each word, and join with spaces
  return status
    .split(" ") // Split by underscore
    .map(
      (
        word // Map each word
      ) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() // Capitalize first letter and make the rest lowercase
    )
    .join(" "); // Join words with a space
}

