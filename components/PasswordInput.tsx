"use client";
import { useState } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

// Input sandi dengan tombol "Lihat" untuk menampilkan isi yang sedang diketik.
// Dipakai di semua formulir sandi agar pengguna bisa memastikan tidak ada salah ketik.
export default function PasswordInput({ className = "input", ...rest }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...rest} type={show ? "text" : "password"} className={`${className} pr-24`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
        aria-label={show ? "Sembunyikan sandi" : "Lihat sandi"}
      >
        {show ? "Sembunyikan" : "Lihat"}
      </button>
    </div>
  );
}
