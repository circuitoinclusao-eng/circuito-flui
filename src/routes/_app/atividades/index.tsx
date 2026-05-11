import { createFileRoute } from "@tanstack/react-router";
import { ResourceList } from "@/components/Resource";
import { atividadeFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/atividades/")({
  component: () => (
    <ResourceList table="atividades" basePath="/atividades"
      title="Atividades" breadcrumb={["Início", "Atividades"]}
      fields={atividadeFields}
      defaultOrder={{ col: "data", ascending: false }}
      listColumns={[
        { key: "titulo", label: "Atividade" },
        { key: "tipo", label: "Tipo" },
        { key: "data", label: "Data", render: (v) => v ? new Date(v).toLocaleDateString("pt-BR") : "—" },
        { key: "local", label: "Local" },
        { key: "participantes_atendidos", label: "Atendidos" },
        { key: "status", label: "Status" },
      ]}
    />
  ),
});
