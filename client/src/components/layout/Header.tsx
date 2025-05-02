import { useState } from "react";
import { Link } from "wouter";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleMenu = () => setMenuOpen(!menuOpen);
  
  return (
    <header className="bg-white border-b border-neutral-200 py-4 px-6 shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-primary font-quicksand font-bold text-2xl">Nana</span>
          <span className="text-secondary font-quicksand font-medium text-lg">Intelligence</span>
        </div>
        
        <div className="hidden md:flex space-x-6">
          <Link href="/">
            <a className="text-neutral-600 hover:text-secondary font-medium transition">Accueil</a>
          </Link>
          <Link href="/solutions">
            <a className="text-neutral-600 hover:text-secondary font-medium transition">Solutions</a>
          </Link>
          <Link href="/about">
            <a className="text-neutral-600 hover:text-secondary font-medium transition">À propos</a>
          </Link>
          <Link href="/contact">
            <a className="text-neutral-600 hover:text-secondary font-medium transition">Contact</a>
          </Link>
        </div>
        
        <div className="block md:hidden">
          <button 
            className="text-neutral-600"
            onClick={toggleMenu}
            aria-label="Toggle mobile menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden py-4 px-6 bg-white border-t border-neutral-200">
          <div className="flex flex-col space-y-3">
            <Link href="/">
              <a className="text-neutral-600 hover:text-secondary font-medium transition">Accueil</a>
            </Link>
            <Link href="/solutions">
              <a className="text-neutral-600 hover:text-secondary font-medium transition">Solutions</a>
            </Link>
            <Link href="/about">
              <a className="text-neutral-600 hover:text-secondary font-medium transition">À propos</a>
            </Link>
            <Link href="/contact">
              <a className="text-neutral-600 hover:text-secondary font-medium transition">Contact</a>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
