import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import { useCart } from "../contexts/CartContext";
import { mediaUrl } from "../services/api";
import * as paymentsApi from "../services/payments";

export default function Wishlist() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { refreshCart } = useCart();

  const { data: items = [], isLoading } = useQuery({ queryKey: ["wishlist"], queryFn: paymentsApi.fetchWishlist });

  const handleRemove = async (itemId: string) => {
    await paymentsApi.removeFromWishlist(itemId);
    qc.invalidateQueries({ queryKey: ["wishlist"] });
  };

  const handleAddToCart = async (item: any) => {
    await paymentsApi.addToCart(item.item_type, item.item_id);
    refreshCart();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">{t("nav.wishlist")}</h1>
      {isLoading ? (
        <p className="text-center text-muted">{t("common.loading")}</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center text-muted">
          <Heart className="h-12 w-12" />
          <p>{t("common.noResults")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <GlassCard key={item.id} className="flex items-center gap-4">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-nebula-purple/40 to-nebula-cyan/30">
                {item.thumbnail && <img src={mediaUrl(item.thumbnail)} className="h-full w-full object-cover" alt="" />}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted">${item.price}</p>
              </div>
              <Button variant="secondary" onClick={() => handleAddToCart(item)}>
                <ShoppingCart className="h-4 w-4" />
              </Button>
              <button onClick={() => handleRemove(item.item_id)} className="btn-ghost !p-2 text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
