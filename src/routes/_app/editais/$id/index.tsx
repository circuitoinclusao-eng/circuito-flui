import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/Cards";

export const Route = createFileRoute("/_app/editais/$id/")({
  component: View,
});

function View() {
  const { id } = Route.useParams();
  const [r, setR] = useState<any>(null);
  useEffect(() => {
    supabase.from("editais").select("*").eq("id", id).maybeSingle().then(({ data }) => setR(data));
  }, [id]);
  if (!r) return <div className="p-8 text-muted-foreground">Carregando...</div>;
  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2">Início › <Link to="/editais" className="hover:underline">Editais</Link> › {r.titulo}</nav>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-semibold">{r.titulo}</h1>
        <div className="flex gap-2">
          <StatusBadge status={r.status} />
          <Button asChild variant="outline" size="sm"><Link to="/editais/$id/editar" params={{ id }}>Editar</Link></Button>
        </div>
      </div>
      <div className="bg-card border rounded-xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Info label="Organização" v={r.organizacao} />
        <Info label="Link" v={r.link ? <a href={r.link} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">{r.link}</a> : "—"} />
        <Info label="Valor" v={r.valor ? `R$ ${Number(r.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"} />
        <Info label="Abertura" v={r.data_inicio ? new Date(r.data_inicio).toLocaleDateString("pt-BR") : "—"} />
        <Info label="Encerramento" v={r.data_fim ? new Date(r.data_fim).toLocaleDateString("pt-BR") : "—"} />
        <Info label="Requisitos" v={r.requisitos} full />
        <Info label="Documentos necessários" v={r.documentos_necessarios} full />
        <Info label="Observações" v={r.observacoes} full />
      </div>
    </>
  );
}

function Info({ label, v, full }: any) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="text-sm whitespace-pre-wrap">{v ?? "—"}</div>
    </div>
  );
}
