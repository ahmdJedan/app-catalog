"use client";

import { useState, useRef, useEffect } from "react";

export default function ModuleTag({ moduleItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const tagRef = useRef(null);

  const name =
    typeof moduleItem === "string" ? moduleItem : moduleItem?.name || "Modul";
  const programmer =
    typeof moduleItem === "object" && moduleItem?.programmer
      ? moduleItem.programmer
      : "Tim Pengembang DSTI";

  // Klik di luar menutup tooltip (untuk mobile / touch)
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (tagRef.current && !tagRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={tagRef}
      className={`module-pill ${isOpen ? "active" : ""}`}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
      aria-expanded={isOpen}
      aria-label={`${name} - Programmer: ${programmer}`}
    >
      <span className="mod-dot"></span>
      <span className="mod-name">{name}</span>

      <div className="module-tooltip" role="tooltip">
        <span className="tooltip-caret"></span>
        <span className="tooltip-label">Programmer:</span>
        <span className="tooltip-name">{programmer}</span>
      </div>
    </div>
  );
}
