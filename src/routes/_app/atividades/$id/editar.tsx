import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AtividadeForm } from "@/components/atividades/AtividadeForm";

export const Route = createFileRoute("/_app/atividades/$id/editar")({
  component: EditarAtividade,
});

function EditarAtividade() {
  const { id } = Route.useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("atividades").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setData(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-8 text-muted-foreground">Carregando...</div>;
  if (!data) return <div className="p-8 text-muted-foreground">Atividade não encontrada.</div>;

  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2">
        Início › <Link to="/atividades" className="hover:underline">Atividades</Link> ›{" "}
        <Link to="/atividades/$id" params={{ id }} className="hover:underline">{data.titulo}</Link> › Editar
      </nav>
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Editar atividade</h1>
      <AtividadeForm id={id} initial={data} />
    </>
  );
}
