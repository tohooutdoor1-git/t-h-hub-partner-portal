import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { addToCart, clearCart, getMyCart, submitQuote, updateCartItem } from "@/lib/quotes.functions";

export function useCart() {
  const fn = useServerFn(getMyCart);
  return useQuery({ queryKey: ["cart"], queryFn: () => fn() });
}

export function useCartActions() {
  const qc = useQueryClient();
  const addFn = useServerFn(addToCart);
  const updateFn = useServerFn(updateCartItem);
  const clearFn = useServerFn(clearCart);
  const submitFn = useServerFn(submitQuote);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cart"] });

  const add = useMutation({
    mutationFn: (v: { product_id: string; quantity: number }) => addFn({ data: v }),
    onSuccess: () => {
      toast.success("Producto agregado a tu cotización");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (v: { item_id: string; quantity: number }) => updateFn({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const clear = useMutation({
    mutationFn: () => clearFn(),
    onSuccess: () => {
      toast.success("Cotización vaciada");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = useMutation({
    mutationFn: (v: { comments: string }) => submitFn({ data: v }),
    onSuccess: (res: { folio?: string | null }) => {
      toast.success(`Cotización ${res.folio ?? ""} enviada a tu ejecutivo`);
      invalidate();
      qc.invalidateQueries({ queryKey: ["my-quotes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { add, update, clear, submit };
}
