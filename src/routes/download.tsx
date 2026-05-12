import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Monitor, Smartphone, Share } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export const Route = createFileRoute("/download")({
  component: DownloadPage,
});

function DownloadPage() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    setInstalled(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function instalar() {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    setEvt(null);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/inicio" className="text-sm text-primary hover:underline">Voltar ao sistema</Link>
        <header className="mt-6 mb-8">
          <h1 className="text-3xl font-semibold">Instalar app</h1>
          <p className="text-muted-foreground mt-2">
            Instale o Gestor Circuito Inclusao para abrir o sistema pelo celular ou computador.
          </p>
        </header>

        <div className="bg-card border rounded-xl shadow-sm p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">Gestor Circuito Inclusao</h2>
              <p className="text-sm text-muted-foreground">
                {installed ? "O app ja esta instalado neste dispositivo." : "Disponivel como PWA instalavel."}
              </p>
            </div>
            <Button onClick={instalar} disabled={!evt || installed}>
              Instalar app
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Instruction icon={Smartphone} title="Android">
            Toque em Instalar app quando o botao estiver disponivel. Se nao aparecer, abra o menu do navegador e escolha Instalar app ou Adicionar a tela inicial.
          </Instruction>
          <Instruction icon={Share} title="iPhone">
            No Safari, toque no botao de compartilhar e escolha Adicionar a Tela de Inicio. Confirme o nome do app e toque em Adicionar.
          </Instruction>
          <Instruction icon={Monitor} title="Computador">
            No Chrome, Edge ou navegador compativel, clique no icone de instalacao na barra de endereco ou use o menu do navegador.
          </Instruction>
        </div>
      </div>
    </main>
  );
}

function Instruction({ icon: Icon, title, children }: { icon: any; title: string; children: ReactNode }) {
  return (
    <section className="bg-card border rounded-xl p-4">
      <Icon className="w-5 h-5 text-primary mb-3" />
      <h2 className="font-semibold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground">{children}</p>
    </section>
  );
}
