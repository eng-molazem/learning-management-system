import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Download, Lock } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import PaymentModal from "../components/PaymentModal";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { mediaUrl } from "../services/api";
import { downloadBook, fetchBooks } from "../services/books";
import type { Book } from "../types";

export default function Books() {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [payingBook, setPayingBook] = useState<Book | null>(null);

  const { data: books = [], isLoading } = useQuery({ queryKey: ["books"], queryFn: () => fetchBooks() });

  const handleDownload = async (book: Book) => {
    const path = await downloadBook(book.id);
    window.open(mediaUrl(path), "_blank");
  };

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{t("books.title")}</h1>
      {isLoading ? (
        <p className="text-center text-muted">{t("common.loading")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((b) => (
            <GlassCard key={b.id} className="flex flex-col !p-0 overflow-hidden">
              <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-nebula-purple/40 to-nebula-cyan/30">
                {b.cover ? (
                  <img src={mediaUrl(b.cover)} className="h-full w-full object-cover" alt="" />
                ) : (
                  <BookMarked className="h-10 w-10 text-white/50" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="line-clamp-2 font-semibold">{localize(b.title_ar, b.title_en)}</h3>
                {b.author && <p className="text-xs text-muted">{t("books.author")}: {b.author}</p>}
                <div className="mt-auto pt-2">
                  {b.is_free ? (
                    <span className="badge mb-2 text-emerald-300">{t("common.free")}</span>
                  ) : (
                    <span className="badge mb-2">${b.price}</span>
                  )}
                  {!user ? (
                    <Button variant="secondary" className="w-full" disabled>
                      <Lock className="h-4 w-4" /> {t("nav.login")}
                    </Button>
                  ) : b.is_purchased ? (
                    <Button className="w-full" onClick={() => handleDownload(b)}>
                      <Download className="h-4 w-4" /> {t("common.download")}
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => setPayingBook(b)}>
                      {t("common.buyNow")}
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {payingBook && (
        <PaymentModal
          type="book"
          refId={payingBook.id}
          onClose={() => setPayingBook(null)}
          onSuccess={() => {
            setPayingBook(null);
            qc.invalidateQueries({ queryKey: ["books"] });
          }}
        />
      )}
    </div>
  );
}
