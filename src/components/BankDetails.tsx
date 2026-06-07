/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Copy, Check, Landmark, Receipt } from "lucide-react";

interface BankDetailsProps {
  onNotify: (message: string) => void;
  isAdminMode?: boolean;
  accountsData?: Array<{
    id: string;
    bank: string;
    type: string;
    number: string;
    accent: string;
    logoType: string;
  }>;
  onUpdateAccount?: (id: string, updated: Partial<{ bank: string; number: string }>) => void;
  rncHeader?: string;
  onUpdateRncHeader?: (value: string) => void;
}

export default function BankDetails({
  onNotify,
  isAdminMode = false,
  accountsData,
  onUpdateAccount,
  rncHeader = "RNC: 133-41038-9",
  onUpdateRncHeader,
}: BankDetailsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const defaultAccounts = [
    {
      id: "rnc",
      bank: "RP2, SRL",
      type: "RNC (Registro Nacional de Contribuyentes)",
      number: "133410389",
      accent: "border-primary/20 bg-primary/5",
      logoType: "rnc"
    },
    {
      id: "bhd",
      bank: "Banco BHD",
      type: "Cuenta de Ahorros",
      number: "39729570017",
      accent: "border-emerald-500/20 bg-emerald-500/5",
      logoType: "bhd"
    },
    {
      id: "banreservas",
      bank: "Banreservas",
      type: "Cuenta de Ahorros",
      number: "9609051377",
      accent: "border-sky-500/20 bg-sky-500/5",
      logoType: "banreservas"
    }
  ];

  const accounts = accountsData || defaultAccounts;

  const copyToClipboard = (text: string, label: string, id: string) => {
    if (isAdminMode) return; // Disable copy interaction inside admin edit mode
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onNotify(`¡${label} copiado al portapapeles! 📋`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-dark-card border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-wine/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <span className="text-primary text-xs font-black uppercase tracking-widest font-display">Soporte de pagos</span>
          <h3 className="text-2xl md:text-3xl font-display font-medium text-white tracking-tight mt-1">
            Información de Transferencia
          </h3>
          <p className="text-sm text-gray-400 mt-2 font-light">
            Pide en línea y transfiere de manera fácil. Copia los datos con un solo toque y envía tu captura por WhatsApp.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-start bg-white/5 px-4 py-2 rounded-2xl border border-white/5 text-xs text-gray-300">
          <Receipt className="w-4 h-4 text-primary" />
          {isAdminMode ? (
            <input
              type="text"
              value={rncHeader}
              onChange={(e) => onUpdateRncHeader?.(e.target.value)}
              className="bg-transparent text-gray-200 focus:outline-none w-36 font-mono text-xs border-b border-white/10"
              placeholder="RNC"
            />
          ) : (
            <span>{rncHeader}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div
            id={`bank-card-${acc.id}`}
            key={acc.id}
            onClick={() => !isAdminMode && copyToClipboard(acc.number, acc.bank, acc.id)}
            className={`border rounded-2xl p-5 relative flex flex-col justify-between transition-all duration-300 group ${
              isAdminMode ? "border-white/15" : "cursor-pointer hover:border-primary/40 hover:-translate-y-1"
            } ${acc.accent}`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                {/* Custom Vector Logos mimicking screenshots */}
                {acc.logoType === "rnc" ? (
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Receipt className="w-4 h-4 text-primary" />
                  </div>
                ) : acc.logoType === "bhd" ? (
                  <div className="flex items-center gap-1.5">
                    {/* BHD Green, Blue & Orange Circles */}
                    <div className="flex -space-x-1">
                      <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 border border-black/5"></div>
                      <div className="w-4.5 h-4.5 rounded-full bg-blue-500 border border-black/5 opacity-80"></div>
                      <div className="w-4.5 h-4.5 rounded-full bg-amber-500 border border-black/5 opacity-80"></div>
                    </div>
                    <span className="text-xs font-bold text-white/50 group-hover:text-white/80 transition-colors">BHD</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {/* Banreservas blue logo */}
                    <div className="w-5 h-5 rounded bg-sky-600 flex items-center justify-center font-display font-black text-[10px] text-white">
                      R
                    </div>
                    <span className="text-xs font-bold text-white/50 group-hover:text-white/80 transition-colors">RESERVAS</span>
                  </div>
                )}

                <span className="text-[10px] bg-white/5 text-gray-400 font-display px-2 py-0.5 rounded-md font-medium uppercase tracking-wider">
                  {acc.id === "rnc" ? "RNC" : "AHORROS"}
                </span>
              </div>

              <span className="text-xs text-gray-500 uppercase tracking-widest block font-display">Beneficiario / Banco</span>
              {isAdminMode ? (
                <input
                  type="text"
                  value={acc.bank}
                  onChange={(e) => onUpdateAccount?.(acc.id, { bank: e.target.value })}
                  className="w-full bg-black/45 border border-white/10 rounded-xl px-2.5 py-1 text-xs font-bold text-white mt-1 focus:outline-none focus:border-primary"
                  placeholder="Banco o Razón"
                />
              ) : (
                <h4 className="font-display font-bold text-white text-base mt-0.5">{acc.bank}</h4>
              )}
              
              <span className="text-xs text-gray-500 uppercase tracking-widest block font-display mt-3">Número de Cuenta</span>
              {isAdminMode ? (
                <input
                  type="text"
                  value={acc.number}
                  onChange={(e) => onUpdateAccount?.(acc.id, { number: e.target.value })}
                  className="w-full bg-black/45 border border-white/10 rounded-xl px-2.5 py-1 text-xs font-bold text-white mt-1 font-mono focus:outline-none focus:border-primary"
                  placeholder="Número de cuenta o RNC"
                />
              ) : (
                <p className="font-mono text-base font-black text-white mt-0.5 tracking-wider break-all bg-black/25 px-2.5 py-1 rounded-lg border border-white/5 flex items-center justify-between">
                  <span>{acc.number}</span>
                  {copiedId === acc.id ? (
                    <Check className="w-4 h-4 text-green-400 shrink-0 ml-2 animate-pulse" />
                  ) : (
                    <Copy className="w-4 h-4 text-primary shrink-0 ml-2 group-hover:scale-110 transition-transform" />
                  )}
                </p>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-white/5 text-center">
              <span className="text-[11px] text-gray-400 group-hover:text-primary transition-colors font-medium">
                {isAdminMode ? "Modo de edición de cuenta" : copiedId === acc.id ? "¡Copiado!" : "Copiar datos"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
