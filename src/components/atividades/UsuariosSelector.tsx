import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile { id: string; nome: string; email?: string }

interface Props {
  label: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function UsuariosSelector({ label, selectedIds, onChange }: Props) {
  const [usuarios, setUsuarios] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("id,nome,email").eq("ativo", true).order("nome")
      .then(({ data }) => setUsuarios((data ?? []) as Profile[]));
  }, []);

  const selecionados = usuarios.filter((u) => selectedIds.includes(u.id));
  const filtrados = usuarios.filter((u) =>
    !busca || u.nome.toLowerCase().includes(busca.toLowerCase()) || (u.email ?? "").toLowerCase().includes(busca.toLowerCase())
  );

  function toggle(id: string) {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {selecionados.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Nenhum {label.toLowerCase()} vinculado.</span>
        )}
        {selecionados.map((u) => (
          <span key={u.id} className="inline-flex items-center gap-1 bg-muted text-xs px-2 py-1 rounded-full">
            {u.nome}
            <button type="button" onClick={() => toggle(u.id)} className="hover:text-destructive" aria-label="Remover">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto">
            <Users className="w-4 h-4 mr-1" /> Vincular {label.toLowerCase()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="p-2 border-b">
            <Input placeholder="Buscar por nome ou e-mail..." value={busca} onChange={(e) => setBusca(e.target.value)} className="h-8" />
          </div>
          <ul className="max-h-64 overflow-y-auto divide-y">
            {filtrados.length === 0 && (
              <li className="px-3 py-3 text-sm text-muted-foreground text-center">Nenhum usuário encontrado.</li>
            )}
            {filtrados.map((u) => {
              const sel = selectedIds.includes(u.id);
              return (
                <li key={u.id}>
                  <button type="button" onClick={() => toggle(u.id)}
                    className={cn("w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2", sel && "bg-primary/5")}>
                    <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", sel ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30")}>
                      {sel && <Check className="w-3 h-3" />}
                    </span>
                    <span className="flex-1 truncate">
                      <div className="font-medium truncate">{u.nome}</div>
                      {u.email && <div className="text-xs text-muted-foreground truncate">{u.email}</div>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
