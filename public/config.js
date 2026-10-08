<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gestão de Membros</title>
    <link rel="stylesheet" href="./styles.css" />
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  </head>
  <body>
    <div id="app">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">⛪</div>
          <div>
            <strong>Gestão de</strong>
            <span>Membros</span>
          </div>
        </div>
        <nav id="menu"></nav>
      </aside>

      <main class="content">
        <header class="topbar">
          <button id="menuToggle" class="menu-toggle">☰</button>
          <div class="topbar-user">
            <span id="userName">Carregando...</span>
            <div id="userAvatar" class="avatar">U</div>
          </div>
        </header>
        <section id="page"></section>
      </main>
    </div>

    <div id="loginScreen" class="overlay active">
      <div class="login-card">
        <div class="login-brand">
          <div class="brand-mark">⛪</div>
          <h1>Gestão de <span>Membros</span></h1>
        </div>

        <div id="loginBox" class="login-box">
          <label> E-mail
            <input id="email" type="email" autocomplete="email" placeholder="voce@igreja.com" />
          </label>
          <label> Senha
            <input id="password" type="password" autocomplete="current-password" placeholder="Sua senha" />
          </label>
          <div id="loginError" class="error"></div>
          <button id="loginBtn" class="primary">Entrar</button>
          <button id="forgotBtn" class="link-btn">Esqueci minha senha</button>
        </div>

        <div id="cadastroBox" class="login-box hidden">
          <div class="mini-header">
            <strong id="cadastroIgreja">Carregando...</strong>
            <small id="cadastroFilial">...</small>
          </div>
          <div id="cadastroMensagem" class="info-box"></div>
          <div id="cadastroForm" class="hidden">
            <label> Nome completo
              <input id="cadNome" type="text" />
            </label>
            <label> Telefone
              <input id="cadTelefone" type="tel" />
            </label>
            <label> E-mail
              <input id="cadEmail" type="email" />
            </label>
            <label> Senha
              <input id="cadSenha" type="password" />
            </label>
            <label> Confirmar senha
              <input id="cadSenha2" type="password" />
            </label>
            <input id="honeypot" type="text" class="honeypot" tabindex="-1" autocomplete="off" />
            <div id="cadastroError" class="error"></div>
            <button id="cadastroBtn" class="primary">Cadastrar</button>
          </div>
          <button id="voltarLoginBtn" class="link-btn">Já tenho cadastro</button>
        </div>
      </div>
    </div>

    <script src="./config.js"></script>
    <script src="./app.js"></script>
  </body>
</html>

