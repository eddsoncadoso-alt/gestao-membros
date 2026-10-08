* {
  box-sizing: border-box;
}

:root {
  --bg: #f3f5f8;
  --surface: #ffffff;
  --surface-2: #eef3f7;
  --primary: #12b76a;
  --primary-dark: #0b8e54;
  --text: #1e2b37;
  --muted: #687885;
  --border: #dfe7ee;
  --danger: #d92d20;
  --shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--text);
}

button, input {
  font: inherit;
}

button {
  cursor: pointer;
}

#app {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: #14283a;
  color: #e9eff6;
  padding: 24px 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px 18px;
  font-size: 14px;
}

.brand strong,
.brand span {
  display: block;
}

.brand span {
  color: var(--primary);
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--primary), #1f7ae0);
  color: white;
  font-size: 22px;
}

#menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  width: 100%;
  border: none;
  background: transparent;
  color: #dfebf5;
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  font-weight: 600;
}

.nav-item:hover,
.nav-item.active {
  background: rgba(255, 255, 255, 0.08);
}

.content {
  flex: 1;
  min-width: 0;
}

.topbar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 16px 22px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  font-weight: 700;
}

#page {
  padding: 22px;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.page-title h1 {
  margin: 0;
  font-size: clamp(24px, 3vw, 32px);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px;
  box-shadow: var(--shadow);
}

.card .value {
  display: block;
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 6px;
}

.card .label {
  color: var(--muted);
  font-size: 13px;
}

.section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 18px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}

.table th,
.table td {
  border-bottom: 1px solid var(--border);
  padding: 12px 10px;
  text-align: left;
}

.table th {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eafaf2;
  color: var(--primary-dark);
  font-weight: 700;
  font-size: 12px;
}

.primary,
.secondary,
.danger {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 700;
}

.primary {
  background: var(--primary);
  color: white;
}

.primary:hover {
  background: var(--primary-dark);
}

.secondary {
  background: #edf3f8;
  color: var(--text);
}

.danger {
  background: var(--danger);
  color: white;
}

button.link-btn {
  border: none;
  background: transparent;
  color: var(--primary-dark);
  font-weight: 700;
}

.error {
  min-height: 20px;
  color: var(--danger);
  font-size: 13px;
  margin: 6px 0;
}

.info-box {
  background: #eefaf3;
  border: 1px solid #d7f3e3;
  color: #116a43;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.hidden {
  display: none !important;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 17, 25, 0.38);
  display: none;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.overlay.active {
  display: flex;
}

.login-card {
  width: min(460px, 100%);
  background: var(--surface);
  border-radius: 16px;
  box-shadow: var(--shadow);
  padding: 28px 22px;
}

.login-brand {
  text-align: center;
  margin-bottom: 18px;
}

.login-brand h1 {
  margin: 10px 0 0;
  font-size: clamp(28px, 4vw, 42px);
}

.login-brand h1 span {
  color: var(--primary);
}

.login-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-box label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
}

input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 11px 12px;
  background: white;
  color: var(--text);
}

input:focus {
  outline: 2px solid rgba(18, 183, 106, 0.18);
  border-color: var(--primary);
}

.mini-header {
  margin-bottom: 14px;
}

.mini-header strong,
.mini-header small {
  display: block;
}

.honeypot {
  position: absolute;
  left: -9999px;
  opacity: 0;
  pointer-events: none;
}

.menu-toggle {
  display: none;
  border: none;
  background: #edf4f8;
  color: var(--text);
  border-radius: 8px;
  padding: 8px 10px;
}

@media (max-width: 760px) {
  #app {
    display: block;
  }

  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(78vw, 280px);
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    z-index: 20;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .menu-toggle {
    display: inline-flex;
  }

  .topbar {
    justify-content: space-between;
  }

  #page {
    padding: 16px;
  }
}

