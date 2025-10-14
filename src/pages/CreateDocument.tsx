import { useNavigate, useParams } from "react-router-dom";
import { InvoiceForm } from "@/components/InvoiceForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const CreateDocument = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type: "estimation" | "invoice" }>();

  const documentType = type === "invoice" ? "invoice" : "estimation";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <InvoiceForm type={documentType} />
      </main>
    </div>
  );
};

export default CreateDocument;
