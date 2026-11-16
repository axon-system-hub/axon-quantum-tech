/* AXON Quantum — Supabase Cloud Sync & Experiment Log Bridge */
(function () {
  'use strict';

  const CFG_STORAGE_KEY = 'axon_supabase_cfg_v1';

  // 필요 시 아래 기본값에 Project URL과 Anon Key를 직접 입력해 배포할 수 있습니다.
  const DEFAULT_CONFIG = {
    url: 'https://tcbfchyfmcyvprbisxel.supabase.co',
    anonKey: 'sb_publishable_3M40RQJlHkCzHt2SKMdHCA_BF4zMiR6'
  };

  let client = null;
  let connected = false;
  let currentUser = null;
  let sdkPromise = null;

  function loadConfig() {
    try {
      const raw = localStorage.getItem(CFG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            url: String(parsed.url || DEFAULT_CONFIG.url || '').trim(),
            anonKey: String(parsed.anonKey || DEFAULT_CONFIG.anonKey || '').trim()
          };
        }
      }
    } catch (_) {
      // ignore storage errors
    }
    return { ...DEFAULT_CONFIG };
  }

  function saveConfig(url, anonKey) {
    const clean = {
      url: String(url || '').trim().replace(/\/+$/, ''),
      anonKey: String(anonKey || '').trim()
    };
    try {
      localStorage.setItem(CFG_STORAGE_KEY, JSON.stringify(clean));
    } catch (_) {
      // ignore
    }
    return clean;
  }

  function clearConfig() {
    try {
      localStorage.removeItem(CFG_STORAGE_KEY);
    } catch (_) {
      // ignore
    }
    client = null;
    connected = false;
    currentUser = null;
  }

  async function loadSdk() {
    if (!sdkPromise) {
      sdkPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    }
    return sdkPromise;
  }

  async function connect(overrideUrl, overrideKey) {
    const cfg =
      overrideUrl !== undefined
        ? saveConfig(overrideUrl, overrideKey)
        : loadConfig();

    if (!cfg.url || !cfg.anonKey) {
      client = null;
      connected = false;
      currentUser = null;
      return { ok: false, reason: 'missing_config' };
    }

    try {
      const { createClient } = await loadSdk();
      client = createClient(cfg.url, cfg.anonKey);
      const { data: sessionData } = await client.auth.getSession();
      currentUser = sessionData && sessionData.session ? sessionData.session.user : null;

      // 가벼운 연결 확인 (테이블 조회)
      const { error } = await client
        .from('axon_workflow_tasks')
        .select('id', { count: 'exact', head: true });

      if (error) {
        connected = false;
        return { ok: false, reason: 'table_or_auth_error', message: error.message };
      }

      connected = true;
      return { ok: true, user: currentUser };
    } catch (err) {
      connected = false;
      return { ok: false, reason: 'network_error', message: err && err.message ? err.message : String(err) };
    }
  }

  async function signIn(email, password) {
    if (!client) {
      const res = await connect();
      if (!res.ok && res.reason === 'missing_config') {
        return { ok: false, message: '먼저 Supabase URL과 Anon Key를 입력하세요.' };
      }
    }
    if (!client) return { ok: false, message: 'Supabase 클라이언트가 초기화되지 않았습니다.' };

    const { data, error } = await client.auth.signInWithPassword({
      email: String(email || '').trim(),
      password: String(password || '')
    });
    if (error) {
      return { ok: false, message: error.message };
    }
    currentUser = data.user || null;
    connected = true;
    return { ok: true, user: currentUser };
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    currentUser = null;
  }

  async function pullTasks() {
    if (!client || !connected) return { ok: false, message: 'not_connected' };
    const { data, error } = await client
      .from('axon_workflow_tasks')
      .select('id, checked, note, updated_at');

    if (error) return { ok: false, message: error.message };
    const map = {};
    (data || []).forEach((row) => {
      map[row.id] = Boolean(row.checked);
    });
    return { ok: true, checkedMap: map, rows: data || [] };
  }

  async function pushTask(taskId, checked, note) {
    if (!client || !connected) return { ok: false, message: 'not_connected' };
    const payload = {
      id: String(taskId),
      checked: Boolean(checked),
      updated_by: currentUser ? currentUser.email : 'anon-client'
    };
    if (note !== undefined) payload.note = String(note);

    const { error } = await client
      .from('axon_workflow_tasks')
      .upsert(payload, { onConflict: 'id' });

    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  async function syncAll(checkedMap) {
    if (!client || !connected) return { ok: false, message: 'not_connected' };
    const rows = Object.keys(checkedMap || {}).map((id) => ({
      id,
      checked: Boolean(checkedMap[id]),
      updated_by: currentUser ? currentUser.email : 'anon-client'
    }));
    if (rows.length === 0) return { ok: true, count: 0 };

    const { error } = await client
      .from('axon_workflow_tasks')
      .upsert(rows, { onConflict: 'id' });

    if (error) return { ok: false, message: error.message };
    return { ok: true, count: rows.length };
  }

  async function listLogs(limitCount) {
    if (!client || !connected) return { ok: false, message: 'not_connected', logs: [] };
    const { data, error } = await client
      .from('axon_experiment_logs')
      .select('id, task_id, title, evidence_tier, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(limitCount || 20);

    if (error) return { ok: false, message: error.message, logs: [] };
    return { ok: true, logs: data || [] };
  }

  async function addLog(taskId, title, evidenceTier, notes) {
    if (!client || !connected) return { ok: false, message: 'not_connected' };
    const { data, error } = await client
      .from('axon_experiment_logs')
      .insert({
        task_id: taskId ? String(taskId).trim() : null,
        title: String(title || '').trim(),
        evidence_tier: String(evidenceTier || '[TARGET]'),
        notes: String(notes || '').trim()
      })
      .select()
      .single();

    if (error) return { ok: false, message: error.message };
    return { ok: true, log: data };
  }

  window.AXON_SUPABASE = {
    getConfig: loadConfig,
    saveConfig,
    clearConfig,
    connect,
    signIn,
    signOut,
    pullTasks,
    pushTask,
    syncAll,
    listLogs,
    addLog,
    isConnected: () => connected,
    getUser: () => currentUser
  };
})();
