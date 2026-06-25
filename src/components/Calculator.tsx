"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { LuX, LuDelete, LuEqual, LuPlus, LuMinus, LuDivide } from "react-icons/lu";

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

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setDisplay(initialValue || "0");
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(false);
      setExpression("");
    }
  }, [isOpen, initialValue]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const formatDisplay = (value: string): string => {
    // Format with thousand separators for display
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
      // Equals
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
    // Evaluate any pending operation directly
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

  const btnClass = "flex items-center justify-center rounded-xl text-sm font-semibold transition-all active:scale-95 select-none h-12";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-sm rounded-t-2xl bg-zinc-900 p-4 shadow-2xl sm:rounded-2xl"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Kalkulator</span>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <LuX size={16} />
          </button>
        </div>

        {/* Expression Display */}
        {expression && (
          <div className="mb-1 text-right text-xs text-zinc-500 h-4">
            {expression}
          </div>
        )}

        {/* Result Display */}
        <div className="mb-4 overflow-hidden rounded-xl bg-zinc-800 px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={display}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9,.]/g, "");
              setDisplay(val);
            }}
            className="w-full bg-transparent text-right text-3xl font-bold text-white outline-none"
          />
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <button onClick={clear} className={`${btnClass} bg-red-500/20 text-red-400 hover:bg-red-500/30`}>
            C
          </button>
          <button onClick={backspace} className={`${btnClass} bg-zinc-800 text-zinc-300 hover:bg-zinc-700`}>
            <LuDelete size={18} />
          </button>
          <button onClick={() => performOperation("÷")} className={`${btnClass} ${operation === "÷" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
            <LuDivide size={18} />
          </button>
          <button onClick={() => performOperation("×")} className={`${btnClass} ${operation === "×" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
            <LuX size={16} />
          </button>

          {/* Row 2 */}
          {[7, 8, 9].map((n) => (
            <button key={n} onClick={() => inputDigit(n.toString())} className={`${btnClass} bg-zinc-800 text-white hover:bg-zinc-700`}>
              {n}
            </button>
          ))}
          <button onClick={() => performOperation("-")} className={`${btnClass} ${operation === "-" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
            <LuMinus size={18} />
          </button>

          {/* Row 3 */}
          {[4, 5, 6].map((n) => (
            <button key={n} onClick={() => inputDigit(n.toString())} className={`${btnClass} bg-zinc-800 text-white hover:bg-zinc-700`}>
              {n}
            </button>
          ))}
          <button onClick={() => performOperation("+")} className={`${btnClass} ${operation === "+" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
            <LuPlus size={18} />
          </button>

          {/* Row 4 */}
          {[1, 2, 3].map((n) => (
            <button key={n} onClick={() => inputDigit(n.toString())} className={`${btnClass} bg-zinc-800 text-white hover:bg-zinc-700`}>
              {n}
            </button>
          ))}
          <button onClick={handleEquals} className={`${btnClass} bg-emerald-600 text-white hover:bg-emerald-500 row-span-2`}>
            <LuEqual size={22} />
          </button>

          {/* Row 5 */}
          <button onClick={() => inputDigit("0")} className={`${btnClass} bg-zinc-800 text-white hover:bg-zinc-700 col-span-2`}>
            0
          </button>
          <button onClick={inputDecimal} className={`${btnClass} bg-zinc-800 text-white hover:bg-zinc-700`}>
            ,
          </button>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-zinc-800 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-700"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500"
          >
            Gunakan
          </button>
        </div>
      </div>
    </div>
  );
}
