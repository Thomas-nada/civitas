import { useEffect } from "react";

const SITE_NAME = "Civitas";
const BASE_TITLE = "Civitas — Cardano Governance Dashboard";
const BASE_DESC =
  "Track Cardano governance proposals, DRep voting records, SPO participation, " +
  "and Constitutional Committee decisions in real time.";

/**
 * Upserts a <meta> tag in <head>. Creates it if missing.
 */
function upsertMeta(attr, key, value) {
  if (!value) return;
  let el = document.querySelector(`meta[${attr}="${CSS.escape(key)}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

/**
 * Upserts a <link rel="canonical"> tag in <head>.
 */
function upsertCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Hook to set per-page SEO meta tags.
 *
 * @param {object} opts
 * @param {string} [opts.title]        Page-specific title (without site name suffix)
 * @param {string} [opts.description]  Page-specific meta description
 * @param {string} [opts.canonical]    Canonical URL (defaults to window.location.href)
 */
export function useSeoMeta({ title, description, canonical } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : BASE_TITLE;
    const desc = description || BASE_DESC;
    const canonicalHref = canonical || window.location.origin + window.location.pathname;

    document.title = fullTitle;

    upsertMeta("name", "description", desc);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:url", canonicalHref);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:type", "website");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:card", "summary");
    upsertCanonical(canonicalHref);

    return () => {
      document.title = BASE_TITLE;
    };
  }, [title, description, canonical]);
}
