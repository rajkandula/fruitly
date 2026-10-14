export default function Loading() {
  return <div className="container-x py-10"><div className="h-8 w-48 animate-pulse rounded-lg bg-white" /><div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-white" />)}</div></div>;
}
