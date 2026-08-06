
REVOKE ALL ON FUNCTION public.next_folio(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_folio(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_order(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.apply_stock_status() FROM PUBLIC, anon, authenticated;
