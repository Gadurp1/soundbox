/**
 * `react-router-dom`, as the site's own pages and the app components it
 * borrows see it: the same module, except that `Link` and `NavLink` give every
 * path-only `to` its trailing slash.
 *
 * The prerender writes `/sfx/door` as `sfx/door/index.html`, and GitHub Pages
 * answers `/soundbox/sfx/door` with a 301 to `/soundbox/sfx/door/`. A visitor
 * never notices, because the router takes over after hydration, but a crawler
 * fetches every href in the HTML and pays the redirect each time. Fixing it
 * here rather than at ~70 call sites keeps the app's source unchanged: the
 * app's own build never sees this file (see `trailingSlashLinks` in
 * vite.config.ts, which swaps it in for the site build only).
 *
 * The import below is the real package. The plugin leaves imports from this
 * file alone, so it does not resolve back to itself.
 */

import { forwardRef } from "react";
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  useHref,
  useLinkClickHandler,
  type LinkProps,
  type NavLinkProps,
  type To,
} from "react-router-dom";

import { pagePath } from "@/lib/asset-url";

export * from "react-router-dom";

function withSlash(to: To): To {
  if (typeof to === "string") return pagePath(to);
  return to.pathname ? { ...to, pathname: pagePath(to.pathname) } : to;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, ...rest }, ref) {
  if (to === "/") return <HomeLink ref={ref} {...rest} />;
  return <RouterLink ref={ref} to={withSlash(to)} {...rest} />;
});

/**
 * A link to the site root. The router joins its basename ("/soundbox") with
 * "/" into "/soundbox", which is the one href `to` cannot fix, so this builds
 * the anchor itself and borrows the router's click handling.
 */
const HomeLink = forwardRef<HTMLAnchorElement, Omit<LinkProps, "to">>(function HomeLink(
  { replace, state, target, preventScrollReset, relative, viewTransition, reloadDocument, onClick, ...rest },
  ref,
) {
  const href = useHref("/");
  const handleClick = useLinkClickHandler("/", {
    replace,
    state,
    target,
    preventScrollReset,
    relative,
    viewTransition,
  });
  return (
    <a
      {...rest}
      ref={ref}
      target={target}
      href={href.endsWith("/") ? href : `${href}/`}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !reloadDocument) handleClick(event);
      }}
    />
  );
});

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, ...rest },
  ref,
) {
  return <RouterNavLink ref={ref} to={withSlash(to)} {...rest} />;
});
