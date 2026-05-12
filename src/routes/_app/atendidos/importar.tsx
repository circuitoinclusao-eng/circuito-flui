import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ImportarAtendidosDialog } from "@/components/atendidos/ImportarAtendidosDialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/_app/atendidos/importar")({
  component: ImportarAtendidosPage,
});

function ImportarAtendidosPage() {
  const nav = useNavigate();
  const [open, setOpen] = useState(true);

  function close() {
    setOpen(false);
    nav({ to: "/atendidos" });
  }

  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2">
        Início › <Link to="/atendidos" className="hover:underline">Atendidos</Link> › Importar
      </nav>
      <div className="bg-card border rounded-xl shadow-sm p-6">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">Importar planilha de atendidos</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Envie uma planilha XLS, XLSX ou CSV para cadastrar ou atualizar atendidos.
        </p>
        <Button onClick={() => setOpen(true)}>
          <Upload className="w-4 h-4 mr-1" /> Importar planilha
        </Button>
      </div>
      <ImportarAtendidosDialog open={open} onClose={close} onDone={() => nav({ to: "/atendidos" })} />
    </>
  );
}
