"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav({ currentPage = "home", onSignOut }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-gray-700 hover:text-blue-600"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <span className="text-xl font-bold text-blue-600">Menu</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-700">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <nav className="space-y-4">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className={`block py-2 px-4 rounded-lg ${
                currentPage === "home"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Home
            </Link>
            <Link
              href="/care-team"
              onClick={() => setIsOpen(false)}
              className={`block py-2 px-4 rounded-lg ${
                currentPage === "care-team"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Care Team
            </Link>
            <Link
              href="/jobs"
              onClick={() => setIsOpen(false)}
              className={`block py-2 px-4 rounded-lg ${
                currentPage === "jobs"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Jobs
            </Link>
            <Link
              href="/messages"
              onClick={() => setIsOpen(false)}
              className={`block py-2 px-4 rounded-lg ${
                currentPage === "messages"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Messages
            </Link>
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="block w-full text-left py-2 px-4 text-red-600 hover:bg-red-50 rounded-lg"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}
