"use client";

import { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaCheck } from "react-icons/fa";

export interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  accentColor?: "purple" | "emerald" | "blue" | "amber";
  align?: "left" | "right" | "auto";
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "เลือกรายการ...",
  className = "",
  accentColor = "purple",
  align = "auto",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [resolvedAlign, setResolvedAlign] = useState<"left" | "right">("left");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // ปิดดร็อปดาวน์เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // คำนวณตำแหน่งอัตโนมัติเมื่อเปิด dropdown
  useEffect(() => {
    if (isOpen && align === "auto" && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      // ถ้าปุ่มอยู่ครึ่งขวาของหน้าจอ → ชิดขวา, ไม่งั้น → ชิดซ้าย
      setResolvedAlign(rect.left + rect.width / 2 > viewportWidth / 2 ? "right" : "left");
    } else if (align !== "auto") {
      setResolvedAlign(align);
    }
  }, [isOpen, align]);

  const colorStyles = {
    purple: {
      activeBg: "bg-purple-50 text-purple-700 font-bold",
      activeIcon: "text-purple-600",
      ring: "focus:ring-purple-500/20 focus:border-purple-500",
      chevronActive: "text-purple-600"
    },
    emerald: {
      activeBg: "bg-emerald-50 text-emerald-700 font-bold",
      activeIcon: "text-emerald-600",
      ring: "focus:ring-emerald-500/20 focus:border-emerald-500",
      chevronActive: "text-emerald-600"
    },
    blue: {
      activeBg: "bg-blue-50 text-blue-700 font-bold",
      activeIcon: "text-blue-600",
      ring: "focus:ring-blue-500/20 focus:border-blue-500",
      chevronActive: "text-blue-600"
    },
    amber: {
      activeBg: "bg-amber-50 text-amber-700 font-bold",
      activeIcon: "text-amber-600",
      ring: "focus:ring-amber-500/20 focus:border-amber-500",
      chevronActive: "text-amber-600"
    }
  };

  const style = colorStyles[accentColor] || colorStyles.purple;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 shadow-sm hover:shadow transition-all duration-150 outline-none ${style.ring} cursor-pointer`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <FaChevronDown className={`text-xs text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? `rotate-180 ${style.chevronActive}` : ""}`} />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 min-w-full max-h-60 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-150 ${
            resolvedAlign === "right" ? "right-0" : "left-0"
          }`}
          style={{ minWidth: "160px", maxWidth: "min(340px, calc(100vw - 32px))" }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors duration-150 text-left cursor-pointer ${
                  isSelected
                    ? style.activeBg
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <FaCheck className={`${style.activeIcon} text-xs shrink-0 ml-2`} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
