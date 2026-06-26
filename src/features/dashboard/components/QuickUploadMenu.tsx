import React from "react"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export const QuickUploadMenu: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Button
      type="button"
      size="md"
      aria-label="Upload documents"
      onClick={() => navigate("/upload")}
      className="h-10 w-10 min-w-10 rounded-full p-0"
    >
      <Plus className="h-5 w-5" aria-hidden />
    </Button>
  )
}
