import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const responder = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const erro = (mensagem: string, status = 400) => responder({ erro: mensagem }, status);

function gerarSenha(tamanho = 10): string {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(tamanho));
  return Array.from(bytes, (b) => letras[b % letras.length]).join("");
}

function gerarToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function chaveSecreta(): string {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente.");
  return secret;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return erro("Método não permitido.", 405);

  let pedido: Record<string, any>;
  try {
    pedido = await req.json();
  } catch {
    return erro("Pedido inválido.");
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!jwt) return erro("Faça login novamente.", 401);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, chaveSecreta());

  const { data: userData, error: userError } = await db.auth.getUser(jwt);
  if (userError || !userData.user) return erro("Sessão inválida.", 401);

  const { data: quem, error: quemError } = await db
    .from("perfis")
    .select("id, papel, igreja_id, filial_id")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (quemError || !quem) return erro("Seu perfil não foi encontrado.", 403);

  const tipo = String(pedido.tipo ?? "");
  const nome = String(pedido.nome ?? "").trim();
  const email = String(pedido.email ?? "").trim().toLowerCase();
  const telefone = String(pedido.telefone ?? "").trim().slice(0, 25);

  async function criarUsuario(emailUsuario: string, senha: string) {
    const { data, error } = await db.auth.admin.createUser({
      email: emailUsuario,
      password: senha,
      email_confirm: true,
    });

    if (error) {
      const jaExiste = /already|registered|exists/i.test(error.message);
      throw new Error(jaExiste ? "Este e-mail já tem login." : error.message);
    }

    return data.user.id;
  }

  // ações sobre login existente
  if (["nova_senha", "alterar_ativo", "editar"].includes(tipo)) {
    const perfilId = pedido.perfil_id;
    if (!perfilId) return erro("Perfil não informado.", 400);

    const { data: alvo, error } = await db
      .from("perfis")
      .select("id, papel, igreja_id, filial_id, membro_id, nome, email")
      .eq("id", perfilId)
      .maybeSingle();

    if (error || !alvo) return erro("Login não encontrado.", 404);

    const pode =
      quem.papel === "admin" ||
      (quem.papel === "master" && alvo.igreja_id === quem.igreja_id && alvo.papel !== "master") ||
      (quem.papel === "filial" && alvo.papel === "membro" && alvo.filial_id === quem.filial_id);

    if (!pode) return erro("Você não tem permissão para isso.", 403);

    if (tipo === "nova_senha") {
      const senha = gerarSenha();
      const { error: updateErr } = await db.auth.admin.updateUserById(alvo.id, { password: senha });
      if (updateErr) return erro(updateErr.message);
      await db.from("perfis").update({ trocar_senha: true }).eq("id", alvo.id);
      return responder({ nome: alvo.nome, email: alvo.email, senha });
    }

    if (tipo === "alterar_ativo") {
      const ativo = pedido.ativo === true;
      await db.from("perfis").update({ ativo }).eq("id", alvo.id);
      await db.auth.admin.updateUserById(alvo.id, { ban_duration: ativo ? "none" : "876000h" });
      return responder({ ok: true });
    }

    const novoNome = String(pedido.nome ?? "").trim();
    const novoEmail = String(pedido.email ?? "").trim().toLowerCase();
    if (!novoNome || !novoEmail) return erro("Informe o nome e o e-mail.");

    if (novoEmail !== alvo.email) {
      const { error: emailErr } = await db.auth.admin.updateUserById(alvo.id, { email: novoEmail, email_confirm: true });
      if (emailErr) {
        const jaExiste = /already|registered|exists/i.test(emailErr.message);
        return erro(jaExiste ? "Este e-mail já tem login." : emailErr.message);
      }
    }

    const novoTel = pedido.telefone === undefined ? undefined : String(pedido.telefone ?? "").trim().slice(0, 25) || null;
    const atualizacao: Record<string, any> = { nome: novoNome, email: novoEmail };
    if (novoTel !== undefined) atualizacao.telefone = novoTel;

    await db.from("perfis").update(atualizacao).eq("id", alvo.id);

    if (alvo.membro_id) {
      const membroUpdate: Record<string, any> = { nome: novoNome, email: novoEmail };
      if (novoTel !== undefined) membroUpdate.telefone = novoTel;
      await db.from("membros").update(membroUpdate).eq("id", alvo.membro_id);
    }

    if (alvo.papel === "filial" && alvo.filial_id && novoTel !== undefined) {
      await db.from("filiais").update({ contato: novoTel }).eq("id", alvo.filial_id);
    }

    return responder({ ok: true });
  }

  if (tipo === "igreja_ativo") {
    if (quem.papel !== "admin") return erro("Só o administrador pode alterar a igreja.", 403);
    const igrejaId = pedido.igreja_id;
    const ativo = pedido.ativo === true;
    await db.from("igrejas").update({ ativo }).eq("id", igrejaId);
    const { data: logins } = await db.from("perfis").select("id, ativo").eq("igreja_id", igrejaId);
    for (const perfil of logins ?? []) {
      await db.auth.admin.updateUserById(perfil.id, { ban_duration: ativo && perfil.ativo ? "none" : "876000h" });
    }
    return responder({ ok: true });
  }

  if (tipo === "igreja_excluir") {
    if (quem.papel !== "admin") return erro("Só o administrador pode excluir igreja.", 403);
    const igrejaId = pedido.igreja_id;
    const confirmarNome = String(pedido.confirmar_nome ?? "").trim();

    const { data: igreja, error: igrejaErr } = await db.from("igrejas").select("id, nome").eq("id", igrejaId).maybeSingle();
    if (igrejaErr || !igreja) return erro("Igreja não encontrada.", 404);
    if (confirmarNome !== igreja.nome) return erro("O nome digitado não confere com a igreja.");

    const { data: logins } = await db.from("perfis").select("id, email").eq("igreja_id", igrejaId);
    const usuarios = (logins ?? []).map((l) => l.id);

    if (usuarios.includes(userData.user.id)) return erro("Não é possível excluir a própria igreja do usuário logado.", 403);

    const { data: eventos } = await db.from("eventos").select("id").eq("igreja_id", igrejaId);
    const idsEventos = (eventos ?? []).map((e) => e.id);
    const { data: grupos } = await db.from("grupos").select("id").eq("igreja_id", igrejaId);
    const idsGrupos = (grupos ?? []).map((g) => g.id);
    const { data: membros } = await db.from("membros").select("id").eq("igreja_id", igrejaId);
    const idsMembros = (membros ?? []).map((m) => m.id);

    if (idsEventos.length) await db.from("escalas").delete().in("evento_id", idsEventos);
    if (idsMembros.length) await db.from("membros_grupos").delete().in("membro_id", idsMembros);
    if (idsGrupos.length) await db.from("membros_grupos").delete().in("grupo_id", idsGrupos);
    if (idsGrupos.length) await db.from("grupos").delete().in("id", idsGrupos);
    if (idsEventos.length) await db.from("eventos").delete().in("id", idsEventos);
    await db.from("lancamentos").delete().eq("igreja_id", igrejaId);
    await db.from("convites").delete().eq("igreja_id", igrejaId);
    await db.from("membros").delete().eq("igreja_id", igrejaId);
    await db.from("filiais").delete().eq("igreja_id", igrejaId);

    for (const perfil of logins ?? []) {
      await db.from("perfis").delete().eq("id", perfil.id);
      await db.auth.admin.deleteUser(perfil.id);
    }

    await db.from("igrejas").delete().eq("id", igrejaId);
    return responder({ ok: true });
  }

  if (tipo === "convite") {
    if (quem.papel === "membro") return erro("Você não tem permissão para criar convites.", 403);

    const filialId = quem.papel === "filial" ? quem.filial_id : pedido.filial_id;
    if (!filialId) return erro("Selecione a filial.");

    const { data: filial, error: filialErr } = await db
      .from("filiais")
      .select("id, nome, is_sede, igreja_id")
      .eq("id", filialId)
      .maybeSingle();

    if (filialErr || !filial) return erro("Filial não encontrada.", 404);
    if (quem.papel === "master" && filial.igreja_id !== quem.igreja_id) return erro("Filial inválida.", 403);

    const { data: igreja, error: igrejaErr } = await db.from("igrejas").select("nome, ativo").eq("id", filial.igreja_id).maybeSingle();
    if (igrejaErr || !igreja || igreja.ativo === false) return erro("Esta igreja está desativada.", 403);

    if (pedido.novo !== true) {
      const { data: atual } = await db
        .from("convites")
        .select("token, expira_em")
        .eq("filial_id", filial.id)
        .eq("ativo", true)
        .gt("expira_em", new Date().toISOString())
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (atual) {
        return responder({ token: atual.token, expira_em: atual.expira_em, igreja: igreja.nome, filial: filial.nome, is_sede: filial.is_sede });
      }
    }

    await db.from("convites").update({ ativo: false }).eq("filial_id", filial.id).eq("ativo", true);

    const token = gerarToken();
    const expira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: inviteErr } = await db.from("convites").insert({
      token,
      igreja_id: filial.igreja_id,
      filial_id: filial.id,
      criado_por: userData.user.id,
      expira_em: expira,
      ativo: true,
      usado: false,
    });

    if (inviteErr) return erro(inviteErr.message);

    return responder({ token, expira_em: expira, igreja: igreja.nome, filial: filial.nome, is_sede: filial.is_sede });
  }

  if (tipo === "igreja") {
    if (quem.papel !== "admin") return erro("Só o administrador pode criar igrejas.", 403);
    const nomeIgreja = String(pedido.igreja_nome ?? "").trim();
    if (!nomeIgreja) return erro("Informe o nome da igreja.");

    const { data: igreja, error: igrejaErr } = await db.from("igrejas").insert({ nome: nomeIgreja }).select("id").single();
    if (igrejaErr) return erro(igrejaErr.message);

    const { data: sede, error: filialErr } = await db.from("filiais").insert({
      igreja_id: igreja.id,
      nome: "Sede",
      is_sede: true,
      responsavel: nome,
      contato: telefone || null,
    }).select("id").single();

    if (filialErr) return erro(filialErr.message);

    const senha = gerarSenha();
    const userId = await criarUsuario(email, senha);

    const { error: perfilErr } = await db.from("perfis").insert({
      id: userId,
      igreja_id: igreja.id,
      filial_id: sede.id,
      nome,
      email,
      papel: "master",
      telefone: telefone || null,
      ativo: true,
      trocar_senha: true,
    });

    if (perfilErr) {
      await db.auth.admin.deleteUser(userId);
      return erro(perfilErr.message);
    }

    return responder({ nome, email, senha });
  }

  if (tipo === "filial") {
    if (!['admin', 'master'].includes(quem.papel)) return erro("Você não tem permissão para criar filial.", 403);
    const igrejaId = quem.papel === 'admin' ? pedido.igreja_id : quem.igreja_id;
    const nomeFilial = String(pedido.filial_nome ?? "").trim();
    if (!igrejaId || !nomeFilial) return erro("Informe a igreja e a filial.");

    const { data: filial, error: filialErr } = await db.from("filiais").insert({
      igreja_id: igrejaId,
      nome: nomeFilial,
      responsavel: nome,
      contato: telefone || null,
    }).select("id").single();

    if (filialErr) return erro(filialErr.message);

    const senha = gerarSenha();
    const userId = await criarUsuario(email, senha);

    const { error: perfilErr } = await db.from("perfis").insert({
      id: userId,
      igreja_id: igrejaId,
      filial_id: filial.id,
      nome,
      email,
      papel: "filial",
      telefone: telefone || null,
      ativo: true,
      trocar_senha: true,
    });

    if (perfilErr) {
      await db.auth.admin.deleteUser(userId);
      return erro(perfilErr.message);
    }

    return responder({ nome, email, senha });
  }

  if (tipo === "membro") {
    if (quem.papel === "membro") return erro("Você não tem permissão para criar membros.", 403);

    let igrejaId = quem.igreja_id;
    let filialId = quem.filial_id;

    if (quem.papel !== "filial") {
      filialId = pedido.filial_id;
      if (!filialId) return erro("Selecione a filial do membro.");

      const { data: filial, error: filialErr } = await db.from("filiais").select("igreja_id").eq("id", filialId).maybeSingle();
      if (filialErr || !filial) return erro("Filial inválida.", 400);
      if (quem.papel === "master" && filial.igreja_id !== quem.igreja_id) return erro("Filial não pertence à sua igreja.", 403);
      igrejaId = filial.igreja_id;
    }

    if (!igrejaId || !filialId) return erro("Dados insuficientes para criar o membro.");

    const senha = gerarSenha();
    const userId = await criarUsuario(email, senha);

    const { data: membro, error: membroErr } = await db.from("membros").insert({
      igreja_id: igrejaId,
      filial_id: filialId,
      nome,
      email,
      telefone: telefone || null,
    }).select("id").single();

    if (membroErr) {
      await db.auth.admin.deleteUser(userId);
      return erro(membroErr.message);
    }

    const { error: perfilErr } = await db.from("perfis").insert({
      id: userId,
      igreja_id: igrejaId,
      filial_id: filialId,
      membro_id: membro.id,
      nome,
      email,
      papel: "membro",
      telefone: telefone || null,
      ativo: true,
      trocar_senha: true,
    });

    if (perfilErr) {
      await db.auth.admin.deleteUser(userId);
      await db.from("membros").delete().eq("id", membro.id);
      return erro(perfilErr.message);
    }

    return responder({ nome, email, senha });
  }

  return erro("Tipo de pedido desconhecido.");
});

