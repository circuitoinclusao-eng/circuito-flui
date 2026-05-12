import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const roles = new Set(["administrador", "coordenador", "colaborador", "consulta"]);
const statuses = new Set(["ativo", "inativo"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ error: "Configuração da função incompleta." }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: requester, error: requesterError } = await userClient.auth.getUser();
    if (requesterError || !requester.user) {
      return json({ error: "Usuário não autenticado." }, 401);
    }

    const { data: requesterRoles, error: rolesError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requester.user.id);

    if (rolesError || !requesterRoles?.some((r) => r.role === "administrador")) {
      return json({ error: "Você não tem permissão para realizar esta ação." }, 403);
    }

    const body = await req.json();
    const nome = String(body.nome ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const telefone = String(body.telefone ?? "").trim();
    const perfil = String(body.perfil ?? "colaborador").trim();
    const status = String(body.status ?? "ativo").trim();
    const senhaTemporaria = String(body.senhaTemporaria ?? "");

    if (!nome || !email || !senhaTemporaria) {
      return json({ error: "Informe nome, e-mail e senha temporária." }, 400);
    }
    if (!roles.has(perfil)) {
      return json({ error: "Perfil inválido." }, 400);
    }
    if (!statuses.has(status)) {
      return json({ error: "Status inválido." }, 400);
    }
    if (senhaTemporaria.length < 6) {
      return json({ error: "A senha temporária deve ter pelo menos 6 caracteres." }, 400);
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: { nome, telefone },
    });

    if (createError || !created.user) {
      return json({ error: createError?.message ?? "Não foi possível criar o usuário." }, 400);
    }

    const userId = created.user.id;

    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: userId,
        nome,
        email,
        telefone: telefone || null,
        ativo: status === "ativo",
        status,
      }, { onConflict: "id" });

    if (profileError) {
      return json({ error: profileError.message }, 400);
    }

    await adminClient.from("user_roles").delete().eq("user_id", userId);
    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: userId, role: perfil });

    if (roleError) {
      return json({ error: roleError.message }, 400);
    }

    return json({ success: true, userId });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Não foi possível realizar esta ação. Tente novamente." }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
