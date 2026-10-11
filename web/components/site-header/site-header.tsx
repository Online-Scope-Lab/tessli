"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CloseIcon, MenuIcon } from "./icons";
import {
  availablePrimaryNavigationItems,
  availableUtilityNavigationItems,
  isNavigationItemActive as isItemActive,
  type NavigationItem,
} from "./navigation";
import styles from "./site-header.module.css";

/** A utility link: internal routes use next/link; external ones open a new tab. */
function UtilityLink({
  item,
  active,
  className,
  onClick,
}: Readonly<{
  item: NavigationItem;
  active: boolean;
  className: string;
  onClick?: () => void;
}>) {
  if (item.external) {
    return (
      <a
        className={className}
        href={item.href}
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span>{item.label}</span>
        <span aria-hidden="true" className={styles.externalMark}>
          ↗
        </span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={className}
      href={item.href}
      onClick={onClick}
    >
      <span>{item.label}</span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 8);
    const frame = window.requestAnimationFrame(updateScrollState);
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrollState);
    };
  }, []);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        closeMenu();
      }
    };

    desktopQuery.addEventListener("change", closeAtDesktop);
    window.addEventListener("popstate", closeMenu);

    return () => {
      desktopQuery.removeEventListener("change", closeAtDesktop);
      window.removeEventListener("popstate", closeMenu);
    };
  }, [closeMenu]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const sheet = sheetRef.current;
    const trigger = triggerRef.current;
    const siteContent = document.querySelector<HTMLElement>(
      "[data-site-content]",
    );
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const previousContentInert = siteContent?.inert ?? false;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    if (siteContent) {
      siteContent.inert = true;
    }

    const focusableSelector =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () =>
      Array.from(sheet?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    const focusFrame = window.requestAnimationFrame(() =>
      focusable()[0]?.focus(),
    );

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);

      if (!first || !last) {
        event.preventDefault();
        return;
      }

      if (!sheet?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      if (siteContent) {
        siteContent.inert = previousContentInert;
      }
      if (trigger?.isConnected && trigger.offsetParent !== null) {
        trigger.focus();
      }
    };
  }, [closeMenu, isMenuOpen]);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={`tessli-container ${styles.inner}`}>
        <Link className={styles.wordmark} href="/" aria-label="Tessli home">
          Tessli
        </Link>

        <nav
          className={styles.desktopNavigation}
          aria-label="Primary navigation"
        >
          {availablePrimaryNavigationItems.map((item) => {
            const active = isItemActive(item, pathname);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`${styles.navigationLink} ${active ? styles.active : ""}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <nav className={styles.utilityNavigation} aria-label="Utilities">
            {availableUtilityNavigationItems.map((item) => {
              const active = isItemActive(item, pathname);
              return (
                <UtilityLink
                  active={active}
                  className={`${styles.utilityLink} ${active ? styles.utilityLinkActive : ""}`}
                  item={item}
                  key={item.href}
                />
              );
            })}
          </nav>
          <button
            aria-controls="mobile-navigation-sheet"
            aria-expanded={isMenuOpen}
            aria-haspopup="dialog"
            aria-label={
              isMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            className={styles.menuTrigger}
            data-mobile-menu-trigger
            onClick={() => setIsMenuOpen(true)}
            ref={triggerRef}
            type="button"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <div
        className={`${styles.sheetLayer} ${isMenuOpen ? styles.sheetLayerOpen : ""}`}
        hidden={!isMenuOpen}
      >
        <button
          aria-label="Close navigation menu"
          className={styles.backdrop}
          onClick={closeMenu}
          tabIndex={-1}
          type="button"
        />
        <div
          aria-labelledby="mobile-navigation-title"
          aria-modal="true"
          className={styles.sheet}
          id="mobile-navigation-sheet"
          ref={sheetRef}
          role="dialog"
        >
          <div className={styles.sheetHeader}>
            <span className={styles.sheetTitle} id="mobile-navigation-title">
              Navigate
            </span>
            <button
              aria-label="Close navigation menu"
              className={styles.closeButton}
              onClick={closeMenu}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>
          <nav
            className={styles.mobileNavigation}
            aria-label="Mobile primary navigation"
          >
            {availablePrimaryNavigationItems.map((item) => {
              const active = isItemActive(item, pathname);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`${styles.mobileLink} ${active ? styles.mobileLinkActive : ""}`}
                  href={item.href}
                  key={item.href}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className={styles.mobileUtilities}>
            <p>Project</p>
            <nav aria-label="Mobile utilities">
              {availableUtilityNavigationItems.map((item) => {
                const active = isItemActive(item, pathname);
                return (
                  <UtilityLink
                    active={active}
                    className={`${styles.mobileUtilityLink} ${active ? styles.mobileUtilityLinkActive : ""}`}
                    item={item}
                    key={item.href}
                    onClick={closeMenu}
                  />
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
