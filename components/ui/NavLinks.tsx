"use client";

import React from "react";

const navLinks = [
  { label: "لماذا Adabibanek", href: "#why" },
  { label: "كيف يعمل", href: "#how" },
  { label: "دليلك الصحي الشامل", href: "#health-guide" },
  { label: "ماذا يقول مستخدمونا", href: "#testimonials" },
];

export function NavLinks() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="hidden lg:flex items-center gap-1 mr-4">
      {navLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={(e) => handleClick(e, link.href)}
          className="
            relative px-4 py-2 cursor-pointer
            text-[18px] font-semibold text-foreground/80
            transition-all duration-200
            hover:text-sky-500
            group
          "
        >
          <span className="
            absolute inset-0 rounded-md
            opacity-0 group-hover:opacity-100
            bg-sky-500/10
            transition-opacity duration-200
          " />
          <span className="relative">{link.label}</span>
          <span className="
            absolute bottom-0 left-4 right-4 h-[2px]
            bg-sky-400
            scale-x-0 group-hover:scale-x-100
            transition-transform duration-200 origin-center
            rounded-full
          " />
        </a>
      ))}
    </nav>
  );
}
