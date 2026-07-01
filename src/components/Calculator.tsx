"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { MaterialSymbol } from "./MaterialSymbol";

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (value: number) => void;
  initialValue?: string;
}

type Operation = "+" | "-" | "×" | "÷" | null;

export default function Calculator({ isOpen, onClose, onResult, initialValue = "" }: CalculatorProps) {
  const [display, setDisplay] = useState(initialValue || "0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplay(initialValue || "0");
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(false);
      setExpression("");
    }
  }, [isOpen, initialValue]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const formatDisplay = (value: string): string => {
    const parts = value.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.join(",");
  };

  const inputDigit = useCallback((digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay((prev) => (prev === "0" && digit !== "." ? digit : prev + digit));
    }
  }, [waitingForOperand]);

  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    setDisplay((prev) => (prev.includes(".") ? prev : prev + "."));
  }, [waitingForOperand]);

  const clear = useCallback(() => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setExpression("");
  }, []);

  const backspace = useCallback(() => {
    if (waitingForOperand) return;
    setDisplay((prev) => {
      if (prev.length <= 1 || (prev.length === 2 && prev.startsWith("-"))) return "0";
      return prev.slice(0, -1);
    });
  }, [waitingForOperand]);

  const performOperation = useCallback((nextOp: Operation) => {
    const currentValue = parseFloat(display.replace(",", "."));

    if (previousValue === null) {
      setPreviousValue(currentValue);
    } else if (operation) {
      let result = 0;
      switch (operation) {
        case "+":
          result = previousValue + currentValue;
          break;
        case "-":
          result = previousValue - currentValue;
          break;
        case "×":
          result = previousValue * currentValue;
          break;
        case "÷":
          result = currentValue !== 0 ? previousValue / currentValue : 0;
          break;
      }
      const resultStr = Math.round(result * 100) / 100 + "";
      setDisplay(resultStr);
      setPreviousValue(result);
    }

    if (nextOp === null) {
      setExpression("");
      setOperation(null);
      setPreviousValue(null);
    } else {
      setExpression(`${previousValue ?? parseFloat(display.replace(/\./g, "").replace(",", "."))} ${nextOp}`);
      setOperation(nextOp);
    }
    setWaitingForOperand(true);
  }, [display, previousValue, operation]);

  const handleEquals = useCallback(() => {
    performOperation(null);
  }, [performOperation]);

  const handleSubmit = useCallback(() => {
    let currentValue = parseFloat(display.replace(",", "."));
    if (previousValue !== null && operation) {
      switch (operation) {
        case "+": currentValue = previousValue + currentValue; break;
        case "-": currentValue = previousValue - currentValue; break;
        case "×": currentValue = previousValue * currentValue; break;
        case "÷": currentValue = currentValue !== 0 ? previousValue / currentValue : 0; break;
      }
    }
    if (!isNaN(currentValue) && currentValue >= 0) {
      onResult(Math.round(currentValue * 100) / 100);
    }
    onClose();
  }, [display, previousValue, operation, onResult, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const key = e.key;
    if (key >= "0" && key <= "9") inputDigit(key);
    else if (key === ".") inputDecimal();
    else if (key === "Backspace") backspace();
    else if (key === "Escape") onClose();
    else if (key === "Enter") handleSubmit();
    else if (key === "+") performOperation("+");
    else if (key === "-") performOperation("-");
    else if (key === "*") performOperation("×");
    else if (key === "/") { e.preventDefault(); performOperation("÷"); }
    else if (key === "=" || key === "Enter") { e.preventDefault(); handleEquals(); }
  }, [inputDigit, inputDecimal, backspace, onClose, handleSubmit, performOperation, handleEquals]);

  if (!isOpen) return null;

  const btnClass = "flex items-center justify-center rounded-xl text-label-md font-semibold transition-all active:scale-95 select-none h-12";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-sm rounded-t-2xl bg-inverse-surface p-gutter shadow-2xl sm:rounded-2xl"
        onKeyDown={handleKeyDown}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-label-sm text-inverse-on-surface/60">Kalkulator</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-inverse-on-surface/60 hover:bg-white/10 hover:text-inverse-on-surface transition-colors"
          >
            <MaterialSymbol icon="close" size={18} />
          </button>
        </div>

        {expression && (
          <div className="mb-1 text-right text-label-sm text-inverse-on-surface/40 h-4">
            {expression}
          </div>
        )}

        <div className="mb-4 overflow-hidden rounded-xl bg-white/5 px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={display}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9,.]/g, "");
              setDisplay(val);
            }}
            className="w-full bg-transparent text-right text-3xl font-bold text-inverse-on-surface outline-none"
          />
        </div>

        <div className="grid grid-cols-4 gap-stack-xs">
          <button onClick={clear} className={`${btnClass} bg-error-container/20 text-error hover:bg-error-container/30`}>
            C
          </button>
          <button onClick={backspace} className={`${btnClass} bg-white/10 text-inverse-on-surface/80 hover:bg-white/20`}>
            <MaterialSymbol icon="backspace" size={18} />
          </button>
          <button onClick={() => performOperation("÷")} className={`${btnClass} ${operation === "÷" ? "bg-primary text-on-primary" : "bg-white/10 text-inverse-on-surface/80 hover:bg-white/20"}`}>
            ÷
          </button>
          <button onClick={() => performOperation("×")} className={`${btnClass} ${operation === "×" ? "bg-primary text-on-primary" : "bg-white/10 text-inverse-on-surface/80 hover:bg-white/20"}`}>
            <MaterialSymbol icon="close" size={16} />
          </button>

          {[7, 8, 9].map((n) => (
            <button key={n} onClick={() => inputDigit(n.toString())} className={`${btnClass} bg-white/10 text-inverse-on-surface hover:bg-white/20`}>
              {n}
            </button>
          ))}
          <button onClick={() => performOperation("-")} className={`${btnClass} ${operation === "-" ? "bg-primary text-on-primary" : "bg-white/10 text-inverse-on-surface/80 hover:bg-white/20"}`}>
            <MaterialSymbol icon="remove" size={18} />
          </button>

          {[4, 5, 6].map((n) => (
            <button key={n} onClick={() => inputDigit(n.toString())} className={`${btnClass} bg-white/10 text-inverse-on-surface hover:bg-white/20`}>
              {n}
            </button>
          ))}
          <button onClick={() => performOperation("+")} className={`${btnClass} ${operation === "+" ? "bg-primary text-on-primary" : "bg-white/10 text-inverse-on-surface/80 hover:bg-white/20"}`}>
            <MaterialSymbol icon="add" size={18} />
          </button>

          {[1, 2, 3].map((n) => (
            <button key={n} onClick={() => inputDigit(n.toString())} className={`${btnClass} bg-white/10 text-inverse-on-surface hover:bg-white/20`}>
              {n}
            </button>
          ))}
          <button onClick={handleEquals} className={`${btnClass} bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container row-span-2`}>
            =
          </button>

          <button onClick={() => inputDigit("0")} className={`${btnClass} bg-white/10 text-inverse-on-surface hover:bg-white/20 col-span-2`}>
            0
          </button>
          <button onClick={inputDecimal} className={`${btnClass} bg-white/10 text-inverse-on-surface hover:bg-white/20`}>
            ,
          </button>
        </div>

        <div className="mt-stack-sm flex gap-stack-xs">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-white/10 py-3 text-label-md font-medium text-inverse-on-surface/60 hover:bg-white/20 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-primary py-3 text-label-md font-semibold text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all"
          >
            Gunakan
          </button>
        </div>
      </div>
    </div>
  );
}
