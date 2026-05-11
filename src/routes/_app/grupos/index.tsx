import { createFileRoute } from "@tanstack/react-router";
import { ResourceList } from "@/components/Resource";
import { grupoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/grupos/")({
  component: () => (
    <ResourceList table="grupos" basePath="/grupos"
      title="Grupos / Turmas" breadcrumb={["Início", "Grupos"]}
      fields={grupoFields}
      listColumns={[
        { key: "nome", label: "Grupo" },
        { key: "cidade", label: "Cidade" },
        { key: "local", label: "Local" },
        { key: "dia_horario", label: "Dia / horário" },
      ]}
    />
  ),
});
