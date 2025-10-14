import { useNavigate } from "react-router-dom";
import { DashboardCard } from "@/components/DashboardCard";
import { FileText, Receipt } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-primary">Invoice & Estimation Manager</h1>
          <p className="text-muted-foreground mt-2">
            Create professional estimations and invoices in seconds
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-8 text-center">
            What would you like to create?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardCard
              title="Create Estimation"
              description="Generate a professional estimation for your client with detailed line items and calculations"
              icon={<FileText className="h-10 w-10" />}
              onClick={() => navigate("/create/estimation")}
            />
            
            <DashboardCard
              title="Create Invoice"
              description="Create an invoice with automatic tax calculations and downloadable PDF format"
              icon={<Receipt className="h-10 w-10" />}
              onClick={() => navigate("/create/invoice")}
            />
          </div>

          <div className="mt-16 bg-card rounded-lg shadow-card p-8 border">
            <h3 className="text-xl font-semibold mb-4">Features</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span>Dynamic line items - add or remove items as needed</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span>Automatic calculations for subtotals, tax, and total amounts</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span>Download professional PDFs ready to send to clients</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span>Form validation to ensure all required information is complete</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span>Responsive design that works perfectly on all devices</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
