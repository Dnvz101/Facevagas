// ---------------------------------------------------------------
// Pagination — números de página com "..." quando tem muita página,
// sempre mostrando a primeira, a última, e um pouco ao redor da atual.
// ---------------------------------------------------------------

export default function Pagination({ currentPage, totalPages, onGoToPage }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const windowSize = 1; // quantas páginas mostrar de cada lado da atual
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= currentPage - windowSize && p <= currentPage + windowSize)) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      <button
        onClick={() => onGoToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 disabled:opacity-30"
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="nv-body px-1 text-[12px] text-slate-300">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onGoToPage(p)}
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
              p === currentPage ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onGoToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 disabled:opacity-30"
      >
        ›
      </button>
    </div>
  );
}
