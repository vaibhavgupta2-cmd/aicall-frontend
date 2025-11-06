import { cn } from "@/lib/utils";
import { CallStatus } from "@/types";
const CALL_STATUS_MAP = {
  ONGOING: {
    bg: "bg-blue-200",
    text: "text-blue-800",
  },
  RINGING: {
    bg: "bg-yellow-200",
    text: "text-yellow-800",
  },
  PENDING: {
    bg: "bg-gray-200",
    text: "text-gray-800",
  },
  COMPLETED: {
    bg: "bg-green-200",
    text: "text-green-800",
  },
  FAILED: {
    bg: "bg-red-200",
    text: "text-red-800",
  },
};
function CallStatusDisplay({ status }: { status: CallStatus }) {
  if (!CALL_STATUS_MAP[status]) return null;
  return (
    <p
      className={cn(
        "p-2 rounded-md w-min font-medium",
        CALL_STATUS_MAP[status].bg,
        CALL_STATUS_MAP[status].text
      )}
    >
      {status}
    </p>
  );
}

export default CallStatusDisplay;
