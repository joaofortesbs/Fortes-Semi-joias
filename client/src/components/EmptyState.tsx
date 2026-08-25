import { PackageOpen } from "lucide-react";

export default function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-[#d9cbb6] bg-[#fbf8f3] px-6 py-10 text-center"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eee4d3] text-[#9d7d48]"><PackageOpen className="h-5 w-5" /></div><h3 className="serif mt-4 text-xl text-[#263b32]">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#69756b]">{description}</p></div>;
}
