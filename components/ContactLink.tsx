"use client";

import Link from "next/link";
import { useEffect } from "react";

// Scroll to CONTACT and flash its heading: it sits near the bottom, so the scroll can stop with it
// mid-screen, and the flash shows where you landed.
function goToContact(el: HTMLElement) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  el.classList.remove("flash");
  void el.offsetWidth; // restart the animation
  el.classList.add("flash");
}

// The header's contact chip. On the home page it scrolls on every click (a #contact link does nothing once
// the hash is already set); from another page it navigates to /#contact and the home page's chip, mounting
// there, finishes the job.
export function ContactLink() {
  useEffect(() => {
    const el = document.getElementById("contact");
    if (el && location.hash === "#contact") goToContact(el);
  }, []);
  return (
    <Link
      href="/#contact"
      className="contact-btn"
      onClick={(e) => {
        const el = document.getElementById("contact");
        if (!el) return;
        e.preventDefault();
        history.replaceState(history.state, "", "#contact");
        goToContact(el);
      }}
    >
      contact
    </Link>
  );
}
