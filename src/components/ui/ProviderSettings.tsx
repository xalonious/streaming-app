"use client";

import { useEffect, useRef, useState } from "react";
import { providerRequest } from "../../api/providers";
import type { MediaType, Provider, ProviderInput } from "../../lib/providers/types";
import { normalizeBaseUrl, resolveTemplate, validateTemplate } from "../../lib/providers/templates";
import { CloseIcon } from "./Icons";

const button = "rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed";
const input = "mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500";
const empty: ProviderInput = { name: "", baseUrl: "", movieTemplate: null, tvTemplate: null, enabled: true, isDefault: false };
const previewMedia = {
  movie: { label: "The Dark Knight (2008)", tmdbId: 155 },
  tv: { label: "Game of Thrones · S1 E1", tmdbId: 1399 },
};

export function ProviderSettings({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  const [form, setForm] = useState<ProviderInput>(empty);
  const [preview, setPreview] = useState<{ type: MediaType; url: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controller = new AbortController();
    providerRequest<{ providers: Provider[] }>("/management", { signal: controller.signal }).then(data => setProviders(data.providers))
      .catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => setLoading(false));
    return () => { controller.abort(); document.body.style.overflow = previous; };
  }, []);

  async function reload() {
    const data = await providerRequest<{ providers: Provider[] }>("/management");
    setProviders(data.providers);
  }
  async function action(run: () => Promise<void>) {
    setBusy(true); setError(""); setSuccess("");
    try { await run(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  function start(provider?: Provider) {
    setEditing(provider?.id ?? null);
    setForm(provider ? { name: provider.name, baseUrl: provider.baseUrl, movieTemplate: provider.movieTemplate, tvTemplate: provider.tvTemplate,
      enabled: provider.enabled, isDefault: provider.isDefault } : { ...empty });
    setPreview(null); setError(""); setSuccess("");
  }
  function change(field: keyof ProviderInput, value: string | boolean) {
    if (field === "movieTemplate" || field === "tvTemplate" || field === "baseUrl") {
      setPreview(null);
    }
    setForm(current => {
      const next = { ...current, [field]: value };

      if (field === "enabled" && !value) next.isDefault = false;
      return next;
    });
  }
  function example(type: MediaType) {
    const template = type === "movie" ? form.movieTemplate : form.tvTemplate;
    if (!template) return { url: "", error: "" };
    try {
      validateTemplate(template, type, normalizeBaseUrl(form.baseUrl));
      return { url: resolveTemplate(template, type, { tmdbId: previewMedia[type].tmdbId, season: 1, episode: 1 }), error: "" };
    } catch (e) { return { url: "", error: (e as Error).message }; }
  }
  const examples = { movie: example("movie"), tv: example("tv") };

  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="provider-settings-title"
      className="provider-settings fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%_-_2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-0 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) { const rect = e.currentTarget.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose(); } }}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#111] px-5 py-4 sm:px-6">
        <div><h2 id="provider-settings-title" className="text-lg font-bold">Streaming providers</h2><p className="mt-1 text-xs text-zinc-500">Manage your streaming sources</p></div>
        <button onClick={onClose} aria-label="Close provider settings" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"><CloseIcon size={16} /></button>
      </div>
      <div className="space-y-5 p-5 sm:p-6">
        {error && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {success && <p role="status" className="text-sm text-green-300">{success}</p>}
        <fieldset disabled={busy} className="min-w-0 space-y-5">
          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-zinc-300">Configured sources</h3><button className={button} onClick={() => start()}>Add provider</button></div>
          {loading ? <p role="status" className="text-sm text-zinc-500">Loading providers…</p> : !providers.length ? <p className="text-sm text-zinc-500">No providers configured. Add a source to start watching.</p> : (
            <ul className="space-y-2">{providers.map((provider, index) => <li key={provider.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{provider.name}</span>{provider.isDefault && <span className="rounded bg-red-600/15 px-2 py-0.5 text-xs text-red-400">Default</span>}<span className="text-xs text-zinc-500">{provider.enabled ? "Enabled" : "Disabled"} · {provider.movieTemplate ? "Movies" : ""}{provider.movieTemplate && provider.tvTemplate ? " / " : ""}{provider.tvTemplate ? "TV" : ""}</span></div>
              <p className="mt-1 break-all text-xs text-zinc-500">{provider.baseUrl}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className={button} onClick={() => start(provider)}>Edit</button>
                <button className={button} onClick={() => void action(async () => { await providerRequest(`/${provider.id}`, { method: "PATCH", body: { enabled: !provider.enabled } }); await reload(); setSuccess("Provider updated."); })}>{provider.enabled ? "Disable" : "Enable"}</button>
                {!provider.isDefault && provider.enabled && <button className={button} onClick={() => void action(async () => { await providerRequest(`/${provider.id}`, { method: "PATCH", body: { isDefault: true } }); await reload(); setSuccess("Default provider updated."); })}>Make default</button>}
                {([-1, 1] as const).map(direction => <button key={direction} className={button} aria-label={`Move ${provider.name} ${direction < 0 ? "up" : "down"}`} disabled={index + direction < 0 || index + direction >= providers.length} onClick={() => void action(async () => {
                  const ids = providers.map(p => p.id); [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
                  await providerRequest("", { method: "PATCH", body: { ids } }); await reload(); setSuccess("Provider order updated.");
                })}>{direction < 0 ? "↑" : "↓"}</button>)}
                <button className={button} onClick={() => setDeleting(provider.id)}>Delete</button>
              </div>
              {deleting === provider.id && <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 text-sm text-red-300"><span>Delete {provider.name}?</span><button className={button} onClick={() => void action(async () => { await providerRequest(`/${provider.id}`, { method: "DELETE" }); setDeleting(null); if (editing === provider.id) setEditing(undefined); await reload(); setSuccess("Provider deleted."); })}>Confirm delete</button><button className={button} onClick={() => setDeleting(null)}>Cancel</button></div>}
            </li>)}</ul>
          )}
          {editing !== undefined && <form className="space-y-4 rounded-xl border border-white/10 p-4 sm:p-5" onSubmit={e => { e.preventDefault(); void action(async () => {
            const body = { ...form, baseUrl: normalizeBaseUrl(form.baseUrl), movieTemplate: form.movieTemplate?.trim() || null, tvTemplate: form.tvTemplate?.trim() || null };
            if (!body.movieTemplate && !body.tvTemplate) throw new Error("Provide at least one movie or TV template");
            if (body.movieTemplate) validateTemplate(body.movieTemplate, "movie", body.baseUrl);
            if (body.tvTemplate) validateTemplate(body.tvTemplate, "tv", body.baseUrl);
            await providerRequest(editing ? `/${editing}` : "", { method: editing ? "PATCH" : "POST", body });
            await reload(); setEditing(undefined); setPreview(null); setSuccess("Provider saved.");
          }); }}>
            <h3 className="font-semibold">{editing ? "Edit provider" : "Add provider"}</h3>
            <label className="block text-sm text-zinc-400">Base URL<input className={input} value={form.baseUrl} onChange={e => change("baseUrl", e.target.value)} placeholder="https://provider.example" required /></label>
            <label className="block text-sm text-zinc-400">Provider name<input className={input} maxLength={80} value={form.name} onChange={e => change("name", e.target.value)} required /></label>
            <p className="text-xs leading-relaxed text-zinc-500">Enter the URL formats from your provider’s documentation. Use {"{tmdbId}"} for movies; add {"{season}"} and {"{episode}"} for TV. Leave an unsupported media type blank.</p>
            {(["movie", "tv"] as const).map(type => <div key={type} className="space-y-2">
              <label className="block text-sm text-zinc-400">{type === "movie" ? "Movie" : "TV episode"} URL template<input className={`${input} font-mono text-xs`} value={form[`${type}Template`] ?? ""} onChange={e => change(`${type}Template`, e.target.value)} placeholder={type === "movie" ? "https://provider.example/movie/{tmdbId}" : "https://provider.example/tv/{tmdbId}/{season}/{episode}"} /></label>
              {examples[type].error && <p className="text-xs text-red-300">{examples[type].error}</p>}
              {examples[type].url && <><p className="break-all font-mono text-xs text-zinc-500">Example: {examples[type].url}</p><button type="button" className={button} onClick={() => { setPreview({ type, url: examples[type].url }); }}>Preview {previewMedia[type].label}</button>
              </>}
            </div>)}
            {preview && <div className="space-y-2"><div className="flex items-center justify-between"><span className="text-xs text-zinc-400">{previewMedia[preview.type].label}</span><button type="button" className={button} onClick={() => setPreview(null)}>Close preview</button></div><p className="break-all font-mono text-xs text-zinc-500">{preview.url}</p><div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black"><iframe title={`${previewMedia[preview.type].label} provider preview`} src={preview.url} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full" /></div></div>}
            <div className="flex flex-wrap gap-4 text-sm text-zinc-400"><label className="flex items-center gap-2"><input type="checkbox" className="accent-red-600" checked={form.enabled} onChange={e => change("enabled", e.target.checked)} />Enabled</label><label className="flex items-center gap-2"><input type="checkbox" className="accent-red-600" checked={form.isDefault} disabled={!form.enabled} onChange={e => change("isDefault", e.target.checked)} />Default source</label></div>
            <p className="text-xs leading-relaxed text-zinc-500">Only use sources you are authorized to access that permit embedding. A valid template or loaded preview does not prove a title is available.</p>
            <div className="flex gap-2"><button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500" type="submit">Save provider</button><button type="button" className={button} onClick={() => { setEditing(undefined); setPreview(null); }}>Cancel</button></div>
          </form>}
        </fieldset>
        {busy && <p role="status" className="text-sm text-zinc-400">Working…</p>}
      </div>
    </dialog>
  );
}
