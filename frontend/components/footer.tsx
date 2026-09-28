'use client';
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AboutUsModal } from "./about-us-modal";

const linkClass = "inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors hover:text-primary";

export function Footer() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <footer className="border-t border-border bg-secondary pb-[env(safe-area-inset-bottom)]">
      <AboutUsModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <div className="mx-auto max-w-[1200px] px-4 py-10 lg:px-6 lg:py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
            <Link href="/" className="flex items-center" aria-label="iLOcate home">
              <Image src="/logo black line.svg" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="text-lg font-bold text-foreground">
                iLO<span className="text-primary">cate</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Your guide to jeepney routes, places and food in Iloilo City, Philippines.
            </p>
          </div>

          <nav className="flex flex-col" aria-label="Explore">
            <h4 className="mb-1 text-sm font-semibold text-foreground">Explore</h4>
            <Link href="/#features" className={linkClass}>Features</Link>
            <Link href="/#how-it-works" className={linkClass}>How it Works</Link>
            <Link href="/#faqs" className={linkClass}>FAQs</Link>
          </nav>

          <nav className="flex flex-col" aria-label="Company">
            <h4 className="mb-1 text-sm font-semibold text-foreground">Company</h4>
            <button type="button" onClick={() => setAboutOpen(true)} className={`${linkClass} text-left`}>About Us</button>
            <Link href="#" className={linkClass}>Contact</Link>
            <Link href="#" className={linkClass}>Privacy Policy</Link>
            <Link href="#" className={linkClass}>Terms of Service</Link>
          </nav>

          <nav className="flex flex-col" aria-label="Social">
            <h4 className="mb-1 text-sm font-semibold text-foreground">Connect</h4>
            <a href="#" className={linkClass}>Facebook</a>
            <a href="#" className={linkClass}>Instagram</a>
            <a href="#" className={linkClass}>Twitter</a>
          </nav>
        </div>

        <p className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} iLOcate. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
