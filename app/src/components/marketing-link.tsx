/**
 * A CTA on a marketing page, which may point at another page on the site or
 * off it entirely — see `@/lib/marketing-links`.
 *
 * This used to branch on the build target, because the same page was rendered
 * into both the app and the public site and needed a different href in each.
 * These pages are site-only now, so the question is simply whether this
 * particular destination is on the site: an in-site path routes through the
 * router, an absolute URL is a real link out. Always pair with
 * `<Button asChild>`.
 */

import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { isExternalHref } from "@/lib/marketing-links";

export function MarketingLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}
